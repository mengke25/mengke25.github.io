{smcl}
{* *! version 1.0 03Sep2024}{...}
{cmd:help twfe_stgdid}
{hline}

{pstd}

{title:twfe_stgdid}

{p2colset 5 16 16 2}{...}
{p2col:{hi: twfe_stgdid} {hline 2}}A function for staggered-DID studies. {stata "help twfe_stgdid":help twfe_stgdid}.{p_end}
{p2colreset}{...}


{marker syntax}{...}
{title:Syntax}

{p 8 21 2}
{cmd:twfe_stgdid Y did [if] } 
[{cmd:,}
    {cmdab:id}{cmd:(}{it:varlist}{cmd:)}
    {cmdab:time}{cmd:(}{it:varlist}{cmd:)}
    {cmdab:ref}{cmd:(}{it:integer}{cmd:)}
    {cmdab:absorb}{cmd:(}{it:string}{cmd:)}
    {cmdab:cov}{cmd:(}{it:string}{cmd:)}
    {cmdab:cluster}{cmd:(}{it:varlist}{cmd:)}
    {cmdab:f}{cmd:(}{it:string}{cmd:)}
    {cmdab:l}{cmd:(}{it:string}{cmd:)}
    {cmdab:type}{cmd:(}{it:string}{cmd:)}
    {cmdab:regtype}{cmd:(}{it:string}{cmd:)}
    {cmdab:level}{cmd:(}{it:string}{cmd:)}
    {cmdab:panelview}{cmd:(}{it:string}{cmd:)}
    {cmdab:r}{cmd:(}{it:string}{cmd:)}
    {cmdab:figname}{cmd:(}{it:string}{cmd:)}
    {cmdab:figtitle}{cmd:(}{it:string}{cmd:)}
    {cmdab:figsubtitle}{cmd:(}{it:string}{cmd:)}
    {cmdab:dispcoef}{cmd:(}{it:string}{cmd:)}
    ]


{title:installation}
{phang2} *- net install {p_end}
{phang2}{inp:.} {stata "net install twfe_stgdid, from(https://mengke25.github.io/files/function/stata/twfe_stgdid) replace": net install twfe_stgdid, from(https://mengke25.github.io/files/function/stata/twfe_stgdid) replace }{p_end}



{title:Description}

{pstd}
twfe_stgdid is an efficient tool designed to assist with staggered-DID analysis based on TWFE. 
It can complete the analysis and display parallel trend tests in one step based on the data 
and given conditions.
{p_end}


{p 4 8 2} {opt Y} (required) – The dependent variable.

{p 4 8 2} {opt did} (required) – The DID estimator variable.

{p 4 8 2} {opt id} (required) – The unique identifier for individuals, which cannot have missing values or duplicates.

{p 4 8 2} {opt time} (required) – The natural time variable.

{p 4 8 2} {opt ref} (optional) – Specifies which period to use as the reference; default is -1.

{p 4 8 2} {opt f} (optional) – Select the number of pre-treatment periods; default is all pre-treatment periods.

{p 4 8 2} {opt l} (optional) – Select the number of post-treatment periods; default is all post-treatment periods.

{p 4 8 2} {opt absorb} (optional) – Fixed effects or control variables that you don’t want to display.

{p 4 8 2} {opt cov} (optional) – Covariates.

{p 4 8 2} {opt cluster} (optional) – The clustering level; default is heteroscedasticity-robust standard errors.

{p 4 8 2} {opt type} (optional) – View type, can be simple or event. simple shows only baseline results, while event reports parallel trend tests; the default is event.

{p 4 8 2} {opt regtype} (optional) – The regression type, can be reg or ppml, default is reg.

{p 4 8 2} {opt level} (optional) – Confidence interval level, default is 95%.

{p 4 8 2} {opt panelview} (optional) – Whether to display the panel distribution of the DID estimator, can be True or False, default is False (do not display).

{p 4 8 2} {opt figname(string)} (optional) – Name for the output graph.

{p 4 8 2} {opt figtitle(string)} (optional) – Title for the figure.

{p 4 8 2} {opt figsubtitle(string)} (optional) – Subtitle for the figure.

{p 4 8 2} {opt dispcoef} (optional) – Whether to display the coefficients in the parallel trend test, can be True or False, default is True (display).




{title:Examples}

{phang2} *- Run example1 {p_end}
{phang2}{inp:.} {stata "use https://mengke25.github.io/files/function/stata/twfe_stgdid/twfe_stgdid_sample.dta,clear": use sample.dta, clear }{p_end}
{phang2}{inp:.} {stata "twfe_stgdid Y did , id(id) time(cycle) ":  twfe_stgdid Y DA , id(id) time(cycle) }{p_end}


{phang2} *- Run example2 {p_end}
{phang2}{inp:.} {stata "use https://mengke25.github.io/files/function/stata/twfe_stgdid/twfe_stgdid_sample.dta,clear": use sample.dta, clear }{p_end}
{phang2}{inp:.} {stata "twfe_stgdid Y did , id(id) time(cycle) f(4) l(4) ref(-1) absorb(id cycle) level(90) cluster(id)":  twfe_stgdid Y DA , id(id) time(cycle) f(4) l(4) ref(-1) absorb(id cycle) level(90) cluster(id) }{p_end}


{phang2} *- Run example3 {p_end}
{phang2}{inp:.} {stata "use https://mengke25.github.io/files/function/stata/twfe_stgdid/twfe_stgdid_sample.dta,clear": use sample.dta, clear }{p_end}
{phang2}{inp:.} {stata "twfe_stgdid Y did , id(id) time(cycle) f(4) l(4) ref(-1) absorb(id cycle) level(90) cluster(id) panelview(True)  regtype(ppml) ":  twfe_stgdid Y DA , id(id) time(cycle) f(4) l(4) ref(-1) absorb(id cycle) level(90) cluster(id) panelview(True)  regtype(ppml) }{p_end}




{title:Author}

{phang}
{cmd:MengKe} China Institute for WTO studies, University of International Business and Economics, China.{break}
E-mail: {browse "mailto:uibemk@126.com":uibemk@126.com}. {break}
Blog: {browse "https://mengke25.github.io":mengke25.github.io} {break}
{p_end}

