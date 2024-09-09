---
layout: post
title: "【stata】自写命令分享`twfe_stgdid`，一键完成staggered-DID"
date:   2024-9-7
tags: [code, stata]
comments: true
author: mengke25
---

仿照CSDID命令一键出实证结果、出图，我写了一个`twfe_stgdid`命令。基于双向固定效应模型（TWFE）一键式完成staggered-DID分析。TWFE估计did estimator时难以避免[负权重带来的问题（异质性处理效应）](https://www.nber.org/system/files/working_papers/w25904/w25904.pdf)。所以，非常惭愧地说，封装这个函数的意义就是帮助初步查看（可能并不严谨的）结果。虽然可能不太严谨，但查看TWFE的结果依然是有意义的（初步查看、或者与其他方法进行对比去对比）。

总之，这个命令一方面或许可以帮助大家做staggeredDD时省去一些功夫，另外也是对我上一期分享`dynamic_est`命令的补充，具体见[dynamic_est](https://mengke25.github.io/dynamic_est/)文末。




<!-- more -->

**Content**
<!-- vscode-markdown-toc -->
* [1.命令简介](#1)
* [2.命令选项](#2)
	* [(1) 主要选项](#2-1)
	* [(2) 其他选项](#2-2)
* [3.安装方法](#3)
* [4.示例](#4)
* [5.源码分享](#5)
* [6.写在最后](#6)

<!-- vscode-markdown-toc-config
	numbering=true
	autoSave=true
	/vscode-markdown-toc-config -->
<!-- /vscode-markdown-toc -->


##  <a name='1'></a>1. 命令简介

`twfe_stgdid` 是一个用于staggered-DID分析的高效工具，基于TWFE模型，可以一键式完成分析并展示平行趋势检验结果，有助于用户快速理解在处理变量影响下结果变量的变化情况。


![fig1](https://mengke25.github.io/images/twfe_stgdid/fig1.png)


##  <a name='2'></a>2.命令选项

###  <a name='2-1'></a>(1) 主要选项
`twfe_stgdid` 需要以下三个必需变量：
* `Y`: 结果变量（因变量）
* `did`: 双重差分估计变量（DID estimator）
  * 可以是二元变量(0/1)
  * 可以是强度（intensity）变量，但对照组必须为0；实验组可以为强度，但必须大于1
* `time`: 自然时间变量


###  <a name='2-2'></a>(2) 其他选项

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


##  <a name='3'></a>3.安装方法

```
net install twfe_stgdid, from("https://mengke25.github.io/files/function/stata/twfe_stgdid") replace
```
如安装失败，也可邮箱联系索取ado文件

uibemk@126.com

allenmeng97@gmail.com


##  <a name='4'></a>4.示例

* 命令用法

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

* 帮助文件：

![help](https://mengke25.github.io/images/twfe_stgdid/fig2.jpg)

##  <a name='5'></a>5.源码分享

```
cap program drop twfe_stgdid
program define twfe_stgdid

// Adjust the syntax to not require quotes around options
    syntax varlist(min=2 max=2) [if] , id(varlist) time(varlist) [ref(string)] [absorb(string)] ///
    [cluster(varlist)] [cov(string)] [level(string)] ///
    [panelview(string)] [r(string)] [figname(string)] [figtitle(string)] ///
    [figsubtitle(string)] [regtype(string)] [type(string)] [f(string)] [l(string)] ///
    [dispcoef(string)]
	
    // Assign the first variable in varlist to y and the second to did
    local y : word 1 of `varlist'
    local did : word 2 of `varlist'

di "------------------------------------------------------------------------------------"
preserve
*------------------------------------------------------------------------*
// check ref
if "`ref'" == ""{
	local ref = "-1"
	di "The option {ref} was not specified, defaulting to {-1}"
}
// check type: simple or event
if "`type'" == ""{
	local type = "event"
	di "The option {type} was not specified, defaulting to {event}"
}
*------------------------------------------------------------------------*
// year-by-year def
if "`r'" == ""{
	local r = 1
	di "The option {r} was not specified, defaulting to {1}"
}
*------------------------------------------------------------------------*
// regtype def
if "`regtype'" == ""{
	local regtype = "reg"
	di "The option {regtype} was not specified, defaulting to {reg}"
}
di "------------------------------------------------------------------------------------"
*------------------------------------------------------------------------*
qui{
// key var generation
global F `f'
global L `l'
cap drop _treatyear0 
cap drop _rty
cap drop ty
cap drop _ty
cap drop f_*
cap drop l_*

bys `id' : egen _treatyear0  = min(`time') if `did' >0
bys `id' : egen _treatyear = mean(_treatyear0)
gen ty = (`time' - _treatyear) / `r'
gen _ty = abs(ty)				// temp_t
}
*------------------------------------------------------------------------*
qui{
tab _ty if ty < 0 ,gen(f_)      // t<0
levelsof _ty if ty < 0
forv i = 1/`r(r)'{
	cap replace f_`i' = 0 if f_`i' == .
}
}
if "$F" != ""{
	di "F-period specified as -$F"
}
if "$F" == ""{
	di "F-period not specified"  
	global F `r(r)'
	di "F-period specified as Full-dim: `=-`r(r)''" 
	di "------------------------------------------------------------------------------------"
}
*------------------------------------------------------------------------*
qui{
tab _ty if ty > 0 ,gen(l_)      // t>0
levelsof _ty if ty > 0
forv i = 1/`r(r)'{
	replace l_`i' = 0 if l_`i' == .
}
gen l_0 = ty == 0    			 // t0
}
if "$L" != ""{
	di "L-period specified as $L"
}
if "$L" == ""{
	di "L-period not specified"  
	global L `r(r)'
	di "L-period specified as Full-dim: `r(r)'" 
	di "------------------------------------------------------------------------------------"
}
*------------------------------------------------------------------------*
// def. of ref period 
if `ref' >= 0{
	di "set l_`ref' as reference"
	qui replace l_`ref' = 0
	global refperiod "l_`ref'"
}
if `ref' < 0{
	local ref2 = -`ref'
	di "set f_`ref' as reference"
	qui replace f_`ref2' = 0
	global refperiod "f_`ref2'"
}
di "------------------------------------------------------------------------------------"

*------------------------------------------------------------------------*
// 是否查看面板选项
if "`panelview'" == ""{
	local panelview="False"
}
if "`panelview'" == "True"{
	panelview `did', i(`id') t(`time') type(treat) name(panelview,replace)
}
if "`panelview'" != "True"{
	di "The option {panelview} was not specified, no panelview plot"
}
*------------------------------------------------------------------------*
if "`type'" == "simple"{
	if "`cluster'" != ""{
		di ":::::::::{staggered-DID}:::::::::"
		di "INPUT Y: `y'"
		di "INPUT COV: `cov'"
		di "INPUT absorb: `absorb'"
		di "INPUT Cluster: no-cluster, Robust"
		di "method `regtype'hdfe"
		di "------------------------------------------------------------------------------------"
		if "`absorb'" != ""{
		`regtype'hdfe `y' `did' `cov' `if', absorb(`absorb') cluster(`cluster') 
		}
		if "`absorb'" == ""{
		`regtype'hdfe `y' `did' `cov' `if', noa cluster(`cluster') 
		}
	}
	
	if "`cluster'" == ""{
		di ":::::::::{staggered-DID}:::::::::"
		di "INPUT Y: `y'"
		di "INPUT COV: `cov'"
		di "INPUT absorb: `absorb'"
		di "INPUT Cluster: `cluster'"
		di "method `regtype'hdfe"
		di "------------------------------------------------------------------------------------"
		if "`absorb'" != ""{
		`regtype'hdfe `y' `did' `cov' `if', absorb(`absorb') vce(r)
		}
		if "`absorb'" == ""{
		`regtype'hdfe `y' `did' `cov' `if', noa vce(r)
		}
	}
}


if "`type'" == "event"{
// f_* 
local f_seq ""
forv i = $F(-1)1 {
	local f_seq "`f_seq' f_`i'"
}
// l_*
local l_seq ""
forvalues i = 0(1)$L {
    local l_seq "`l_seq' l_`i'"
}
// parallel-test
if "`cluster'" != ""{ 
	di ":::::::::{staggered-DID}:::::::::"
	di "INPUT Y: `y'"
	di "INPUT COV: `cov'"
	di "INPUT absorb: `absorb'"
	di "INPUT Cluster: `cluster'"
	di "method `regtype'hdfe"
	di "------------------------------------------------------------------------------------"
	if "`absorb'" != ""{
	local full_cmd "`regtype'hdfe `y' `f_seq' `l_seq' `if', absorb(`absorb') cluster(`cluster')"
	}
	if "`absorb'" == ""{
	local full_cmd "`regtype'hdfe `y' `f_seq' `l_seq' `if', noa cluster(`cluster')"
	}
	display "`full_cmd'"
	`full_cmd'
}

if "`cluster'" == ""{ 
	di ":::::::::{staggered-DID}:::::::::"
	di "INPUT Y: `y'"
	di "INPUT COV: `cov'"
	di "INPUT absorb: `absorb'"
	di "INPUT Cluster: `cluster'"
	di "method `regtype'hdfe"
	di "------------------------------------------------------------------------------------"
	if "`absorb'" != ""{
	local full_cmd "`regtype'hdfe `y' `f_seq' `l_seq' `if', absorb(`absorb') vce(r)"
	}
	if "`absorb'" == ""{
	local full_cmd "`regtype'hdfe `y' `f_seq' `l_seq' `if',noa vce(r)"
	}
	display "`full_cmd'"
	`full_cmd'
}


// matsave
global period = $F + $L + 1 
local s_y = -$F
local e_y = $L
local F $F

if "`level'" == "" {
	local level = "95"
	di "The option {level} was not specified, defaulting to {95%}"
}

local zval = 2.33 // 对应于 95% 置信区间
if "`level'" == "90" local zval = 1.96
if "`level'" == "99" local zval = 2.58

mat M = J($period,5,.)
forv i = `s_y' / `e_y' {
	local row = `i' + $F + 1 // 相对时间的偏移量
	if `i' < 0{
		cap mat M[`row',1] = _b[f_`=-`i'']    // 系数
		cap mat M[`row',2] = _se[f_`=-`i'']   // 标准误
		cap mat M[`row',3] = _b[f_`=-`i''] + `zval' * _se[f_`=-`i''] // 置信区间上限
		cap mat M[`row',4] = _b[f_`=-`i''] - `zval' * _se[f_`=-`i''] // 置信区间下限
		cap mat M[`row',5] = `i'  // 相对时间
		
	}
	if `i' >= 0{
		cap mat M[`row',1] = _b[l_`=`i'']    // 系数
		cap mat M[`row',2] = _se[l_`=`i'']   // 标准误
		cap mat M[`row',3] = _b[l_`=`i''] + `zval' * _se[l_`=`i''] // 置信区间上限
		cap mat M[`row',4] = _b[l_`=`i''] - `zval' * _se[l_`=`i''] // 置信区间下限
		cap mat M[`row',5] = `i'  // 相对时间
	}
}

qui{
clear
svmat M
replace M1 = 0 if M5 == `ref'
format M1 %9.2f
format M2 %9.2f

gen se = "(0" + string(round(M2,0.001))  + ")"
replace se = "." if strmatch(se,"*.*") == 0
replace se = "." if strmatch(se,"(0.)") == 1
forv i = 1/9{
	replace se = regexr(se, "\(0([`i'])\.", "(`i'.")
}

gen coef = string(abs(round(M1,0.01)))
replace coef = "0"+coef if strmatch(coef,".*") & M1 >=0 
replace coef = "-"+coef if strmatch(coef,".*")==0 & M1 <0 
replace coef = "-0"+coef if strmatch(coef,".*") & M1 <0
replace coef ="" if M5 == `ref'

gen sig_se = subinstr(se,"(","",.)
replace sig_se = subinstr(sig_se,")","",.)
destring sig_se,replace force
replace sig_se = M1/M2
replace se= "" if M5 == `ref'
	
gen sig = "***" if abs(sig_se) > 2.58 & sig_se!=.
replace sig = "**" if abs(sig_se) <= 2.58 & abs(sig_se) > 2.33 
replace sig = "*" if abs(sig_se) <= 2.33 & abs(sig_se) > 1.96

gen coef_sig = coef + sig

// check type: simple or event
if "`figname'" == ""{
	local figname = "parallel"
}

if "`dispcoef'" == ""{
	local dispcoef = "True"
}

if "`dispcoef'" == "True"{
tw (rcap M3 M4 M5, lp(solid) lc(gs4)) /// 
   (connect M1 M5 if M5 <=`ref', ms(o) mc(gs6) mlab(coef_sig) mlabp(1) lp(solid)) /// 
   (connect M1 M5 if M5 >=`ref', ms(o) lc(gs6) mlab(coef_sig) mlabp(11) lp(solid)) /// 
   (scatter M1 M5 if M5 <=`ref', ms(i) mlab(se) mlabp(5)) /// 
   (scatter M1 M5 if M5 >= `ref', ms(i) mlab(se) mlabp(7)) /// 
   , scheme(s1mono) legend(off) /// 
   xline(`=`ref'+0.5' ,lp(shortdash)) /// 
   yline(0,lp(shortdash)) xtitle("time") /// 
   ytitle("coef. and `level'% CI") /// 
   name("`figname'",replace) /// 
   subtitle("`figsubtitle'") /// 
   title("`figtitle'") 
}

if "`dispcoef'" == "False"{
tw (rcap M3 M4 M5, lp(solid) lc(gs4)) /// 
   (connect M1 M5, ms(o) mc(gs6) lp(solid)) /// 
   , scheme(s1mono) legend(off) /// 
   xline(`=`ref'+0.5' ,lp(shortdash)) /// 
   yline(0,lp(shortdash)) xtitle("time") /// 
   ytitle("coef. and `level'% CI") /// 
   name("`figname'",replace) /// 
   subtitle("`figsubtitle'") /// 
   title("`figtitle'") 
}


}
}
restore
end
```



##  <a name='6'></a>6.写在最后

在我上次发布的[dynamic_est命令](https://mengke25.github.io/dynamic_est/)时，在文末说明其不能直接对`类似多时点`的数据进行分析。

这样来看，`twfe_stgdid`在某种程度上也算是对`dynamic_est`的一种补充

其实整理这些命令，就是把自己平时用的多的一套流程封装起来。接下来我或许会写一个做panelmatch的命令，这个会相对麻烦一些，但也会更有意思，欢迎大家关注。

##  <a name='mengke25https:mengke25.github.io'></a>**转载请注明出处**：[@mengke25](https://mengke25.github.io/) 

##  <a name='https:mengke25.github.ioimagesdashang.png'></a>**请喝咖啡**：[打赏渠道](https://mengke25.github.io/images/dashang.png)



