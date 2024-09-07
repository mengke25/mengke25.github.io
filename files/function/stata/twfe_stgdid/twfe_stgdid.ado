cap program drop twfe_stgdid
program define twfe_stgdid
// Adjust the syntax to not require quotes around options
    syntax, y(varlist) did(varlist) id(varlist) time(varlist) ref(integer) absorb(string) [condition(string)] [cluster(varlist)] [cov(string)] [level(string)] [panelview(string)] [r(string)] [figname(string)] [figtitle(string)] [figsubtitle(string)]  [regtype(string)]  [type(string)] [f(string)] [l(string)] [dispcoef(string)]

di "------------------------------------------------------------------------------------"
preserve
*------------------------------------------------------------------------*
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
bys `id' : egen _treatyear0  = min(`time') if `did' == 1
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
// condition 选项
if "`condition'" != ""{
	local condition = "if " + "`condition'"
}
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
		di "INPUT Condition: `condition'"
		di "INPUT Cluster: no-cluster, Robust"
		di "method `regtype'hdfe"
		di "------------------------------------------------------------------------------------"
		`regtype'hdfe `y' `did' `cov' `condition', absorb(`absorb') cluster(`cluster') 
	}
	
	if "`cluster'" == ""{
		di ":::::::::{staggered-DID}:::::::::"
		di "INPUT Y: `y'"
		di "INPUT COV: `cov'"
		di "INPUT absorb: `absorb'"
		di "INPUT Condition: `condition'"
		di "INPUT Cluster: `cluster'"
		di "method `regtype'hdfe"
		di "------------------------------------------------------------------------------------"
		`regtype'hdfe `y' `did' `cov' `condition', absorb(`absorb') vce(r)
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
	di "INPUT Condition: `condition'"
	di "INPUT Cluster: `cluster'"
	di "method `regtype'hdfe"
	di "------------------------------------------------------------------------------------"
	local full_cmd "`regtype'hdfe `y' `f_seq' `l_seq', absorb(`absorb') cluster(`cluster')"
	display "`full_cmd'"
	`full_cmd'
}

if "`cluster'" == ""{ 
	di ":::::::::{staggered-DID}:::::::::"
	di "INPUT Y: `y'"
	di "INPUT COV: `cov'"
	di "INPUT absorb: `absorb'"
	di "INPUT Condition: `condition'"
	di "INPUT Cluster: `cluster'"
	di "method `regtype'hdfe"
	di "------------------------------------------------------------------------------------"
	local full_cmd "`regtype'hdfe `y' `f_seq' `l_seq', absorb(`absorb') vce(r)"
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
