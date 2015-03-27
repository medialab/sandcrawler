---
layout: page
title: Phantom Spider
id: phantom_spider
---

# {{ page.title }}

---

**sandcrawler**'s phantom spiders use [phantomjs](http://phantomjs.org/) to perform complex client-side scraping tasks that would not be possible by only retrieving the static markup of the pages you need to scrape.

They work in a quasi-identical way to the static spiders of this library and this page merely aims at explaining what are the key differences of the phantom spiders and outlining frequent pitfalls (the most important one being related to [jawascript](#jawascript)).

Note however that if what you want is to understand the basics of the library's spiders, you should go [there]({{ site.baseurl }}/spider) instead.

---

* [Creating a phantom spider](#creating)
* [Spawning a custom phantom](#spawn)
* [Running a phantom spider](#running)
* [On the concept of jawascript](#jawascript)
* [Scraping environment](#environment)
* [spider.inlineScraper/inlineScraperSync](#inline)
* [Phantom-related configuration](#config)

---

<h2 id="creating">Creating a phantom spider</h2>

Creating a phantom spider is as simple as changing

```js
var spider = sandcrawler.spider();
```

into

```js
var spider = sandcrawler.phantomSpider();
```

Note that in most cases you won't have anything else to change to switch from a static to a phantom spider

---

<h2 id="spawn">Spawning a custom phantom</h2>

Need to spawn a custom phantomjs process to handle your scraping job because **sandcrawler**'s defaults don't suit you?

```js
sandcrawler.spawn(opts, callback);
```

*Options*

* **args** *?object*: camel-cased command line [arguments](http://phantomjs.org/api/command-line.html).
* **autoClose** *?boolean* [`true`]: should the phantom child exits on its own when every spider given to it has completed?
* **handshakeTimeout** *?integer* [`5000`]: time allowed in milliseconds to perform the handshake with the phantom child.
* **name** *?string*: an optional name to give to the phantom child.
* **path** *?string*: path of a custom `phantomjs` binary.

*Callback*

* **err**: an error that occurred while spawning the phantom.
* **phantom**: the phantom object.

*Example*

```js
sandcrawler.spawn(
  {
    path: '/opt/phantomjs-2.0.0/bin/phantomjs',
    args: {
      webSecurity: false
    }
  },
  function(err, phantom) {
    if (err) {
      // Handle error
    }

    phantom.run(spider);
  }
);
```

---

<h2 id="running">Running a phantom spider</h2>

Phantom spiders can be run the same way as the static ones.

By default, **sandcrawler** will spawn a phantomjs child for you, use it to perform your scraping tasks, and close it automatically when the work is done.

If you need a precise phantomjs child to run your spiders and need a custom configuration etc., you'll need to [spawn](#spawn) it manually.

```js
// The following will spawn a default phantomjs automatically for you:
spider.run(callback);
sandcrawler.run(spider, callback);

// If you need to spawn your phantomjs manually:
sandcrawler.spawn({...}, function(err, phantom) {

  phantom.run(spider, callback);
  // or,
  spider.run(phantom, callback);
});
```

---

<h2 id="jawascript">On the concept of jawascript</h2>

This is **really** important to understand: the scraper function supplied to a phantom spider won't be executed within your script's context at all.

Instead, the function will be serialized and send to a phantomjs child and executed within a web page's context.

So, what I call jawascript throughout this documentation is merely code that is written in the same script as your node's script but that will be executed elsewhere.

```js
var scriptVariable = 'Hello world!';

var spider = sandcrawler.phantomSpider()
  .scraper(function($, done) {

    // Achtung! This code won't run in node but within a web page
    // As a consequence, you don't have access to 'scriptVariable'
    console.log(scriptVariable) >>> undefined (probably)

    // However, this means you can freely access any browser utilities
    window.navigator;
    var articles = document.querySelectorAll('.article');

    (...)
  });
```

If you find this disturbing or need to pass your script as a string rather than as a function, please see [spider.inlineScraper](#inline).

---

<h2 id="environment">Scraping environment</h2>

Since your scraper is executed within a web page's context, **sandcrawler** can setup a cosy environment for you:

As such, you can:

* Use any browser-specific JavaScript code;
* Access jQuery through the `$` variable (jQuery is injected for you safely and won't mess with the page's already existing `$` variable or jQuery if any).
* Access [artoo.js]({{ site.links.artoo }}) utilities through `artoo`.

N.B.:

* The `done` callback (or the name you gave it, **sandcrawler** will adapt) cannot be overriden by the web page.
* If you need to access the web page's `$` or `done` variables, you remain free to use `window.$` and `window.done`.

---

<h2 id="inline">spider.inlineScraper/inlineScraperSync</h2>

If you want to separate your spider's logic from the scraper script that will be executed in a web page's context or if you need to build your scraper script before giving it to the spider (with [browserify](http://browserify.org/), for instance), you can use `spider.inlineScraper`.

```js
spider.inlineScraper(string);
spider.inlineScraperSync(string);
```

*Examples*

```js
// Asynchronous
spider.inlineScraper('done(null, document.title);');

// Synchronous
spider.inlineScraperSync('return document.title');
```

---

<h2 id="config">Phantom-related configuration</h2>

The following keys, that can only apply to a phantom spider, may be added to a [job descriptive object]({{ site.baseurl }}/spider#url):

* **artoo** *?object*: an artoo.js [settings]({{ site.links.artoo }}settings) object.
* **phantomPage** *?object*: an object to merge with phantomjs page's [settings](http://phantomjs.org/api/webpage/property/settings.html).
