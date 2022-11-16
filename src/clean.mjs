import {parse} from "csv-parse/sync";
import {csv, fileURL, imagesDir} from "./config.mjs";
import {readFileSync, unlinkSync, existsSync} from "node:fs";

const {delimiter} = csv;
const file = new URL('./events.extracted.csv', fileURL);
const options = {delimiter, columns: true, skip_empty_lines: true};
const events = parse(readFileSync(file), options);

const recoverEvent = event => Object.fromEntries(Object.entries(csv.columns).map(([p, t]) => [p, event[t]]));

events.map(recoverEvent).forEach(({id} = {}) => {
    const url = new URL(`./${id}.png`, imagesDir);
    if (!id || !existsSync(url)) return console.log(id, 'file not found');
    return unlinkSync(url);
})
