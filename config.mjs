import querystring from "node:querystring";

export const api_key = process.env.scraperapi, filename = 'events.csv',
    query = {cities: ['moscow', 'saint-petersburg'], filters: ['hiphop', 'electronic', 'indie']}, options = {
        data: {
            categories: {indie: 'Инди', hiphop: 'Хип-хоп и рэп', electronic: 'Электронная музыка'},
            urlHandler: url => new URL('?' + querystring.stringify({api_key, url}), 'http://api.scraperapi.com').href
        }
    }, csv = {
        header: true, quoted: true, delimiter: ';', columns: {
            id: 'External ID',
            pid: 'Parent ID',
            title: 'Title',
            category: 'Category',
            image: 'Photo',
            date: 'Description',
            text: 'Text'
        }
    };
