import config from "../config.json" assert {type: "json"};

const {output = './'} = config;
const {MAX_EVENTS, API_KEYS, VERCEL_URL} = process.env;
if (MAX_EVENTS) config.limit = parseInt(MAX_EVENTS);
if (API_KEYS && config.api) config.api.keys = JSON.parse(API_KEYS);
if (VERCEL_URL && !config.images?.url) {
    if (!config.images) config.images = {};
    const url = new URL(output, `https://${VERCEL_URL}`);
    config.images.url = new URL(config.images.path || './', url).href;
}
config.output = new URL(output, new URL('../', import.meta.url));
export default config;
