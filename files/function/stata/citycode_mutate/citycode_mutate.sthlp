{smcl}
{* *! version 1.0 03Sep2024}{...}
{cmd:help citycode_mutate}
{hline}

{pstd}

{title:citycode_mutate}

{p2colset 5 16 16 2}{...}
{p2col:{hi: citycode_mutate} {hline 2}}generate a new var to capture China's citycode from string variable {stata "help citycode_mutate":help citycode_mutate}.{p_end}
{p2colreset}{...}


{marker syntax}{...}
{title:Syntax}

{p 4 19 2}
{cmdab:citycode_mutate} {varlist} ,  
[
    varlist is a string variable; 
    It can be firm name, company name, or any other string variable that contains city information.
]


{marker description}{...}
{title:Description}

{pstd} generate a new var to capture China's citycode from string variable



{title:Author}

{phang}
{cmd:MengKe} China Institute for WTO studies, University of International Business and Economics, China.{break}
E-mail: {browse "mailto:uibemk@126.com":uibemk@126.com}. {break}
Blog: {browse "https://www.mengke25.github.io":mengke25.github.io} {break}
{p_end}

