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

export const sorter = ({date: a} = {}, {date: b} = {}) => a - b;

export async function fetchItem(data = {}, context = {}) {
    try {
        const {key} = context;
        const {event: {url}} = data;
        if (!url || !key) return;
        const {href} = new URL(url, base);
        const {state, ld} = await pRetry(() => fetchPage(href, key), options);
        return getItem({...data, href, state, ld, context});
    } catch (e) {
        console.error(e);
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
    const date = data?.scheduleInfo?.dates[0];
    const url = data?.href || data?.event?.url;
    const category = localisation?.filter?.[filter] || filter;
    const shortDate = data?.scheduleInfo?.regularity?.singleShowtime;
    const image = fetchImage(data?.event?.image?.sizes?.microdata?.url, id)?.href;
    const mid = Object.values(data?.state?.events || {})?.[0]?.yaMusic?.id;
    const formatter = new Intl.DateTimeFormat(locales, shortDate ? short : long);
    const targetDate = new Date(shortDate || date || new Date());
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
