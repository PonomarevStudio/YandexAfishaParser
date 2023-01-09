import {stringify} from "node:querystring";
import pWaitFor from "p-wait-for";
import pWhilst from "p-whilst";
import pLimit from "p-limit";
import fetch from "node-fetch";
import config from "./config.mjs";
import {freemem} from "os";

const {
    api: {
        keys = [],
        options = {},
        concurrency = 5,
        url = "http://api.scraperapi.com"
    },
    limit = Infinity,
    log = 1000,
} = config, queue = [];
let complete, lastLog, limits = {}, workers = [], counter = 0;

export function setComplete(value = true) {
    return complete = value;
}

export function stat() {
    return {limit, counter, queue: queue.length, workers: workers.map(({worker} = {}) => worker.activeCount)};
}

export async function getKeysLimit(apiKeys = keys, apiUrl = url) {
    const keys = apiKeys.map(async api_key => {
        const url = new URL('/account?' + stringify({api_key}), apiUrl);
        const keyData = await fetch(url).then(r => r.json()).catch(() => ({})) || {};
        const {requestLimit = 0, requestCount = 0, concurrencyLimit = 0} = keyData;
        const availableLimit = requestLimit - requestCount - concurrencyLimit;
        return [api_key, availableLimit];
    });
    return new Map(await Promise.all(keys));
}

export function pushTask(task) {
    return new Promise((resolve, reject) => {
        if (++counter > limit) return resolve();
        return queue.push((...args) => task(...args).then(resolve).catch(reject));
    })
}

export async function initWorkers() {
    limits = await getKeysLimit();
    console.info('Limit for API keys: ');
    workers = [...limits.entries()].map(([key, limit] = []) => new Worker(key, limit));
    const interval = setInterval(() => {
        const {queue, workers} = stat(),
            log = `${queue} tasks in queue, and [${workers.join(', ')}] in workers`;
        if (lastLog === log) return;
        const free = Math.round(freemem() / 1024 / 1024);
        const used = Math.round(process.memoryUsage.rss() / 1024 / 1024);
        console.log(log, `that use ${used} MB of memory (${free} MB free)`);
        lastLog = log;
    }, log);
    await Promise.all(workers.map(({complete} = {}) => complete));
    clearInterval(interval);
    if (queue.length) console.warn('API keys limit exceeded, skipped items:', queue.length);
    return queue.map(task => task());
}

export class Worker {

    constructor(key, limit = 0) {
        console.info(key, limit);
        const worker = pLimit(concurrency);
        Object.assign(this, {key, limit, worker});
        this.complete = pWhilst(this.checkLimit.bind(this), this.tick.bind(this)).catch(e => e);
    }

    async tick() {
        await pWaitFor(this.checkQueue.bind(this), options);
        this.runTask().catch(e => console.error(e));
    }

    checkQueue() {
        const queueLength = queue.length > 0;
        const activeCount = this.worker.activeCount < concurrency;
        const memory = process.memoryUsage.rss() + (1024 * 1024 * 1024) / freemem() < 1;
        return complete || (queueLength && activeCount && memory);
    }

    checkLimit() {
        return !complete && this.limit > 0;
    }

    runTask() {
        const {key} = this;
        const task = queue.pop();
        if (!task) return;
        this.limit--;
        return this.worker(task, {key});
    }

}
