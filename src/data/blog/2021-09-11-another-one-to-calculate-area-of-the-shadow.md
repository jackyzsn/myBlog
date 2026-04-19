---
title: "Another one to calculate area of the shadow"
description: "Working out the shaded area inside a semicircle using elementary trigonometry — a New Zealand high-school puzzle I saw on TikTok."
pubDatetime: 2021-09-11T12:00:00Z
tags:
  - math
  - puzzle
  - geometry
draft: false
---

Saw on TikTok that this is a high-school problem in New Zealand — calculate the area of the shaded region. It looked like it should yield to a bit of trigonometry. The blue lines below are helper lines I added.

![Shadow area problem setup](/assets/images/posts/P20210911/area1.png)

To get the shaded region, area **b**, we can take the area of the half-circle minus areas **a** and **c**.

![Decomposing the shadow](/assets/images/posts/P20210911/area2.png)

Area **a** is easy. It equals the circle area minus triangle *ADC*, divided by 2:

$$
S_a = \frac{(\pi - 2) r^2}{2}
$$

![Area a reasoning](/assets/images/posts/P20210911/area4.png)

To get area **c**, we use area of *DFC* minus area **e** plus area **f**. Because triangle *DAF* is similar to *EFC* and *AF = 2·EF*, we know area **e** = 4·**f**.

![Area c reasoning](/assets/images/posts/P20210911/area3.png)

To find area **e**, take the circular sector *ADF* minus triangle *ADF*. The angle ∠*DAE* equals `arctan(0.5)`, so the sector area *ADF* is `(2r)² · π · 2·arctan(0.5) / (2π)`, which simplifies to `4·arctan(0.5)·r²`.

$$
\angle DAE = \arctan(0.5)
$$

$$
S_{\frown DAF} = 4 \arctan(0.5)\, r^2
$$

For triangle *DFA*, the area is `DG · AG`, where `DG = 2r·sin(arctan(0.5))` and `AG = 2r·cos(arctan(0.5))`:

$$
S_{\triangle DAF} = 4 r^2 \sin\bigl(\arctan(0.5)\bigr) \cos\bigl(\arctan(0.5)\bigr)
$$

So area **e**:

$$
S_e = 4 r^2\Bigl(\arctan(0.5) - \sin\bigl(\arctan(0.5)\bigr) \cos\bigl(\arctan(0.5)\bigr)\Bigr)
$$

And since **e** = 4·**f**:

$$
S_f = r^2\Bigl(\arctan(0.5) - \sin\bigl(\arctan(0.5)\bigr) \cos\bigl(\arctan(0.5)\bigr)\Bigr)
$$

The area of triangle *DFC* equals `DF · CF / 2`. By similar triangles, `CF = DG = GF`, so:

$$
S_{\triangle DFC} = 4 r^2 \sin^2\bigl(\arctan(0.5)\bigr)
$$

Now area **c** = *DFC* − **e** + **f**:

$$
S_c = 4 r^2 \sin^2\bigl(\arctan(0.5)\bigr) - 3 r^2 \Bigl(\arctan(0.5) - \sin\bigl(\arctan(0.5)\bigr) \cos\bigl(\arctan(0.5)\bigr)\Bigr)
$$

Finally, **b** = half-circle − **a** − **c**:

$$
S_b = \frac{\pi r^2}{2} - \frac{(\pi - 2) r^2}{2} - \Biggl(4 r^2 \sin^2\bigl(\arctan(0.5)\bigr) - 3 r^2 \Bigl(\arctan(0.5) - \sin\bigl(\arctan(0.5)\bigr) \cos\bigl(\arctan(0.5)\bigr)\Bigr)\Biggr)
$$

Simplified:

$$
S_b = r^2 \Biggl(1 - 4 \sin^2\bigl(\arctan(0.5)\bigr) + 3 \Bigl(\arctan(0.5) - \sin\bigl(\arctan(0.5)\bigr) \cos\bigl(\arctan(0.5)\bigr)\Bigr)\Biggr)
$$

Which comes out to:

$$
S_b \approx 0.394\, r^2
$$
