---
layout: post
title: "文献导读：Minimum Wage and Individual Worker Productivity"
date:   2024-4-20
tags: [文献导读]
comments: true
author: mengke25
---

<head>
    <script src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML" type="text/javascript"></script>
    <script type="text/x-mathjax-config">
        MathJax.Hub.Config({
            tex2jax: {
            skipTags: ['script', 'noscript', 'style', 'textarea', 'pre'],
            inlineMath: [['$','$']]
            }
        });
    </script>
</head>



#### Minimum Wage and Individual Worker Productivity : Evidence from a Large US Retailer

#### 一、内容概要

* 最低工资 ↑ → 工人生产力 ↑

* 最低工资 ↑ → 工人被解雇的频率 ↓

* 最低工资 ↑ → 利润 ↓

* 最低工资 ↑ → 工人福利 ↑

#### 二、数据及实证策略

##### （一）数据

对象是美国大型零售商销售人员，这家零售商雇佣了美国10%以上百货公司的员工，并在50个州经营2000多家商店。员工的工作内容为：问候客户、解释说服客户、追加销售、交叉销售；作者将工人的工资数据与2012.02~2015.06的月度人事数据进行匹配，清洗出40000个根据绩效获得报酬的销售人员；

![image](https://mengke25.github.io/images/LR0421m_wage/table1.png)

###### 1.销售人员和工资数据

* 平均工作时间：107小时

* 平均销售额：每小时2件

* 平均工资：1361美元/月
* 不变工资：6.12美元/小时
* 可变工资：5.95美元/小时
* 平均佣金率（可变薪酬除以销售额）：3.5%
* 平均在岗时间：49个月

###### 2.商店和就业数据

* 平均员工数：16.64名
* 平均人员流动率：3.4%（终止率4.8%；招聘率2.1%）
* 主管与员工的比率：衡量监控覆盖度
* 主管工人比与营业额、利润、Low人群的比例无关

###### 3.最低工资的变化

* 2012.02~2015.06
* 70个变化（49个州层面；21个县市层面）
* 平均最低工资：7.87 $/hour
* Δ平均最低工资：0.54 $/hour
* min wage adjustment：指的是不足最低工资需要雇主补充的部分，通常为0，均值为0.23$
* [result]   MinW ↑ 1$  →   min wage adjustment ↑ 0.25美元/小时
* [result]   MinW ↑ 1$  →   每小时可变薪酬 ↑ 0.44美元
* [result]   MinW ↑ 1$  →   每小时平均总工资 ↑ 0.65美元
* 最低工资的变化不会改变基本费率和佣金率

###### 4.工人的种类(t期)

* low：t-1时刻被支付最低工资（占比4%）
* medium：t-1时刻被支付薪水最低的71%
* high：t-1时刻被支付薪水最高的25%
* low月收入=最低工资的频率为20.5%
* high月收入=最低工资的频率为0.7%

##### （二）识别策略

###### 1.样本选择和边界不连续设计

* 最低工资增加的一侧：Treat
* 最低工资不增加的一侧：Control
* 200多家商店；10000多名销售人员

###### 2.实证策略

$$
Y_{ijpt}=\alpha+\beta MinW_{jt}+X_{it}·\zeta+\eta Z_{jt}+\delta_i+\phi_{pt}+\epsilon_{ijpt}
$$

$$
Y_{ijpt}=\alpha+\beta_1 MinW_{jt}+\beta_2 MediumType_{ijt}+ \beta_3 HighType_{ijt}+ \\\\\\ 
\beta_4 MinW_{jt}·MediumType_{ijt}+\beta_5 MinW_{jt}·HighType_{ijt}+X_{it}·\zeta+ \eta Z_{jt}+\delta_i+\phi_{pt}+\epsilon_{ijpt}
$$


* $ i $代表员工；$j$代表商店；$p$代表县对；$t$代表时间（月）

#### 三、实证结果——最低工资&员工效率

##### （一）核心发现

![image](https://mengke25.github.io/images/LR0421m_wage/fig1.png)


![image](https://mengke25.github.io/images/LR0421m_wage/table4.png)


![image](https://mengke25.github.io/images/LR0421m_wage/tableA1.png)
* 最低工资每增加1美元，员工绩效会提高0.094（4.5%）

##### （二）动态效应

$$
Y_{ijpt}=\alpha+\sum_{m=-2}^2 \beta_{1}^{3m} MinW_{j,t-3m} + \sum_{m=-2}^2 \beta_{2}^{3m} MinW_{j,t-3m} ·MediumType_{ijt} +\\\\\\
\sum_{m=-2}^2 \beta_{3}^{3m} MinW_{j,t-3m} ·HighType_{ijt}+\gamma_1MediumType_{ijt}+\\\\\\ 
\gamma_2HighType_{ijt}+X_{it}·\zeta+\eta Z_{jt}+\delta_i+\phi_{pt}+\epsilon_{ijpt}
$$


* 滞后效应（3m>0）
* 预期效应（3m<0）：没有趋势

![image](https://mengke25.github.io/images/LR0421m_wage/tableA2.png)

##### （三）稳健性

###### 1.pre-trend

![image](https://mengke25.github.io/images/LR0421m_wage/fig2.png)
###### 2.工人跨境

* 包括了工人固定效应，比较了员工 在两个“最低工资”下的表现
* 最低工资的增长与新员工家庭到工作地点的距离没有相关性

![image](https://mengke25.github.io/images/LR0421m_wage/tableE2.png)

###### 3.工人的样本选择问题

[explain] 最低工资增加后，保留工人的构成发生变化  →  样本选择问题

* 平衡面板数据交乘项
![image](https://mengke25.github.io/images/LR0421m_wage/tableE3.png)
* 使用平衡面板replicate前面的baseline
![image](https://mengke25.github.io/images/LR0421m_wage/tableE4.png)


###### 4.员工Type的划分

* baseline中，在区分员工type时，不能保证不同的“县对”中三类type员工的percentile一样

* 根据前三个月的平均工资（而不是前一个月）划分不同type的员工


![image](https://mengke25.github.io/images/LR0421m_wage/tableE5.png)

* 将区分High Medium Low的阈值改为工资的120%、140%、160%


![image](https://mengke25.github.io/images/LR0421m_wage/tableE6.png)

###### 5.可替代的研究设计

* border-discontinuity损失了大量样本。一个可替代性的方案：放松边界条件，使用整体商店样本，但引入更多控制变量

![image](https://mengke25.github.io/images/LR0421m_wage/tableE7.png)

###### 6.最低工资的州间影响

* 跨州的变化可能会受到其他州级政策变化的影响——将分析仅限于州级工资变化，或仅限于县市层面工资变化

![image](https://mengke25.github.io/images/LR0421m_wage/fig3B.png)
![image](https://mengke25.github.io/images/LR0421m_wage/fig3C.png)
![image](https://mengke25.github.io/images/LR0421m_wage/tableE8.png)
###### 7.边境商店位置的定义

* baseline中，使用商店所在县的中心距离边界的位置衡量“商店是否属于边界”，现在直接使用商店的具体位置

![image](https://mengke25.github.io/images/LR0421m_wage/fig3D.png)
![image](https://mengke25.github.io/images/LR0421m_wage/fig3E.png)
![image](https://mengke25.github.io/images/LR0421m_wage/tableE9.png)
###### 8.不堆叠观察(Unstacking)


![image](https://mengke25.github.io/images/LR0421m_wage/tableE10.png)

![image](https://mengke25.github.io/images/LR0421m_wage/fig3F.png)
###### 9.控制变量

* 控制部门时间趋势

![image](https://mengke25.github.io/images/LR0421m_wage/tableE11.png)

![image](https://mengke25.github.io/images/LR0421m_wage/tableE12.png)


#### 四、监管异质性揭示的模型双重性质

* 更强的监管 → 个人表现提升
* 在不受监管的员工中 → Low的努力↑    High的努力↓ （pay for performance占主导地位）
* 在高度监管的员工中 → Low、Medium、High的努力↑ （efficiency wage占主导地位）

* 监控覆盖率：商店主管与员工的比率，底部4分位(低)，其他情况(高)

监控覆盖率低或者高时，最低工资对工人绩效的影响

![image](https://mengke25.github.io/images/LR0421m_wage/table5.png)

![image](https://mengke25.github.io/images/LR0421m_wage/fig4.png)



* 前文假设覆盖率m对最低工资M不是内生的，如果m是内生的，m可能会随M的增加而增加（理论推导）

$$
Y_{jpt} = \alpha + \beta MinW_{jt}+ \eta Z_{jt}+\delta_j+\phi_{pt}+\epsilon_{jpt}
$$

![image](https://mengke25.github.io/images/LR0421m_wage/tableA4.png)

#### 五、最低工资在商店层面的效应

##### （一）最低工资对营业额的影响

* 最低工资增加 解雇率应当降低（受到高度监管的员工付出更多努力），意味着更少的招聘，因此【工人流动率更低，工人在岗时间更长】
* Low员工在商店中的占比本身很小，因此最低工资对商店的平均影响很小

$$
Y_{jpt} = \alpha + \beta MinW_{jt}+\gamma\% LowType_{j,t}+\eta Z_{jt}+\delta_j+\phi_{pt}+\epsilon_{jpt}
$$

![image](https://mengke25.github.io/images/LR0421m_wage/fig5.png)
* 最低工资的提高会减少商店level的解雇、招聘、营业额
* 提高LowType员工的任期

![image](https://mengke25.github.io/images/LR0421m_wage/table6.png)

![image](https://mengke25.github.io/images/LR0421m_wage/fig6.png)

![image](https://mengke25.github.io/images/LR0421m_wage/table7.png)
* 最低工资增加后，LowType员工被解雇的可能性显著降低19%

##### （二）最低工资对就业的影响

* 最低工资对就业没有显著影响
* LowType的比例未受到显著影响

##### （三）最低工资对产出和利润的影响

###### 1.Output

* 低收入者更努力，低收入者的留存率更高（增加的不成比例）；因此对产出利润的影响效应模棱两可
* 提高最低工资能够提升商店层面的生产力

![image](https://mengke25.github.io/images/LR0421m_wage/table8.png)
###### 2.Profits

* 最低工资对利润的影响是负面的，最低工资增加1美元，每小时利润较样本均值减少16%

#### 六、核心结果的解释

##### （一）需求渠道

* 最低工资增长的同时，需求业增长。可以解释个人生产力的增长
* 商店需求高，HighType的销售额比LowType增长跟多

![image](https://mengke25.github.io/images/LR0421m_wage/figF3.png)
![image](https://mengke25.github.io/images/LR0421m_wage/tableF3.png)
* HighType生产力对最低工资引起的Demand shock更为敏感

![image](https://mengke25.github.io/images/LR0421m_wage/tableF4.png)
##### （二）组织调整渠道

* 组织调整：把员工分配到“销售更好”的部门；将兼职状态改为全职状态；减少小时数增加工作效率；给予假期和看病福利

![image](https://mengke25.github.io/images/LR0421m_wage/fig7.png)
![image](https://mengke25.github.io/images/LR0421m_wage/tableF6.png)
* 销售额的增长源于消费价格的上涨？

![image](https://mengke25.github.io/images/LR0421m_wage/tableF7.png)


#### 七、结论

我们评估了 40,000 多名销售人员的最低工资对工人生产力的影响，这些销售人员的工资部分取决于绩效，他们受雇于一家经营 2,000 多家商店的美国大型零售商。

 使用边界不连续性研究设计，我们记录了工人在提高最低工资后变得更有效率，并且这种效应在工资通常由最低工资支持的工人中更强。 然而，当对工人的监控不那么强烈时，这些影响就会逆转。 我们使用具有两种工人激励来源的理论模型来组织这些发现：效率工资渠道和绩效工资渠道。 从这个模型的角度来看，我们的实证结果表明，效率工资渠道对生产率的提高负有责任。 有趣的是，尽管工资被允许取决于绩效（尽管不取决于努力），但效率工资仍起着重要作用。
