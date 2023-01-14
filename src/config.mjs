import config from "../config.json" assert {type: "json"};

const {output = './'} = config;
const {MAX_EVENTS, API_KEYS, VERCEL, VERCEL_URL} = process.env;
if (MAX_EVENTS) config.limit = parseInt(MAX_EVENTS);
if (API_KEYS && config.api) config.api.keys = JSON.parse(API_KEYS);
if (VERCEL && !config.timeout) config.timeout = 2500000;
if (VERCEL_URL && !config.images?.url) {
    if (!config.images) config.images = {};
    config.images.url = new URL(config.images.path || './', `https://${VERCEL_URL}`).href;
}
config.output = new URL(output, new URL('../', import.meta.url));
export default config;
