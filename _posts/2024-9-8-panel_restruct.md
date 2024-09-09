---
layout: post
title: "【stata】panel-match面板数据重构思路"
date:   2024-9-8
tags: [code,stata]
comments: true
author: mengke25
---


根据首次发生冲击的时间，将`staggered setting`或`general setting`下的treatment group和control group进行重构，并生成`_group`以及`_newid`。

本命令旨在为手动`panel-match`提供思路


<!-- more -->

_____________________
**Content**

<!-- vscode-markdown-toc -->
* [1.面板数据的生成](#1)
	* [(1) standard setting](#1-1)
	* [(2) staggered setting](#1-2)
	* [(3) general setting](#1-3)
* [2.面板数据重构命令](#2)
* [3.使用示例](#3)

<!-- vscode-markdown-toc-config
	numbering=true
	autoSave=true
	/vscode-markdown-toc-config -->
<!-- /vscode-markdown-toc -->



##   <a name='1'></a>1.面板数据的生成

首先，我写了一个函数，用于生成三种类型的面板数据：`standard setting`,`staggered setting`以及`general setting`。

这个函数依赖Hongyu Mou & Yiqing Xu老师的[panelview](https://yiqingxu.org/packages/panelview_stata/Stata_tutorial.pdf)包，需要先安装下:
```
net install grc1leg, from(http://www.stata.com/users/vwiggins) replace
net install gr0075, from(http://www.stata-journal.com/software/sj18-4) replace
ssc install labutil, replace
ssc install sencode, replace
net install panelview, all replace from("https://yiqingxu.org/packages/panelview_stata")
```

下面就是面板数据生成的函数，

可以根据需要选择`standard setting`,`staggered setting`或`general setting`进行生成

```stata
cap program drop panel_gen
program define panel_gen
syntax , type(string)
  qui{
    clear
    set obs 200
    egen id = repeat(),v(1/20)
    sort id
    egen t = repeat(),v(2005/2014)

    if "`type'" == "standard"{
      // standard-setting.
      gen estimator = 1 if t >= 2011 & id <= 7
      replace estimator = 0 if estimator == .
      panelview estimator, i(id) t(t) type(treat)
    }

    if "`type'" == "staggered"{
      // staggered-spec.
      gen estimator = 1 if id <= 2 & t >= 2007
      replace estimator = 1 if id == 3 & t >= 2008
      replace estimator = 1 if id == 4 & t >= 2009
      replace estimator = 1 if (id == 5|id == 6) & t >= 2010
      replace estimator = 1 if (id == 7|id == 8) & t >= 2011
      replace estimator = 1 if id == 9 & t >= 2012
      replace estimator = 0 if estimator == .
      panelview estimator, i(id) t(t) type(treat)
    }

    if "`type'" == "general"{
      // general-setting.
      gen estimator = 0
      replace estimator = 1 if id == 1 & (t==2007|t==2008|t==2009|t==2014|t==2011)
      replace estimator = 1 if id == 2 & (t==2008|t==2009|t==2011|t==2013|t==2014)
      replace estimator = 1 if id == 3 & (t==2011|t==2009|t==2012)
      replace estimator = 1 if id == 4 & (t==2008|t==2013|t==2014)
      replace estimator = 1 if id == 5 & (t==2010|t==2011)
      replace estimator = 1 if id == 6 & (t==2011|t==2012|t==2014)
      replace estimator = 1 if id == 7 & (t==2010|t==2014)
      replace estimator = 1 if id == 8 & (t==2012)
      replace estimator = 1 if id == 9 & (t==2013|t==2014)
      panelview estimator, i(id) t(t) type(treat)
    }
  }
end
```

在定义上述函数之后，即可通过以下命令生成相应面板

###   <a name='1-1'></a>(1) standard setting
```
panel_gen, type(standard)
```
![fig1](https://mengke25.github.io/images/panel_restruct/fig1.png)

###   <a name='1-2'></a>(2) staggered setting
```
panel_gen, type(staggered)
```
![fig2](https://mengke25.github.io/images/panel_restruct/fig2.png)

###  <a name='1-3'></a>(3) general setting
```
panel_gen, type(general)
```
![fig3](https://mengke25.github.io/images/panel_restruct/fig3.png)


##   <a name='2'></a>2.面板数据重构命令

根据`panel_gen`命令生成的面板数据，我们可以用`panel_restruct`命令进行重构。

下面是我定义的`panel_restruct`函数，能够针对`staggered-setting`和`general-setting`两种类型的数据一键进行重构。

只需要定义四个参数
* id：panel id变量
* time：panel time变量
* did：did estimator variable
* pre：希望生成的事前期数
* post：希望生成的事后期数


```stata
cap program drop panel_restruct
program define panel_restruct

  syntax , id(varlist) time(varlist) did(string) pre(string) post(string) 

  egen _id = group(`id')
  xtset _id `time'

  local offsets1 ""
  forv i = 0/$pre {
    local j_`i' = $pre - `i' + 1
    local offsets1 "`offsets1' -`j_`i''"
  }
  local offsets11 ""
  forv i = 1/$pre {
    local j_`i' = $pre - `i' + 1
    local offsets11 "`offsets11' -`j_`i''"
  }
  local offsets2 ""
  forv i = 1/$post {
    local j_`i' = $post - `i' + 1
    local offsets2 "`j_`i'' `offsets2'"
  }

  global relat_time  "`offsets11' 0 `offsets2'"   // 
  global relat_time1 "`offsets1' 0 `offsets2'"	// 往前多找一期

  di  "$relat_time1"
  di  "$relat_time"

  su `time',d
  local start_year = r(min) + $pre
  local end_year = r(max) - $post
  global gunit = `end_year' - `start_year' + 1
  global length_windows = abs($pre + $post + 1)

  forv tt = `start_year'/`end_year'{
  preserve
  forv i = -$pre/$post{
      cap drop Dummyyear`i'
    local kp = `tt' + `i'
    di `kp'
    gen Dummyyear`kp' = (`time' == `kp')
  }
  egen Dummyyear= rsum(Dummyyear*)
  keep if Dummyyear == 1
  drop Dummyyear*


  // 确定treat==1的unit
  cap drop _ident 
  cap drop _treat
  gen _ident=.
  su _id,d
  forv i =`r(min)'/`r(max)'{
      forv j = -$pre/-1{
        local checkyear = `tt' + `j'
      replace _ident = 1 if (_id == `i') & (`time'== `checkyear') & (`did' == 0)
    }
    forv j = 0/$post{
        local checkyear = `tt' + `j'
      replace _ident = 1 if (_id == `i') & (`time'== `checkyear') & (`did' > 0)
    }
  }
  bys _id : egen _treat = count(_ident)
  gen _treat_selected = (_treat == $length_windows)

  // 确定control==1的unit
  cap drop _ident 
  cap drop _treat
  gen _ident=.
  su _id,d
  forv i =`r(min)'/`r(max)'{
      forv j = -$pre/$post{
        local checkyear = `tt' + `j'
      replace _ident = 1 if (_id == `i') & (`time'== `checkyear') & (`did' == 0)
    }
  }
  bys _id : egen _treat = count(_ident)
  gen _control_selected = (_treat == $length_windows)

  cap drop _type  
  cap drop _ident 
  cap drop _treat
  gen _groupyear = `tt' if (_treat_selected==1|  _control_selected==1)
  gen _type = "treat" if _treat_selected == 1
  replace _type = "control" if _control_selected == 1
  drop if _type == ""

  su _treat_selected,d
  global conditionalways = r(mean)
  if $conditionalways == 0 {
      di "all treat, no panel-data combinated in group_year `tt'"
    local dim = _N
    drop in 1/`dim'
  }
  if $conditionalways == 1 {
      di "all control, no panel-data combinated in group_year `tt'"
    local dim = _N
    drop in 1/`dim'
  }
  if $conditionalways < 1 & $conditionalways > 0 {
      di "panel data generated in group_year `tt'"
  }

  cap drop _id 
  cap drop _treat_selected 
  cap drop _control_selected

  save group_`tt'.dta,replace 
  restore
  }

  use group_`start_year'.dta,clear
  local nstart_year = `start_year' + 1
  forv i = `nstart_year'/`end_year'{
      append using group_`i'.dta
  }
  forv i = `start_year'/`end_year'{
      erase group_`i'.dta
  }
  cap drop _rt
  gen _rt = `time' - _groupyear
  egen _groupid = group(`id' _groupyear)
  panelview `did', i(_groupid) t(_rt) type(treat)
end
```



##  <a name='3'></a>3.使用示例

先调用`panel_gen`，生成特定spec的面板数据，

```
panel_gen, type(general)
```


然后调用`panel_restruct`，进行重构。
```
panel_restruct, id(id) time(t) did(estimator) pre(2) post(2)
```

至此，面板重构完成，输入数据为`general setting`，如左图所示

输出数据即重构后的数据如右图所示，已经将左图data打散，并将符合条件的`treatment group` 和 `control group`进行了组合

![fig4](https://mengke25.github.io/images/panel_restruct/fig4.png)



##  4. <a name='mengke25https:mengke25.github.io'></a>**转载请注明出处**：[@mengke25](https://mengke25.github.io/) 

##  5. <a name='https:mengke25.github.ioimagesdashang.png'></a>**请喝咖啡**：[打赏渠道](https://mengke25.github.io/images/dashang.png)

