import {readFile, writeFile, mkdir, access, constants} from "node:fs/promises";
import {ImagePool} from "@squoosh/lib";
import config from "./config.mjs";
import fetch from "node-fetch";
import pRetry from "p-retry";
import {freemem} from "os";

const {
    output = import.meta.url,
    log = 10000,
    images: {
        download,
        fallback,
        path = "./",
        allowed = [],
        options = {},
        url = "http://localhost/"
    } = {},
} = config;

export const local = new URL(path, output);
export let initialised, interval, lastLog, remain = 0, queue = Promise.resolve();

export async function init() {
    if (initialised) return;
    initialised = true;
    if (download) await mkdir(local, {recursive: true});
    else return console.info('Image downloading disabled');
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
    saveImage(url, getLocalUrl(id));
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
            await writeFile(file, Buffer.from(buffer));
            if (checkImage(response)) return;
            remain++;
            queue = queue.then(() => convertImage(file).then(() => remain--));
        } catch (e) {
            console.error(e);
        }
    }
}

export async function convertImage(file) {
    const pool = new ImagePool(1);
    try {
        const buffer = await readFile(file);
        const image = pool.ingestImage(buffer);
        const {bitmap: {width: decodedWidth}} = await image.decoded;
        const width = Math.min(decodedWidth, 2048)
        await image.preprocess({resize: {width: Math.min(width, 2048)}});
        await image.encode({mozjpeg: {quality: 90}});
        const {binary} = await image.encodedWith.mozjpeg;
        await writeFile(file, binary);
    } catch (e) {
        console.error(file, "⚠️", e);
    } finally {
        await pool.close();
    }
}

export function checkImage(response) {
    const mime = response.headers.get('content-type');
    const size = response.headers.get("content-length");
    return allowed.includes(mime) && size <= 3000000;
}

export function printLog(memory) {
    const log = `${remain} images in queue for conversion`;
    if (lastLog === log) return;
    lastLog = log;
    if (memory) {
        const free = Math.round(freemem() / 1024 / 1024);
        const used = Math.round(process.memoryUsage.rss() / 1024 / 1024);
        console.log(log, `that use ${used} MB of memory (${free} MB free)`);
    } else console.log(log);
}

export function logger(state = true) {
    if (state && !interval) interval = setInterval(printLog, log);
    if (!state && interval) {
        clearInterval(interval);
        interval = undefined;
    }
}

export function getQueue() {
    return queue;
}
