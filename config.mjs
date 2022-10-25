import querystring from "node:querystring";

export const api_key = process.env.scraperapi, filename = 'events.csv',
    query = {cities: ['moscow', 'saint-petersburg'], filters: ['hiphop', 'electronic', 'indie']},
    dateTimeFormat = new Intl.DateTimeFormat('ru-RU', {
        minute: 'numeric',
        hour: 'numeric',
        day: 'numeric',
        month: 'long'
    }), shortDateTimeFormat = new Intl.DateTimeFormat('ru-RU', {day: 'numeric', month: 'long'}), options = {
        concurrency: 5,
        data: {
            dateHandler: (date, isShortDate) => isShortDate ? shortDateTimeFormat.format(new Date(date)) : dateTimeFormat.format(new Date(date)),
            imgHandler: url => url || 'https://static.tildacdn.com/tild6361-3537-4663-b161-326166303863/Group_219.png',
            categories: {indie: 'Инди', hiphop: 'Хип-хоп и рэп', electronic: 'Электронная музыка'},
            urlHandler: url => new URL('?' + querystring.stringify({api_key, url}), 'http://api.scraperapi.com').href
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
