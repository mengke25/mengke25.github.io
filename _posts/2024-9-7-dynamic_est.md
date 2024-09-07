---
layout: post
title: "【stata】自写命令分享，一键生成dynamic effect"
date:   2024-9-7
tags: [code,stata]
comments: true
author: mengke25
---




最早是我用来checkdata的，后来为了方便就封装成了函数。现在我稍微完善了一下，封装成了stata外部命令，能够实现一句命令查看被解释变量变量在treat下的dynamic effect，希望能帮到大家。


<!-- more -->

## 1. 命令简介

`dynamic_est` 是一个用于可视化双向固定效应模型（Two-Way Fixed Effects, TWFE）动态效应的工具。它特别适用于事件研究（event study）或双重差分（Difference-in-Differences, DID）分析。通过一句命令即可展示动态效应，帮助用户更好地理解在某变量的作用下，随时间变化其对结果变量的影响。

![fig1](https://mengke25.github.io/images/dynamic_est/fig1.png)


## 2.使用方法

### (1) 主要选项
`dynamic_est` 需要以下四个必需变量：
* `y`: 结果变量（outcome variable），即你想要观察的因变量。
* `treat`: 分组变量
  * 可以是二元变量，用于区分处理组（treatment group）或对照组（control group）
  * 也支持强度（intensity）变量
* `time`: 时间变量
  * 支持自然年份（standard-spec.）
  * 相对年份（staggered-spec.）
* `ref`: 基期选择，数值型，如{2006} 或 {-1}，用于定义参考时期。


### (2) 其他选项

除了以上的必需变量，dynamic_est 还支持以下可选参数：
* absorb(string): 可吸收的固定效应或控制变量
* cluster(varlist): 聚类变量，用于调整标准误
* cov(string): 模型中要包含的协变量
* level(string): 置信区间水平，默认为90%，可选值为`90`、`95`、`99`
* regtype(string): 回归类型，可选择`reg`（默认的OLS）或`ppml`（泊松伪极大似然估计）
* figname(string): 输出图形的文件名
* figtitle(string): 图形的标题
* figsubtitle(string): 图形的副标题


## 3.安装方法

```
net install dynamic_est, from("https://mengke25.github.io/files/function/stata/dynamic_est") replace
```
因为是自用命令，可能还有很多不完善的地方，所以先暂时上传到了个人的repositories中，如果大家有什么建议或者问题，欢迎私信我！

allenmeng97@gmail.com

uibemk@126.com


## 4.示例

### (1) 基本用法
#### standard-spec.
```    
dynamic_est lnv , treat(treat) time(year) ref(2009) 
```

#### staggered-spec.
```
dynamic_est lnv , treat(treat) time(t) ref(-1) 
```

### (2) 进阶用法
```
dynamic_est lnv , treat(treat_intens) time(year) ref(2009) absorb(id year) cluster(id) regtype(reg)
```

## 5.写在最后

需要补充说明的是，dynamic effect并不完全等同于`DID`中的平行趋势检验。
上文所谓的standard-spec和staggered-spec是为了区分数据的范式

* 在standard-spec情形下，`time`是自然时间，此时dynamic effect结果可以被看做平行趋势检验结果。在这种请跨国下，以下两组代码等价：
```
ppmlhdfe Active i(2016/2019).year#i1.Tr_cate if year>=2015 , /// 
a(id_cate#country_j year#country_j) cluster(country_j) 
```

```
dynamic_est Active if year>=2015,treat(Tr_cate) time(year) ref(2015) /// 
absorb(id_cate#country_j year#country_j) cluster(country_j) regtype(ppml)
```

* 在standard-spec情形下，
  * 不能直接用`dynamic_est`去直接对`类似多时点`的数据进行分析。
  * 需要先对panel进行处理，例如像Sun Abraham、callaway santanna等（或者用panelmatch的方法）对panel进行重组，才能进行分析。
  * 不过，我写的另一个外部命令[twfe_stgdid](https://mengke25.github.io/twfe_stgdid/)可以直接对`staggered-spec`的数据进行分析。

---------------------------------------------

**欢迎白嫖，也欢迎酌情**[请喝咖啡](https://mengke25.github.io/images/dashang.png)







