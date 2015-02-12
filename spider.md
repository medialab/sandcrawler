---
layout: page
title: Spider
id: spider
---

# {{ page.title }}

---

**sandcrawler**'s spiders enable you to perform complex scraping tasks.

They aim at visiting series of urls in order to scrape the retrieved pages' contents.

---

* [Basics](#basics)
* [Bonus](#bonus)

---

<h2 id="basics">Basics</h2>

Here is how a spider works:

* You must create it:

```js
var sandcrawler = require('sandcrawler');

var spider = sandcrawler.spider('MySpiderName');
```

* Then you must feed it with urls:

```js
spider.urls([
  'http://url1.com',
  'http://url2.com'
]);
```

* And specify the scraper they will use on those urls:

```js
spider.scraper(function($, done) {
  done($('.yummy-data').scrape());
});
```

* So you can do something with the results of the scraper:

```js
spider.result(function(err, req, res) {
  console.log('Yummy data!', res.data);
});
```

* Finally you must run the spider so it can start doing its job:

```js
spider.run(function(err, remains) {
  console.log('Finished!');
});
```

* Chained, it should look like that:

```js
var spider = sandcrawler('MySpiderName')
  .urls([
    'http://url1.com',
    'http://url2.com'
  ])
  .scraper(function($, done) {
    done($('.yummy-data').scrape());
  })
  .result(function(err, req, res) {
    console.log('Yummy data!', res.data);
  })
  .run(function(err, remains) {
    console.log('Finished!');
  });
```

---

Note that if you need phantom to perform your scraping task in a phantom, you just need to change the spider type and it should work the same:

```js
var spider = sandcrawler.phantomSpider();
// instead of
var spider = sancrawler.spider();
```

Be sure however to pay a visit to the [Phantom Spider]({{ site.baseurl }}/phantom_spider) page of this documentation to avoid typical pitfalls.

---

<h2 id="bonus">Bonus</h2>

If you do not fancy spiders and believe they are a creepy animal that should be shunned, you remain free to use less fearsome names such as `droid` or `jawa`:

```js
var spider = sandcrawler.spider();
// is the same as
var droid = sandcrawler.droid();
// and the same as
var jawa = sandcrawler.jawa();
```
