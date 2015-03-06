---
layout: page
title: Lifecycle
id: lifecycle
---

# {{ page.title }}

---

When doing their work, **sandcrawler** spiders abide by a precise lifecyle and will emit events each time they do something so that anyone can hook onto it to track them and implement custom logic.

*Example*

```js
spider.on('spider:start', function() {
  console.log('The spider has started.');
});

spider.on('job:success', function(job) {
  console.log('Success for url:', job.res.url);
});
```

If you ever wonder know what's inside the job objects passed around most of job-level events, be sure to check out this [part]({{ site.baseurl }}/spider#job) of the documentation first.

---

*Spider-level events*

* [spider:start](#start)
* [spider:teardown](#teardown)
* [spider:success](#success)
* [spider:fail](#fail)
* [spider:end](#end)

*Job-level events*

* [job:add](#job-add)
* [job:discard](#job-discard)
* [job:start](#job-start)
* [job:scrape](#job-scrape)
* [job:success](#job-success)
* [job:fail](#job-fail)
* [job:retry](#job-retry)
* [job:end](#job-end)

---

<h2 id="start">spider:start</h2>

Emitted when the spider starts.

---

<h2 id="teardown">spider:teardown</h2>

Emitted when the spider tears down. This is useful to plugins needing to cleanup when the hooked spider finishes its work.

---

<h2 id="success">spider:success</h2>

Emitted when the spider succeeds. Note that the spider can succeed even if some jobs did not. Indeed, the spider will only considered as failed if a global error occurred while running.

*Data*

* **remains**: array of unsuccessful jobs along with their related errors.

---

<h2 id="fail">spider:fail</h2>

Emitted when the spider fails globally.

*Data*

* **err**: the culprit.
* **remains**: array of unsuccessful jobs along with their related errors.

---

<h2 id="end">spider:end</h2>

Emitted when the spider ends, whether it succeeded or failed.

*Data*

* **status**: either `success` or `fail`.
* **remains**: array of unsuccessful jobs along with their related errors.

---

<h2 id="job-add">job:add</h2>

Emitted when a job is added to the spider's queue when running.

*Data*

* **job**: the related job.

---

<h2 id="job-discard">job:discard</h2>

Emitted when a job is discarded from the job's queue because it was rejected by a `beforeScraping` middleware.

*Data*

* **err**: the error that lead to the job being discarded.
* **job**: the related job.

---

<h2 id="job-start">job:start</h2>

Emitted when the spider starts processing a job.

*Data*

* **job**: the related job.

---

<h2 id="job-scrape">job:scrape</h2>

Emitted when the spider starts scraping a job.

*Data*

* **job**: the related job.

---

<h2 id="job-success">job:success</h2>

Emitted when a job succeeds.

*Data*

* **job**: the related job.

---

<h2 id="job-fail">job:fail</h2>

Emitted when a job fails.

*Data*

* **err**: the related error.
* **job**: the related job.

---

<h2 id="job-retry">job:retry</h2>

Emitted when a job is retried.

*Data*

* **job**: the related job.
* **when**: either `now` or `later`.

---

<h2 id="job-end">job:end</h2>

Emitted when a job ends, whether it succeeded or failed.

*Data*

* **status**: either `success` or `fail`.
* **job**: the related job.
