---
layout: post
title: "Downloading lots of UNAVCO PBO data"
tags: unavco pbo gnss
---

In November of 2016 we took advantage of record-low water levels in western reservoirs to survey them with airborne LiDAR, with a goal of extracting sedimentation levels.
This multi-week project was carried out with a "home-built" airborne system, based on a [Riegl VQ-480i](http://www.riegl.com/nc/products/airborne-scanning/produktdetail/product/scanner/37/) and an [iXblue ATLANS-C](https://www.ixblue.com/products/atlans-c):

![Our airborne system](/img/airborne-scanner.jpg)

One of the many reservoirs we surveyed:

![A reservoir in California](/img/dam.jpg)

One small but crucial part of this operation is the control.
While the iXblue IMU/GNSS system provides real-time location and orientation information, these data are not accurate enough for good airborne surveys.
Our position, in particular, needs to be corrected using ground-based differential GNSS.
One source of ground-based control is the extensive [UNAVCO PBO network](https://www.unavco.org/instrumentation/networks/status/pbo), which is particularity useful in the western United States, where we were working.

Before we began our project, we contacted UNAVCO and requested that they log 1Hz data at 34 PBO sites that were near our regions of interest.
After the completion of our flights, UNAVCO loaded these 1Hz data to their [PBO FTP site](https://www.unavco.org/data/gps-gnss/ftp/ftp.html), which we then needed to retrieve.
To ensure that we don't miss any data, we wanted to download every site for every day in our window (fourteen days total), a process that cries out for a scripting solution.

First, I created a text file, `pbo-sites.txt`, with each PBO site name, e.g.:

```
azu1
bbdm
bkms
...
```

I then identified the days of the year I needed to download, in the case 314 to 328.
I then put these information together in a Makefile, using two `foreach`es, and used [wget](https://www.gnu.org/software/wget/) to fetch the data themselves.
A relatively simple recipe to quickly grab a large amount of data.

{% gist ae1911e490fdc72a69e8bf105426b0d7 %}
