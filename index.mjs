import {writeFileSync} from "node:fs";
import {getEvents} from "./parser.mjs";
import {stringify} from 'csv-stringify/sync';
import {csv, query, options, filename} from "./config.mjs";

writeFileSync(filename, stringify(await getEvents(query, options), csv));

console.log('saved to', filename)
