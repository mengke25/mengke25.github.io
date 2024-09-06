
cap program drop dynamic_fig
program define dynamic_fig

    // Adjust the syntax to not require quotes around options
    syntax, y(varlist) treat(varlist) time(varlist) ref(integer) absorb(string) [condition(string)] cluster(varlist) [cov(string)] [level(string)] [figname(string)] [figtitle(string)] [figsubtitle(string)]  [regtype(string)] 
	
	qui{
	if "`regtype'" == ""{
	    local regtype = "reg"
	}
	
	if "`level'" == "" {
	    local level = "90"
	}

    // Summarize the year variable to find the range
    su `time', d
    local s_y = r(min)
    local e_y = r(max)
    local period = `e_y' - `s_y'
    local coef_t ""
	
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

	// Display the constructed coef_t string for debugging purposes
	di "`coef_t'"
	}
	
	if `gap' == 0{
	    di "INPUT TIME: natural time"
		di "INPUT Y: `y'"
		di "INPUT COV: `cov'"
		di "INPUT Condition: `condition'"
		di "INPUT Cluster: `cluster'"
		di "method `regtype'hdfe"
		di ":::::::::RUN:::::::::"
		
		// Execute the regression with or without condition
		if "`condition'" != "" {
			di "TWFE: `regtype'hdfe `y' i1.`treat'#i(`coef_t').`time' `cov' if `condition', absorb(`absorb') cluster(`cluster')"
			`regtype'hdfe `y' i1.`treat'#i(`coef_t').`time' `cov' if `condition', absorb(`absorb') cluster(`cluster') level(`level')
		}
		else {
			di "TWFE: `regtype'hdfe `y' i1.`treat'#i(`coef_t').`time' `cov', absorb(`absorb') cluster(`cluster')"
			`regtype'hdfe `y' i1.`treat'#i(`coef_t').`time' `cov', absorb(`absorb') cluster(`cluster')  level(`level')
		}
	}
	
	if `gap' != 0{
	    di "INPUT TIME: relative time"
		di "INPUT Y: `y'"
		di "INPUT COV: `cov'"
		di "INPUT Condition: `condition'"
		di "INPUT Cluster: `cluster'"
		di "method `regtype'hdfe"
		di ":::::::::RUN:::::::::"
		
		// Execute the regression with or without condition
		if "`condition'" != "" {
			di "TWFE: `regtype'hdfe `y' i1.`treat'#i(`coef_k').`time' `cov' if `condition', absorb(`absorb') cluster(`cluster')"
			`regtype'hdfe `y' i1.`treat'#i(`coef_t').`time' `cov' if `condition', absorb(`absorb') cluster(`cluster') level(`level')
		}
		else {
			di "TWFE: `regtype'hdfe `y' i1.`treat'#i(`coef_k').`time' `cov', absorb(`absorb') cluster(`cluster')"
			`regtype'hdfe `y' i1.`treat'#i(`coef_t').`time' `cov', absorb(`absorb') cluster(`cluster')  level(`level')
		}
	}
	
	
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
		replace coef = "-0"+coef if strmatch(coef,".*") & M1 <0
		replace coef = "-"+coef if strmatch(coef,".*")==0 & M1 <0 
		replace coef ="" if M5 == `ref'
		
		gen sig_se = subinstr(se,"(","",.)
		replace sig_se = subinstr(sig_se,")","",.)
		destring sig_se,replace force
		replace sig_se = M1/M2
			
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
			   ytitle("coef. and CI") /// 
			   name("`figname'",replace) /// 
			   subtitle("`figsubtitle'") /// 
			   title("`figtitle'")
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
		   ytitle("coef. and CI") /// 
		   name("`figname'",replace) /// 
		   subtitle("`figsubtitle'") /// 
		   title("`figtitle'") 
		}
	restore
	
	cap drop _ty
	}
end




