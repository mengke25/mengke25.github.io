clear
set obs 10 
gen x = _n
gsort -x
gen y = 2.5*_n
corr y x
clear
