import {getEvents} from "../parser.mjs";
import {stringify} from 'csv-stringify/sync';
import {query, options, csv} from "../config.mjs";

const targetOptions = {...options, max: parseInt(process.env.MAX_EVENTS)}

export default async ({}, res) => {
    const events = await getEvents(query, targetOptions);
    res.setHeader('Content-Disposition', 'attachment;filename=events.csv');
    res.setHeader('Content-Type', 'text/csv');
    res.send(stringify(events, csv));
}
