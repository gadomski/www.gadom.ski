+++
date = "2015-05-03T16:15:50-06:00"
title = "Fast Gauss Transform C++ Library"

+++

Have you ever wanted to solve a Fast Gauss Transform really quickly?

$$ G(\mathbf{y}\_j) = \sum_{i=1}^{N} q_i \exp \frac { - || \mathbf{y}_j - \mathbf{x}_i ||^2 } { h^2 } $$

Because I know I have.

But for serious, solving that equation, which basically calculates the n-dimentional probability density function between two points, is important for a lot of stuff, including many types of spatial optimization problems.
I needed to do it fast for my implementation of [Coherent Point Drift](https://github.com/gadomski/cpd), so I made a C++ library [fgt](https://github.com/gadomski/fgt), modeled after [FIGTree](http://www.umiacs.umd.edu/~morariu/figtree/).

The library is implemented in what is hopefully a modern, reusable C++ fashion, with minimal external dependencies (look ma, no boost).
The main dependency is [armadillo](http://arma.sourceforge.net/), a really swell matrix library that I keep reusing because it makes me happy.
If you want to get crazy you can even use an [openmp](http://openmp.org/wp/) library to parallelize stuff.

https://github.com/gadomski/fgt
