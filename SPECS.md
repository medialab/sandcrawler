Sandcrawler Specifications
==========================

Sandcrawler aims at enabling the scraping of complex sites through phantomjs and helped by artoo.js. It must provide a straightforward way to crawl through sites as well as permitting to customized every little detail if needed.

API
---

The user must either use basic sandcrawler methods or use a crawler to perform finer jobs.

One crawler is bound to one url.

```js
var crawler = new sandcrawler([spy]);

crawler.from(url,s params)
	.inject/.parse
    .process
    .then
    .on
    .fail

crawler.log
```

waitFor et tout

Ideas
-----

* A lazy site logger.
* Provide middlewares.
* Must provide a non-dynamic fallback
* Limit, parallels etc.
