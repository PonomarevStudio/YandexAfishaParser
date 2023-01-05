import qs from "node:querystring";

export const apiURL = 'http://api.scraperapi.com';

export const imagesDir = new URL(`../public/images/`, import.meta.url);

export const fileURL = new URL('../public/events.csv', import.meta.url);

export const imagesHost = process.env.VERCEL_URL || `the-vox-images.vercel.app`;

export const imagesURL = new URL('/images/', `https://${imagesHost}`);

export const defaultImage = 'https://static.tildacdn.com/tild6361-3537-4663-b161-326166303863/Group_219.png';

export const query = {
    cities: ['moscow', 'saint-petersburg'],
    filters: ['hiphop', 'electronic', 'indie', 'pop', 'rock', 'jazz-blues', 'classical_music', 'metal']
};

export const dateTimeFormat = new Intl.DateTimeFormat('ru-RU', {
    minute: 'numeric', hour: 'numeric', day: 'numeric', month: 'long'
});

export const shortDateTimeFormat = new Intl.DateTimeFormat('ru-RU', {day: 'numeric', month: 'long'});

export const options = {
    apiKeys: JSON.parse(process.env.API_KEYS || '[]'),
    max: process?.env?.MAX_EVENTS ? parseInt(process.env.MAX_EVENTS) : Infinity,
    concurrency: 5,
    data: {
        categories: {
            pop: 'Поп',
            rock: 'Рок',
            indie: 'Инди',
            metal: 'Метал',
            hiphop: 'Хип-хоп и рэп',
            'jazz-blues': 'Джаз и блюз',
            electronic: 'Электронная музыка',
            classical_music: 'Классическая музыка',
        },
        imgHandler: url => url || defaultImage,
        urlHandler: (url, api_key) => api_key ? new URL('?' + qs.stringify({api_key, url}), apiURL).href : url,
        dateHandler: (date, isShortDate) => isShortDate ? shortDateTimeFormat.format(new Date(date)) : dateTimeFormat.format(new Date(date))
    }
};

export const csv = {
    header: true, quoted: true, delimiter: ';', columns: {
        id: 'External ID',
        pid: 'Parent ID',
        title: 'Title',
        image: 'Photo',
        category: 'Category',
        date: 'Description',
        brand: 'Brand',
        price: 'Price',
        text: 'Text',
        mid: 'SKU'
    }
};

export const allowedMIMEs = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml']
