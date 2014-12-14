---
layout: page
title: Quick Start
id: quick_start
---

# {{ page.title }}

---

**sandcrawler.js** is a scraping library aiming at performing complex scraping tasks where client-side JavaScript execution is needed.

But before being able to do so, let's see how one could perform simpler tasks like scraping the famous *Hacker News*.

---

## Defining our scraper

First of all, we need to create a scraper to describe what we intend to perform here:

```js
// Let's start by requiring the library
var sandcrawler = require('sandcrawler');

// Now let's define a new scraper and start chaining
var myScraper = sandcrawler.scraper();

  // What we need is to hit the following url
  .url('https://news.ycombinator.com')

  // With the following extracting script we are going to write
  .script('./extractor.js')

  // So that we can handle the result
  .result(function(err, req, res) {
    console.log('Url scraped, retrieved:', res.data);
  });
```

---

## Writing a script to extract our data

Now that we defined the behaviour of our scraper, we need to write the `extractor.js` file so that we can retrieve the data we need.

Let's say we are a bit lazy and we just want to retrieve the title of the site for the time being.

One has to understand that the script we are writing now will be executed within phantomjs on `https://news.ycombinator.com` and must be asynchronous.

This script must therefore call the `done` function with the desired data when extraction is finished so he can return control to **sandcrawler**.

*extractor.js*

```js
// Getting the title
var title = document.title;

// Notifying sandcrawler that the extraction is done
done(title);
```

1. Why should I use a callback? Can't I just return the data like in a function?

> No you cannot. How would you fare if what you need is to wait for certain XHR calls to succeed before retrieving your data? Stop fighting against asynchronicity and start playing along with it.

<ol start="2">
  <li>What if this <em>done</em> function already exists within the host webpage and we are messing with it?</li>
</ol>

> Do not worry for **sandcrawler** always ensures that your client-side extracting scripts are always run within a safe environment. This callback will always be available as well as other utilities the library offers you such as jQuery and artoo.js.

---

## More on the result

Let's go back a moment on our scraper's result callback so we understand what is going on:

```js
var myScraper = sandcrawler.scraper()
  .url('https://news.ycombinator.com')
  .script('./extractor.js')
  .result(function(err, req, res) {
    // Exposing result of our scraping job
  });
```

This callback is exposing the following arguments:

* **err**: a potential error. Life is hard and errors are frequent when scraping: 404 status, your extracting script was poorly written etc.
* **req**: the request that was passed by your scraping job. `req.url` is `https://news.ycombinator.com`, for instance.
* **res**: the response you received. Here, `res.data` would be what was returned by the `done` callback in your extracting script.

Note that both `req` and `res` arguments hold a lot of information you might need while scraping like urls, headers, arbitrary data etc.

---

## Running our scraper

We are now ready to unleash our scraper, let's wrap things up and use `sandcrawler.run` to do so:

*extractor.js*

```js
var title = document.title;
done(title);
```

*scrape-hn.js*

```js
var sandcrawler = require('sandcrawler');

var myScraper = sandcrawler.scraper();
  .url('https://news.ycombinator.com')
  .script('./extractor.js')
  .result(function(err, req, res) {
    console.log('Url scraped, retrieved:', res.data);
  });

// Launching the scraper
sandcrawler.run(myScraper);
```

*Running the script*

```bash
node scrape-hn.js
```

Now, if stars are correctly aligned, your console should ouput the following:

```
Hacker News
```

A phantomjs instance was spawned automatically for you and ran your extracting script on `'https://news.ycombinator.com` so you could retrieve the page's title.

---

## Prototyping within your web browser

---

## Adding more pages to that

---

## Jawascript

---

## Isn't phantomjs overkill?

---

## What now?

plugins



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

// Running our scraper with phantomjs
sandcrawler.run(scraper, function(err, remains) {
  console.log('Finished');
});
```
