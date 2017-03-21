> I also understand the interaction between amplitude and reflectance and intensity and how it's different scan to scan, etc.

This is the crux of the issue, so I'll talk about this first before moving into the QT-specific stuff. Since you are In The Know on this stuff, I'll go all the way to the beginning to tell this story :-). A couple of setup points:

- This description only applies to pulse-based scanners. Photon-counting and phase-based scanners work differently.
- In general this stuff applies to all pulse based bits, but parts are Riegl specific. I'll do my best to point out the Riegl specific parts.
- I'll try to capitalize Intensity, Amplitude, and Reflectance in this writeup to draw attention to the terms, but in general they're not captialized.

When photons hit a photovoltaic detector in a LiDAR system, the detector produces a voltage signal, e.g. a voltage between 0-5V. That voltage is then read by an analog-to-digital (A-D) converter to produce a digital number (DN) that represents the voltage, e.g. a number between 0-255 (for an 8-bit A-D). That DN represents the number of photons incident on the detector for a given epoch, e.g. 2us. If you sample this system repeatedly through time, you get a waveform (return-pulse.png). In my attached picture, that DN is called "Intensity". Intensity is a general term for "some arbitrarily-scaled digital number", e.g. if you had a 16-bit A-D converter you would get DN values between 0-65535. Intensity is also the term that the las format uses for its "how much energy did the LiDAR scanner see" value, and it is specified to be a dimensionless relative measure, i.e. Intensity values are not expected to have an absolute relationship to radiometric reflectance.

When a Riegl system sees a pulse like "return-pulse.png" (a real Riegl return, btw), it uses its real-time waveform processing to do two things:

1. Decide which peaks in that waveform should be considered points, and which peaks should be "dropped" i.e. not converted into discrete returns.
2. If a peak is a point, how much "energy" does that peak represent, i.e. how strong was the return?

In the simplest sense, step (1) is a matter of comparing the energy contained in a peak to some detection threshold (it's actually a bit more complicated than that but we don't have to worry about that right now). If the detection threshold is a peak maximum DN of 100, then the first and last peaks in our sample pulse become points, but the middle two don't.

Once we've decided which peaks are points, a Riegl system then assigns each point a "Amplitude." From the VZ-4000/6000 manual, Amplitude is defined as:

> the ratio of the actual detected optical amplitude versus the detection threshold

scaled into dB. E.g. if we say that first pulse has a max DN of 250, and our detection threshold is 100, then the Amplitude of that first point is 10 * log10(250 / 100) = 3.98. Note that these are all made up values, actual systems have different ones, but they illustrate the concept.

So that's two of the three terms covered: Intensity is a digital number (DN) that represents a relative measure of the returned energy in a system-dependent way, and Amplitude is a Riegl-specific ratio of the returned energy to the detection threshold in dB. Note that neither Intensity and Amplitude represent the radiometric reflectance of the backscattering object in the laser's wavelength because their values will decrease with range according to 1/r^2.

"Reflectance" is a Riegl-specific term that attempts to get at a range-independent measure of the radiometric reflectance of an object. Reflectance is defined as the ratio of the energy returned by an object to the energy returned by a perfectly reflecting diffuse white target at the same range. So a gray object should be about 50%, or about -3dB. Points with a positive reflectance are *more* reflective than a diffuse white target, usually meaning that they are retroreflective. Some caveats taken directly from the Riegl manual:

> Obviously, the reflectance value is valid only if all of the following conditions are fulfilled:
> - the target is the first target (for other targets a part of the beam power is already reflected by the preceding targets)
> - the whole laser footprint of the beam hits this target
> - the target surface is flat and perpendicular to the laser beam
