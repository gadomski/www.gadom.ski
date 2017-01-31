---
layout: post
title: "Using PDAL to clean legacy LiDAR data"
tags: riegl 3dd lidar z390 cues snow pdal
---

The CRREL/UCSV Energy Site (CUES) is a snow research site on Mammoth Mountain, CA {% cite Bair2015 %}:

![East-looking panoramic photo of the CUES site](http://snow.ucsb.edu/sites/default/files/slides/20120908_122051.jpg)

In February 2011 a [Riegl](http://www.riegl.com/) LMS-Z390 LiDAR scanner came online at the site, mounted in a glass enclosure on the central structure.
This scanner regularly captures snow depths over a portion of the study area, and stores these snow depths on the [CUES web server](http://snow.ucsb.edu/level-0-raw-data-files) as `.3dd` files:

![An example of a scan of the CUES site](/img/cues-scan.png)

While these data have been used with some research, in general they have been under-utilized, partially due to their file format.
`.3dd` is an old Riegl file format, so old that the company no longer produces binaries to read from the format &mdash; the only binaries are available in [`riscanlib` for Windows 32 systems](http://www.riegl.com/index.php?id=234).
And because Riegl doesn't release the layout of their file formats to the public, we can't[^1] write our own multi-platform reader.

`riscanlib`, which requires a Riegl website account to download, comes with an example executable named `conv2asc.exe` that reads a `.3dd` file and prints the X, Y, Z, and Intensity coordinates to standard output.
For now, this is what we're using to extract information from `.3dd` files.
However, there's a couple of hangups:

1. Our trusty ol' Z390 scanner produces a lot of bogus data at `(0., 0., 0.)` that should be filtered out.
2. `.3dd` intensities are floats in [0, 1], but other point cloud formats (e.g. [las](https://www.asprs.org/committee-general/laser-las-file-format-exchange-activities.html)) work best when intensity is scaled from [0, 65536].
3. Our scanner shifts and moves through time, both intentionally when someone makes and adjustment and naturally due to shifts in the ground.
   We need to apply a rigid transform to our data to ensure all of our scans are in the same reference frame.

We'll tackle parts 1 and 2 in this post, and save part 3 for a later date.
If you want to follow along at home with the same data, [download it from the CUES website](http://snow.ucsb.edu/data/2016/lidar/201612/20161229-1315-30.Z390.frame.3dd.gz).
We'll assume you've already used `conv2asc.exe` on the `3dd` file and redirected the output to `txt/original/20161229-1315-30.Z390.frame.txt`.

[PDAL](http://pdal.io/) (with the Python plugin enabled) is the only required software for this exercise (assuming you have a unix-y system that includes `sed`).

## Filtering and scaling

[PDAL's text reader](http://www.pdal.io/stages/readers.text.html) expects reasonably well-formed text files.
Our `conv2asc.exe` output looks like this, which isn't good enough:

```
$ head txt/original/20161229-1315-30.Z390.frame.txt
0.0000, 0.0000, 0.0000, 0.0000
0.0000, 0.0000, 0.0000, 0.0000
0.0000, 0.0000, 0.0000, 0.0000
0.0000, 0.0000, 0.0000, 0.0000
0.0000, 0.0000, 0.0000, 0.0000
0.0000, 0.0000, 0.0000, 0.0000
0.0000, 0.0000, 0.0000, 0.0000
0.0000, 0.0000, 0.0000, 0.0000
0.0000, 0.0000, 0.0000, 0.0000
0.0000, 0.0000, 0.0000, 0.0000
```

We need to remove those spaces between the comma and the next number, and add a header.
This is a simple two-step process:

{% highlight bash %}
mkdir -p txt/cleaned
echo "X,Y,Z,Intensity" > txt/cleaned/20161229-1315-30.Z390.frame.txt
sed 's/, /,/g' txt/original/20161229-1315-30.Z390.frame.txt >> txt/cleaned/20161229-1315-30.Z390.frame.txt
{% endhighlight %}

We'll use PDAL to do the `(0., 0., 0.)` filtering and intensity scaling.
The filtering can be done out of the box with [range filter](http://www.pdal.io/stages/filters.range.html), but we need to write some code to do the intensity scaling.
We'll use the [programmable filter](http://www.pdal.io/stages/filters.programmable.html) to do the scaling work.

Create a file called `scripts/scale_intensity.py` with the following code:

{% highlight python %}
def scale_intensity(input, output):
    intensity = input["Intensity"]
    intensity = intensity * 65536
    output["Intensity"] = intensity
    return True
{% endhighlight %}

This takes our `[0, 1]` intensity values and scales them to `[0, 65536]`, which happens to be the maximum range of intensity values supported by the las format.[^2]

We then can created a "cleaned" laz file with no origin points[^3] and scaled intensity values with this one-liner:

{% highlight bash %}
mkdir -p laz/cleaned
pdal translate txt/cleaned/20161229-1315-30.Z390.frame.txt laz/cleaned/20161229-1315-30.Z390.frame.laz \
    -f range --filters.range.limits='X![0:0],Y![0:0],Z![0:0]' \
    -f programmable --filters.programmable.script=scripts/scale_intensity.py \
        --filters.programmable.module=scale_intensity \
        --filters.programmable.function=scale_intensity
{% endhighlight %}

## Conclusion

By combining simple external tools (e.g. `sed`) with PDAL's powerful filters, we can transform uncomfortable data formats into more usable layouts.
I've gisted a Makefile and the scale intensity script that are useful for batch processing:

{% gist gadomski/c921e5bffc888f0c5f44ca07d4932de4 %}

In a later post I'll discuss how to use transformation matrices to bring all of these data into the same coordinate system.

[^1]: Legally.
[^2]: Inquiring minds might wonder if we're corrupting useful data by scaling these values all willy-nilly. By convention, when LiDAR systems report "intensity" values, they are sensor-specific values that have no absolute relationship to a real-world radiometric property of the reflective object. Riegl does attempt to provide an absolute measure of an object's reflectivity in the laser's wavelength with the "Reflectivity" attribute, but even this is fraught with issues {% cite Hartzell2013a %}.
[^3]: As of this writing, the negation operator ("!") is an undocumented feature of the range filter.

## References

{% bibliography --cited %}

## Footnotes
