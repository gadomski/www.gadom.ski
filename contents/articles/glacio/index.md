---
title: Real-time Glacier Monitoring
author: gadomski
date: 2014-09-10
template: article.jade
---

One of my work projects went live today: http://glacierresearch.org/.

<span class="more"></span>

Internally known as glac.io (and also available at http://glac.io/), the website serves real-time climate and camera data from sensors located near glaciers all over the world.
Some of the highlights:

- [Real time climate data charting](http://glacierresearch.org/locations/hubbard/data.html): constructed with [d3.js](http://d3js.org/) and a custom-rolled [javascript api for the Corps Water Management System](https://github.com/gadomski/cwms-jsonapi).
  These data provide up-to-the-minute information about the environmental conditions at each of three glacier sites (with more to come soon).
- [Real time images](http://glacierresearch.org/locations/helheim/realtime-images-terminus.html): we currently have four cameras hooked into our site providing recent still imagery of our research sites.
  I've made a viewer (again, with d3.js) to flip through the latest pictures.
  Some of these pictures can be stunning.

<img src="helheim-terminus.jpg" style="width: 400px; margin: auto">

- [Room for growth](http://glacierresearch.org/locations/): the webpage is developed with an eye towards incorporating data from more sites and more projects.
  The code is available on [github](https://github.com/gadomski/glac.io) and uses all open-source technologies.
  The site itself is all static html pages and javascript &mdash; no complex server setup necessary.

[Many agencies and individuals](http://glacierresearch.org/collaborators.html) have worked together to bring these data to one place, and I owe them all a thanks.
