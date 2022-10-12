import {getEvents} from "../parser.mjs";
import {stringify} from 'csv-stringify/sync';
import {query, options, csv} from "../config.mjs";

export default async ({}, {send}) => send(stringify(await getEvents(query, options), csv));
