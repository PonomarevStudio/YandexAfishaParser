import fetch from 'node-fetch';
import {writeFileSync} from "node:fs";
import querystring from "node:querystring";
import {JSDOM, VirtualConsole} from "jsdom";
import {stringify} from 'csv-stringify/sync';

const events = [], limit = 20, config = {
    filename: 'events.csv',
    baseUrl: 'https://afisha.yandex.ru',
    cities: ['moscow', 'saint-petersburg'],
    filters: ['hiphop', 'electronic', 'indie'],
    apiUrl: 'https://afisha.yandex.ru/api/events/rubric/concert',
    categories: {hiphop: 'Хип-хоп и рэп', electronic: 'Электронная музыка', indie: 'Инди'},
    csv: {
        header: true,
        quoted: true,
        delimiter: ';',
        columns: {
            id: 'External ID',
            pid: 'Parent ID',
            title: 'Title',
            category: 'Category',
            image: 'Photo',
            date: 'Description',
            text: 'Text'
        }
    }
}, virtualConsole = new VirtualConsole();

virtualConsole.on("error", () => []);

for (const city of config.cities) {
    for (const filter of config.filters) {
        let offset = 0, response;
        do {
            const query = {limit, offset, city, filter},
                url = new URL('?' + querystring.stringify(query), config.apiUrl);
            response = await fetch(url).then(r => r.json());
            console.log(city, filter, offset, '—', (offset + limit), `(${response?.data?.length})`)
            if (Array.isArray(response?.data)) response.data.forEach(item => {
                const id = item?.event?.id,
                    event = {
                        id,
                        pid: id,
                        title: item?.event?.title,
                        category: config.categories[filter],
                        date: item?.scheduleInfo?.preview?.text,
                        image: item?.event?.image?.sizes?.microdata?.url,
                    },
                    url = new URL(item?.event?.url, config.baseUrl).href,
                    result = fetch(url).then(r => r.text()).then(page => {
                        const {document} = new JSDOM(page, {virtualConsole}).window,
                            ld = Array.from(document.querySelectorAll(`script[type="application/ld+json"]`))
                                .map(({innerHTML} = {}) => JSON.parse(innerHTML)).flat().find(item => item['@type'] === 'Event');
                        event.text = ld?.description;
                        return event;
                    }).catch(e => console.error(e));
                events.push(result);
            });
        } while (response?.paging?.total > (offset += limit));
    }
}

console.log(events.length, 'events collected')

const data = await Promise.all(events)

writeFileSync(config.filename, stringify(data, config.csv));

console.log('saved to', config.filename)
