import {writeFile, mkdir, access, constants} from "node:fs/promises";
import {ImagePool} from "@squoosh/lib";
import config from "./config.mjs";
import fetch from "node-fetch";
import pRetry from "p-retry";

const {
    output = import.meta.url,
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
export let initialised, queue = Promise.resolve();

export async function init() {
    if (initialised) return initialised;
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
    queue = queue.then(() => saveImage(url, getLocalUrl(id)));
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
    const pool = new ImagePool(1);
    const image = pool.ingestImage(buffer);
    const {bitmap: {width: decodedWidth}} = await image.decoded;
    const width = Math.min(decodedWidth, 2048)
    await image.preprocess({resize: {width: Math.min(width, 2048)}});
    await image.encode({mozjpeg: {quality: 90}});
    const {binary} = await image.encodedWith.mozjpeg;
    await pool.close();
    return binary;
}

export function checkImage(response) {
    const mime = response.headers.get('content-type');
    const size = response.headers.get("content-length");
    return allowed.includes(mime) && size <= 3000000;
}
