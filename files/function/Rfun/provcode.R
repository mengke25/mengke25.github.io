provcode <- function(df_name, prov_variable) {
  # 获取数据框
  df <- get(df_name)
  
  # 创建新的provcode变量并初始化为0
  df$provcode <- 0
  
  # 使用条件语句根据城市名变量更新provcode
  df$provcode[grep("北京", df[[prov_variable]], ignore.case = TRUE)] <- 110000
  df$provcode[grep("天津", df[[prov_variable]], ignore.case = TRUE)] <- 120000
  df$provcode[grep("河北", df[[prov_variable]], ignore.case = TRUE)] <- 130000
  df$provcode[grep("山西", df[[prov_variable]], ignore.case = TRUE)] <- 140000
  df$provcode[grep("内蒙", df[[prov_variable]], ignore.case = TRUE)] <- 150000
  df$provcode[grep("辽宁", df[[prov_variable]], ignore.case = TRUE)] <- 210000
  df$provcode[grep("吉林", df[[prov_variable]], ignore.case = TRUE)] <- 220000
  df$provcode[grep("黑龙江", df[[prov_variable]], ignore.case = TRUE)] <- 230000
  df$provcode[grep("上海", df[[prov_variable]], ignore.case = TRUE)] <- 310000
  df$provcode[grep("浦东", df[[prov_variable]], ignore.case = TRUE)] <- 310000
  df$provcode[grep("江苏", df[[prov_variable]], ignore.case = TRUE)] <- 320000
  df$provcode[grep("浙江", df[[prov_variable]], ignore.case = TRUE)] <- 330000
  df$provcode[grep("安徽", df[[prov_variable]], ignore.case = TRUE)] <- 340000
  df$provcode[grep("福建", df[[prov_variable]], ignore.case = TRUE)] <- 350000
  df$provcode[grep("江西", df[[prov_variable]], ignore.case = TRUE)] <- 360000
  df$provcode[grep("山东", df[[prov_variable]], ignore.case = TRUE)] <- 370000
  df$provcode[grep("河南", df[[prov_variable]], ignore.case = TRUE)] <- 410000
  df$provcode[grep("湖北", df[[prov_variable]], ignore.case = TRUE)] <- 420000
  df$provcode[grep("湖南", df[[prov_variable]], ignore.case = TRUE)] <- 430000
  df$provcode[grep("广东", df[[prov_variable]], ignore.case = TRUE)] <- 440000
  df$provcode[grep("广西", df[[prov_variable]], ignore.case = TRUE)] <- 450000
  df$provcode[grep("海南", df[[prov_variable]], ignore.case = TRUE)] <- 460000
  df$provcode[grep("重庆", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("四川", df[[prov_variable]], ignore.case = TRUE)] <- 510000
  df$provcode[grep("贵州", df[[prov_variable]], ignore.case = TRUE)] <- 520000
  df$provcode[grep("云南", df[[prov_variable]], ignore.case = TRUE)] <- 530000
  df$provcode[grep("西藏", df[[prov_variable]], ignore.case = TRUE)] <- 540000
  df$provcode[grep("陕西", df[[prov_variable]], ignore.case = TRUE)] <- 610000
  df$provcode[grep("甘肃", df[[prov_variable]], ignore.case = TRUE)] <- 620000
  df$provcode[grep("青海", df[[prov_variable]], ignore.case = TRUE)] <- 630000
  df$provcode[grep("宁夏", df[[prov_variable]], ignore.case = TRUE)] <- 640000
  df$provcode[grep("新疆", df[[prov_variable]], ignore.case = TRUE)] <- 650000
  
  df$provcode[grep("东城区", df[[prov_variable]], ignore.case = TRUE)] <- 110000
  df$provcode[grep("西城区", df[[prov_variable]], ignore.case = TRUE)] <- 110000
  df$provcode[grep("朝阳区", df[[prov_variable]], ignore.case = TRUE)] <- 110000
  df$provcode[grep("丰台区", df[[prov_variable]], ignore.case = TRUE)] <- 110000
  df$provcode[grep("石景山区", df[[prov_variable]], ignore.case = TRUE)] <- 110000
  df$provcode[grep("海淀区", df[[prov_variable]], ignore.case = TRUE)] <- 110000
  df$provcode[grep("门头沟区", df[[prov_variable]], ignore.case = TRUE)] <- 110000
  df$provcode[grep("房山区", df[[prov_variable]], ignore.case = TRUE)] <- 110000
  df$provcode[grep("通州区", df[[prov_variable]], ignore.case = TRUE)] <- 110000
  df$provcode[grep("顺义区", df[[prov_variable]], ignore.case = TRUE)] <- 110000
  df$provcode[grep("昌平区", df[[prov_variable]], ignore.case = TRUE)] <- 110000
  df$provcode[grep("大兴区", df[[prov_variable]], ignore.case = TRUE)] <- 110000
  df$provcode[grep("怀柔区", df[[prov_variable]], ignore.case = TRUE)] <- 110000
  df$provcode[grep("平谷区", df[[prov_variable]], ignore.case = TRUE)] <- 110000
  df$provcode[grep("密云区", df[[prov_variable]], ignore.case = TRUE)] <- 110000
  df$provcode[grep("延庆区", df[[prov_variable]], ignore.case = TRUE)] <- 110000
  
  df$provcode[grep("和平区", df[[prov_variable]], ignore.case = TRUE)] <- 120000
  df$provcode[grep("河东区", df[[prov_variable]], ignore.case = TRUE)] <- 120000
  df$provcode[grep("河西区", df[[prov_variable]], ignore.case = TRUE)] <- 120000
  df$provcode[grep("南开区", df[[prov_variable]], ignore.case = TRUE)] <- 120000
  df$provcode[grep("河北区", df[[prov_variable]], ignore.case = TRUE)] <- 120000
  df$provcode[grep("红桥区", df[[prov_variable]], ignore.case = TRUE)] <- 120000
  df$provcode[grep("东丽区", df[[prov_variable]], ignore.case = TRUE)] <- 120000
  df$provcode[grep("西青区", df[[prov_variable]], ignore.case = TRUE)] <- 120000
  df$provcode[grep("津南区", df[[prov_variable]], ignore.case = TRUE)] <- 120000
  df$provcode[grep("北辰区", df[[prov_variable]], ignore.case = TRUE)] <- 120000
  df$provcode[grep("武清区", df[[prov_variable]], ignore.case = TRUE)] <- 120000
  df$provcode[grep("宝坻区", df[[prov_variable]], ignore.case = TRUE)] <- 120000
  df$provcode[grep("滨海新区", df[[prov_variable]], ignore.case = TRUE)] <- 120000
  df$provcode[grep("宁河区", df[[prov_variable]], ignore.case = TRUE)] <- 120000
  df$provcode[grep("静海区", df[[prov_variable]], ignore.case = TRUE)] <- 120000
  df$provcode[grep("蓟州区", df[[prov_variable]], ignore.case = TRUE)] <- 120000
  
  df$provcode[grep("黄浦区", df[[prov_variable]], ignore.case = TRUE)] <- 310000
  df$provcode[grep("徐汇区", df[[prov_variable]], ignore.case = TRUE)] <- 310000
  df$provcode[grep("长宁区", df[[prov_variable]], ignore.case = TRUE)] <- 310000
  df$provcode[grep("静安区", df[[prov_variable]], ignore.case = TRUE)] <- 310000
  df$provcode[grep("普陀区", df[[prov_variable]], ignore.case = TRUE)] <- 310000
  df$provcode[grep("虹口区", df[[prov_variable]], ignore.case = TRUE)] <- 310000
  df$provcode[grep("杨浦区", df[[prov_variable]], ignore.case = TRUE)] <- 310000
  df$provcode[grep("闵行区", df[[prov_variable]], ignore.case = TRUE)] <- 310000
  df$provcode[grep("宝山区", df[[prov_variable]], ignore.case = TRUE)] <- 310000
  df$provcode[grep("嘉定区", df[[prov_variable]], ignore.case = TRUE)] <- 310000
  df$provcode[grep("浦东新区", df[[prov_variable]], ignore.case = TRUE)] <- 310000
  df$provcode[grep("金山区", df[[prov_variable]], ignore.case = TRUE)] <- 310000
  df$provcode[grep("松江区", df[[prov_variable]], ignore.case = TRUE)] <- 310000
  df$provcode[grep("青浦区", df[[prov_variable]], ignore.case = TRUE)] <- 310000
  df$provcode[grep("奉贤区", df[[prov_variable]], ignore.case = TRUE)] <- 310000
  df$provcode[grep("崇明区", df[[prov_variable]], ignore.case = TRUE)] <- 310000
  
  df$provcode[grep("万州区", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("涪陵区", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("渝中区", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("大渡口区", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("江北区", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("沙坪坝区", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("九龙坡区", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("南岸区", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("北碚区", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("綦江区", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("大足区", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("渝北区", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("巴南区", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("黔江区", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("长寿区", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("江津区", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("合川区", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("永川区", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("南川区", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("璧山区", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("铜梁区", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("潼南区", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("荣昌区", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("开州区", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("梁平区", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("武隆区", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("城口县", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("丰都县", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("垫江县", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("忠县", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("云阳县", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("奉节县", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("巫山县", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("巫溪县", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("石柱土家族自治县", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("秀山土家族苗族自治县", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("酉阳土家族苗族自治县", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  df$provcode[grep("彭水苗族土家族自治县", df[[prov_variable]], ignore.case = TRUE)] <- 500000
  

  # 将更新后的数据框保存回原数据框
  assign(df_name, df, envir = .GlobalEnv)
  
  # 返回更新后的数据框
  return(df)
}

