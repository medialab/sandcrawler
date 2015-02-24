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

```js
var sandcrawler = require('sandcrawler');

var spider = sandcrawler.spider()
  .url('https://news.ycombinator.com/')
  .scraper(function($, done) {

    var data = $('td.title:nth-child(3)').scrape({
      title: {sel: 'a'},
      url: {sel: 'a', attr: 'href'}
    });

    done(null, data);
  })
  .result(function(err, req, res) {
    console.log('Scraped data:', res.data);
  })
  .run(function(err, remains) {
    console.log('And we are done!');
  });
```

---

## Features

* **Spider abstraction**: define your scraping jobs easily with the library's chainable methods and run them without further ado.
* **Fully customizable**: You want really precise headers, a custom user-agent and complex logic? You'll have them all.
* **Phantomjs**: Let the library handle [phantomjs](http://phantomjs.org/) for you if you need browser emulation.
* **Complex dynamic scraping**: Need to log into facebook and auto-scroll/expand a full page? sandcrawler is made for you.
* **Reliable**: Don't lose data during your scraping process anymore thanks to the library's paranoid strategies.
* **Scalable**: sandcrawler has been battle-hardened and has already seen the real web's nasty and dirty face.
* **Easy prototyping**: Design your scraping scripts within your browser thanks to [artoo.js](http://medialab.github.io/artoo/) and use the same script within sandcrawler to perform the job.
* **Reusable logic**: Creating plugins for sandcrawler is really easy. Use already existing [ones]({{ site.baseurl }}/plugins) or build yours to fit your needs.

---

## Installation

You can install the latest version of **sandcrawler.js** with npm (note that it will install phantomjs for you thanks to this [package](https://www.npmjs.com/package/phantomjs)):

```bash
npm install sandcrawler
```

You can also install the latest development version thusly:

```bash
npm install git+https://github.com/medialab/sandcrawler.git
```

---

## Usage

To start using the library, head towards the [Quick Start]({{ site.baseurl }}/quick_start) section for a fast tutorial or browse the documentation through the navigation at your left.

```js
var sandcrawler = require('sandcrawler');
```

---

## Philosophy

**sandcrawler.js** is being developed by scraper developers for scraper developers with the following concepts in mind:

* **Not a framework**: sandcrawler is a library and not a framework so that people can remain free to develop things in their own way.
* **Exhaustivity over minimalist API**: every detail can be customized. This comes at the cost of a bigger code footprint for tiny projects but with more reliance for big ones.
* **Asynchronicity**: sandcrawler is not trying to fight the asynchronous nature of client-side JavaScript. If you want to be able to perform complex scraping tasks on modern dynamic websites, you won't be able to avoid asynchronicity very long.
* **Better workflow**: sandcrawler aims at enabling developers to design their scraping scripts within the cosy environment of their browsers using [artoo.js](http://medialab.github.io/artoo/) so they can automatize them easily afterwards.

---

## Plugins

* [**sandcrawler-logger**](https://github.com/Yomguithereal/sandcrawler-logger): *Simple logger to plug into one of your spiders for immediate feedback.*
* [**sandcrawler-dashboard**](https://github.com/medialab/sandcrawler-dashboard): *A handy terminal dashboard displaying advanced information about one of your spiders.*

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
