import pLimit from 'p-limit';
import fetch from 'node-fetch';
import querystring from "node:querystring";
import {JSDOM, VirtualConsole} from "jsdom";

const virtualConsole = new VirtualConsole();
virtualConsole.on("error", () => []);

export async function getEvents({cities = [], filters = []} = {}, {concurrency = 1, max = Infinity, ...options} = {}) {
    options.runThread = pLimit(concurrency);
    const collections = [], context = {max};
    for (const city of cities) {
        for (const filter of filters) {
            collections.push(getCollection.call(context, {city, filter}, options))
        }
    }
    const events = (await Promise.all(collections)).flat();
    console.log(events.length, 'events collected, parsing data ...');
    const unsorted = await Promise.all(events)
    console.log('sorting by date ...');
    const dateHandler = options?.data?.dateHandler;
    return unsorted.sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(({date, isShortDate, ...event} = {}) => ({
            ...event,
            date: dateHandler(date, isShortDate),
            brand: dateHandler(date, isShortDate)
        }));
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
        response.data.forEach(item => {
            if (--this.max >= 0) events.push(runThread(() => getEvent({...item, query}, data)));
        });
    } while (this.max >= 0 && response?.paging?.total > (offset += limit));
    return events;
}

export async function getEvent(data = {}, {
    request = {},
    categories = {},
    urlHandler = _ => _,
    imgHandler = _ => _,
    baseUrl = 'https://afisha.yandex.ru'
} = {}) {
    const id = data?.event?.id,
        url = new URL(data?.event?.url, baseUrl);

    console.log(url.href)

    let page = await fetch(urlHandler(url.href), request).then(r => r.text()),
        document = new JSDOM(page, {virtualConsole}).window.document,
        state = getState(document),
        ld = getLD(document);

    if (!ld?.description) {
        page = await fetch(urlHandler(url.href), request).then(r => r.text());
        document = new JSDOM(page, {virtualConsole}).window.document;
        state = getState(document);
        ld = getLD(document);
    }

    return {
        id,
        url,
        pid: id,
        price: 499,
        text: ld?.description,
        title: data?.event?.title,
        category: categories[data?.query?.filter],
        isShortDate: !data?.scheduleInfo?.regularity?.singleShowtime,
        mid: Object.values(state?.events || {})?.[0]?.yaMusic?.id,
        date: data?.scheduleInfo?.regularity?.singleShowtime || data?.scheduleInfo?.dates[0],
        image: imgHandler(data?.event?.image?.sizes?.microdata?.url)
    }
}

export function getLD(document, type = 'Event') {
    return Array.from(document.querySelectorAll(`script[type="application/ld+json"]`))
        .map(({innerHTML} = {}) => JSON.parse(innerHTML)).flat().find(item => item['@type'] === type);
}

export function getState(document) {
    const eventDataScript = document.querySelector(`script.i-redux`);
    const window = {}
    eval(eventDataScript?.innerHTML);
    return window['__initialState'] || {};
}
