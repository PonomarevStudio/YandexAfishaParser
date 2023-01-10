import {initWorkers, pushTask, setComplete} from "./workers.mjs";
import {fetchCollection, getQueries} from "./collections.mjs";
import {mkdir, writeFile} from "node:fs/promises";
import {fetchItem, sorter} from "./items.mjs";
import {getQueue, logger} from "./images.mjs";
import {stringify} from "csv-stringify/sync";
import {dirname} from "node:path";
import config from "./config.mjs";

const {
    csv = {},
    filename = 'items.csv',
    output = import.meta.url
} = config;

const workers = initWorkers();
const collections = getQueries().map(query => fetchCollection(query));
console.log(collections.length, 'target collections ...');
const items = (await Promise.all(collections)).flat();
const tasks = items.map(item => pushTask(context => fetchItem(item, context)));
console.log(tasks.length, 'items collected, parsing their data ...');
const sortedItems = (await Promise.all(tasks)).filter(Boolean).sort(sorter);
console.log(sortedItems.length, 'items exporting ...');
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
