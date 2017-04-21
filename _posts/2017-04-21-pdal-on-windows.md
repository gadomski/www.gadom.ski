---
layout: post
title: "PDAL on Windows"
tags: pdal windows
---

As much as I try to use free and open-source software for work, there are times when you have to bite the bullet and use Their Software.
Right now my proprietary stack is:

- [RiSCAN Pro](http://www.riegl.com/index.php?id=221) for registering and exporting Riegl LiDAR data.
- [QT Modeler](http://appliedimagery.com/) for visualization and analysis of point clouds.
- [Trimble Business Center](http://www.trimble.com/survey/trimble-business-center.aspx) for GNSS post-processing.

While I'm working on replacing each component with a FOSS stack, we're not there yet.
All three softwares are Windows-only, so I just got a Windows processing box for work.
While I'm mostly going to be working in these proprietary GUIs on the 'doze box, I figure this is a good chance to up my personal Windows hacking chops and maybe sand off some Windows-specific edges for some software projects that I work on.

A good first step is [PDAL](https://www.pdal.io/).
It's widely used, its developer base is mostly *not* Windows, but it is expected to be Windows-friendly.
I also have a colleague who wants to develop his own Windows software that uses PDAL, and so I figured I'd try it myself and report back.

So let's get PDAL set up on a tabula rasa Windows box and build a small downstream dependency project.

## Development dependencies

I'm working on Windows 10 Enterprise with a 64-bit processor.
To get this party started, we need the following software:

- [Visual Studio Community](https://www.visualstudio.com/free-developer-offers/) is a free version of Visual Studio.
  I'm working with the 2017 version.
  You'll need to install C++ and Github integration.
- [CMake](https://cmake.org/).
- [OSGeo4W](https://trac.osgeo.org/osgeo4w/) is open-source geospatial packages.
  The OSGeo installer includes many of the development dependencies for PDAL, so we'll use it instead of building these dependencies yourself.
  You'll need the `gdal-dev`, `libgeotiff`, and `proj` libraries from the 64-bit version of OSGeo.

You'll need to update your `PATH` to include the following (assuming you've installed OSGeo to the default path):

- `C:\OSGeo4W64\lib`
- `C:\OSGeo4W64\bin`
- `C:\Users\<youruser>\local\lib`
- `C:\Users\<youruser>\local\bin`

If you plan on installing PDAL to a location other than `C:\Users\<youruser>\local`, update those paths accordingly.
The default CMake install location, `C:\Program Files\PDAL`, requires admin permissions to write, so it's often a good idea to pick a different install spot.
Also add the environment variable `GDAL_DATA` and set its value to `C:\OSGeo4W64\share\epsg_csv`.

## Get PDAL

Open up Visual Studio, find the `Team Explorer` tab, and clone a new GitHub repo: `https://github.com/PDAL/PDAL`.
If you accept the defaults, the code will be downloaded to `Source\Repos\PDAL` in your home directory.

## Create a Visual Studio solution with CMake

Open CMake, and choose `Source/Repos/PDAL` as your source code directory and `Source/Repos/PDAL/build` as your build directory.
Yes, I meant to type <s>normal</s> Unix slashes, the CMake GUI displays paths with Unix path separators.
Click `Configure`.
You'll be asked to create the build directory, then you'll be asked to specify the generator.
Choose `Visual Sudio 15 2017 Win64` (notice the `Win64`).
Go on through, and make sure CMake configuration completes successfully.
Set `CMAKE_INSTALL_PREFIX` to `C:/Users/<youruser>/local` (or whatever value you picked when you set up your environment variables).
Click `Generate` and you'll have a solution in `Source/Repos/PDAL/build/`.

## Build PDAL with Visual Studio

Open or go back to Visual Studio and open `Source\Repos\PDAL\build\PDAL.sln`.
Switch to the `Solution Explorer`, then build the `ALL_BUILD` target.
If that completes successfully, build the `INSTALL` target.

*Note: I usually like to run tests before I install, but the PDAL test suite is broken in Visual Studio at the moment.*

## Create and build a downstream project

A "downstream" is a project that depends on, in this case, PDAL.
I've created a project `pdal-downstream` and added the following two files:

{% gist a4c5f04a37231fb20355d890768b4eaa %}

Following the same procedure as we did for PDAL, configure this project with CMake and build it in Visual Studio.
That should create a file `pdal-downstream\build\Debug\pdal-downstream.exe` that you can run to report the installed PDAL version.

## Conclusion

And that's it!
As you can see, most of the hard work is `PATH` configuration and getting the correct software onto your system.
