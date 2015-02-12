---
layout: page
title: Phantom Spider
id: phantom_spider
---

# {{ page.title }}

---

**sandcrawler**'s phantom spider use [phantomjs](http://phantomjs.org/) to enable you to perform complex client-side scraping tasks that would not be possible only by retrieving the static markup of the pages you need to scrape.

They work in a quasi-identical way to the static spiders of this library and this page merely aims at explaining what are the key differences of the phantom spiders and outline frequent pitfalls so you don't to fall into them.

If what you want is understand the basics of the library's spiders, you should go [there]({{ site.baseurl }}/spider) instead.

---

default phantom maybe not what you want

js: phantomSpider

Jawascript

1. Why should I use a callback? Can't I just return the data like in a function?

> No you cannot. How would you fare if what you need is to wait for certain XHR calls to succeed before retrieving your data? Stop fighting against asynchronicity and start playing along with it.

<ol start="2">
  <li>What if this <em>done</em> function already exists within the host webpage and we are messing with it?</li>
</ol>

> Do not worry for **sandcrawler** always ensures that your client-side extracting scripts are always run within a safe environment. This callback will always be available as well as other utilities the library offers you such as jQuery and artoo.js.
