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

---

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

## Usage

To start using the library, head towards the [Quick Start]({{ site.baseurl/quick_start }}) section for a fast tutorial and you'll soon be able to design the code presented below.

```js
var sandcrawler = require('sandcrawler');

var scraper = sandcrawler.scraper()
  .url('https://news.ycombinator.com/')
  .script('./retrieve-post.js')
  .result(function(err, req, res) {
    console.log(res.data);
  });

sandcrawler.run(scraper, function(err, remains) {
  console.log('Finished');
});
```

---

## Features

* **Scraper abstraction**: define your scraping jobs easily with the library's chainable methods and run them without further ado.
* **Phantomjs**: Let the library handle [phantomjs](http://phantomjs.org/) for you if you need browser emulation.
* **Complex dynamic scraping**: Need to log into facebook and auto-scroll/expand a full page? sandcrawler is made for you.
* **Static scraping**: You don't need browser emulation? The library will fallback to ye olde static scraping techniques.
* **Scalable and reliable**: Don't lose data within your scraping process anymore thanks to the library's paranoid strategies.
* **Easy prototyping**: Design your scraping scripts in your browser thanks to [artoo.js](http://medialab.github.io/artoo/) and use the same script within sandcrawler to perform the job.
* **Loaded with helpers**: sandcrawler deploys a cosy scraping environment along with [artoo.js](http://medialab.github.io/artoo/) utilities.
* **Fully customizable**: You want really precise headers, a custom user-agent and complex logic? You'll have them all.
* **Reusable logic**: Creating plugins for sandcrawler is really easy. Use already existing ones or build yours to fit your needs.

---

## Philosophy

**sandcrawler.js** is being developed by scraper developers for scraper developers with the following concepts in mind:

* **Not a framework**: sandcrawler is a library and not a framework so that people can remain free to develop things in their own way.
* **Exhaustivity over minimalist API**: every detail can be customized. This comes with the cost of a bigger footprint for tiny projects but with more reliance for big ones.
* **Asynchronicity**: sandcrawler is not trying to fight the asynchronous nature of client-side JavaScript. If you want to be able to perform complex scraping tasks on modern dynamic websites, you'd better start embracing this asynchronous nature.
* **Better workflow**: sandcrawler aims at enabling developers to design their scraping scripts within their browsers using [artoo.js](http://medialab.github.io/artoo/) so they can automatize them easily afterwards.

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
