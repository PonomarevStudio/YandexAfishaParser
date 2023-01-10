# Yandex Afisha event converter to Tilda products

Parser of data about events from afisha.yandex.ru using ScraperAPI saving them in CSV, which can be imported in Tilda's
store

## Demo

https://yandex-afisha-parser.vercel.app

## How to Use

You can choose from one of the following two methods to use this repository:

### One-Click Run

Run the parser using [Vercel](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FPonomareVlad%2FYandexAfishaParser&env=API_KEYS&envDescription=ScraperAPI%20keys%20in%20JSON%20array%20format%3A%20%5B%22first_key%22%2C%20%22second_key%22%2C%20%22n_key%22%5D&envLink=https%3A%2F%2Fwww.scraperapi.com&project-name=yandex-afisha-parser&repository-name=YandexAfishaParser)

### Clone and Run locally

Install dependencies

```bash
npm install
```

Get free API keys from https://scraperapi.com and put them into [config.json](config.json)

```json
{
  "api": {
    "keys": [
      "first_key",
      "second_key",
      "n_key"
    ]
  }
}
```

Parse events (will be saved to [public/events.csv](public/events.csv))

```bash
npm run build
```

### Disable image downloading (optional)

Set property `images.download` to `false` in [config.json](config.json)

```json
{
  "images": {
    "download": false
  }
}
```
