---
layout: post
title: "【stata】自写命令分享`dynamic_est`，一键生成dynamic effect"
date:   2024-9-6
tags: [code,stata]
comments: true
author: mengke25
---


最早是我用来checkdata的，后来为了方便就写成了函数。现在我稍微完善了一下，封装成了stata外部命令，能够实现一句命令查看被解释变量变量在treat下的dynamic effect，希望能帮到大家。
<!-- more -->



<!-- vscode-markdown-toc -->
* [1. 命令简介](#1)
* [2.使用方法](#2)
	* [(1) 主要选项](#2-1)
	* [(2) 其他选项](#2-2)
* [3.安装方法](#3)
* [4.示例](#4)
	* [(1) 基本用法](#4-1)
	* [(2) 进阶用法](#4-2)
	* [(3) 帮助文件](#4-3)
* [5.源码分享](#5)
* [6.写在最后](#6)


<!-- vscode-markdown-toc-config
	numbering=true
	autoSave=true
	/vscode-markdown-toc-config -->
<!-- /vscode-markdown-toc -->



##  <a name='1'></a>1. 命令简介

`dynamic_est` 是一个用于可视化动态效应（dynamic effect）的工具。它特别适用于事件研究（event study）或双重差分（Difference-in-Differences, DID）分析。通过一句命令即可展示动态效应，帮助用户更好地理解在某变量的作用下，随时间变化其对结果变量的影响。

在输出的图像中，为了让结果更加直观，我加入了各期的系数、标准误，也标注了显著性

![fig1](https://mengke25.github.io/images/dynamic_est/fig1.png)


##  <a name='2'></a>2.使用方法

###   <a name='2-1'></a>(1) 主要选项
`dynamic_est` 需要以下四个必需变量：
* `y`: 结果变量（outcome variable），即你想要观察的因变量。
* `treat`: 分组变量
  * 可以是二元变量，用于区分处理组（treatment group）或对照组（control group）
  * 也支持强度（intensity）变量
* `time`: 时间变量
  * 支持自然年份（standard-spec.）
  * 相对年份（staggered-spec.）
* `ref`: 基期选择，数值型，如{2006} 或 {-1}，用于定义参考时期。


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

```
net install dynamic_est, from("https://mengke25.github.io/files/function/stata/dynamic_est") replace
```
如果安装失败，可通过邮件向我索取。因为是自用命令，可能还有很多不完善的地方，所以先暂时上传到了个人的repositories中，如果大家有什么建议或者问题，欢迎私信我！

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


##  <a name='5'></a>5.源码分享

```
cap program drop dynamic_est
program define dynamic_est

    // Adjust the syntax to not require quotes around options
    syntax varlist(min=1 max=1) [if],  /// 
	treat(varlist) time(varlist) ref(integer) [absorb(string)] ///
	[cluster(varlist)] [cov(string)] ///
	[level(string)] [treattype(string)] [figname(string)] ///
	[figtitle(string)] [figsubtitle(string)]  [regtype(string)]
	
	// Assign the first variable in varlist to y and the second to did
    local y : word 1 of `varlist'
    // local treat : word 2 of `varlist'
	
	// default options
	di "------------------------------------------------------------------------------------"
	di "Option warning:"
	
	if "`regtype'" == ""{
	    local regtype = "reg"
		di "The option {regtype} was not specified, defaulting to {reg}"
	}
		
	if "`level'" == "" {
	    local level = "95"
		di "The option {level} was not specified, defaulting to {95%}"
	}	
	
	if "`treattype'" == ""{
		// local treattype = "binary"	// binary or intensity
		qui{
		levelsof `treat'
		local levelsoftreat = r(r)
		su `treat'
		if `levelsoftreat' == 2 & r(min) == 0 & r(max) == 1{
			local treattype = "binary"
		}
		if `levelsoftreat' > 2 {
			local treattype = "intensity"
		}
		}
		di "The option {treattype} was not specified, the treat var you entered should be {`treattype'}"
	}
		
	qui{
    // Summarize the year variable to find the range
	cap ren _ty xjsktf29186
    su `time', d
    local s_y = r(min)
    local e_y = r(max)
    local period = `e_y' - `s_y'
    local coef_t ""
	}
	
	qui{
	if `s_y' >=0 {
	    local gap = 0
		di "时间为正数，可直接运行"
	}
	
	if `s_y' < 0{
	    su `time', d
		gen _ty = `time' - r(min) + 1
		local gap = 1 -r(min)
		local time _ty
		local ref = `ref' + `gap'
		su `time', d
		local s_y = r(min)
		local e_y = r(max)
		local period = `e_y' - `s_y'
		local coef_t ""
	}
	}
	
	di "------------------------------------------------------------------------------------"
	qui{
	// Loop through the years to construct the coefficient time variables
	forv i = 1/`period' {
		local j = `i' + `s_y' - 1
		if `j' < `ref' {
			local coef_t "`coef_t' `=`s_y'-1+`i''"
			local coef_k "`coef_k' `=`i'-`gap''"
		}
		if `j' >= `ref' {
			local coef_t "`coef_t' `=`s_y'+`i''"
			local coef_k "`coef_k' `=`i'+1-`gap''"
		}
	}
	}
	// Display the constructed coef_t string for debugging purposes
	// di "`coef_t'"
	
	// binary or intensity?
	
	if "`treattype'" == "binary"{
		// binary
		if `gap' == 0{
	    di "INPUT TIME: natural time {standard-DID}"
		di "INPUT treatment type: binary"
		di "INPUT Y: `y'"
		di "INPUT COV: `cov'"
		di "INPUT absorb: `absorb'"
		di "INPUT Cluster: `cluster'"
		di "method `regtype'hdfe"
		di "------------------------------------------------------------------------------------"
		di ":::::::::RUN:::::::::"
		di "------------------------------------------------------------------------------------"
		
		// Execute the regression with or without cluster & absorb
		if "`cluster'" != ""{
			if "`absorb'" != ""{
				di "TWFE: `regtype'hdfe `y' i1.`treat'#i(`coef_t').`time' `cov' `if', absorb(`absorb') cluster(`cluster')"
				`regtype'hdfe `y' i1.`treat'#i(`coef_t').`time' `cov' `if', absorb(`absorb') cluster(`cluster') level(`level')
			}
			if "`absorb'" == ""{
				di "TWFE: `regtype'hdfe `y' i1.`treat'#i(`coef_t').`time' `cov' `if', noa cluster(`cluster')"
				`regtype'hdfe `y' i1.`treat'#i(`coef_t').`time' `cov' `if', noa cluster(`cluster') level(`level')
			}
		}
		
		if "`cluster'" == ""{
			if "`absorb'" != ""{
				di "TWFE: `regtype'hdfe `y' i1.`treat'#i(`coef_t').`time' `cov' `if', absorb(`absorb') vce(r)"
				`regtype'hdfe `y' i1.`treat'#i(`coef_t').`time' `cov' `if', absorb(`absorb') vce(r) level(`level')
			}
			if "`absorb'" == ""{
				di "TWFE: `regtype'hdfe `y' i1.`treat'#i(`coef_t').`time' `cov' `if', noa vce(r)"
				`regtype'hdfe `y' i1.`treat'#i(`coef_t').`time' `cov' `if', noa cluster(`cluster') level(`level')
			}
		}

	}
	
	if `gap' != 0{
	    di "INPUT TIME: relative time {staggered-DID}"
		di "INPUT treatment type: binary"
		di "INPUT Y: `y'"
		di "INPUT COV: `cov'"
		di "INPUT absorb: `absorb'"
		di "INPUT Cluster: `cluster'"
		di "method `regtype'hdfe"
		di "------------------------------------------------------------------------------------"
		di ":::::::::RUN:::::::::"
		di "------------------------------------------------------------------------------------"
		
		// Execute the regression with or without condition
		if "`cluster'" != ""{
			if "`absorb'" != "" {
				di "TWFE: `regtype'hdfe `y' i1.`treat'#i(`coef_k').`time' `cov' `if', absorb(`absorb') cluster(`cluster')"
				`regtype'hdfe `y' i1.`treat'#i(`coef_t').`time' `cov' `if' , absorb(`absorb') cluster(`cluster') level(`level')
			}
			if "`absorb'" == "" {
				di "TWFE: `regtype'hdfe `y' i1.`treat'#i(`coef_k').`time' `cov' `if', noa cluster(`cluster')"
				`regtype'hdfe `y' i1.`treat'#i(`coef_t').`time' `cov' `if' , noa cluster(`cluster') level(`level')
			}
		}
		if "`cluster'" == ""{
			if "`absorb'" != "" {
				di "TWFE: `regtype'hdfe `y' i1.`treat'#i(`coef_k').`time' `cov' `if', absorb(`absorb') vce(r)"
				`regtype'hdfe `y' i1.`treat'#i(`coef_t').`time' `cov' `if', absorb(`absorb') vce(r) level(`level')
			}
			if "`absorb'" == "" {
				di "TWFE: `regtype'hdfe `y' i1.`treat'#i(`coef_k').`time' `cov' `if', noa vce(r)"
				`regtype'hdfe `y' i1.`treat'#i(`coef_t').`time' `cov' `if' , noa vce(r) level(`level')
			}
		}
	}
	}
	
	if "`treattype'" == "intensity"{
		// intensity
		if `gap' == 0{
	    di "INPUT TIME: natural time {standard-DID}"
		di "INPUT treatment type: intensity"
		di "INPUT Y: `y'"
		di "INPUT COV: `cov'"
		di "INPUT absorb: `absorb'"
		di "INPUT Cluster: `cluster'"
		di "method `regtype'hdfe"
		di "------------------------------------------------------------------------------------"
		di ":::::::::RUN:::::::::"
		di "------------------------------------------------------------------------------------"
		
		// Execute the regression with or without condition
		if "`cluster'" != ""{
			if "`absorb'" != ""{
				di "TWFE: `regtype'hdfe `y' c.`treat'#i(`coef_t').`time' `cov' `if' , absorb(`absorb') cluster(`cluster')"
				`regtype'hdfe `y' c.`treat'#i(`coef_t').`time' `cov' `if' , absorb(`absorb') cluster(`cluster') level(`level')
			}
			if "`absorb'" == ""{
				di "TWFE: `regtype'hdfe `y' c.`treat'#i(`coef_t').`time' `cov' `if' , noa cluster(`cluster')"
				`regtype'hdfe `y' c.`treat'#i(`coef_t').`time' `cov' `if' , noa cluster(`cluster') level(`level')
			}
		}
		if "`cluster'" == ""{
			if "`absorb'" != ""{
				di "TWFE: `regtype'hdfe `y' c.`treat'#i(`coef_t').`time' `cov' `if' , absorb(`absorb') vce(r)"
				`regtype'hdfe `y' c.`treat'#i(`coef_t').`time' `cov' `if' , absorb(`absorb') vce(r) level(`level')
			}
			if "`absorb'" == ""{
				di "TWFE: `regtype'hdfe `y' c.`treat'#i(`coef_t').`time' `cov' `if' , noa vce(r)"
				`regtype'hdfe `y' c.`treat'#i(`coef_t').`time' `cov' `if' , noa vce(r) level(`level')
			}
		}
	}
	
	if `gap' != 0{
	    di "INPUT TIME: relative time {staggered-DID}"
		di "INPUT treatment type: intensity"
		di "INPUT Y: `y'"
		di "INPUT COV: `cov'"
		di "INPUT absorb: `absorb'"
		di "INPUT Cluster: `cluster'"
		di "method `regtype'hdfe"
		di "------------------------------------------------------------------------------------"
		di ":::::::::RUN:::::::::"
		di "------------------------------------------------------------------------------------"
		
		// Execute the regression with or without condition
		if "`cluster'" != ""{
			if "`absorb'" != ""{
				di "TWFE: `regtype'hdfe `y' c.`treat'#i(`coef_k').`time' `cov' `if', absorb(`absorb') cluster(`cluster')"
				`regtype'hdfe `y' c.`treat'#i(`coef_t').`time' `cov' `if' , absorb(`absorb') cluster(`cluster') level(`level')
			}
			if "`absorb'" == ""{
				di "TWFE: `regtype'hdfe `y' c.`treat'#i(`coef_k').`time' `cov' `if', noa cluster(`cluster')"
				`regtype'hdfe `y' c.`treat'#i(`coef_t').`time' `cov' `if' , noa cluster(`cluster') level(`level')
			}
		}
		if "`cluster'" == ""{
			if "`absorb'" != ""{
				di "TWFE: `regtype'hdfe `y' c.`treat'#i(`coef_k').`time' `cov' `if', absorb(`absorb') vce(r)"
				`regtype'hdfe `y' c.`treat'#i(`coef_t').`time' `cov' `if' , absorb(`absorb') vce(r) level(`level')
			}
			if "`absorb'" == ""{
				di "TWFE: `regtype'hdfe `y' c.`treat'#i(`coef_k').`time' `cov' `if', noa vce(r)"
				`regtype'hdfe `y' c.`treat'#i(`coef_t').`time' `cov' `if' , noa vce(r) level(`level')
			}
		}
	}
	}
	
	cap{
	mat N = e(N)
	local obs =  N[1,1]
	}
	
	// ↓↓↓↓↓ fig ↓↓↓↓↓ 
	if "`treattype'" == "intensity"{
	local length = `period' + 1
	mat M = J(`length',5,.)
	if "`level'" == "90"{
		forv i = `s_y' / `e_y'{
			local row = `i' - `s_y' + 1
			cap mat M[`row',1] = _b[c.`treat'#`i'.`time']
			cap mat M[`row',2] = _se[c.`treat'#`i'.`time']
			cap mat M[`row',3] = _b[c.`treat'#`i'.`time'] + 1.96 * _se[c.`treat'#`i'.`time']
			cap mat M[`row',4] = _b[c.`treat'#`i'.`time'] - 1.96 * _se[c.`treat'#`i'.`time']
			cap mat M[`row',5] = `i'
		}
	}
	if "`level'" == "95"{
		forv i = `s_y' / `e_y'{
			local row = `i' - `s_y' + 1
			cap mat M[`row',1] = _b[c.`treat'#`i'.`time']
			cap mat M[`row',2] = _se[c.`treat'#`i'.`time']
			cap mat M[`row',3] = _b[c.`treat'#`i'.`time'] + 2.33 * _se[c.`treat'#`i'.`time']
			cap mat M[`row',4] = _b[c.`treat'#`i'.`time'] - 2.33 * _se[c.`treat'#`i'.`time']
			cap mat M[`row',5] = `i'
		}
	}
	if "`level'" == "99"{
		forv i = `s_y' / `e_y'{
			local row = `i' - `s_y' + 1
			cap mat M[`row',1] = _b[c.`treat'#`i'.`time']
			cap mat M[`row',2] = _se[c.`treat'#`i'.`time']
			cap mat M[`row',3] = _b[c.`treat'#`i'.`time'] + 2.58 * _se[c.`treat'#`i'.`time']
			cap mat M[`row',4] = _b[c.`treat'#`i'.`time'] - 2.58 * _se[c.`treat'#`i'.`time']
			cap mat M[`row',5] = `i'
		}
	}
	}
	
	if "`treattype'" == "binary"{
	local length = `period' + 1
	mat M = J(`length',5,.)
	if "`level'" == "90"{
		forv i = `s_y' / `e_y'{
			local row = `i' - `s_y' + 1
			cap mat M[`row',1] = _b[1.`treat'#`i'.`time']
			cap mat M[`row',2] = _se[1.`treat'#`i'.`time']
			cap mat M[`row',3] = _b[1.`treat'#`i'.`time'] + 1.96 * _se[1.`treat'#`i'.`time']
			cap mat M[`row',4] = _b[1.`treat'#`i'.`time'] - 1.96 * _se[1.`treat'#`i'.`time']
			cap mat M[`row',5] = `i'
		}
	}
	if "`level'" == "95"{
		forv i = `s_y' / `e_y'{
			local row = `i' - `s_y' + 1
			cap mat M[`row',1] = _b[1.`treat'#`i'.`time']
			cap mat M[`row',2] = _se[1.`treat'#`i'.`time']
			cap mat M[`row',3] = _b[1.`treat'#`i'.`time'] + 2.33 * _se[1.`treat'#`i'.`time']
			cap mat M[`row',4] = _b[1.`treat'#`i'.`time'] - 2.33 * _se[1.`treat'#`i'.`time']
			cap mat M[`row',5] = `i'
		}
	}
	if "`level'" == "99"{
		forv i = `s_y' / `e_y'{
			local row = `i' - `s_y' + 1
			cap mat M[`row',1] = _b[1.`treat'#`i'.`time']
			cap mat M[`row',2] = _se[1.`treat'#`i'.`time']
			cap mat M[`row',3] = _b[1.`treat'#`i'.`time'] + 2.58 * _se[1.`treat'#`i'.`time']
			cap mat M[`row',4] = _b[1.`treat'#`i'.`time'] - 2.58 * _se[1.`treat'#`i'.`time']
			cap mat M[`row',5] = `i'
		}
	}
	}
	
	qui{
	preserve
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
		
		if `gap' == 0{
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
			   title("`figtitle'") note("observations: `obs'")
		}
		
		if `gap' != 0{
		replace M5 = M5 - `gap'
		local ref = `ref' - `gap'
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
		   title("`figtitle'") note("observations: `obs'")
		}
	restore
	
	cap drop _ty
	cap ren xjsktf29186 _ty 
	}
	
end
```



##  <a name='6'></a>6.写在最后

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
  * 不过，我写的另一个外部命令[（欢迎使用）twfe_stgdid](https://mengke25.github.io/twfe_stgdid/)可以直接对`staggered-spec`的数据进行分析。





##   <a name='mengke25https:mengke25.github.io'></a>**转载请注明出处**：[@mengke25](https://mengke25.github.io/) 

##  <a name='https:mengke25.github.ioimagesdashang.png'></a>**请喝咖啡**：[打赏渠道](https://mengke25.github.io/images/dashang.png)




