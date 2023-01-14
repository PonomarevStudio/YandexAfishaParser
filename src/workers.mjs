import {stringify} from "node:querystring";
import pWaitFor from "p-wait-for";
import pWhilst from "p-whilst";
import pLimit from "p-limit";
import {freemem} from "os";
import fetch from "node-fetch";
import config from "./config.mjs";

const {
    api: {
        keys = [],
        options = {},
        concurrency = 5,
        url = "http://api.scraperapi.com"
    },
    limit = Infinity,
    log = 10000,
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
        queue.push((...args) => task(...args).then(resolve).catch(reject));
    })
}

export function increaseLimit(apiKey, amount = 1) {
    const worker = workers.find(({key} = {}) => key === apiKey);
    counter -= amount;
    if (!worker) return;
    worker.limit += amount;
    if (!worker.state) worker.start();
}

export async function initWorkers() {
    limits = await getKeysLimit();
    if (!limits.size) return console.warn('No API keys') || process.exit();
    console.info('Limit for API keys: ');
    workers = [...limits.entries()].map(([key, limit] = []) => new Worker(key, limit));
    const interval = setInterval(printLog, log);
    await Promise.all(workers.map(({complete} = {}) => complete));
    if (queue.length) console.warn(queue.length, 'items skipped');
    queue.map(task => task());
    clearInterval(interval);
}

export function printLog(memory) {
    const {queue, workers} = stat(),
        log = `${queue} tasks in queue, and [${workers.join(', ')}] in workers`;
    if (lastLog === log) return;
    lastLog = log;
    if (memory) {
        const free = Math.round(freemem() / 1024 / 1024);
        const used = Math.round(process.memoryUsage.rss() / 1024 / 1024);
        console.log(log, `that use ${used} MB of memory (${free} MB free)`);
    } else console.log(log);
}

export class Worker {

    constructor(key, limit = 0) {
        console.info(key, limit);
        const worker = pLimit(concurrency);
        Object.assign(this, {key, limit, worker});
        this.state = false;
        this.start();
    }

    start() {
        this.state = true;
        return this.complete = pWhilst(this.checkLimit.bind(this), this.tick.bind(this))
            .catch(e => e).finally(this.end.bind(this));
    }

    end() {
        this.state = false;
        return pWaitFor(() => this.worker.activeCount < 1).catch(e => e);
    }

    async tick() {
        await pWaitFor(this.checkQueue.bind(this), options);
        this.runTask().catch(e => console.error(e));
    }

    checkQueue() {
        const queueLength = queue.length > 0;
        const activeCount = this.worker.activeCount < concurrency;
        return complete || (queueLength && activeCount);
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
