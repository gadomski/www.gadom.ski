---
layout: post
title: "Vertical datum conversions with PDAL"
tags: pdal vertical-datum
---

In order to match collected point cloud data to existing records, it is often necessary to convert the data from one coordinate system to another.
Some types of conversions, e.g. basic reprojections, can be completely described by mathematical functions, making them relatively straightforward.
Converting between vertical datums, however, can be more challenging.

For a good introduction to vertical datums, [NOAA has a quality tutorial](https://vdatum.noaa.gov/docs/datums.html).
In this exercise, we are going to convert the vertical coordinates of a point cloud from a three-dimensional reference system, NAD 83 (1986), to a vertical datum, the North American Vertical Datum 1988 (NAVD 88).
NAVD 88 is based on the Earth's gravity field, which varies in space (and in time) based upon rock density, crustal thickness, and a variety of other factors.
Earth's gravity field can be expressed through a geoid, which is a (from the NOAA tutorial):

> equipotential surface, defined in the Earth's gravity field, which best fits, in a least squares sense, global mean sea level (MSL)

In order to use [PDAL](https://www.pdal.io/) to convert vertical coordinates to a new vertical datum, we'll need to fetch the appropriate geoid.
PDAL uses [proj.4](http://proj4.org/) under the hood, and proj.4 accepts geoid's in NOAA VDatum's `gtx` file format.
We can fetch the 12B geoid from the [VDatum download website](https://vdatum.noaa.gov/download.php).
Inside the 12B zipfile there is a file called `g2012b_conus.gtx`; this is the geoid for the Continental United States (CONUS).
We'll use this file to convert our data.

For this example, we'll convert data in NAD83 / UTM 18N, which has an [EPSG code](http://www.epsg.org/) of `EPSG:26918` using the `pdal translate` subcommand.

```bash
pdal translate -i infile.las -o outfile.las \
    -f reprojection \
    --filters.reprojection.out_srs="+init=EPSG:26918 +geoidgrids=/path/to/vdatum/g2012b_conus.gtx" \
    --writers.las.a_srs=EPSG:26918+5703
```

By providing the geoid path, PDAL will use proj.4 to convert each point to the NAVD88 vertical datum.
The `--writers.las.a_srs=EPSG:26918+5703` option sets the spatial reference system of the output file to the compound EPSG code `EPSG:26918+5703`.
[EPSG:5703](http://spatialreference.org/ref/epsg/north-american-vertical-datum-of-1988-height/) is NAVD88.
