---
layout: post
title:  "atlas.lidar.io"
date:   2017-09-12
tags: atlas rust angular fabric bootstrap d3
---

We have a remote [LiDAR](https://en.wikipedia.org/wiki/Lidar) system at the [Helheim Glacier](https://en.wikipedia.org/wiki/Helheim_Glacier) in southeast Greenland.
This system, called ATLAS, was installed in the summer of 2015 to capture 3D scans of the glacier at regular intervals.
These 3D scans can then be used to extract glacier velocities using, among other technologies, [cpd](/2017/01/20/cpd-v0-5-0.html).

![The latest image from ATLAS_CAM, looking at the ATLAS system](http://glacio.gadom.ski/cameras/ATLAS_CAM/images/latest/redirect)

The latest image from ATLAS_CAM, a remote camera looking at the ATLAS LiDAR system.

In addition to the 3D LiDAR data, the ATLAS system produces a slew of other information, including data on battery charge status, temperature inside the scanner and inside of the scanner mount, and more.
The engineers who built and maintain the system (us) need to keep an eye on these values, so we can see what's happening with the system and find out quickly if something is going wrong (not that there's much we can do about it &mdash; the system is more-or-less autonomous).
This information is also of interest to other stakeholders in the project, including the non-profit Heising-Simons Foundation who funds the work, and our scientific partners.

I've created <http://atlas.lidar.io> to serve this information.
The rest of this post walks through the component parts of the atlas.lidar.io system.

## Data path

The ATLAS system is constantly logging information such as LiDAR scanner status, temperatures, power system status, and more.
These data are compiled into hourly digest messages called "heartbeats".
Heartbeats are transmitted via [Iridium](https://en.wikipedia.org/wiki/Iridium_satellite_constellation) [Short-Burst Data (SBD)](https://www.iridium.com/services/details/iridium-sbd) messages and received by a server process, [sbd-rs](https://github.com/gadomski/sbd-rs), running on our lidar.io box located at CRREL.
The lidar.io box also receives remote camera images from multiple remote cameras via FTP.

### sbd-rs

**sbd-rs** is the first of several server-side components that drive our atlas.lidar.io website.
It is a http server written in [Rust](https://www.rust-lang.org/en-US/) and using the [Iron web framework](http://ironframework.io/).
The server listens for incoming SBD messages, receives and parses these messages, and then stores the messages on the filesystem.
The **sbd-rs** crate includes both a binary executable, for running the server, and a Rust library to provide an API for retrieving SBD messages from Rust code.

Many of the server-side components of the atlas.lidar.io system are written in Rust.
I choose Rust because:

- I love programming in it.
- It is strongly typed and has first-class documentation tests, making it very easy to write robust code that isn't terrible to revisit six months or two years later.
- Because of its memory-safety guarantees, servers I write in Rust are *stable*. I've had zero production-time issues (knock on wood) with the **sbd-rs** server &mdash; it Just Works™.

A downside of Rust is that it isn't widely used or read by other programmers, so components I write in Rust are usually my responsibility alone.
As we'll see, that's led to some design decisions to *not* use Rust for components I want other people to be able to work on.

### glacio

Once the heartbeat messages have been stored on the filesystem as SBD messages, they need to be read and reconstructed into their heartbeat content.
This work is done by the [glacio](https://github.com/CRREL/glacio) Rust library.

Rust's packaging system, Cargo, permits [workspaces](https://doc.rust-lang.org/book/second-edition/ch14-03-cargo-workspaces.html), which group multiple [crates](https://crates.io/).
The **glacio** workspace has three crates:

- **glacio**, the Rust library for reading heartbeats and remote camera images.
- **glacio-http**, an Iron HTTP library for serving ATLAS and other remote station data via a JSON HTTP API.
- **glacio-bin**, a binary executable for querying serverside and starting the JSON HTTP API.

This separation makes it easier to enforce clean code boundaries, ensuring that, e.g., I don't pollute the Rust API with HTTP-specific functionality.

The **glacio** library uses the **sbd-rs** library to read the SBD messages from the filesystem and re-construct the heartbeat messages.
Because SBD messages are byte-limited, a heartbeat message may or may not be broken up into multiple SBD transmissions.
The **glacio-http** library uses the **glacio** Rust API to build JSON-serializable structures and return those structures to HTTP requests using an Iron server.
Finally, the **glacio-bin** binary reads in a configuration file, builds the appropriately-configured HTTP server, and starts that server on lidar.io.

The data are now available to the world, but this HTTP API does *no* actual web presentation work.
I've separated out the web content into a non-Rust project of its own, so that other developers, who might not know Rust, can work on the front-end.
The HTTP API can be used by multiple applications; in fact, the ATLAS_CAM picture at the top of this page is provided by the HTTP API, via the url <http://glacio.gadom.ski/cameras/ATLAS_CAM/images/latest/redirect>.

## Data presentation

Data presentation is handled by an [Angular](https://angular.io/) frontend, [atlas.lidar.io](https://github.com/CRREL/atlas.lidar.io).
I wanted a JavaScript web framework front end because they are made to work with external JSON APIs, and I wanted to enforce separation between my data crunching (**glacio**) and data presentation.
I researched and demoed a couple of options, and I ended up with Angular because (a) its demo was clean and (b) it has first-class routing.
Since I'm not building a web app, but instead emulating a traditional static web page, I needed routing to be easy, and Angular provided that.

I used [Bootstrap](https://getbootstrap.com/) (of course) for styles, and [d3](https://d3js.org/) for graphing.
Angular compiles to a couple of static files when deploying, so it can be served directly by Apache, which reduces the number of moving parts/running processes on the lidar.io box.
The documentation for Angular isn't roadmapped out very well, so figuring out the right way to deploy took a bit of figuring, but once I found the correct instructions things turned out to be *very* easy.

## Deployment

To update both the **glacio** API and the **atlas.lidar.io** website, I use basic [fabric](http://www.fabfile.org/) recipes.
Deploying is as simple as:

```bash
fab deploy
```

This makes it easy to do quick, incremental iterations of the website and JSON API.

### Development versions

Right now I develop new versions of the atlas.lidar.io website against a **glacio** server running locally on my laptop.
I copy down all the necessary source data from lidar.io, and use a me-specific configuration file to serve the glacio data.
This works for my small-scale, local development, but I will eventually need to have a development API available for testing development frontends.

## Conclusion

Rust JSON API backend + Angular web frontend is a pretty swell combination that allows maximum flexibility and power for processing on the backend and good separability and performance on the frontend.
With responsive styling from Bootstrap, this was a really easy way to stand up a mobile-and-desktop enabled website with custom data presentation quickly.
