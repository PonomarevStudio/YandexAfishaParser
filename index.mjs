import {writeFileSync} from "node:fs";
import {getEvents} from "./parser.mjs";
import {stringify} from 'csv-stringify/sync';
import {csv, query, options, filename} from "./config.mjs";

const events = await getEvents(query, options);

writeFileSync('events.json', JSON.stringify(events));

writeFileSync(filename, stringify(events, csv));

console.log('saved to', filename)
