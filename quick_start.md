---
layout: page
title: Quick Start
id: quick_start
---

# {{ page.title }}

---

**sandcrawler.js** is a scraping library aiming at performing complex scraping tasks where client-side JavaScript execution might be needed.

But before being able to do so, let's see how one could perform simpler tasks like scraping the famous *Hacker News*.

---

* [Defining a spider](#defining)
* [Enter the scraper](#scraper)
* [Analyzing the results](#results)
* [Running the spider](#running)
* [More pages?](#more-pages)
* [Need phantomjs?](#phantomjs)
* [Prototyping within your web browser](#prototyping)
* [What now?](#what-now)

---

<h2 id="defining">Defining a spider</h2>

First of all, we need to create a spider that will fetch *Hacker News*' front page so we can scrape its data.

We'll gather only post titles and urls for the sake of the demonstration but I am sure anyone would be greedier than that in a normal use case.

```js
// Let's start by requiring the library
var sandcrawler = require('sandcrawler');

// Now let's define a new spider and start chaining
var spider = sandcrawler.spider()

  // What we need is to hit the following url
  .url('https://news.ycombinator.com')

  // With the following scraper
  .scraper(function($, done) {

    var data = $('td.title:has(a):not(:last)').scrape({
      title: {sel: 'a'},
      url: {sel: 'a', attr: 'href'}
    });

    done(null, data);
  })

  // So that we can handle its result
  .result(function(err, req, res) {
    console.log('Scraped data:', res.data);
  });
```

---

<h2 id="scraper">Enter the scraper</h2>

To scrape our post title and urls, we need to use a scraping function.

This function takes two arguments:

* **$**: The retrieved html parsed with [cheerio](https://github.com/cheeriojs/cheerio) and extended with [artoo.scrape](http://medialab.github.io/artoo/node/).
* **done**: a callback to call when your scraping is done. This function is a typical node.js callback and takes as first argument an error if needed and the scraped data as second argument.

---

<h2 id="results">Analyzing the results</h2>

Once your scraping has been done, or if an error occurred in the process, you'll be able to analyse the results of your actions within a dedicated callback taking the following arguments:

* **err**: an error asserting that your scraping job failed (because of a 404 for instance or because your script did not return the information before a precise timeout etc.). You should **really** check errors. Scraping is not a reliable science and you should be prepared to see things fail sometimes. Note however that the spider is able to retry jobs if you ever want to.
* **req**: the request you passed to the spider (the url you gave, any arbitrary data or parameters you might need to pass along the spider etc.).
* **res**: the response received along with the scraped data. `res.data`, for instance, holds the results of your scraper function.

---

<h2 id="running">Running the spider</h2>

Once your spider is correctly defined, you can finally run it:

```js
spider.run(function(err, remains) {
  console.log('Finished!');
});
```

The `run` callback accepts two important arguments:

* **err**: a spider-level error that made it fail globally, if any.
* **remains**: an array of scraping jobs that failed along with the resultant error so you can retry later or just assess the losses.

---

<h2 id="more-pages">More pages?</h2>

But one might notice that this is quite silly to deploy such shenaningans just to scrape a single page.

Needless to say that **sandcrawler** enables you to scrape multiple pages. Just pass an array of urls to the spider's `urls` method and there you go:

```js
spider.urls([
  'https://news.ycombinator.com',
  'https://news.ycombinator.com?p=2',
  'https://news.ycombinator.com?p=3',
  'https://news.ycombinator.com?p=4'
]);
```

Note also that if you need to deduce the next urls from the current page, you can also [iterate]({{ site.baseurl }}/spider#iterate) or even [add urls]({{ site.baseurl }}/spider#add) to the spider at runtime without further ado.

---

<h2 id="phantomjs">Need phantomjs?</h2>

But sometimes, static scraping is clearly not enough and you might need to perform silly operations such as develop a long infinite scrolling or triggering complex XHR requests requiring great amount of authentication.

For this, you can use the library's phantom spiders that will use [phantomjs](http://phantomjs.org/) for you:

```js
// Just change
sandcrawler.spider();
// into
sandcrawler.phantomSpider();
```

If you ever need more information about differences between regular spiders and phantom ones, you can read this [page]({{ site.baseurl }}/phantom_spider).

---

<h2 id="prototyping">Prototyping within your web browser</h2>

Prototyping scrapers server-side can be tiresome at times.

Fortunately, **sandcrawler** has been designed to be the [artoo.js](https://medialab.github.io/artoo/)' big brother. The latter makes client-side scraping more comfortable and enables you to prototype, in your browser, scrapers you will run using **sandcrawler** later.

Indeed, any **sandcrawler** scraper function can use **artoo.js** and **jQuery** seamlessly so you can use your scripts both in the browser and in the server.

---

<h2 id="plugins">Plugins</h2>

As a conclusion, know that, under the hood, **sandcrawler**'s spiders are event emitters. This makes the creation of plugins a very easy task.

For the sake of the example, let's say you want to log "Yeah!" to the console each time a scraping job succeeds:

```js
spider.on('job:success', function(job) {
  console.log('Yeah!');
});
```

One can then easily create a plugin function by writing the following:

```js
function myPlugin(opts) {
  return function(spider) {

    spider.on('job:success', function(job) {
      console.log('Yeah!');
    });
  };
}
```

And plug it into his/her spiders likewise:

```js
spider.use(myPlugin());
```

For more information about plugins or if you want to know if a plugin already exists to tackle your needs, you can check this [page]({{ site.baseurl }}/plugins).

---

<h2 id="what-now">What now?</h2>

Now that you know the basics of sandcrawler, feel free to roam (or even scrape...) its documentation whose summary can be found on your left.

<blockquote align="center" class="twitter-tweet" lang="en"><p>Show more data on your web page than available in your API? That&#39;s a scrapin&#39; <a href="http://t.co/sGCsFXUTjF">pic.twitter.com/sGCsFXUTjF</a></p>&mdash; Andrew Nesbitt (@teabass) <a href="https://twitter.com/teabass/status/557877644474454016">January 21, 2015</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>
