# -*- coding: utf-8 -*-
"""
guosen_macro_bond.py
====================
宏观看债数据库 - 一站式债券数据提取工具

用法示例：
    from guosen_macro_bond import data_fetch

    # 1. 基础提取
    df = data_fetch('y10', '2026-01-01', '2026-05-28')

    # 2. 频率转换（月度，取月末值）
    df = data_fetch('y10', '2020-01-01', '2026-05-28', freq='M')

    # 3. 计算环比
    df = data_fetch('y10', '2020-01-01', '2026-05-28', transform='mom')

    # 4. 计算同比
    df = data_fetch('y10', '2020-01-01', '2026-05-28', transform='yoy')

    # 5. 取对数
    df = data_fetch('y10', '2020-01-01', '2026-05-28', transform='log')
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
from pathlib import Path
import requests


# ── 期限配置 ────────────────────────────────────────────────
TENORS = {
    'm1':  {'label': '1个月',  'code': 'M1004677'},
    'm2':  {'label': '2个月',  'code': 'M1004829'},
    'm3':  {'label': '3个月',  'code': 'S0059741'},
    'm6':  {'label': '6个月',  'code': 'S0059742'},
    'm9':  {'label': '9个月',  'code': 'S0059743'},
    'y1':  {'label': '1年',    'code': 'S0059744'},
    'y2':  {'label': '2年',    'code': 'S0059745'},
    'y3':  {'label': '3年',    'code': 'S0059746'},
    'y4':  {'label': '4年',    'code': 'M0057946'},
    'y5':  {'label': '5年',    'code': 'S0059747'},
    'y6':  {'label': '6年',    'code': 'M0057947'},
    'y7':  {'label': '7年',    'code': 'S0059748'},
    'y8':  {'label': '8年',    'code': 'M1000165'},
    'y9':  {'label': '9年',    'code': 'M1004678'},
    'y10': {'label': '10年',   'code': 'S0059749'},
    'y15': {'label': '15年',   'code': 'S0059750'},
    'y20': {'label': '20年',   'code': 'S0059751'},
    'y30': {'label': '30年',   'code': 'S0059752'}
}

# 频率映射
FREQ_MAP = {
    'D': '日度',
    'W': '周度',
    'ME': '月度',
    'QE': '季度',
    'YE': '年度'
}

# 变换方式映射
TRANSFORM_MAP = {
    'yoy': '同比',
    'mom': '环比',
    'log': '对数',
    'diff': '差分',
    'diff_yoy': '同比差分'
}


# ── 核心函数 ────────────────────────────────────────────────
def data_fetch(
    tenor='y10',
    start=None,
    end=None,
    fill_method='forward',
    freq=None,
    agg_method='last',
    transform=None,
    source='online'
):
    """
    一站式债券数据提取工具

    参数
    ----
    tenor : str 或 list，默认 'y10'
        期限代码，如 'y10' 或 ['y1', 'y5', 'y10']
    start : str，可选
        起始日期，格式 'YYYY-MM-DD'
    end : str，可选
        截止日期，格式 'YYYY-MM-DD'
    fill_method : str，默认 'forward'
        缺失值填充方式：
        - 'forward': 向前填充（使用下一交易日数据）
        - 'backward': 向后填充
        - 'linear': 线性插值
        - 'none': 不填充
    freq : str，可选
        频率转换：
        - 'D': 日度
        - 'W': 周度
        - 'M': 月度
        - 'Q': 季度
        - 'Y': 年度
        - None: 保持原始频率
    agg_method : str，默认 'last'
        频率聚合方式：
        - 'last': 最后一条
        - 'first': 第一条
        - 'mean': 均值
        - 'median': 中位数
        - 'sum': 求和
        - 'max': 最大值
        - 'min': 最小值
    transform : str，可选
        数据变换：
        - 'yoy': 同比增长率
        - 'mom': 环比增长率
        - 'log': 对数
        - 'diff': 一阶差分
        - 'diff_yoy': 同比差分
        - None: 不变换
    source : str，默认 'online'
        数据源：
        - 'local': 本地JSON文件
        - 'online': 在线API (mengke25.github.io)

    返回
    ----
    pd.DataFrame

    示例
    ----
    >>> # 基础提取
    >>> df = data_fetch('y10', '2026-01-01', '2026-05-28')

    >>> # 月度数据（取月末值）
    >>> df = data_fetch('y10', '2020-01-01', '2026-05-28', freq='M')

    >>> # 计算环比
    >>> df = data_fetch('y10', '2020-01-01', '2026-05-28', transform='mom')

    >>> # 在线获取
    >>> df = data_fetch('y10', source='online')
    """
    # 1. 加载原始数据
    df = _load_raw_data(tenor, start, end, source)

    # 2. 填充缺失值
    if fill_method != 'none':
        df = _fill_missing(df, tenor if isinstance(tenor, list) else [tenor], fill_method)

    # 3. 频率转换
    if freq:
        df = _resample_frequency(df, tenor if isinstance(tenor, list) else [tenor], freq, agg_method)

    # 4. 数据变换
    if transform:
        df = _transform_data(df, tenor if isinstance(tenor, list) else [tenor], transform)

    return df


def list_tenors():
    """列出所有可用期限"""
    print("可用期限：")
    print(f"  {'代码':<6}  {'说明':<8}  {'Wind代码'}")
    print("  " + "-" * 40)
    for code, info in TENORS.items():
        print(f"  {code:<6}  {info['label']:<8}  {info['code']}")


def list_transforms():
    """列出所有可用变换"""
    print("可用变换：")
    print(f"  {'代码':<12}  {'说明'}")
    print("  " + "-" * 30)
    for code, desc in TRANSFORM_MAP.items():
        print(f"  {code:<12}  {desc}")


def list_freqs():
    """列出所有可用频率"""
    print("可用频率：")
    print(f"  {'代码':<6}  {'说明'}")
    print("  " + "-" * 20)
    for code, desc in FREQ_MAP.items():
        print(f"  {code:<6}  {desc}")


def get_meta(source='online'):
    """获取数据集元信息"""
    if source == 'online':
        url = "https://mengke25.github.io/guosen/bond_yield.json"
        resp = requests.get(url, timeout=10)
        data = resp.json()
    else:
        json_file = Path(__file__).parent / 'wind_wsd_data/bond_yield.json'
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    return data.get('meta', {})


# ── 内部辅助函数 ────────────────────────────────────────────────
def _load_raw_data(tenor, start, end, source):
    """加载原始数据"""
    # 处理期限参数
    if isinstance(tenor, str):
        tenor = [tenor]

    # 验证期限
    invalid = [t for t in tenor if t not in TENORS]
    if invalid:
        raise ValueError(f"无效期限: {invalid}。可用: {list(TENORS.keys())}")

    # 加载数据
    if source == 'online':
        url = "https://mengke25.github.io/guosen/bond_yield.json"
        resp = requests.get(url, timeout=10)
        data = resp.json()
    else:
        json_file = Path(__file__).parent / 'wind_wsd_data/bond_yield.json'
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

    # 转换为DataFrame
    df = pd.DataFrame(data['data'])
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date').reset_index(drop=True)

    # 筛选列
    df = df[['date'] + tenor]

    # 筛选日期
    if start:
        df = df[df['date'] >= pd.to_datetime(start)]
    if end:
        df = df[df['date'] <= pd.to_datetime(end)]

    return df


def _fill_missing(df, tenor_list, method):
    """填充缺失值"""
    if method == 'forward':
        # 向前填充（使用下一交易日数据）
        df = df.set_index('date')
        for tenor in tenor_list:
            df[tenor] = df[tenor].bfill()
        df = df.reset_index()
    elif method == 'backward':
        # 向后填充
        df = df.set_index('date')
        for tenor in tenor_list:
            df[tenor] = df[tenor].ffill()
        df = df.reset_index()
    elif method == 'linear':
        # 线性插值
        df = df.set_index('date')
        for tenor in tenor_list:
            df[tenor] = df[tenor].interpolate(method='linear')
        df = df.reset_index()

    return df


def _resample_frequency(df, tenor_list, freq, agg_method):
    """频率转换"""
    df = df.set_index('date')

    # 聚合函数映射
    agg_funcs = {
        'last': 'last',
        'first': 'first',
        'mean': 'mean',
        'median': 'median',
        'sum': 'sum',
        'max': 'max',
        'min': 'min'
    }

    agg_func = agg_funcs.get(agg_method, 'last')

    # 重采样
    resampled = df.resample(freq)

    if agg_func in ['last', 'first']:
        df_new = resampled.apply(lambda x: x.iloc[-1] if agg_func == 'last' else x.iloc[0])
    else:
        df_new = getattr(resampled, agg_func)()

    return df_new.reset_index()


def _transform_data(df, tenor_list, transform):
    """数据变换"""
    df = df.copy()

    for tenor in tenor_list:
        col_name = f"{tenor}_{transform}"

        if transform == 'yoy':
            # 同比增长率
            df[col_name] = df[tenor].pct_change(periods=252) * 100  # 假设一年252个交易日
        elif transform == 'mom':
            # 环比增长率
            df[col_name] = df[tenor].pct_change() * 100
        elif transform == 'log':
            # 对数
            df[col_name] = np.log(df[tenor])
        elif transform == 'diff':
            # 一阶差分
            df[col_name] = df[tenor].diff()
        elif transform == 'diff_yoy':
            # 同比差分
            df[col_name] = df[tenor].diff(periods=252)

    return df


# ── 直接运行时的演示 ─────────────────────────────────────────
if __name__ == '__main__':
    print("=" * 60)
    print("宏观看债数据库 - 数据提取工具")
    print("=" * 60)

    # 示例1: 基础提取
    print("\n示例1: 基础提取（10年国债，最近10天）")
    df1 = data_fetch('y10', '2026-05-18', '2026-05-28')
    print(df1)

    # 示例2: 频率转换（月度）
    print("\n示例2: 月度数据（取月末值）")
    df2 = data_fetch('y10', '2026-01-01', '2026-05-28', freq='ME', agg_method='last')
    print(df2)

    # 示例3: 计算环比
    print("\n示例3: 计算环比")
    df3 = data_fetch('y10', '2026-05-01', '2026-05-28', transform='mom')
    print(df3)

    # 示例4: 多期限
    print("\n示例4: 多期限提取")
    df4 = data_fetch(['y1', 'y10'], '2026-05-20', '2026-05-28')
    print(df4)

    # 示例5: 在线获取
    print("\n示例5: 在线获取")
    df5 = data_fetch('y10', '2026-05-20', '2026-05-28', source='online')
    print(df5)
