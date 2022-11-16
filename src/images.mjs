import fetch from 'node-fetch';
import {parse} from 'csv-parse/sync';
import {fileURL, csv, defaultImage} from "./config.mjs";
import {writeFileSync, mkdirSync, readFileSync} from "node:fs";

const {delimiter} = csv,
    options = {delimiter, columns: true, skip_empty_lines: true},
    dir = new URL(`../public/images/`, import.meta.url),
    events = parse(readFileSync(fileURL), options);

mkdirSync(dir, {recursive: true});

for await (const event of events) {
    try {
        const url = event[csv.columns.image];
        if (url === defaultImage) continue;
        const response = await fetch(url);
        const file = new URL(`./${event[csv.columns.id]}.png`, dir);
        writeFileSync(file, Buffer.from(await response.arrayBuffer()));
        console.log(file.href, response.headers.get("content-length"));
    } catch (e) {
        console.error(e);
    }
}
