import {getEvents} from "./parser.mjs";
import {stringify} from 'csv-stringify/sync';
import {writeFileSync, mkdirSync} from "node:fs";
import {csv, query, options, fileURL} from "./config.mjs";

const events = await getEvents(query, options);

mkdirSync(new URL('./', fileURL), {recursive: true});

writeFileSync(fileURL, stringify(events, csv));

console.log('CSV saved to ', fileURL.href)
