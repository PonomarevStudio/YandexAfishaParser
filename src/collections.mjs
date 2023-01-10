import {stringify} from "node:querystring";
import cartesian from "cartesian";
import config from "./config.mjs";
import fetch from "node-fetch";

const {
    collections: {
        query = {},
        url = "https://afisha.yandex.ru/api/events/rubric/concert"
    } = {}
} = config;

export function getQueries(data = query) {
    return cartesian(data);
}

export function fetchQuery(url, query) {
    const {href} = new URL('?' + stringify(query), url);
    return fetch(href).then(r => r.json()).catch(() => ({}));
}

export async function fetchCollection(query = {}, limit = 20) {
    const {paging: {total = 0} = {}} = await fetchQuery(url, query);
    let offset = 0, pages = [];
    do {
        pages.push(fetchCollectionPage(query, limit, offset));
    } while (total > (offset += limit));
    return (await Promise.all(pages)).flat();
}

export async function fetchCollectionPage(query = {}, limit, offset) {
    const {data} = await fetchQuery(url, {...query, limit, offset});
    if (!Array.isArray(data)) return [];
    return data.map(item => ({...item, query}));
}
