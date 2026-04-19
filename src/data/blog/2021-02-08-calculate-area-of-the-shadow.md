---
title: "Calculate area of the shadow"
description: "Solving a high school geometry puzzle by decomposing overlapping circle sectors into triangles and using the law of cosines to find the shadow area."
pubDatetime: 2021-02-08T12:00:00Z
tags:
  - puzzle
  - math
draft: false
---

Saw this in Tiktok China, high school math.

![Calculate Area](/assets/images/posts/P20210208/area.png)

Lines added by me for helping to solve the problem. My idea to get the area of the shadow, I should use sector OBC minus the smaller sector OBC. The smaller sector OBC should be sector ABC minus triangle ABO and ACO. ABO and ACO are the same. So I just need to calculate area ABO. ABO three side length are known, they are 10, 5 and 5√2. So it's easy to get the area of it. Using below formula will get it's area.

![Calculate triangle Area](/assets/images/posts/P20210208/triarea.png)

Also based on below formula, we can get cos(BAO) value. Using acos, you get the angle value of BA. Knowing the value of BAO, then you can calculate the area of sector BAC.

![Calculate angle](/assets/images/posts/P20210208/cosine.png)

So now we can calculate the area of the smaller sector BOC. Now we need to calculate the bigger sector BOC's area. In order to do that, I need to know the angle value indicated in the picture, which it has the same value as angle OBH. We know BO is 5, if we know BH, then the angle is acos(BN/BO).

In fact, point B and point C are the intercept of Circle O and Circle A. If we make point O as (0, 0), Circle O equation is x^2 + y^2 = 5^2. and Circle A is (x - 5) ^2 + (y + 5)^2 = 10^2. Solve these two equations, you will get BH (one of y value). After you get BH, you will get the area of bigger sector BOC

So now you can use the bigger sector area minus the smaller one, it will get you the area of the shadow.

Some values I calculated:

- Angle BAO = acos(5√2/8)
- Sector BAC area = 100 * acos(5√2/8)
- Triangle BAO area = triangle CAO area = 25 * √(3(18+13√2))
- BH = (5 + 5√7)/4
- Big sector BOC area = 25/2 * (π/2 + 2 * acos((1+√7)/4))
- Shadow area = 25/2 * (π/2 + 2 * acos((1+√7)/4)) + 50 * √(3(18+13√2)) - 100 * acos(5√2/8)
