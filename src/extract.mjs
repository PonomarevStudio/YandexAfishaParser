import {parse} from "csv-parse/sync";
import {csv, fileURL} from "./config.mjs";
import {stringify} from 'csv-stringify/sync';
import {writeFileSync, readFileSync} from "node:fs";

const {delimiter} = csv;
const file = new URL('./store.csv', fileURL);
const options = {delimiter, columns: true, skip_empty_lines: true};
const events = parse(readFileSync(file), options);

const recoverEvent = event => Object.fromEntries(Object.entries(csv.columns).map(([p, t]) => [p, event[t]]));

const extractedEvents = events.map(recoverEvent).filter(({image} = {}) => !image)

writeFileSync(new URL('./events.extracted.csv', fileURL), stringify(extractedEvents, csv));
