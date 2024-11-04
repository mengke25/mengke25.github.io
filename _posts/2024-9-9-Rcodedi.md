---
layout: post
title: "【R语言】R语言常用函数汇总（持续更新）"
date:   2024-9-9
tags: [code,R]
comments: true
author: mengke25
---



一些R语言常用函数，持续更新

<!-- more -->

### 0.R语言常见操作

[R语言_dylyr速查](https://mengke25.github.io/html_dir/Rlanguage/R语言_dplyr函数速查.html)



[R语言_lappy速查](https://mengke25.github.io/html_dir/Rlanguage/R语言_lappy.html)



[R语言_wide型数据转换](https://mengke25.github.io/html_dir/Rlanguage/R语言_pivot_wider.html)



[R语言_long型数据转换](https://mengke25.github.io/html_dir/Rlanguage/R语言_pivot_longer.html)



[R语言_条件赋值case_when](https://mengke25.github.io/html_dir/Rlanguage/R语言_条件赋值case_when.html)



[R语言_字符替换gsub](https://mengke25.github.io/html_dir/Rlanguage/R语言_正则表达式字符替换.html)



[R语言_画图ggplot](https://mengke25.github.io/html_dir/ggplot/ggplot.html)



[R语言_setNames](https://mengke25.github.io/html_dir/Rlanguage/R语言_setNames.html)



[R语言_cur系列函数](https://mengke25.github.io/html_dir/Rlanguage/R语言_cur系列函数.html)



[R语言_do.call函数](https://mengke25.github.io/html_dir/Rlanguage/R语言_docall.html)









### 1.R语言回归分析

#### (1) 载入程辑包
```
library(haven)
library(ggplot2)
library(tidyr)
library(RColorBrewer) 
library(ggstatsplot)
library(conflicted)
library(dplyr)
library(readxl)
library(quarto)
library(tidyverse)
library(forcats)
library(ggpattern)
library(conflicted)
library(skimr)
conflict_prefer("filter", "dplyr")
conflict_prefer("lag", "dplyr")

library(fixest)
library(broom)
library(stargazer)
library(modelsummary) ## feols输出
```

#### (2) 生成随机数据
```
##### 生成数据框 #####
set.seed(123)
df <- data.frame(
  id = rep(1:10, each = 10),
  year = rep(2000:2009, times = 10),
  x = rnorm(100),
  y = rnorm(100),
  z = rnorm(100)
)
df$D  <- ifelse(df$x>=0 , 1, 0)

df <- df %>%
  mutate(y = 5*x + rnorm(n = nrow(df)) )
```

#### (3) 回归命令
```
##### 回归 #####

# reghdfe y x, a(id year) clsuter(id)
model1 <- feols(y ~ x | id + year, data = df)
summary(model1, cluster = "id")  # 聚类标准误

# reghdfe y c.x#c.z ,a(id year) cluster(id) 
model2 <- feols(y ~ x : z | id + year, data = df)
summary(model2, cluster = "id")

# reghdfe y c.x##c.z x z ,a(id year) cluster(id) 
model3 <- feols(y ~ x * z  | id + year, data = df)          # 直接 
model3 <- feols(y ~ x : z + x + z  | id + year, data = df)  # 手动
summary(model3, cluster = "id")

# reghdfe y c.x##i.D  ,a(id year) cluster(id) 
model4 <- feols(y ~ as.factor(D) * x  | id + year ,data = df)
summary(model4, cluster = "id")
```

#### (4) 输出结果
```
##### 输出结果 #####

models <- list(
  Model1 = model1,
  Model2 = model2,
  Model3 = model3,
  Model4 = model4
)

# ggcoefstats(model4) # + coord_flip()

modelsummary(models, 
             output = "html",  # 或者 "gt", "html", "latex" 等
             statistic = "std.error",  
             stars = c('*' = 0.1, '**' = 0.05, '***' = 0.01), 
             conf.int = TRUE)  # 包含置信区间
```

#### (5) 直接绘制系数
```
##### 绘制系数 #####

# reghdfe y c.x##i.year  ,a(id year) cluster(id) 
model5 <- feols(y ~  x*as.factor(year)  | id + year ,data = df)
summary(model5, cluster = "id")

ggcoefstats(model5,
            exclude.intercept = TRUE,
            exclude = "x", 
            stats.labels = FALSE)


modelsummary(model5, 
             output = "html",  # 或者 "gt", "html", "latex" 等
             statistic = "std.error",  
             stars = c('*' = 0.1, '**' = 0.05, '***' = 0.01), 
             conf.int = TRUE)  # 包含置信区间
```

#### (6) 常见估计方式
```
##### 其他常见范式 #####

# ppml
model_poisson <- glm(D ~ x + factor(id) + factor(year), family = poisson, data = df)
summary(model_poisson)

# probit
probit_model <- glm(D ~ x + factor(id) + factor(year), family = binomial(link = "probit"), data = df)
summary(probit_model)

# logit
logit_model <- glm(D ~ x + factor(id) + factor(year), family = binomial(link = "logit"), data = df)
summary(logit_model)

# tobit
library(censReg)
model_tobit <- censReg(y ~ x + factor(id) + factor(year), data = df)
summary(model_tobit)

# ivreg
library(AER)
model_ivreg <- ivreg(y ~ x | z + factor(id) + factor(year), data = df)
summary(model_ivreg)
```













