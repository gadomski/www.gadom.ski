---
layout: post
title: "Snow depths with PDAL"
tags: pdal snow seven-sisters cdot
---

For the past several years we've been using terrestrial LiDAR to monitor snow-covered mountainsides for avalanche stability and mitigation {% cite Deems2015 deems2015ground %}.
We've even gotten some [local press](http://www.dailycamera.com/science_environment/ci_30756446/boulder-scientist-targets-more-effective-safer-avalanche-mitigation) for our efforts.
I just completed processing for our data from the Seven Sisters at Loveland Pass, CO, where we've been working with the Colorado Department of Transportation (CDOT) to assess the effectivity of their installed [GasEx](https://www.denverpost.com/2015/09/18/colorado-mountain-passes-get-remote-controlled-gas-avalanche-control-finally/) systems.
I used [PDAL](https://www.pdal.io/) to calculate and visualize the height of snow (HS) for these data, and the process was non-trivial enough to be worth a blog post.

## Source data

The data were georeferenced using Riegl's proprietary [RiSCAN Pro](http://www.riegl.com/products/software-packages/riscan-pro/) and exported to the [laz](https://www.laszip.org/) format.
Our workflow uses UTM coordiantes inside RiSCAN Pro, which doesn't play nicely with Riegl's GeoSysManager, so the georeferenced laz files from RiSCAN Pro don't have correct spatial reference information in the las header.
Additionaly, as seen below, there's a lot of in-air noise (usually due to blowing snow) and a lot of high-density points near that scanner that we aren't really interested in.

![Annotated scan from 2017-04-28 of the Seven Sisters.](/img/2017-04-28-SevenSisters-in-air-snow-annotated.png)

We're also interested in removing all the trees in the scan, as we only really want a bare earth surface and the snow surface for our HS measurements.
Fortunately for us, these are all operations that PDAL can do, albeit with a bit of extra hoop-jumping.

## Generating reference surfaces

The first step is to post-process the point clouds, as delivered from Riegl, using the following pipeline:

```json
{
    "pipeline": [
        {
            "type": "readers.las",
            "spatialreference": "EPSG:6342+5703"
        },
        {
            "type": "filters.crop",
            "polygon": "POLYGON((424285.054199 4392521.066437,424264.463623 4392406.715332,424205.290527 4392190.98584,424201.560547 4392140.775757,423641.87146 4391921.607422,423426.168762 4391845.724854,423401.804596 4391842.146729,423041.956669 4392012.294861,422662.966858 4392335.28717,422759.23587 4392382.745789,422961.488438 4392474.017517,423273.389465 4392601.933075,423419.496582 4392539.133209,423538.245728 4392509.673706,423915.109497 4392511.763214,424070.769165 4392542.10498,424201.549438 4392565.36734,424248.287964 4392556.360779,424280.257935 4392531.412476,424285.054199 4392521.066437))"
        },
        {
            "type": "filters.outlier"
        },
        {
            "type": "filters.smrf",
            "ignore": "Classification[7:7]"
        },
        {
            "type": "writers.las"
        }
    ]
}
```

Step-by-step, this pipeline:

1. Reads in the las data and tags it as UTM 13N / NAD83(2011), with the NAVD88 vertical datum.
2. Crops the data to a pre-defined area of interest.
3. Uses the outlier filter to add the classifation value "7" to all noise points.
4. Classifies all ground points using PDAL's smrf filter, ignoring noise points.
   Note that for snow-on scans, we're hoping that both bare ground and snow surfaces get classified as ground.
5. Writes out the data to a las file.

You'll notice that neither the `readers.las` stage or the `writers.las` stage have filenames specified; this is because we use this pipeline via the following makefile rule:

```make
build/full-resolution/%: laz/from-riscan/% pipelines/from-riscan.json
	@mkdir -p $(dir $@)
	pdal pipeline pipelines/from-riscan.json \
		--readers.las.filename="$<" \
		--writers.las.filename="$@"
```

This lets us quickly create full-resolution processed laz files in parallel using a simple make command e.g. `make -j 6 all`,


## References

{% bibliography --cited %}
