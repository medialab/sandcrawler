---
layout: page
title: Home
id: home
---

<br>

<p align="center">
  <a>
    <img class="inline-img" alt="artoo" width="220" height="220" src="{{ site.baseurl }}/public/img/sandcrawler-icon.svg" />
  </a>
</p>

<h1>sandcrawler.js</h1>
<p align="center"><em>The server-side scraping companion</em></p>

---

**sandcrawler.js** is a node library aiming at providing developers with concise but exhaustive tools to scrape the web.

## Installation

You can install the latest version of **sandcrawler.js** with npm (note that it will install phantomjs for you thanks to this [package](https://www.npmjs.com/package/phantomjs)):

```bash
npm install sandcrawler
```

You can also install the lastest development version thusly:

```bash
npm install git+https://github.com/medialab/sandcrawler.git
```

---

## Bootcamp

Now that you have installed **sandcrawler.js** let's scrape the famous *Hacker News*:

```js
var sandcrawler = require('sandcrawler');

// Defining our scraping task
var scraper = sandcrawler.scraper()

  // Hitting Hacker News' url
  .url('https://news.ycombinator.com/')

  // Running the following client-side script on the page
  .jawascript(function(done) {

    // Using artoo.js to gather data
    var data = $('td.title:has(a):not(:last)').scrape({
      title: {sel: 'a'},
      url: {sel: 'a', attr: 'href'}
    });

    // Notifying that the scraping is done
    done(data);
  })

  // Acting upon result
  .result(function(err, req, res) {

    // Printing scraped data
    console.log(res.data);
  });

// Running task with phantomjs
sandcrawler.run(scraper, function(err, remains) {
  console.log('Finished');
});
```

---

## Features

* **Scraper abstraction**: define your scraping jobs easily with the library's chainable methods and run them without further ado.
* **Phantomjs**: Let the library handle [phantomjs](http://phantomjs.org/) for you if you need browser emulation.
* **Static scraping**: You don't need browser emulation? The library will fallback to ye olde static scraping techniques.
* **Scalable and reliable**: Don't lose data in your scraping process anymore thanks to the library retries utilities and remains stashing.
* **Easy prototyping**: Design your scraping scripts in your browser thanks to [artoo.js](http://medialab.github.io/artoo/) and use the same script within sandcrawler to perform the job.
* **Loaded with helpers**: sandcrawler deploys a cosy scraping environment ensuring your access to jQuery or cheerio and [artoo.js](http://medialab.github.io/artoo/) if needed.
* **Fully customizable**: You want really precise headers, a custom user-agent and complex logic? You'll have them all.
* **Reusable logic**: Creating plugins for sandcrawler is really easy and enables you to use already existing ones or build yours to fit your needs.

---

## Philosophy

**sandcrawler.js** is being developed by scraper developers for scraper developers with the following concepts in mind:

* sandcrawler is a library and not a framework so that people can remain free to develop things in their own way.
* sandcrawler is not trying to fight the asynchronous nature of client-side JavaScript. If you want to be able to perform complex scraping tasks on modern dynamic websites, you have to embrace this asynchronous nature.
* sandcrawler aims at enabling developers to design their scraping scripts within their browsers using [artoo.js](http://medialab.github.io/artoo/) so they can automatize them easily afterwards.

---

## Contribution
[![Build Status](https://travis-ci.org/medialab/sandcrawler.svg)](https://travis-ci.org/medialab/sandcrawler)

Contributions are more than welcome. Feel free to submit any pull request as long as you added unit tests if relevant and passed them all.

To install the development environment, clone your fork and use the following commands:

```bash
# Install dependencies
npm install

# Testing
npm test
```

---

## Authors
**sandcrawler.js** is being developed by [Guillaume Plique](https://github.com/Yomguithereal) @ SciencesPo - [médialab](http://www.medialab.sciences-po.fr/fr/).

Logo by [Daniele Guido](https://github.com/danieleguido).

---

Under a [MIT License](https://github.com/medialab/sandcrawler/blob/master/LICENSE.txt).
