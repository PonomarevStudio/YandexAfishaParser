import {parse} from "csv-parse/sync";
import {stringify} from 'csv-stringify/sync';
import {writeFileSync, readFileSync} from "node:fs";
import {csv, fileURL, imagesURL, defaultImage} from "./config.mjs";

const {delimiter} = csv;
const options = {delimiter, columns: true, skip_empty_lines: true};
const events = parse(readFileSync(fileURL), options);

const convertedEvents = events.map(event => {
    const recoveredEvent = Object.fromEntries(Object.entries(csv.columns).map(([p, t]) => [p, event[t]]));
    if (recoveredEvent.image !== defaultImage) recoveredEvent.image = new URL(`${recoveredEvent.id}.png`, imagesURL).href;
    return recoveredEvent;
});

writeFileSync(new URL('./events.converted.csv', fileURL), stringify(convertedEvents, csv));
