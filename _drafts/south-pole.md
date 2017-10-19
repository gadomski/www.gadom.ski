---
layout: post
title:  "Bespoke thermal-LiDAR integration at the South Pole"
tags: infratec riegl south-pole tls
---

We've worked with [Riegl](http://www.riegl.com/) and [InfraTec](http://www.infratec.eu/) to integrate an InfraTec VarioCAM HD with Riegl [TLS](https://en.wikipedia.org/wiki/Lidar#Terrestrial_lidar) scanners.
To date, this integration is not complete; we can take pictures with an InfraTec camera on top of a Riegl scanner, and we have developed a calibration for the camera and the mounting, but full software integration is still in the future.
Even with incomplete integration, we brought a Riegl scanner and a InfraTec camera to the South Pole in January of 2017 to perform a three-dimensional survey of infrastructure with integrated thermal information.

![2017-01-SouthPole overview image](/img/2017-01-SouthPole-overview.png)

This is an overview picture of the resultant data.
The legend is incorrect, the colorization is in degrees Celsius; I'll explain why that's "time" later in this post.

This post walks through the procedures and the software used to do the integration.

## Source data

The TLS data were collected in 23 individual scan positions throughout the facility.

![2017-01-SouthPole scan positions](/img/2017-01-SouthPole-scan-positions.jpg)

Each scan position included between five and nine thermal images, captured from a camera mounted on top of the TLS scanner.
The heavy lifting of registering and QC-ing all of these scans was done by my colleague Adam.
He also used InfraTec's software to convert each thermal image (in the `irb` format, discussed later) to a simple colormap jpg, and imported these colormaps into Riegl.
This ensured that each thermal image had an associated image record in the RiSCAN Pro project[^1].

## Coordinate systems

As a part of the registration process, each scan position has its own Scanner's Own Position (SOP) matrix, a 4x4 transformation matrix that brings points from the Scanner's Own Coordinate System (SOCS) to the PRoject Coordinate System (PRCS).
The project as a whole then has one Project's Own Position (POP) matrix, which brings points from PRCS to the GLobal Coordinate System (GLCS).

Each thermal image also has an associated Camera's Own Position (COP) matrix, which changes with each picture because the scanner head rotates for each new image.
The camera mounting also has its own transformation matrix that represents the camera's position with relation to the scanner origin, known as the mounting matrix (MM).
Together, the mounting matrix and the COP matrix can bring a point from SOCS to the CaMera's Coordinate System (CMCS).

![Riegl coordinate systems](/img/riegl-coordinate-systems.png)

These matrices are all contained in the the RiSCAN Pro project file, an xml file that resides in each RiSCAN Pro project directory.
I created the [riscan-pro](https://github.com/gadomski/riscan-pro) Rust library to parse these matrics from RiSCAN Pro projects and use them for coordinate conversions (and more).
You can see the methods used to go up and down this "coordinate ladder" in [the library's documentation](https://docs.rs/riscan-pro/0.2.1/riscan_pro/struct.Point.html).

## Camera calibration

In order to convert points from the CMCS to actual image pixels, certain properties of the camera itself must be known or discovered.
We've developed a camera calibration for our InfraTec VarioCAM HD, and this calibration is contained inside of the RiSCAN Pro project.
The math underlying this calibration is beyond me, but it is laid out exactly in the Riegl project documentation, so I simply tranferred it over to [my Rust library](https://docs.rs/riscan-pro/0.2.1/src/riscan_pro/camera_calibration.rs.html#70-105).

The camera calibration converts three-dimensional CMCS points to a two-dimensional pixel.
This math isn't perfect &mdash; it can produce "valid" pixel values for points that are, e.g., behind the camera.
My library does some additional filtering to ensure that each CMCS point maps to a valid pixel value or [None](https://doc.rust-lang.org/std/option/).

## Putting it together

We now have all the math we need to:

1. Find the corresponding thermal pixel, if one exists, for each SOCS point.
2. Convert SOCS points to GLCS points.

Now we just need to read our data.

Our point clouds are stored as `rxp` files, which is the proprietary file format from Riegl.
Thankfully, they provide [RiVLib](http://www.riegl.com/index.php?id=224)[^2], which provides a library for reading `rxp` data.
I made a FFI wrapper around their library and a helper library in the Rust workspace [rivlib-rs](https://github.com/gadomski/rivlib-rs), which I use to read rxp points into Rust.

A similar situation presents itself with the thermal data.
InfraTec's `irb` format is closed and proprietary, but they also provide a library[^3] for reading `irb` files.
Again, I wrote a FFI wrapper and helper library[^4], this time named [irbacs-sys](https://github.com/gadomski/irbacs-sys) and [irb-rs](https://github.com/gadomski/irb-rs) respectively.

The pieces are now all set up.
To review, these are the individual rust crates we have so far:

- **riscan-pro**
- **irb**
    - depends on **irbacs-sys**
- **scanifc**
    - depends on **scanifc-sys**

Each one of these crates stands more-or-less on its own, and could be used in other projects.
Everything from here on out will be pretty us-specific, so it probably belongs in its own crate: the **Thermal Colorization Engine**, or [**tce**](https://github.com/gadomski/tce).

The basic mechanics are pretty simple:

1. For each SOCS point in each rxp file, find all temperature values that overlap that point.
2. Average these temperature values to produce a single temperature value.
3. Create a `las` point with the following attributes:
    1. XYZ in GLCS.
    2. GpsTime set to the temperature, in °C.
    3. RGB set to a color-ramp value, as determined by the temperature.
4. Write the `las` point out to a file, one output file per input `rxp` file.

The `las` format doesn't do custom attributes well.
The extra bytes mechanism does exist for las 1.4, but it's not universally supported[^5].
The `GpsTime` field is convenient for us, since it's (a) a double field and (b) pretty useless for our TLS data.
So we shove the temperature value into there.

## Coordinate reference system and compression

My [las-rs](https://github.com/gadomski/las-rs) library doesn't support compressed output or coordinate reference system information, so we use PDAL to do a bit of post-processing.

```bash
pdal translate -i infile.las -o outfile.laz -f sample -f outlier --filters.sample.radius=0.02 --writers.las.a_srs="EPSG:32761+5773"
```

The `outfile.laz` tells PDAL to write a compressed laz output.
The sample filter resamples the data to roughly 0.02m sampling using the [poisson method](https://www.pdal.io/stages/filters.sample.html).
And the outlier filter removes blatantly invalid in-air points.

## Conclusion

It took a decent amount of work, but we now have an engine that can be used to colorize Riegl-collected TLS data with InfraTec thermal imagery.
I won't be sad when Riegl does this integration themselves, but until then, this'll do.

## Footnotes

[^1]: RiSCAN Pro is Riegl's terrestrial laser scanning software. It's not a terrible piece of kit, but it's a pretty black-box system, and doing the same thing over and over again isn't it's strongest suit. Highly manual tasks, such as registration, are best done in RiSCAN Pro, so we use RiSCAN Pro projects as our starting point for this custom integration.
[^2]: To their customers.
[^3]: You think they'd give this to non-customers? SMH.
[^4]: Discerning readers might notice that I used a workspace for my Riegl wrappers, but two seperate repositories for my InfraTec wrappers. Why? The `irb-rs` library includes some code that doesn't require `irbacs-sys` to run, namely the ability to read text exports created by InfraTec software. Workspaces seem to work best when you don't fiddle with features much -- when `cargo build --all` Just Works and builds everything. Since the Riegl stuff is very tightly integrated, it made sense to be a workspace -- less so for the InfraTec stuff.
[^5]: In particular, QT Modeler does not support extra bytes AFAICT.
