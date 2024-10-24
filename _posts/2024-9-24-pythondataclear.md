---
layout: post
title: "【python】python数据处理命令（stata等价命令）"
date:   2024-9-24
tags: [code,python]
comments: true
author: mengke25
---

一个对照表，帮助熟悉快速上手pandas、numpy


<!-- more -->

#### 1.一般运算

* `加法`
```python
# gen x = y + z
df['x'] = df['y'] + df['z']
```

* `减法`
```python
# gen x = y - 1
df['x'] = df['y'] - 1
```

* `乘法`
```python
# gen var = x * y
df['var'] = df['x'] * df['y']
```

* `除法`
```python
# gen x = z / y
df['x'] = df['z'] / df['y']
```

* `取对数`
```python
# gen logx = log(x)
df['logx'] = np.log(df['x'])
```

* `开根号`
```python
# gen z = sqrt(y)
df['z'] = np.sqrt(df['y'])
```

* `取平方`
```python 
# gen x2 = x^2
df['x2'] = df['x'] ** 2
```

* `y 列对 3 取模`
```python
# gen x = mod(y,3)
df['x'] = df['y'] % 3
```

* `向上或向下取整`

```python
# gen x = floor(y)
df['x'] = np.floor(df['y'])
```

```python
# gen x = ceil(y)
df['x'] = np.ceil(df['y'])
```




#### 2.对列进行处理

* `生成新变量`

```python
# gen x = 1 if (r2 == 0 | r2 == 1)
condition = (df['r2'] == 0) | (df['r2'] == 1)
df.loc[condition, 'x'] = 1

# gen childage = age if r2 == 2
df.loc[df['r2'] == 2 , 'childage' ] = df['age']
```

* `删除变量（列）`

```python
# drop r7_1
df = df.drop(['r7_1'], axis = 1)
df = df.drop(['mx','x'],axis = 1)
```

#### 3.对行进行处理

* `删除行`

```python
## 有条件的
# drop if childage < 18 | childage > 30
condition = (df['childage'] < 18) | (df['childage'] > 30)
df = df.drop(df[condition].index)
df = df.drop(df[(df['childage'] < 18) | (df['childage'] > 30)].index, axis=0)   # 等价

## 删除缺失值
df = df.dropna(subset= ['mx'])
```

* `保留行`

```python
# keep if r2 <= 2
df = df[df['r2'] <= 2]
```

* `替换行`与`生成新变量`类似

```python 
# replace hedu=2 if if childage < 18 | childage > 30
condition = (df['childage'] < 18) | (df['childage'] > 30)
df.loc[condition, 'hedu'] = 2

# replace hedu=0 if hedu==.   // 把缺失值替换为0
df['hedu'] = df['hedu'].fillna(0)
```




#### 4.分组计算
```python
# bysort h1: egen mx=mean(x)
df['mx'] = df.groupby('h1')['x'].transform('mean')
df['mx'].value_counts()

# bysort h1 : egen htype = total(x)
df['htype'] = df.groupby('h1')['x'].transform('sum')

# bysort h1: egen htype=count(id)
df['htype'] = df.groupby('h1')['id'].transform('count')
```
常见 transform函数
* sum：对每个分组计算总和
* mean：对每个分组计算均值
* count：对每个分组计算非空值的数量
* size：对每个分组计算总行数（包括空值）
* min：对每个分组计算最小值
* max：对每个分组计算最大值
* std：对每个分组计算标准差
* var：对每个分组计算方差
* first：返回每个分组的第一个值
* last：返回每个分组的最后一个值
* median：对每个分组计算中位数

还可以传递自定义的函数到 transform() 中，例如使用 lambda 表达式：

```python
df['double_x'] = df.groupby('h1')['x'].transform(lambda x: x * 2)
```




#### 5.去重与重整

* `去重（duplicates）`

```python
# duplicates drop id year,force 
df.drop_duplicates(subset=['id', 'year'], keep=False, inplace=True)
```

* `重整（reshape）`

长变宽
```python
# reshape wide v, i(id) j(year)
df_wide = df.pivot(index='id', columns='year', values='v').reset_index()
df_wide.columns = ['id'] + [f'v_{year}' for year in df_wide.columns[1:]]
```


宽变长
```python
# reshape long v, i(id) j(year)
df_long = pd.melt(df_wide, id_vars=['id'], var_name='year', value_name='v')
df_long['year'] = df_long['year'].str.extract('(\d+)').astype(int)  # 提取年份
```




#### 6.匹配与合并

* `匹配（merge）`

```python
# merge m:1 id year using abc.dta
df_using = pd.read_excel("abc.xlsx")
df_merged = pd.merge(df, df_using, on=['id', 'year'], how='left')
```

``` python
# how='right'：相当于 merge 1:m，如果你想保留 "using" 文件中的所有行。
# how='inner'：只保留两个 DataFrame 中都有匹配键的行，相当于 Stata 中的 merge 1:1。
# how='outer'：保留两个 DataFrame 中的所有行，相当于 merge 中的 full join。
```

* `合并（append）`



#### 7.循环









