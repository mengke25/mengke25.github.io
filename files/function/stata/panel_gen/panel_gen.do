cap program drop panel_gen
program define panel_gen
syntax , type(string)

di "panel_gen, type(standard)"
di "panel_gen, type(staggered)"
di "panel_gen, type(general)"

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
