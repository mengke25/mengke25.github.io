---
layout: post
title: "【stata】自写命令分享dynamic_est，实现DID、ES一键出图"
date:   2024-9-6
tags: [code,stata]
comments: true
author: mengke25
---

最早是我用来checkdata的，后来为了方便就写成了函数。现在我稍微完善了一下，封装成了stata外部命令，能够实现一句命令查看outcome var在treat作用下的dynamic effect。

<!-- more -->

_____________________
**Content**
<!-- vscode-markdown-toc -->
* [1. 命令简介](#1)
* [2.命令选项](#2)
	* [(1) 主要选项](#2-1)
	* [(2) 其他选项](#2-2)
* [3.安装方法](#3)
* [4.示例](#4)
	* [(1) 基本用法](#4-1)
	* [(2) 进阶用法](#4-2)
	* [(3) 帮助文件](#4-3)
* [5.写在最后](#5)


<!-- vscode-markdown-toc-config
	numbering=true
	autoSave=true
	/vscode-markdown-toc-config -->
<!-- /vscode-markdown-toc -->



##  <a name='1'></a>1. 命令简介

`dynamic_est` 是一个用于可视化动态效应（dynamic effect）的工具。它特别适用于事件研究（event study）或双重差分（Difference-in-Differences, DID）分析。通过一句命令即可展示动态效应，帮助用户更好地理解在某变量的作用下，随时间变化其对结果变量的影响。

在输出的图像中，为了让结果更加直观，我加入了各期的系数、标准误，也标注了显著性

![fig1](https://mengke25.github.io/images/dynamic_est/fig1.png)


##  <a name='2'></a>2.命令选项

###   <a name='2-1'></a>(1) 主要选项
```
dynamic_est {outcome_var} , treat({varlist}) time({varlist}) ref({numeric}) 
```

`dynamic_est` 需要以下四个必需变量：
* `y`: 结果变量（outcome variable），即你想要观察的因变量。
* `treat`: 分组变量
  * 可以是二元变量，用于区分处理组（treatment group）或对照组（control group）
  * 也支持强度（intensity）变量
* `time`: 时间变量
  * 支持自然年份（standard-spec.）
  * 相对年份（staggered-spec.）
* `ref`: 基期选择，数值型，如{2006} 或 {-1}，用于定义reference period。


###   <a name='2-2'></a>(2) 其他选项

除了以上的必需变量，dynamic_est 还支持以下可选参数：
* absorb(string): 可吸收的固定效应或控制变量
* cluster(varlist): 聚类变量，用于调整标准误
* cov(string): 模型中要包含的协变量
* level(string): 置信区间水平，默认为90%，可选值为`90`、`95`、`99`
* regtype(string): 回归类型，可选择`reg`（默认的OLS）或`ppml`（泊松伪极大似然估计）
* figname(string): 输出图形的文件名
* figtitle(string): 图形的标题
* figsubtitle(string): 图形的副标题


##   <a name='3'></a>3.安装方法

已上传ssc
```
ssc install dynamic_est,replace 
```

或者从我的仓库中获取
```
net install dynamic_est, from("https://mengke25.github.io/files/function/stata/dynamic_est") replace
```
如果安装失败，可通过邮件向我索取。因为是自用命令，可能还有很多不完善的地方，如果有什么建议或者问题，欢迎私信我

allenmeng97@gmail.com

uibemk@126.com



##   <a name='4'></a>4.示例

###  <a name='4-1'></a>(1) 基本用法
####   <a name='standard-spec.'></a>standard-spec.
```    
dynamic_est lnv , treat(treat) time(year) ref(2009) 
```

####  <a name='staggered-spec.'></a>staggered-spec.
```
dynamic_est lnv , treat(treat) time(t) ref(-1) 
```

###   <a name='4-2'></a>(2) 进阶用法
```
dynamic_est lnv , treat(treat_intens) time(year) ref(2009) absorb(id year) cluster(id) regtype(reg)
```


###   <a name='4-3'></a>(3) 帮助文件

![help](https://mengke25.github.io/images/dynamic_est/fig2.jpg)


##  <a name='5'></a>5.写在最后

需要补充说明的是，dynamic effect并不完全等同于`DID`中的平行趋势检验。
上文所谓的standard-spec和staggered-spec是为了区分数据的范式

* 在standard-spec情形下，`time`是自然时间，此时dynamic effect结果可以被看做平行趋势检验结果。例如，在这种情况下，以下两组代码等价：
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
  * 需要先对panel进行处理，例如像Sun Abraham、callaway santanna等（或者用panelmatch的方法）对panel进行重构成，才能进行分析。
  * 关于panel-data的重构，我也po出了[对panel data restruct的思考以及相关的代码](https://mengke25.github.io/panel_restruct/)
  * 此外，我写的另一个外部命令[（欢迎使用）twfe_stgdid](https://mengke25.github.io/twfe_stgdid/)可以直接对`staggered-spec`的数据进行分析。




##   <a name='mengke25https:mengke25.github.io'></a>**转载请注明出处**：[@mengke25](https://mengke25.github.io/) 

##  <a name='https:mengke25.github.ioimagesdashang.png'></a>**请喝咖啡**：[打赏渠道](https://mengke25.github.io/images/dashang.png)




