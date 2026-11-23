---
title: PCA算法
published: 2026-11-23
draft: true
pinned: false
description: "PCA是一种极为常用且经典的无监督学习算法，为高维数据的降维表示提供了可能。"
image: "images/title.png"
tags: ["机器学习", "无监督学习", "PCA"]
category: "机器学习"
series: "从零开始机器学习"
seriesOrder: 1
---

-*-

## 引言

最小二乘法与线性回归即便对高中生来说都是耳熟能详的：给定我们一组数据 $(x, y)$ ，通过最小化残差平方和就可以拟合出最优的预测曲线。这类算法实际上是一种监督学习（Supervised Learning）算法。在机器学习中，我们将 $y$ 称为标签（label），$x$ 称为特征（Features）， $(x,y)$ 称为训练数据（Training Data）。所谓“监督”，指的就是

-*-
