---
layout: post
title: "【stata】一键式提取城市代码或统一名称"
date:   2024-9-3
tags: [code,stata]
comments: true
author: mengke25
---

用正则表达式写了个简单的外部命令，用于提取字符串中的城市名称或代码。之前随手[分享在xhs上](https://www.xiaohongshu.com/explore/66d5fc0f000000001f01724d?xsec_token=AB4wCYFvOcil5gjJTKKpbZ8yMy9dI19EqRog2iqRCYbfY=&xsec_source=pc_user)，竟获得近300赞及400多次收藏。现在我来分享下这个命令的具体用法。

<!-- more -->

_____________________
**Content**
<!-- vscode-markdown-toc -->
* [1.citycode_mutate](#citycode_mutate)
	*  [(1) 命令用法](#1)
	*  [(2) 安装方法](#2)
	*  [(3) 示例](#3)
	*  [(4) 帮助文件](#4)
* [2.cityname_mutate](#cityname_mutate)
	*  [(1) 命令用法](#1-1)
	*  [(2) 安装方法](#2-1)
	*  [(3) 示例](#3-1)
	*  [(4) 帮助文件](#4-1)

<!-- vscode-markdown-toc-config
	numbering=true
	autoSave=true
	/vscode-markdown-toc-config -->
<!-- /vscode-markdown-toc -->




##   <a name='citycode_mutate'></a>1.citycode_mutate

###   <a name='1'></a>(1) 命令用法

`citycode_mutate`命令用于识别字符串中可能存在的城市信息，并生成城市代码。

命令语法：直接在citycode_mutate后输入需要识别的字符串变量名即可
```
citycode_mutate var(string)
```

###   <a name='2'></a>(2) 安装方法
```
net install citycode_mutate, from("https://mengke25.github.io/files/function/stata/citycode_mutate") replace
```

###   <a name='3'></a>(3) 示例

```
citycode_mutate firm
```

![fig1](https://mengke25.github.io/images/citycode_mutate/fig1.png)


###   <a name='4'></a>(4) 帮助文件

![fig2](https://mengke25.github.io/images/citycode_mutate/fig2.png)



##   <a name='cityname_mutate'></a>2.cityname_mutate

###   <a name='1-1'></a>(1) 命令用法

`cityname_mutate`命令可将城市代码转换成统一的城市名

命令语法：直接在citycode_mutate后输入城市6位代码
```
cityname_mutate var(numeric)
```


###  <a name='2-1'></a>(2) 安装方法
```
net install cityname_mutate, from("https://mengke25.github.io/files/function/stata/cityname_mutate") replace
```

###   <a name='3-1'></a>(3) 示例

```
cityname_mutate citycode
```

![fig3](https://mengke25.github.io/images/citycode_mutate/fig3.png)


###   <a name='4-1'></a>(4) 帮助文件


![fig4](https://mengke25.github.io/images/citycode_mutate/fig4.png)



##  3. <a name='mengke25https:mengke25.github.io'></a>**转载请注明出处**：[@mengke25](https://mengke25.github.io/) 

##  4. <a name='https:mengke25.github.ioimagesdashang.png'></a>**请喝咖啡**：[打赏渠道](https://mengke25.github.io/images/dashang.png)




