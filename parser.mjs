import pLimit from 'p-limit';
import fetch from 'node-fetch';
import querystring from "node:querystring";
import {JSDOM, VirtualConsole} from "jsdom";

const virtualConsole = new VirtualConsole();
virtualConsole.on("error", () => []);

export async function getEvents({cities = [], filters = []} = {}, {concurrency = 5, ...options} = {}) {
    options.runThread = pLimit(concurrency);
    const collections = [];
    for (const city of cities) {
        for (const filter of filters) {
            collections.push(getCollection({city, filter}, options))
        }
    }
    const events = (await Promise.all(collections)).flat();
    console.log(events.length, 'events collected, parsing data ...');
    return await Promise.all(events);
}

export async function getCollection(query = {}, {
    data = {},
    limit = 20,
    runThread = f => f(),
    apiUrl = 'https://afisha.yandex.ru/api/events/rubric/concert',
} = {}) {
    let offset = 0, events = [], response = {};
    do {
        const url = new URL('?' + querystring.stringify({...query, limit, offset}), apiUrl);
        response = await fetch(url.href).then(r => r.json());
        console.log(query, offset, '—', (offset + limit), `(${response?.data?.length})`)
        if (!Array.isArray(response?.data)) continue;
        response.data.forEach(item => events.push(runThread(() => getEvent({...item, query}, data))));
    } while (response?.paging?.total > (offset += limit));
    return events;
}

export async function getEvent(data = {}, {
    request = {},
    categories = {},
    urlHandler = _ => _,
    baseUrl = 'https://afisha.yandex.ru'
} = {}) {
    const id = data?.event?.id,
        url = new URL(data?.event?.url, baseUrl),
        page = await fetch(urlHandler(url.href), request).then(r => r.text());
    console.log(url.href)
    return {
        id,
        pid: id,
        title: data?.event?.title,
        text: getLD(page)?.description,
        category: categories[data?.query?.filter],
        image: data?.event?.image?.sizes?.microdata?.url
    }
}

export function getLD(html, type = 'Event') {
    const {document} = new JSDOM(html, {virtualConsole}).window;
    return Array.from(document.querySelectorAll(`script[type="application/ld+json"]`))
        .map(({innerHTML} = {}) => JSON.parse(innerHTML)).flat().find(item => item['@type'] === type);
}
