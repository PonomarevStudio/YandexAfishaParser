import {initWorkers, pushTask, setComplete} from "./workers.mjs";
import {fetchCollection, getQueries} from "./collections.mjs";
import {mkdir, writeFile} from "node:fs/promises";
import {fetchItem, sorter} from "./items.mjs";
import {getQueue, logger} from "./images.mjs";
import {stringify} from "csv-stringify/sync";
import {dirname} from "node:path";
import config from "./config.mjs";

const {
    timeout,
    csv = {},
    filename = 'items.csv',
    output = import.meta.url
} = config;

let completeTimeout;

if (timeout) completeTimeout = setTimeout(() => {
    console.warn('Time limit exceeded !');
    setComplete();
}, timeout);

const workers = initWorkers();
const collections = getQueries().map(query => fetchCollection(query));
console.log(collections.length, 'target collections ...');
const items = (await Promise.all(collections)).flat();
const tasks = items.map(item => pushTask(context => fetchItem(item, context)));
if (!tasks.length) console.warn('No tasks') || process.exit();
console.log(tasks.length, 'items collected, parsing their data ...');
const sortedItems = (await Promise.all(tasks)).filter(Boolean).sort(sorter);
console.log(sortedItems.length, 'items exporting ...');
if (completeTimeout) clearTimeout(completeTimeout);
setComplete();
await workers;
console.log('saving images ...');
logger();
await getQueue();
logger(false);
const file = new URL(filename, output);
await mkdir(dirname(file.pathname), {recursive: true});
await writeFile(file, stringify(sortedItems, csv));
console.log('CSV saved to ', file.href);
