---
layout: post
title: Outlier filtering with PDAL using rasterization
tags: pdal uas ricopter
---

Dear reader, this is not ideal:

![Law Estates point cloud data with noise in the air](/img/2019-03-12-LawEstates-with-noise.png)

Those in-air points make our Very High Quality Data look, well, kinda Busch League.

When collecting airborne or drone-based lidar data, you'll almost always end up with in-air points like these.
These points originate from all sorts of places: birds, bugs, water vapor, other drones.
They don't add anything to the visualization and are useless for most analysis, so they must be culled without mercy.

Manual culling works, but it's not always the best solution for big datasets, very noisy datasets, or in a case when you don't have a good point-cloud-and-viewing machine in front of you (aka right now when I'm on my Mac laptop).
And so we look for an automatic solution.

[PDAL](https://pdal.io/)
