import qs from "node:querystring";

export const filename = 'events.csv',
    apiURL = 'http://api.scraperapi.com',
    query = {
        cities: ['moscow', 'saint-petersburg'],
        filters: ['hiphop', 'electronic', 'indie', 'pop', 'rock', 'jazz-blues', 'classical_music', 'metal']
    },
    dateTimeFormat = new Intl.DateTimeFormat('ru-RU', {
        minute: 'numeric',
        hour: 'numeric',
        day: 'numeric',
        month: 'long'
    }),
    shortDateTimeFormat = new Intl.DateTimeFormat('ru-RU', {day: 'numeric', month: 'long'}),
    options = {
        apiKeys: JSON.parse(process.env.API_KEYS || '[]'),
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
            imgHandler: url => url || 'https://static.tildacdn.com/tild6361-3537-4663-b161-326166303863/Group_219.png',
            urlHandler: (url, api_key) => api_key ? new URL('?' + qs.stringify({api_key, url}), apiURL).href : url,
            dateHandler: (date, isShortDate) => isShortDate ? shortDateTimeFormat.format(new Date(date)) : dateTimeFormat.format(new Date(date))
        }
    }, csv = {
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
