---
layout: post
title: "【python】调用大模型接口批量处理文本"
date:   2024-8-1
tags: [code, python]
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


用于在excel中调用chatGPT、Claude等AI，帮忙进行自然语言处理，并输出相应的内容。它是一个专门做dirty work的RA

<!-- more -->


author:  mengke25 <br />
个人主页：[personal website](https://mengke25.github.io); <br />
GitHub主页：[github](https://github.com/mengke25); <br />
CSDN主页：[CSDN](https://blog.csdn.net/weixin_43168119?spm=1000.2115.3001.5343); <br />


#### 0. 项目url
[项目仓库](https://github.com/mengke25/proj_textOpenAI)

#### 1. project简介

##### （1）概况

用于在excel中调用chatGPT、Claude等AI，帮忙进行自然语言处理，并输出相应的内容。它是一个专门做dirty work的RA

##### （2）主要功能

我们把自然语言放到excel的某一列，比如是一段文本
我们可以在promot中说‘请帮我提炼关键词’，‘请帮我总结’，‘请帮我翻译’，‘请判断是积极还是消极’，‘请帮我做相应的处理’
AI会根据我们输入的文本，给出相应的处理结果，并输出到excel的某一列

（为了提高运行速度，我将每个`xlsx`拆成了10个，同时运行。）

##### （3）应用场景

1. 文本分析：对文本进行分析，提取关键词，判断情感倾向等
2. 文本处理：对文本进行清洗，去除无用信息，提取关键信息等
3. 文本翻译：将文本翻译成另一种语言
4. 文本分类：对文本进行分类，比如新闻、评论、微博等
5. 文本生成：根据输入文本，生成相应的文本
6. 文本推荐：根据用户的兴趣，推荐相关的文本
7. 文本摘要：对文本进行摘要，生成简短的文本
8. 文本风格迁移：将文本风格迁移到另一种风格
9. 文献综述撰写：根据文献，生成综述

<br /> <br />

#### 2. project路径解释

* `config`文件夹下的`config.json`为配置文件，用于输入prompt等
* `file`文件夹下待读取`.xlsx`是原始文件
* `orig_file`是我用于储存待读文本的文件夹，不用管
* `output`文件夹即最终输出结果所在的文件夹
* `script`是用于储存python脚本的文件夹

<br /> <br />

#### 3. 使用方法（程序运行方法）



* 第一步，修改`config`路径下的`json`配置文件，prompt改成自己的需求，其中：   
  * `root_path`： 项目路径，用于定位文件
  * `apikey`：是openai的api key，需要自己申请
  * `apiurl`：是openai的api url，需要自己申请
  * `input_col`：是输入文本所在的列，也即想输入给AI的列
  * `output_col`：是输出结果所在的列，也即想让AI输出在excel的哪一列
  * `prompt_template`：是AI的提示模板，可以自己修改
  * `system_message`：是系统提示语，可以自己修改

***一个示例：***

```json
{
    "global": {
        "root_path": "D:\\project\\July2024_textOpenAI",
        "apikey": "sk-gG0j***************f9e75",
        "apiurl": "https://api.gptsapi.net",
        "input_col": 5,
        "output_col": 7,
        "prompt_template": "请根据我凝练的1、2、3等小点，提炼其中最有代表性的关键词2至3个即可（每个关键词不超过8个中文字），不要提及地方名称或“自贸试验区”这种通用的词，每个关键词用分号“；”相连",
        "system_message": "你是一个帮助提取治理举措中关键词的助手"
    }
}
```


<br /> <br />


* 第二步，修改`main.py`中的参数，主要是修改想要输入的xlsx文件

```python
# 定义输入文件
chat_file = r'D:\project\July2024_textOpenAI\orig_file\targetfile.xlsx'
```

<br /> <br />

* 第三步，运行`main.py`，等运行完，去`output`文件夹将`'****_AI.xlsx'`保存到本地




