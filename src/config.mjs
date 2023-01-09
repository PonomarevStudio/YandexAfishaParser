import config from "../config.json" assert {type: "json"};

const {output = './'} = config;
const {MAX_EVENTS, API_KEYS} = process.env;
if (MAX_EVENTS) config.limit = parseInt(MAX_EVENTS);
if (API_KEYS && config.api) config.api.keys = JSON.parse(API_KEYS);
config.output = new URL(output, new URL('../', import.meta.url));

export default config;
