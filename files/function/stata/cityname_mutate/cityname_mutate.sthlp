{smcl}
{* *! version 1.0 03Sep2024}{...}
{cmd:help cityname_mutate}
{hline}

{pstd}

{title:cityname_mutate}

{p2colset 5 16 16 2}{...}
{p2col:{hi: cityname_mutate} {hline 2}}generate a new var to capture China's cityname from 6-digit citycode variable. {stata "help cityname_mutate":help cityname_mutate}.{p_end}
{p2colreset}{...}


{marker syntax}{...}
{title:Syntax}

{p 4 19 2}
{cmdab:cityname_mutate} {varlist} ,  
[
    varlist is 6-digit citycode(numeric var); 
]


{marker description}{...}
{title:Description}

{pstd} generate a new var to capture China's cityname from 6-digit citycode variable.



{title:Author}

{phang}
{cmd:MengKe} China Institute for WTO studies, University of International Business and Economics, China.{break}
E-mail: {browse "mailto:uibemk@126.com":uibemk@126.com}. {break}
Blog: {browse "https://mengke25.github.io":mengke25.github.io} {break}
{p_end}

