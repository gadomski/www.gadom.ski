---
layout: post
title: "Slope maps with GMT"
category: gmt
tags: gmt slope-maps ogr skiing
---

About two-thirds of dry slab avalanches occur on slopes between 30° and 45° {% cite McClung2006 %}.
A map of slope angles is therefore a useful tool for safe decision making when backcountry skiing.

The excellent [CalTopo](https://caltopo.com/) provides a suite of map building tools, including a slope angle shading map.
But me being me, I want to make my own maps.

This wakthrough describes how to make a slope angle shading map using free and open data and [GMT](http://gmt.soest.hawaii.edu/).
You'll need the following softwares to follow along:

- GMT
- [GDAL/OGR](http://www.gdal.org/)

## The goal

[Hidden Valley](https://en.wikipedia.org/wiki/Hidden_Valley_(Ski_Estes_Park)) is a abandoned ski area in Rocky Mountain National Park that closed in 1991.
It now is a popular winter destination for backcountry skiing and sledding.
We want to create a map with the dangerous slope angles color-coded, with enough additional context to make it a useful map. 

![Hidden Valley](/img/hidden-valley-slope-angle.png)

## Getting the data

We'll use data from the [USGS 3D Elevation Program](https://nationalmap.gov/elevation.html) to produce our slope, hillshade, and contour images.
Our stream and lake overlays will come from the [National Hydrography Dataset](https://nhd.usgs.gov/), and the roads from the [National Transporation Dataset](https://catalog.data.gov/dataset/usgs-national-transportation-dataset-ntd-downloadable-data-collectionde7d2).
All these products are browsable and downloadable through [The National Map](https://viewer.nationalmap.gov/basic/), but here's direct links to the datasets required for this exercise:

- [n40w106](https://prd-tnm.s3.amazonaws.com/StagedProducts/Elevation/13/GridFloat/USGS_NED_13_n40w106_GridFloat.zip) DEM as GridFloat
- [n41w106](https://prd-tnm.s3.amazonaws.com/StagedProducts/Elevation/13/GridFloat/USGS_NED_13_n41w106_GridFloat.zip) DEM as GridFloat
- [Subbasin 10190005](https://prd-tnm.s3.amazonaws.com/StagedProducts/Hydrography/NHD/HU8/HighResolution/Shape/NHD_H_10190005_Shape.zip) as a shapefile
- [Colorado roads](https://prd-tnm.s3.amazonaws.com/StagedProducts/Tran/Shape/TRAN_8_Colorado_GU_STATEORTERRITORY.zip) as a shapefile

All told, it's about 4.6G of data, organized like this on my system:

```
$ tree -P '*.shp|*.flt'
.
├── dem
│   ├── n40w106
│   │   └── n40w106.shp
│   ├── n41w106
│   │   └── n41w106.shp
│   ├── usgs_ned_13_n40w106_gridfloat.flt
│   └── usgs_ned_13_n41w106_gridfloat.flt
├── roads
│   └── Shape
│       ├── Trans_AirportPoint.shp
│       ├── Trans_AirportRunway.shp
│       ├── Trans_RailFeature.shp
│       ├── Trans_RoadSegment.shp
│       ├── Trans_RoadSegment2.shp
│       ├── Trans_RoadSegment3.shp
│       └── Trans_TrailSegment.shp
└── water
    └── Shape
        ├── NHDArea.shp
        ├── NHDFlowline.shp
        ├── NHDLine.shp
        ├── NHDPoint.shp
        ├── NHDPointEventFC.shp
        ├── NHDWaterbody.shp
        ├── WBDHU10.shp
        ├── WBDHU12.shp
        ├── WBDHU2.shp
        ├── WBDHU4.shp
        ├── WBDHU8.shp
        └── WBDLine.shp

7 directories, 23 files
```

## Creating a simple raster map with GMT

To prove that our system is working, let's create a rainbow elevation map from our DEM data in our area of interest.
We'll use a makefile to build up the products required, and place them all in `build/`.
Let's go through the makefile components one-by-one.

First, we define our area of interest and create a rule for our build directory:

```
XMIN:=-105.70
XMAX:=-105.62
YMIN:=40.37
YMAX:=40.41

build:
	mkdir $@
```

Next, we subset our DEM data to our area of interest using a VRT.
For some reason GMT (on my system) isn't happy reading VRTs, even though it should be able to use any GDAL-y data source, so we use the VRT to create a GeoTIFF:

```
build/dem.vrt: Makefile | build
	gdalbuildvrt -te $(XMIN) $(YMIN) $(XMAX) $(YMAX) $@ $(wildcard dem/*.flt)

build/dem.tif: build/dem.vrt
	gdal_translate $< $@
```

Finally, we create our simple rainbow elevation map.
I make this a two-step process &mdash; first, create the PostScript file, then use `psconvert` to turn it into a png:

```
build/hidden-valley.ps: build/dem.tif Makefile | build
	grdimage $< > $@

%.png: %.ps
	psconvert -TG -A -P $<
```

A few things to note:

1. `grdimage` takes *many* more options, which we'll use later, but for now we're keeping it simple.
2. The `psconvert` command converts the PostScript file into a png with transparency (`-TG`), cropped close (`-A`), and rotated into portrait mode (`-P`).

We make our map by running `make build/hidden-valley.png`:

![Rainbow elevation map of Hidden Valley](/img/hidden-valley-rainbow.png)

## References

{% bibliography --cited %}
