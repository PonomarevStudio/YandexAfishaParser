import {increaseLimit, pushTask} from "./workers.mjs";
import {JSDOM, VirtualConsole} from "jsdom";
import {stringify} from "node:querystring";
import {fetchImage} from "./images.mjs";
import config from "./config.mjs";
import fetch from "node-fetch";
import pRetry from 'p-retry';

const {
    api: {
        url: apiURL = "http://api.scraperapi.com"
    } = {},
    items: {
        price = 0,
        retry = 1,
        options = {},
        base = "https://afisha.yandex.ru"
    } = {},
    date: {
        locales = "ru-RU",
        long = {
            "month": "long",
            "day": "numeric",
            "hour": "numeric",
            "minute": "numeric"
        },
        short = {
            "month": "long",
            "day": "numeric"
        }
    } = {},
    localisation = {},
} = config;

const virtualConsole = new VirtualConsole();
virtualConsole.on("error", () => []);

export const sorter = ({targetDate: a = 0} = {}, {targetDate: b = 0} = {}) => a - b;

export async function fetchItem(data = {}, context = {}) {
    if (!context.retries) context.retries = 0;
    const {event: {url}} = data;
    let {key} = context;
    if (!url || !key) return;
    const {href} = new URL(url, base);
    try {
        const {state, ld} = await pRetry(() => fetchPage(href, key), options);
        return getItem({...data, href, state, ld, context});
    } catch (e) {
        const retries = ++context.retries;
        if (retries > retry) return getItem({...data, href, context});
        return pushTask(context => fetchItem(data, {...context, retries}));
    }
}

export async function fetchPage(url, api_key) {
    const {href} = new URL('?' + stringify({api_key, url}), apiURL);
    const response = await fetch(href);
    switch (response.status) {
        case 200:
            const page = await response.text();
            const {document} = new JSDOM(page, {virtualConsole})?.window;
            const state = getState(document);
            const ld = getLD(document);
            return {state, ld};
        case 404:
            return {};
        default:
            increaseLimit(api_key);
            throw Object.assign(new Error('API error'), {message: await response.text()});
    }
}

export function getLD(document, type = 'Event') {
    const scripts = document.querySelectorAll(`script[type="application/ld+json"]`);
    const objects = Array.from(scripts).map(({innerHTML} = {}) => JSON.parse(innerHTML));
    return objects.flat().find(item => item['@type'] === type) || {};
}

export function getState(document) {
    const eventDataScript = document.querySelector(`script.i-redux`);
    const window = {}
    try {
        eval(eventDataScript?.innerHTML);
    } catch (e) {
        console.error(e);
    }
    return window['__initialState'] || {};
}

export function getItem(data = {}) {
    const id = data?.event?.id;
    const title = data?.event?.title;
    const text = data?.ld?.description;
    const filter = data?.query?.filter;
    const url = data?.href || data?.event?.url;
    const shortDate = data?.scheduleInfo?.dates[0];
    const category = localisation?.filter?.[filter] || filter;
    const date = data?.scheduleInfo?.regularity?.singleShowtime;
    const mid = Object.values(data?.state?.events || {})?.[0]?.yaMusic?.id;
    const image = fetchImage(data?.event?.image?.sizes?.microdata?.url, id)?.href;
    const formatter = new Intl.DateTimeFormat(locales, date ? long : short);
    const targetDate = new Date(date || shortDate || new Date());
    const formattedDate = formatter.format(targetDate);
    return {
        brand: formattedDate,
        date: formattedDate,
        targetDate,
        category,
        pid: id,
        price,
        image,
        title,
        text,
        mid,
        url,
        id
    }
}
