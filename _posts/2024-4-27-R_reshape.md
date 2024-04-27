---
layout: post
title: "【R语言】reshape in dplyr"
date:   2024-4-27
tags: [code,R]
comments: true
author: mengke25
---

dplyr 是一个在 R 语言中非常流行的数据处理包，它提供了一套简洁而直观的函数，用于进行数据操作和转换。dplyr 的设计目标是使数据操作变得更加易读、直观和高效。
今天我来分享reshape数据相关的两个函数:`pivot_longer`和`pivot_wider`


<!-- more -->


#### pivot_longer

##### 1.一个示例

在 dplyr 中，pivot_longer 函数用于将数据从宽格式变为长格式。以下是一个简单的例子，演示如何使用 pivot_longer：

假设你有一个数据框（data frame）如下：


```R
library(dplyr)

# 创建示例数据框
data <- data.frame(
  ID = c(1, 2, 3),
  Name = c("Alice", "Bob", "Charlie"),
  Math_Score_Week1 = c(80, 90, 75),
  Math_Score_Week2 = c(85, 88, 92),
  English_Score_Week1 = c(70, 85, 80),
  English_Score_Week2 = c(75, 78, 88)
)

# 查看原始数据
print(data)

```

      ID    Name      Math_Score_Week1    Math_Score_Week2   English_Score_Week1   English_Score_Week2
    1  1   Alice               80               85                  70                  1                  75
    2  2     Bob               90               88                  85                  2                  78
    3  3 Charlie               75               92                  80                  3                  88


上述数据框中，Math_Score_Week1 和 Math_Score_Week2 是两个不同周的数学成绩，English_Score_Week1 和 English_Score_Week2 是两个不同周的英语成绩。你希望将这些数据从宽格式转换为长格式。

使用 pivot_longer 可以实现这一目标：


```R
data_long <- data %>%
  pivot_longer(
    cols = starts_with("Math_Score") | starts_with("English_Score"),
    names_to = c(".value", "Week"),  # 指定列名的拆分规则
    names_sep = "_"
  )

# 查看转换后的数据
print(data_long)

```

1 Alice   Score    80      70
1 Alice   Score    85      75
2 Bob     Score    90      85
2 Bob     Score    88      78
3 Charlie Score    75      80
3 Charlie Score    92      88


这里，pivot_longer 的参数包括：

cols：指定要进行长格式转换的列。
names_to：用于指定新列的名称。在这个例子中，我们使用 .value 来表示数学和英语成绩的部分，同时指定了一个额外的 Week 列。
names_sep：指定用于分割列名的字符，在这里是下划线 "_”。
这样，原始数据的宽格式就被转换成了长格式，每个学生每周的数学和英语成绩都被整理到了新的行中。



##### 2.option的解释

1. **`names_prefix`**：
   - **描述：** `names_prefix` 是一个正则表达式，用于从每个变量名称的开头删除匹配的文本。
   - **用法：** 如果你的变量名称有一个共同的前缀，而你希望在转换过程中去掉这个前缀，可以使用 `names_prefix`。
2. **`names_pattern`**：
   - **描述：** `names_pattern` 是一个正则表达式，用于从变量名称中提取匹配组。
   - **用法：** 当 `names_to` 包含多个值时，`names_pattern` 可以帮助你指定如何从变量名称中提取信息，以创建新的列。例如，在你的数据中，如果有一列变量名是类似 "new_diagnosis_m014" 的话，你可以使用 `names_pattern = "new_?(.*)_(.)(.*)" `来提取诊断、性别和年龄信息。
3. **`names_ptypes`** 和 **`values_ptypes`**：
   - **描述：** 这两个参数分别是列名和值的原型（prototype），它们用于指定新创建的列和值的预期类型。
   - **用法：** 如果你想确认新创建的列的类型是否符合预期，可以使用这两个参数。例如，如果你期望新的列是整数类型，可以使用 `names_ptypes = list(week = integer())`。
4. **`names_transform`** 和 **`values_transform`**：
   - **描述：** 这两个参数是列名和值的转换函数，用于在创建新列和值时进行类型转换。
   - **用法：** 如果你需要对特定列进行类型转换，可以使用这两个参数。例如，如果你想将某个字符变量转换为整数，可以使用 `names_transform = list(week = as.integer)`。
5. **`names_repair`**：
   - **描述：** `names_repair` 定义了输出具有无效列名时的行为。
   - **用法：** 默认值是 "check_unique"，如果输出的列名重复，会报错。可以设置为 "minimal" 允许输出中有重复列，或者设置为 "unique" 通过添加数字后缀来去重。
6. **`names_to`**：
   - **描述：** `names_to` 是一个字符向量，用于指定从列名中提取信息创建的新列的名称。
   - **用法：** 具体用法取决于 `names_to` 的长度。如果长度为 1，将创建一个包含指定列名的新列。如果长度大于 1，则需要使用 `names_sep` 或 `names_pattern` 指定如何拆分列名。

##### 3.**`names_prefix`**：实例
假设你有以下数据框，其中的列名以 "X_" 开头，而你想要在转换时去掉这个前缀：
```{R}
# 假设有以下数据框
data <- data.frame(
  ID = c(1, 2, 3),
  Name = c("Alice", "Bob", "Charlie"),
  X_Math_Score_Week1 = c(80, 90, 75),
  X_Math_Score_Week2 = c(85, 88, 92)
)
```
使用 pivot_longer 函数，并结合 names_prefix 参数，可以进行如下转换：

