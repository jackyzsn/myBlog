---
title: "Find maximum sub array"
description: "A single-pass Kadane-style solution to the classic maximum sub array interview problem, with worked-through Java and Python implementations."
pubDatetime: 2022-03-28T12:00:00Z
tags:
  - algorithm
  - interview
  - java
  - python
featured: true
draft: false
---

This is a Google interview question. By giving a random array, find the sub array with the maximum sum. There are multiple ways to do it. Let see how to do it by only loop the entire array only once.

![Array](/assets/images/posts/P20220328/array.png)

Assume you found the sub array, from start to end, it holds the maximum sum. If that's the case, then if you sum the first N elements, their sum can't be negative. If they are negative, then you could exclude them, and you will get a bigger sum.

This can be used to locate the start index. You can start from the beginning of the array, and calculating the first N elements. If you get negative sum, then you can move the start index to current position. And start over again to calculate the first N element sum. If sum is greater than zero, you don't move the start index.

You need other variables to keep track of the maximum start index, maximum end index and maximum sum. As long as your first N element sum is greater than maximum sum, you keep indexes and maximum sum into the variables. After finish looping the entire array, the maximum variables keeps the maximum sub aaray inforamtion.

Below it's the Java code.

```java
import java.util.Arrays;
import java.util.Random;

public class FindMaxWindow {

    public static void main(String[] args) {
        int size = 30;
        int min = -100;
        int max = 100;

        Random r = new Random();
        int[] randomArray = r.ints(size, min, max).toArray();

        System.out.println("\n" + Arrays.toString(randomArray));

        int startIndex = 0;
        long totalSum = 0;
        long maxSum = 0;
        int maxStart = 0;
        int maxEnd = 0;

        for (int i = 0; i < randomArray.length; i++) {
            totalSum += randomArray[i];
            if (totalSum < 0) {
                startIndex = -1;
                totalSum = 0;
            } else {
                if (startIndex == -1) {
                    startIndex = i;
                }
                if (totalSum > maxSum) {
                    maxSum = totalSum;
                    maxStart = startIndex;
                    maxEnd = i;
                }
            }
        }

        System.out.printf("Maximum sum: %d, start index: %d, end index: %d%n%n", maxSum, maxStart, maxEnd);
    }
}
```

Below it's the Python code.

```python
import random

if __name__ == '__main__':
    print("==== Start =====")
    num_array = []
    for i in range(20):
        num_array.append(random.randint(-100, 100))
    print(num_array)
    start_index = 0
    total_sum = 0
    max_sum = 0
    max_start = 0
    max_end = 0
    for i in range(20):
        total_sum += num_array[i]
        if total_sum < 0:
            start_index = -1
            total_sum = 0
        else:
            if start_index == -1:
                start_index = i
            if total_sum > max_sum:
                max_sum = total_sum
                max_start = start_index
                max_end = i

    print("Maximum sum: ", max_sum, ", Start index: ", max_start, ", End index: ", max_end)
    print("==== End =====")
```
