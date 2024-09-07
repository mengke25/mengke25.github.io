---
layout: post
title: "【stata】自写命令分享`twfe_stgdid`，一键完成staggered-DID"
date:   2024-9-7
tags: [code, stata]
comments: true
author: mengke25
---

仿照CSDID命令一键出实证结果、出图，我写了一个`twfe_stgdid`命令。基于双向固定效应模型（TWFE）一键式完成staggered-DID分析。TWFE估计did estimator时难以避免[负权重带来的问题（异质性处理效应）](https://www.nber.org/system/files/working_papers/w25904/w25904.pdf)。所以，非常惭愧地说，封装这个函数的意义就是帮助初步查看（可能并不严谨的）结果。虽然可能不太严谨，但查看TWFE的结果依然是有意义的（初步查看、或者与其他方法进行对比去对比），这个命令或许可以帮助大家省去一些功夫。




<!-- more -->

## 1. 命令简介

`twfe_stgdid` 是一个用于staggered-DID分析的高效工具，基于TWFE模型，可以一键式完成分析并展示平行趋势检验结果，有助于用户快速理解在处理变量影响下结果变量的变化情况。


![fig1](https://mengke25.github.io/images/twfe_stgdid/fig1.png)


## 2.使用方法

### (1) 主要选项
`twfe_stgdid` 需要以下三个必需变量：
* `Y`: 结果变量（因变量）
* `did`: 双重差分估计变量（DID estimator）
  * 可以是二元变量(0/1)
  * 可以是强度（intensity）变量，但对照组必须为0；实验组可以为强度，但必须大于1
* `time`: 自然时间变量


### (2) 其他选项

* `ref`: 基准时期，默认为-1
* `f`: 选择预处理期数量，默认是全部预处理期
* `l`: 选择处理后的时期数量，默认是全部处理期
* `absorb`: 吸收的固定效应或不展示的控制变量
* `cov`: 模型中的协变量
* `cluster`: 聚类层级，默认是异方差稳健标准误
* `type`: 显示类型，默认是事件研究（`event`），可选`simple`仅展示baseline结果
* `regtype`: 回归类型，默认是OLS回归（`reg`），也可选择泊松伪极大似然估计（`ppml`）
* `level`: 置信区间水平，默认是95%
* `panelview`: 是否显示DID估计量的面板分布，默认为False
  * （需要预先安装Mou, Hongyu和Yiqing Xu老师的[panelview外部命令](https://yiqingxu.org/packages/panelview_stata/Stata_tutorial.pdf)）
* `figname`: 输出图形文件名
* `figtitle`: 图形标题
* `figsubtitle`: 图形副标题
* `dispcoef`: 是否显示平行趋势检验中的系数，默认为True


## 3.安装方法

```
net install twfe_stgdid, from("https://mengke25.github.io/files/function/stata/twfe_stgdid") replace
```
如安装失败，也可邮箱联系索取ado文件

uibemk@126.com

allenmeng97@gmail.com


## 4.示例

```
use "$path/twfe_stgdid/twfe_stgdid_sample.dta",clear 
```
```
// 最基础的语法
twfe_stgdid Y did , id(id) time(cycle) 
```
```
// 加上时间窗
twfe_stgdid Y did , id(id) time(cycle) f(5) l(4)
```
```
// 加上时间窗、基期选择、固定效应等
twfe_stgdid Y did , id(id) time(cycle) ref(-1) f(5) l(4) absorb(id cycle) cluster(id) regtype(ppml) figsubtitle("staggered-DID")
```

### (3) 帮助文件

![help](https://mengke25.github.io/images/twfe_stgdid/fig2.jpg)


## 5.写在最后

在我上次发布的[dynamic_est命令](https://mengke25.github.io/dynamic_est/)时，在文末说明其不能直接对`类似多时点`的数据进行分析。


这样来看，`twfe_stgdid`在某种程度上也算是对`dynamic_est`的一种补充

其实整理这些命令，就是把自己平时用的多的一套流程封装起来。接下来我或许会写一个做panelmatch的命令，这个会相对麻烦一些，但也会更有意思，欢迎大家关注。


---------------------------------------------
转载请注明出处：[@mengke25](https://mengke25.github.io/twfe_stgdid/) <br />
**欢迎白嫖，也欢迎酌情**[请喝咖啡](https://mengke25.github.io/images/dashang.png)
---------------------------------------------








