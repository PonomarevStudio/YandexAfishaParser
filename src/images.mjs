import {cpus} from 'os';
import fetch from 'node-fetch';
import {parse} from 'csv-parse/sync';
import {ImagePool} from '@squoosh/lib';
import {writeFileSync, mkdirSync, readFileSync, existsSync} from "node:fs";
import {fileURL, csv, defaultImage, allowedMIMEs, imagesDir} from "./config.mjs";

const {delimiter} = csv,
    options = {delimiter, columns: true, skip_empty_lines: true},
    events = parse(readFileSync(fileURL), options),
    imagePool = new ImagePool(cpus().length);

mkdirSync(imagesDir, {recursive: true});

for await (const event of events) {
    try {
        const url = event[csv.columns.image];
        if (url === defaultImage) continue;
        const file = new URL(`./${event[csv.columns.id]}.png`, imagesDir);
        if (existsSync(file)) continue;
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const mime = response.headers.get('content-type');
        const size = response.headers.get("content-length");
        if (allowedMIMEs.includes(mime) && size <= 3000000)
            writeFileSync(file, Buffer.from(buffer));
        else {
            const image = imagePool.ingestImage(buffer);
            const {bitmap: {width: decodedWidth}} = await image.decoded;
            const width = Math.min(decodedWidth, 2048)
            await image.preprocess({resize: {width: Math.min(width, 2048)}});
            await image.encode({mozjpeg: {quality: 90}});
            writeFileSync(file, (await image.encodedWith.mozjpeg).binary);
            console.log(url, 'converted to JPEG', decodedWidth, width);
        }
        console.log(file.href, mime, size);
    } catch (e) {
        console.error(e);
    }
}

await imagePool.close();
