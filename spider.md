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

*Introduction*

* [Basics](#basics)

*Spider methods*

--*Feeding*

* [spider.url](#url)
* [spider.urls](#urls)
* [spider.addUrl](#addurl)
* [spider.addUrls](#addurls)
* [spider.iterate](#iterate)

--*Scraping*

* [spider.scraper](#scraper)
* [spider.scraperSync](#scraper-sync)

--*Lifecycle*

* [spider.result](#result)
* [spider.before](#before)
* [spider.beforeScraping](#before-scraping)
* [spider.afterScraping](#after-scraping)
* [spider.on/etc.](#on)

--*Configuration*

* [spider.config](#config)
* [spider.timeout](#timeout)
* [spider.limit](#limit)
* [spider.validate](#validate)
* [spider.throttle](#throttle)
* [spider.use](#use)

--*Controls*

* [spider.run](#run)
* [spider.pause](#pause)
* [spider.resume](#resume)
* [spider.exit](#exit)

*Job specification*

* [job](#job)
* [job.req](#req)
* [job.res](#res)

*Conclusion*

* [Bonus](#bonus)

---

<h2 id="basics">Basics</h2>

Here is how a spider works:

* You must create one:

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

* Chained, it may look like this:

```js
var spider = sandcrawler('MySpiderName')
  .urls([
    'http://url1.com',
    'http://url2.com'
  ])
  .scraper(function($, done) {
    done(null, $('.yummy-data').scrape());
  })
  .result(function(err, req, res) {
    console.log('Yummy data!', res.data);
  })
  .run(function(err, remains) {
    console.log('Finished!');
  });
```

---

Note that if you need to perform your scraping task in a phantom, you just need to change the spider type and it should work the same:

```js
var spider = sandcrawler.phantomSpider();
// instead of
var spider = sancrawler.spider();
```

Be sure however to pay a visit to the [Phantom Spider]({{ site.baseurl }}/phantom_spider) page of this documentation to avoid typical pitfalls.

---

<h2 id="url">spider.url</h2>

This method can be used to add a single job to your spider's queue.

A job, in its most simple definition, is a mere url but can be described by an object to inform the spider you need finer parameters.

```js
spider.url(feed);
```

*Arguments*

* **feed** *string|object* : either a string representing the url you need to hit, or a descriptive object containing the possible keys listed below:

*Job descriptive object*:

* **url** *string|object*: the url you need to hit as a string or an object to be formatted by node's [url](http://nodejs.org/api/url.html) module.
* **auth** *?object*: an object containing at least a `user` and optionally a `password` to authenticate through http.
* **body** *?object|string*: if `bodyType` is set to `'form'`, either a querystring or an object that will be formatted as a querystring. If `bodyType` is set to `'json'`, either a JSON string or an object that will be stringified.
* **bodyType** *?string* [`'form'`]: either `'form'` or `'json'`.
* **cookies** *?array*: array of cookies to send with the request. Can be given as string or as an object that will be passed to [tough-cookie](https://www.npmjs.com/package/tough-cookie#properties).
* **data** *?mixed*: any arbitrary data, usually an object, you would need to attach to your job and pass along the spider for later user (a database id for instance).
* **headers** *?object*: object of custom headers to send with the request.
* **method** *?string* [`'GET'`]: http method to use.
* **proxy** *?string*: a proxy for the request.
* **timeout** *?integer* [`5000`]: time in milliseconds to perform the job before triggering a timeout.

*Examples*

```js
// String url
spider.url('http://nicesite.com');

// Url object
spider.url({
  port: 8000,
  hostname: 'nicesite.com'
});

// Job object
spider.url({
  url: {
    port: 8000,
    hostname: 'nicesite.com'
  },
  headers: {
    'User-Agent': 'The jawa avenger'
  },
  data: {
    id: 'nice1',
    location: './test/'
  }
});
```

---

<h2 id="urls">spider.urls</h2>

Same as `spider.url` except you can pass an array of jobs.

```js
spider.urls(feeds);
```

*Examples*

```js
spider.urls([
  'http://nicesite.com',
  'http://prettysite.com'
]);

spider.urls([
  {url: 'http://nicesite.com', method: 'POST'},
  {url: 'http://prettysite.com', method: 'POST'}
]);
```

*Note*

Under the hood, `spider.url` and `spider.urls` are strictly the same. It's just a matter of convention and style to dissociate them.

---

<h2 id="addurl">spider.addUrl</h2>

Alias of [`spider.url`](#url).

---

<h2 id="addurls">spider.addUrls</h2>

Alias of [`spider.urls`](#urls).

---

<h2 id="iterate">spider.iterate</h2>

This method takes a function returning the next url from the result of the last job or `false` if you want to stop.

```js
spider.iterate(fn);
```

The given function will be passed the following arguments:

* **i** *integer*: index of the last job.
* **req** *object*: last job request.
* **res** *object*: last job's response.

*Example*

```js
// Spider starting on a single url and paginating from it
var spider = sandcrawler.spider()
  .url('http://nicesite.com')
  .iterate(function(i, req, res) {
    return res.data.nextUrl || false;
  })
  .scraper(function($, done) {
    done(null, {nextUrl: $('.next-page').attr('href')});
  });

// This is roughly the same as adding the next url at runtime
var spider = sandcrawler.spider()
  .url('http://nicesite.com')
  .scraper(function($, done) {
    done(null, {nextUrl: $('.next-page').attr('href')});
  })
  .result(function(err, req, res) {
    if (!err && res.data.nextUrl)
      this.addUrl(res.data.nextUrl);
  });
```

---

<h2 id="scraper">spider.scraper</h2>

This method registers the spider's scraping function.

```js
spider.scraper(fn);
```

This function will be given the following arguments:

* **$**: the retrieved html loaded into [cheerio](https://github.com/cheeriojs/cheerio) and extended with [artoo.scrape]({{ site.links.artoo }}/scrape).
* **done**: a callback to call when your scraping is done. This function is a typical node.js callback and takes as first argument an error if needed and the scraped data as second argument.

*Example*

```js
// Simplistic example to retrieve the page's title
spider.scraper(function($, done) {
  done(null, $('title').text());
});
```

*Note*

Any error thrown within this function will fail the current job but won't exit the process.

---

<h2 id="scraper-sync">spider.scraperSync</h2>

Synchronous version of `spider.scraper`.

```js
spider.scraperSync(fn);
```

This function will be given the following argument:

* **$**: the retrieved html loaded into [cheerio](https://github.com/cheeriojs/cheerio) and extended with [artoo.scrape]({{ site.links.artoo }}/scrape).

*Example*

```js
// Simplistic example to retrieve the page's title
spider.scraper(function($) {
  return $('title').text();
});
```

*Note*

Any error thrown within this function will fail the current job but won't exit the process.

---

<h2 id="result">spider.result</h2>

Method accepting a callback dealing with jobs' results.

```js
spider.result(fn);
```

This function will be given the following arguments:

* **err**: a potential error that occurred during the job's scraping process.
* **req**: the job's request you passed.
* **res**: the resultant response.

*Example*

```js
spider.result(function(err, req, res) {
  if (err) {
    console.log('Oh, no! An error!', err);
  }
  else {
    saveInDatabase(res.data);
  }
});
```

*Retries*

Note that within the result callback, you are given the opportunity to retry failed jobs.

There are three `req` method that you can use to do so:

* **req.retry/req.retryLater**: put the failed job at the end of the spider's queue so it can be retried later.
* **req.retryNow**: put the failed job at the front of the spider's queue so it can be retried immediately.

```js
spider.result(function(err, req, res) {
  if (err) {
    // Our job failed, let's retry now!
    req.retryNow();
  }
});
```

Note also that you can set a `maxRetries` [setting](#config) not to be trapped within an infinite loop of failures.

---

<h2 id="before">spider.before</h2>

Register a middleware applying before the spider starts its job queue.

This is useful if you need to perform tasks like logging into a website before being able to perform your scraping tasks.

```js
spider.before(fn);
```

The function passed will be given the following argument:

* **next**: the function to call with an optional error if failed. Note that if such an error is passed when applying `before` middlewares, then the spider will fail globally.

*Example*

```js
// Checking whether our database is available before launching the spider
var spider = sandcrawler.spider()
  .url('http://nicesite.com')
  .before(function(next) {
    if (databaseAvailable())
      return next();
    else
      return next(new Error('database-not-available'));
  });

sandcrawler.run(spider, function(err) {
  // database-not-available error here if our middleware failed
});
```

---

<h2 id="before-scraping">spider.beforeScraping</h2>

Register a middleware applying before the spider attempts to perform a scraping job.

This gives you the opportunity to discard a job before it's even performed.

The function passed will be given the following arguments:

* **req**: the request about to be passed.
* **next**: the function to call with an optional error if failed. Note that if such an error is passed when applying `beforeScraping` middlewares, then the job will be discarded.

*Example*

```js
// Checking whether we already scraped the url before
var scrapedUrls = {};

var spider = sandcrawler.spider()
  .url('http://nicesite.com')
  .beforeScraping(function(req, next) {
    if (scrapedUrls[req.url]) {
      return next(new Error('already-scraped'));
    }
    else {
      scrapedUrls[req.url] = true;
      return next();
    }
  });
```

---

<h2 id="after-scraping">spider.afterScraping</h2>

Register a middleware applying after the spider has performed a scraping job.

The function passed will be given the following arguments:

* **req**: the passed request.
* **res**: the resultant response.
* **next**: the function to call with an optional error if failed. Note that if such an error is passed when applying `afterScraping` middlewares, then the job will be failed.

*Example*

```js
// Validate the retrieved data
var spider = sandcrawler.spider()
  .url('http://nicesite.com')
  .scraperSync(function($) {
    return $('.title').scrape({
      title: 'text',
      href: 'href'
    });
  })
  .afterScraping(function(req, res, next) {
    if (!res.data.title || !res.data.href)
      return next(new Error('invalid-data'));
    else
      return next();
  });
```

---

<h2 id="on">spider.on/etc.</h2>

Every spider is a standard node [event emitter](http://nodejs.org/api/events.html).

This means you can use any of the event emitters methods like `on` or `removeListener`.

For more information about the events you can listen, you should head towards the [lifecycle]({{ site.baseurl }}/lifecycle) part of this documentation.

---

<h2 id="config">spider.config</h2>

This method can be used to tune the spider's configuration.

```js
spider.config(object);
```

*Options*

* **auth** *?object*: an object containing at least a `user` and optionally a `password` to authenticate through http.
* **autoRetry** [`false`]: should the spider attempt to retry failed job on its own?
* **body** *?object|string*: if `bodyType` is set to `'form'`, either a querystring or an object that will be formatted as a querystring. If `bodyType` is set to `'json'`, either a JSON string or an object that will be stringified.
* **bodyType** *?string* [`'form'`]: either `'form'` or `'json'`.
* **concurrency** *integer* [`1`]: number of jobs to perform at the same time.
* **cookies** *?array*: array of cookies to send with the request. Can be given as string or as an object that will be passed to [tough-cookie](https://www.npmjs.com/package/tough-cookie#properties).
* **headers** *?object*: object of custom headers to send with the request.
* **jar** *?boolean|object|string*: if `true` the spider will keep the received cookies to use them in further requests. Can also take a path where cookies will be store thanks to [tough-cookie-filestore](https://www.npmjs.com/package/tough-cookie-filestore) so you can re-use them later. Finally, can take a [tough-cookie](https://www.npmjs.com/package/tough-cookie) or [request](https://www.npmjs.com/package/request) jar object (note that you can also access a spider's jar through `spider.jar`.
* **limit** *?integer*: max number of jobs to perform.
* **maxRetries** *?integer*  [`3`]: max number of times one can retry a job.
* **method** *?string* [`'GET'`]: http method to use.
* **proxy** *?string*: a proxy to use for the requests.
* **timeout** *?integer* [`5000`]: time in milliseconds to perform the jobs before triggering a timeout.

*Example*

```js
spider.config({
  proxy: 'http://my-proxy.fr',
  method: 'POST',
  timeout: 50 * 1000
});
```

---

<h2 id="timeout">spider.timeout</h2>

```js
spider.timeout(milliseconds);
```

Shorthand for:

```js
spider.config({timeout: milliseconds});
```

---

<h2 id="limit">spider.limit</h2>

```js
spider.limit(nb);
```

Shorthand for:

```js
spider.config({limit: nb});
```

---

<h2 id="validate">spider.validate</h2>

Gives you an opportunity to validate the scraped data before the result callback.

```js
spider.validate(spec);
```

*Argument*

* **spec** *typologyDefinition|function*: either a [typology](https://github.com/jacomyal/typology) definition or a custom function taking as sole argument the scraped data.

*Examples*

```js
// The scraped data must be a string or a number
spider.validate('string|number');

// The scraped title must be at least 5 characters
spider.validate(function(data) {
  return data.length >= 5;
});
```

Under the hood, this method registers a validation `afterScraping` middleware.

---

<h2 id="throttle">spider.throttle</h2>

Delay the scraping process of each job by the given amount of time (this is particularily helpful when you don't want to hit on servers too hard and avoid being kicked out for being too obvious in your endeavours).

```js
spider.throttle(milliseconds);
spider.throttle(minMilliseconds, maxMilliseconds);
```

Either the job will be delayed for the given time in milliseconds or you can pass a minimum and a maximum, also in milliseconds, to randomize the throttling.

---

<h2 id="user">spider.use</h2>

Makes the spider use the given plugin.

```js
spider.use(plugin);
```

For more information about plugins, you should head towards [this]({{ site.baseurl }}/plugins) section of the documentation.

---

<h2 id="run">spider.run</h2>

Starts the spider.

```js
spider.run(callback);
```

Takes a single callback taking the following arguments:

* **err** *error*: a JavaScript error if the spider failed globally.
* **remains** *array*: an array consisting of every failed jobs and their associated errors.

*Example*

```js
spider.run(function(err, remains) {
  if (err)
    console.log('The spider failed:', err.message);
  else
    console.log(remains.length + ' jobs failed.');
});
```

Note also that `spider.run` is an alias to `sandcrawler.run(spider)`.

```js
spider.run(function(err, remains) {
  //...
});

// is exactly the same as
sandcrawler.run(spider, function(err, remains) {
  //...
});
```

---

<h2 id="pause">spider.pause</h2>

Pauses the spider execution.

---

<h2 id="resume">spider.resume</h2>

Resumes the spider execution.

---

<h2 id="exit">spider.exit</h2>

Exits the spider and fails every jobs in the queue.

```js
spider.result(function(err, req, res) {
  this.exit();
});

sandcrawler.run(function(err, remains) {
  // err.message will be 'exited'
});
```

---

<h2 id="job">job</h2>

Spiders materialize their scraping processes as jobs so they can track them and provide their users with useful information.

For instance, every url fed to a spider will be translated, in the spider's lifecycle, as a job having the following keys:

*Keys*

* **id**: the job's unique id.
* **original**: the exact feed you passed to the spider and that was used to create the job.
* **req**: the job's request.
* **res**: the job's response.
* **state**: several state-related flag like whether the job is failing etc.
* **time**: an object containing a `start` and `stop` node process hrtime.

---

<h2 id="req">job.req</h2>

The job's request object.

*Keys*

* **data**: any arbitrary data attached by the user to the request.
* **retries**: number of time the request was already retried.
* **url**: the requested url (may differ from the eventually hit url).

And any other keys set by the user while adding the job through the [url](#url) method.

---

<h2 id="res">job.res</h2>

The job's response object.

*Keys*

* **body**: body of the response.
* **data**: data as returned by the scraping function supplied to the spider.
* **error**: an eventual error if the job failed.
* **headers**: any response headers.
* **status**: http status code.
* **url**: the eventually hit url (after redirections, for instance).

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