```{R}
library(dplyr)

# 使用 names_prefix 删除 X_
data_long <- data %>%
  pivot_longer(
    cols = starts_with("X_"),
    names_to = "Math_Score_Week",
    names_prefix = "X_",
    values_to = "Math_Score"
  )

# 查看转换后的数据
print(data_long)
```
这样，names_prefix = "X_" 就会在转换过程中去掉列名的 "X_" 前缀，得到如下的结果：
```
# A tibble: 6 × 4
     ID Name    Math_Score_Week Math_Score
  <dbl> <chr>   <chr>           <dbl>
1     1 Alice   Week1              80
2     1 Alice   Week2              85
3     2 Bob     Week1              90
4     2 Bob     Week2              88
5     3 Charlie Week1              75
6     3 Charlie Week2              92

```


##### 4.**`names_pattern`**：实例
假设你有以下数据框，其中的列名包含有关个体诊断、性别和年龄的信息，而你想要在转换时提取这些信息：
```{R}
# 假设有以下数据框
data <- data.frame(
  ID = c(1, 2, 3),
  Name = c("Alice", "Bob", "Charlie"),
  new_diagnosis_m014 = c(10, 15, 8),
  new_diagnosis_f014 = c(5, 8, 12)
)
```
使用 pivot_longer 函数，并结合 names_pattern 参数，可以进行如下转换：

```{R}
library(dplyr)

# 使用 names_pattern 提取诊断、性别和年龄信息
data_long <- data %>%
  pivot_longer(
    cols = starts_with("new_"),
    names_to = c("diagnosis", "gender", "age"),
    names_pattern = "new_?(.*)_(.)(.*)",
    values_to = "count"
  )

# 查看转换后的数据
print(data_long)
```
这样，names_pattern = "new_?(.*)_(.)(.*)" 就会在转换过程中提取诊断、性别和年龄信息，得到如下的结果：
```
# A tibble: 6 × 5
     ID Name     diagnosis gender   age   count
  <dbl> <chr>    <chr>     <chr>    <chr> <dbl>
1     1 Alice    diagnosis m        014      10
2     1 Alice    diagnosis f        014       5
3     2 Bob      diagnosis m        014      15
4     2 Bob      diagnosis f        014       8
5     3 Charlie  diagnosis m        014       8
6     3 Charlie  diagnosis f        014      12
```


#### pivot_wider

##### 1.**`pivot_wider` 的用法：**

`pivot_wider` 用于将数据从长格式变为宽格式，增加列数，减少行数。它将某些列的值转换为新的列，并使用这些值填充新列。以下是一些关键参数：

- **`names_from`：** 用于指定要从中获取新列名的列。可以是一个或多个列。
- **`values_from`：** 用于指定要填充新列的值的来源列。可以是一个或多个列。
- **`names_prefix`：** 可选，添加到每个变量名的前缀字符串。
- **`names_sep`：** 可选，用于将 `names_from` 或 `values_from` 中的多个变量值连接成单个字符串，作为新列的名称。
- **`names_glue`：** 可选，替代 `names_sep` 和 `names_prefix`，可以使用 `names_from` 列（和特殊的 `.value`）创建自定义列名。
- **`names_vary`：** 可选，用于控制 `names_from` 值相对于 `values_from` 列名的组合顺序，有 "fastest" 和 "slowest" 两个选项。
- **`names_expand`：** 可选，是否在进行变换之前通过 `expand()` 对 `names_from` 列中的值进行扩展，生成更多的列。
- **`names_sort`：** 可选，是否对列名进行排序。
- **`names_repair`：** 可选，用于处理输出中无效列名的情况，默认为 "check_unique"。
- **`values_fill`：** 可选，当遇到缺失值时用于填充的值。
- **`values_fn`：** 可选，用于在输出中每个单元格的值上应用的函数。

##### 2.**`pivot_wider` 的实例：**

假设有以下数据框，其中包含个体的一些观测值：

```R
# 假设有以下数据框
data_long <- data.frame(
  ID = c(1, 2, 3, 1, 2, 3),
  Variable = c("A", "A", "A", "B", "B", "B"),
  Value = c(10, 15, 20, 30, 25, 35)
)
```
![fig3](https://mengke25.github.io/images/R_reshape0427/fig3.png)

使用 `pivot_wider` 将数据从长格式转换为宽格式，以创建新的列：

```{R}
library(dplyr)

# 使用 pivot_wider 进行转换
data_wide <- data_long %>%
  pivot_wider(
    names_from = Variable,
    values_from = Value,
    names_prefix = "Var"
  )

# 查看转换后的数据
print(data_wide)
```

这将生成如下的宽格式数据：

```bat
# A tibble: 3 × 3
     ID VarA  VarB
  <dbl> <dbl> <dbl>
1     1    10    30
2     2    15    25
3     3    20    35
```

在这个例子中，`names_from` 指定要用于创建新列名的列，`values_from` 指定要填充新列的值的来源列，`names_prefix` 添加了新列名的前缀。这样，每个不同的变量（A、B）都被转换为一个新的列。


##### 3.**`pivot_wider` 实例2——对标stata：**

对于这样一个数据，分别用stata和R去处理，代码应当是什么样的呢？
![处理前](https://mengke25.github.io/images/R_reshape0427/fig1.png)
```{stata}
reshape wide value, i(year)  j(treat)
```
// `value`是被shape的变量
// `i(year)`是shape后的unit
// `j(treat)`是shape后的尾缀


```{R}
merged_temp <- merged_temp %>% 
  filter(!is.na(treat)) %>%
  pivot_wider(names_from = treat,
              values_from = value,
              names_prefix = "var")
```
` values_from = value`，是被shape的变量
`names_from = treat`，是shape后的尾缀
`names_prefix = "var"`，是shape后的前缀

![处理后](https://mengke25.github.io/images/R_reshape0427/fig2.png)


