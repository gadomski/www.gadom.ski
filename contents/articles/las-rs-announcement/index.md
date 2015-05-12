---
title: las-rs
author: gadomski
date: 2015-05-12
template: article.jade
---

[Rust](http://www.rust-lang.org/) is a new language.

That's about where I want to leave it.
People [like it](http://winningraceconditions.blogspot.com/2012/09/rust-0-index-and-conclusion.html), people [hate it](http://www.viva64.com/en/b/0324/)...kay.
I thought I'd check it out, so I hacked together a quick [las](http://www.asprs.org/Committee-General/LASer-LAS-File-Format-Exchange-Activities.html) reader.

https://github.com/gadomski/las-rs.

<span class="more"></span>

I plan to add the ability to write lasfiles as well, and maybe a command-line interface (either as part of **las-rs** or as a separate package) that roughly emulates [liblas](http://www.liblas.org/) and [lastools](http://www.cs.unc.edu/~isenburg/lastools/).

My thoughts on working with rust so far:

- Yes yes yes [cargo](https://crates.io/).
  *las* files are all little-endian, but rust doesn't come natively with an endian-aware read stream.
  Boom, [byteorder](https://crates.io/crates/byteorder), and done.
  Much better than manually vendoring some header-only C/C++ library or forcing boost upon yourself.

- Language syntax is good.
  Learning curve is not gentle, but that hopefully will change as rust [hits 1.0](http://blog.rust-lang.org/2014/12/12/1.0-Timeline.html).

- +1 to built in, same-file testing.
  The easier tests are to write, the more they will be written.

- Once I learned the basics of the language, a rewrite of the *las* reader took less than probably five hours.
  Much faster than an equivalent C/C++ standup, just from a pure typing mechanics perspective.
  There's something to that.

- I think I like [traits](https://doc.rust-lang.org/book/traits.html).

- No opinion on performance yet.

The biggest stick in the mud for rust, as it always has been, is the inertia/chicken-and-egg problem.
If I build [my next big project](https://github.com/gadomski/WDAL) in rust, I'm automatically HOSING anyone that wants to work on it with me.
Open source performance programming is more-or-less expected to be C/C++, full stop.
For now, rust might be a nice niche that I spec out fun little projects in, but as of yet I'm not willing to commit my big developments to the new language.


## Next Steps

As mentioned above, I want to make a writer and a command line interface.
I also want to FFI wrap [libgeotiff](http://trac.osgeo.org/geotiff/) and [GDAL](http://www.gdal.org/) so I can work with spatial reference systems in rust.
Might as well give the language a fighting chance, and the joy of cargo.io is that if I FFI wrap those things once, hopefully those wrappings can just become canonical and no one has to solve that problem again.
Here's hoping.
