import {writeFile, mkdir, access, constants} from "node:fs/promises";
import {ImagePool} from "@squoosh/lib";
import config from "./config.mjs";
import {cpus, freemem} from "os";
import fetch from "node-fetch";
import pRetry from "p-retry";

const imageThreads = () => Math.round(
    Math.max(
        Math.min(
            freemem() / 1024 / 1024 / 128,
            cpus().length / 2
        ), 1
    )
);

const {
    output = import.meta.url,
    log = 1000,
    images: {
        download,
        fallback,
        path = "./",
        allowed = [],
        options = {},
        threads = imageThreads(),
        url = "http://localhost/"
    } = {},
} = config, queue = [];

export const local = new URL(path, output);
export let initialised, interval, lastLog, pool;

export async function init() {
    if (initialised) return initialised;
    initialised = true;
    if (download) await mkdir(local, {recursive: true});
    else return console.info('Image downloading disabled');
    return pool = new ImagePool(threads);
}

export function startLog() {
    interval = setInterval(() => {
        const log = `${queue.length} images in queue`;
        if (lastLog === log) return;
        console.log(log);
        lastLog = log;
    }, log);
}

export function getLocalUrl(id) {
    return new URL(`./${id}.png`, local);
}

export function getPublicUrl(id) {
    return new URL(`./${id}.png`, url);
}

export function fetchImage(url, id) {
    if (!url) return fallback;
    if (!download) return url;
    const task = saveImage(url, getLocalUrl(id));
    queue.push(task);
    task.then(result => (removeFromQueue(task), result));
    return getPublicUrl(id);
}

export async function saveImage(url, file) {
    await init();
    try {
        await access(file, constants.F_OK);
    } catch (e) {
        try {
            const response = await pRetry(() => fetch(url), options);
            const buffer = await response.arrayBuffer();
            const output = checkImage(response) ? Buffer.from(buffer) : await convertImage(buffer);
            await writeFile(file, output);
        } catch (e) {
            console.error(e);
        }
    }
}

export async function convertImage(buffer) {
    if (!pool) return Buffer.from(buffer);
    const image = pool.ingestImage(buffer);
    const {bitmap: {width: decodedWidth}} = await image.decoded;
    const width = Math.min(decodedWidth, 2048)
    await image.preprocess({resize: {width: Math.min(width, 2048)}});
    await image.encode({mozjpeg: {quality: 90}});
    const {binary} = await image.encodedWith.mozjpeg;
    return binary;
}

export function checkImage(response) {
    const mime = response.headers.get('content-type');
    const size = response.headers.get("content-length");
    return allowed.includes(mime) && size <= 3000000;
}

export async function exit() {
    await Promise.all(queue);
    clearInterval(interval);
    return pool?.close?.();
}

function removeFromQueue(task) {
    const index = queue.indexOf(task);
    if (index === -1) return;
    return queue.splice(index, 1);
}
