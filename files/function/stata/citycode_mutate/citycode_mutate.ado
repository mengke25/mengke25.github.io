cap program drop citycode_mutate
program define citycode_mutate
qui{
syntax varlist(min=1 max=1)

// 创建 citycode 变量并初始化为0
cap drop citycode
gen citycode = .

// 使用 strmatch 根据城市名更新 citycode
replace citycode = 110000 if strmatch(`varlist', "*北京*")
replace citycode = 120000 if strmatch(`varlist', "*天津*")
replace citycode = 130100 if strmatch(`varlist', "*石家庄*")
replace citycode = 130200 if strmatch(`varlist', "*唐山*")
replace citycode = 130300 if strmatch(`varlist', "*秦皇岛*")
replace citycode = 130400 if strmatch(`varlist', "*邯郸*")
replace citycode = 130500 if strmatch(`varlist', "*邢台*")
replace citycode = 130600 if strmatch(`varlist', "*保定*")
replace citycode = 130700 if strmatch(`varlist', "*张家口*")
replace citycode = 130800 if strmatch(`varlist', "*承德*")
replace citycode = 130900 if strmatch(`varlist', "*沧州*")
replace citycode = 131000 if strmatch(`varlist', "*廊坊*")
replace citycode = 131100 if strmatch(`varlist', "*衡水*")
replace citycode = 140100 if strmatch(`varlist', "*太原*")
replace citycode = 140200 if strmatch(`varlist', "*大同*")
replace citycode = 140300 if strmatch(`varlist', "*阳泉*")
replace citycode = 140400 if strmatch(`varlist', "*长治*")
replace citycode = 140500 if strmatch(`varlist', "*晋城*")
replace citycode = 140600 if strmatch(`varlist', "*朔州*")
replace citycode = 140700 if strmatch(`varlist', "*晋中*")
replace citycode = 140800 if strmatch(`varlist', "*运城*")
replace citycode = 140900 if strmatch(`varlist', "*忻州*")
replace citycode = 141000 if strmatch(`varlist', "*临汾*")
replace citycode = 141100 if strmatch(`varlist', "*吕梁*")
replace citycode = 150100 if strmatch(`varlist', "*呼和浩特*")
replace citycode = 150200 if strmatch(`varlist', "*包头*")
replace citycode = 150300 if strmatch(`varlist', "*乌海*")
replace citycode = 150400 if strmatch(`varlist', "*赤峰*")
replace citycode = 150500 if strmatch(`varlist', "*通辽*")
replace citycode = 150600 if strmatch(`varlist', "*鄂尔多斯*")
replace citycode = 150700 if strmatch(`varlist', "*呼伦贝尔*")
replace citycode = 150800 if strmatch(`varlist', "*巴彦淖尔*")
replace citycode = 652800 if strmatch(`varlist', "*巴音郭楞*")
replace citycode = 150900 if strmatch(`varlist', "*乌兰察布*")
replace citycode = 210100 if strmatch(`varlist', "*沈阳*")
replace citycode = 210200 if strmatch(`varlist', "*大连*")
replace citycode = 210300 if strmatch(`varlist', "*鞍山*")
replace citycode = 210400 if strmatch(`varlist', "*抚顺*")
replace citycode = 210500 if strmatch(`varlist', "*本溪*")
replace citycode = 210600 if strmatch(`varlist', "*丹东*")
replace citycode = 210700 if strmatch(`varlist', "*锦州*")
replace citycode = 210800 if strmatch(`varlist', "*营口*")
replace citycode = 210900 if strmatch(`varlist', "*阜新*")
replace citycode = 211000 if strmatch(`varlist', "*辽阳*")
replace citycode = 211100 if strmatch(`varlist', "*盘锦*")
replace citycode = 211200 if strmatch(`varlist', "*铁岭*")
replace citycode = 211300 if strmatch(`varlist', "*朝阳*")
replace citycode = 211400 if strmatch(`varlist', "*葫芦岛*")
replace citycode = 220100 if strmatch(`varlist', "*长春*")
replace citycode = 220200 if strmatch(`varlist', "*吉林*")
replace citycode = 220300 if strmatch(`varlist', "*四平*")
replace citycode = 220400 if strmatch(`varlist', "*辽源*")
replace citycode = 220500 if strmatch(`varlist', "*通化*")
replace citycode = 220600 if strmatch(`varlist', "*白山*")
replace citycode = 220700 if strmatch(`varlist', "*松原*")
replace citycode = 220800 if strmatch(`varlist', "*白城*")
replace citycode = 230100 if strmatch(`varlist', "*哈尔滨*")
replace citycode = 230200 if strmatch(`varlist', "*齐齐哈尔*")
replace citycode = 230300 if strmatch(`varlist', "*鸡西*")
replace citycode = 230400 if strmatch(`varlist', "*鹤岗*")
replace citycode = 230500 if strmatch(`varlist', "*双鸭山*")
replace citycode = 230600 if strmatch(`varlist', "*大庆*")
replace citycode = 230700 if strmatch(`varlist', "*伊春*")
replace citycode = 230800 if strmatch(`varlist', "*佳木斯*")
replace citycode = 230900 if strmatch(`varlist', "*七台河*")
replace citycode = 231000 if strmatch(`varlist', "*牡丹江*")
replace citycode = 231100 if strmatch(`varlist', "*黑河*")
replace citycode = 231200 if strmatch(`varlist', "*绥化*")
replace citycode = 310000 if strmatch(`varlist', "*上海*")
replace citycode = 320100 if strmatch(`varlist', "*南京*")
replace citycode = 320200 if strmatch(`varlist', "*无锡*")
replace citycode = 320300 if strmatch(`varlist', "*徐州*")
replace citycode = 320400 if strmatch(`varlist', "*常州*")
replace citycode = 320500 if strmatch(`varlist', "*苏州*")
replace citycode = 320600 if strmatch(`varlist', "*南通*")
replace citycode = 320700 if strmatch(`varlist', "*连云港*")
replace citycode = 320800 if strmatch(`varlist', "*淮安*")
replace citycode = 320900 if strmatch(`varlist', "*盐城*")
replace citycode = 321000 if strmatch(`varlist', "*扬州*")
replace citycode = 321100 if strmatch(`varlist', "*镇江*")
replace citycode = 321200 if strmatch(`varlist', "*泰州*")
replace citycode = 321300 if strmatch(`varlist', "*宿迁*")
replace citycode = 330100 if strmatch(`varlist', "*杭州*")
replace citycode = 330200 if strmatch(`varlist', "*宁波*")
replace citycode = 330300 if strmatch(`varlist', "*温州*")
replace citycode = 330400 if strmatch(`varlist', "*嘉兴*")
replace citycode = 330500 if strmatch(`varlist', "*湖州*")
replace citycode = 330600 if strmatch(`varlist', "*绍兴*")
replace citycode = 330700 if strmatch(`varlist', "*金华*")
replace citycode = 330800 if strmatch(`varlist', "*衢州*")
replace citycode = 330900 if strmatch(`varlist', "*舟山*")
replace citycode = 331000 if strmatch(`varlist', "*台州*")
replace citycode = 331100 if strmatch(`varlist', "*丽水*")
replace citycode = 340100 if strmatch(`varlist', "*合肥*")
replace citycode = 340200 if strmatch(`varlist', "*芜湖*")
replace citycode = 340300 if strmatch(`varlist', "*蚌埠*")
replace citycode = 340400 if strmatch(`varlist', "*淮南*")
replace citycode = 340500 if strmatch(`varlist', "*马鞍山*")
replace citycode = 340600 if strmatch(`varlist', "*淮北*")
replace citycode = 340700 if strmatch(`varlist', "*铜陵*")
replace citycode = 340800 if strmatch(`varlist', "*安庆*")
replace citycode = 341000 if strmatch(`varlist', "*黄山*")
replace citycode = 341100 if strmatch(`varlist', "*滁州*")
replace citycode = 341200 if strmatch(`varlist', "*阜阳*")
replace citycode = 341300 if strmatch(`varlist', "*宿州*")
replace citycode = 341400 if strmatch(`varlist', "*巢湖*")
replace citycode = 341500 if strmatch(`varlist', "*六安*")
replace citycode = 341600 if strmatch(`varlist', "*亳州*")
replace citycode = 341700 if strmatch(`varlist', "*池州*")
replace citycode = 341800 if strmatch(`varlist', "*宣城*")
replace citycode = 350100 if strmatch(`varlist', "*福州*")
replace citycode = 350200 if strmatch(`varlist', "*厦门*")
replace citycode = 350300 if strmatch(`varlist', "*莆田*")
replace citycode = 350400 if strmatch(`varlist', "*三明*")
replace citycode = 350500 if strmatch(`varlist', "*泉州*")
replace citycode = 350600 if strmatch(`varlist', "*漳州*")
replace citycode = 350700 if strmatch(`varlist', "*南平*")
replace citycode = 350800 if strmatch(`varlist', "*龙岩*")
replace citycode = 350900 if strmatch(`varlist', "*宁德*")
replace citycode = 360100 if strmatch(`varlist', "*南昌*")
replace citycode = 360200 if strmatch(`varlist', "*景德镇*")
replace citycode = 360300 if strmatch(`varlist', "*萍乡*")
replace citycode = 360400 if strmatch(`varlist', "*九江*")
replace citycode = 360500 if strmatch(`varlist', "*新余*")
replace citycode = 360600 if strmatch(`varlist', "*鹰潭*")
replace citycode = 360700 if strmatch(`varlist', "*赣州*")
replace citycode = 360800 if strmatch(`varlist', "*吉安*")
replace citycode = 360900 if strmatch(`varlist', "*宜春*")
replace citycode = 361000 if strmatch(`varlist', "*抚州*")
replace citycode = 361100 if strmatch(`varlist', "*上饶*")
replace citycode = 370100 if strmatch(`varlist', "*济南*")
replace citycode = 370200 if strmatch(`varlist', "*青岛*")
replace citycode = 370300 if strmatch(`varlist', "*淄博*")
replace citycode = 370400 if strmatch(`varlist', "*枣庄*")
replace citycode = 370500 if strmatch(`varlist', "*东营*")
replace citycode = 370600 if strmatch(`varlist', "*烟台*")
replace citycode = 370700 if strmatch(`varlist', "*潍坊*")
replace citycode = 370800 if strmatch(`varlist', "*济宁*")
replace citycode = 370900 if strmatch(`varlist', "*泰安*")
replace citycode = 371000 if strmatch(`varlist', "*威海*")
replace citycode = 371100 if strmatch(`varlist', "*日照*")
replace citycode = 371200 if strmatch(`varlist', "*莱芜*")
replace citycode = 371300 if strmatch(`varlist', "*临沂*")
replace citycode = 371400 if strmatch(`varlist', "*德州*")
replace citycode = 371500 if strmatch(`varlist', "*聊城*")
replace citycode = 371600 if strmatch(`varlist', "*滨州*")
replace citycode = 371700 if strmatch(`varlist', "*菏泽*")
replace citycode = 410100 if strmatch(`varlist', "*郑州*")
replace citycode = 410200 if strmatch(`varlist', "*开封*")
replace citycode = 410300 if strmatch(`varlist', "*洛阳*")
replace citycode = 410400 if strmatch(`varlist', "*平顶山*")
replace citycode = 410500 if strmatch(`varlist', "*安阳*")
replace citycode = 410600 if strmatch(`varlist', "*鹤壁*")
replace citycode = 410700 if strmatch(`varlist', "*新乡*")
replace citycode = 410800 if strmatch(`varlist', "*焦作*")
replace citycode = 410900 if strmatch(`varlist', "*濮阳*")
replace citycode = 411000 if strmatch(`varlist', "*许昌*")
replace citycode = 411100 if strmatch(`varlist', "*漯河*")
replace citycode = 411200 if strmatch(`varlist', "*三门峡*")
replace citycode = 411300 if strmatch(`varlist', "*南阳*")
replace citycode = 411400 if strmatch(`varlist', "*商丘*")
replace citycode = 411500 if strmatch(`varlist', "*信阳*")
replace citycode = 411600 if strmatch(`varlist', "*周口*")
replace citycode = 411700 if strmatch(`varlist', "*驻马店*")
replace citycode = 420100 if strmatch(`varlist', "*武汉*")
replace citycode = 420200 if strmatch(`varlist', "*黄石*")
replace citycode = 420300 if strmatch(`varlist', "*十堰*")
replace citycode = 420500 if strmatch(`varlist', "*宜昌*")
replace citycode = 420600 if strmatch(`varlist', "*襄阳*")
replace citycode = 420700 if strmatch(`varlist', "*鄂州*")
replace citycode = 420800 if strmatch(`varlist', "*荆门*")
replace citycode = 420900 if strmatch(`varlist', "*孝感*")
replace citycode = 421000 if strmatch(`varlist', "*荆州*")
replace citycode = 421100 if strmatch(`varlist', "*黄冈*")
replace citycode = 421200 if strmatch(`varlist', "*咸宁*")
replace citycode = 421300 if strmatch(`varlist', "*随州*")
replace citycode = 430100 if strmatch(`varlist', "*长沙*")
replace citycode = 430200 if strmatch(`varlist', "*株洲*")
replace citycode = 430300 if strmatch(`varlist', "*湘潭*")
replace citycode = 430400 if strmatch(`varlist', "*衡阳*")
replace citycode = 430500 if strmatch(`varlist', "*邵阳*")
replace citycode = 430600 if strmatch(`varlist', "*岳阳*")
replace citycode = 430700 if strmatch(`varlist', "*常德*")
replace citycode = 430800 if strmatch(`varlist', "*张家界*")
replace citycode = 430900 if strmatch(`varlist', "*益阳*")
replace citycode = 431000 if strmatch(`varlist', "*郴州*")
replace citycode = 431100 if strmatch(`varlist', "*永州*")
replace citycode = 431200 if strmatch(`varlist', "*怀化*")
replace citycode = 431300 if strmatch(`varlist', "*娄底*")
replace citycode = 440100 if strmatch(`varlist', "*广州*")
replace citycode = 440200 if strmatch(`varlist', "*韶关*")
replace citycode = 440300 if strmatch(`varlist', "*深圳*")
replace citycode = 440400 if strmatch(`varlist', "*珠海*")
replace citycode = 440500 if strmatch(`varlist', "*汕头*")
replace citycode = 440600 if strmatch(`varlist', "*佛山*")
replace citycode = 440700 if strmatch(`varlist', "*江门*")
replace citycode = 440800 if strmatch(`varlist', "*湛江*")
replace citycode = 440900 if strmatch(`varlist', "*茂名*")
replace citycode = 441200 if strmatch(`varlist', "*肇庆*")
replace citycode = 441300 if strmatch(`varlist', "*惠州*")
replace citycode = 441400 if strmatch(`varlist', "*梅州*")
replace citycode = 441500 if strmatch(`varlist', "*汕尾*")
replace citycode = 441600 if strmatch(`varlist', "*河源*")
replace citycode = 441700 if strmatch(`varlist', "*阳江*")
replace citycode = 441800 if strmatch(`varlist', "*清远*")
replace citycode = 441900 if strmatch(`varlist', "*东莞*")
replace citycode = 442000 if strmatch(`varlist', "*中山*")
replace citycode = 445100 if strmatch(`varlist', "*潮州*")
replace citycode = 445200 if strmatch(`varlist', "*揭阳*")
replace citycode = 445300 if strmatch(`varlist', "*云浮*")
replace citycode = 450100 if strmatch(`varlist', "*南宁*")
replace citycode = 450200 if strmatch(`varlist', "*柳州*")
replace citycode = 450300 if strmatch(`varlist', "*桂林*")
replace citycode = 450400 if strmatch(`varlist', "*梧州*")
replace citycode = 450500 if strmatch(`varlist', "*北海*")
replace citycode = 450600 if strmatch(`varlist', "*防城港*")
replace citycode = 450700 if strmatch(`varlist', "*钦州*")
replace citycode = 450800 if strmatch(`varlist', "*贵港*")
replace citycode = 450900 if strmatch(`varlist', "*玉林*")
replace citycode = 451000 if strmatch(`varlist', "*百色*")
replace citycode = 451100 if strmatch(`varlist', "*贺州*")
replace citycode = 451200 if strmatch(`varlist', "*河池*")
replace citycode = 451300 if strmatch(`varlist', "*来宾*")
replace citycode = 451400 if strmatch(`varlist', "*崇左*")
replace citycode = 460100 if strmatch(`varlist', "*海口*")
replace citycode = 460200 if strmatch(`varlist', "*三亚*")
replace citycode = 460300 if strmatch(`varlist', "*三沙*")
replace citycode = 460400 if strmatch(`varlist', "*儋州*")
replace citycode = 500000 if strmatch(`varlist', "*重庆*")
replace citycode = 510100 if strmatch(`varlist', "*成都*")
replace citycode = 510300 if strmatch(`varlist', "*自贡*")
replace citycode = 510400 if strmatch(`varlist', "*攀枝花*")
replace citycode = 510500 if strmatch(`varlist', "*泸州*")
replace citycode = 510600 if strmatch(`varlist', "*德阳*")
replace citycode = 510700 if strmatch(`varlist', "*绵阳*")
replace citycode = 510800 if strmatch(`varlist', "*广元*")
replace citycode = 510900 if strmatch(`varlist', "*遂宁*")
replace citycode = 511000 if strmatch(`varlist', "*内江*")
replace citycode = 511100 if strmatch(`varlist', "*乐山*")
replace citycode = 511300 if strmatch(`varlist', "*南充*")
replace citycode = 511400 if strmatch(`varlist', "*眉山*")
replace citycode = 511500 if strmatch(`varlist', "*宜宾*")
replace citycode = 511600 if strmatch(`varlist', "*广安*")
replace citycode = 511700 if strmatch(`varlist', "*达州*")
replace citycode = 511800 if strmatch(`varlist', "*雅安*")
replace citycode = 511900 if strmatch(`varlist', "*巴中*")
replace citycode = 512000 if strmatch(`varlist', "*资阳*")
replace citycode = 520100 if strmatch(`varlist', "*贵阳*")
replace citycode = 520200 if strmatch(`varlist', "*六盘水*")
replace citycode = 520300 if strmatch(`varlist', "*遵义*")
replace citycode = 520400 if strmatch(`varlist', "*安顺*")
replace citycode = 520500 if strmatch(`varlist', "*毕节*")
replace citycode = 520600 if strmatch(`varlist', "*铜仁*")
replace citycode = 530100 if strmatch(`varlist', "*昆明*")
replace citycode = 530300 if strmatch(`varlist', "*曲靖*")
replace citycode = 530400 if strmatch(`varlist', "*玉溪*")
replace citycode = 530500 if strmatch(`varlist', "*保山*")
replace citycode = 530600 if strmatch(`varlist', "*昭通*")
replace citycode = 530700 if strmatch(`varlist', "*丽江*")
replace citycode = 530800 if strmatch(`varlist', "*普洱*")
replace citycode = 530900 if strmatch(`varlist', "*临沧*")
replace citycode = 540100 if strmatch(`varlist', "*拉萨*")
replace citycode = 540200 if strmatch(`varlist', "*日喀则*")
replace citycode = 540300 if strmatch(`varlist', "*昌都*")
replace citycode = 540400 if strmatch(`varlist', "*林芝*")
replace citycode = 540500 if strmatch(`varlist', "*山南*")
replace citycode = 540600 if strmatch(`varlist', "*那曲*")
replace citycode = 610100 if strmatch(`varlist', "*西安*")
replace citycode = 610200 if strmatch(`varlist', "*铜川*")
replace citycode = 610300 if strmatch(`varlist', "*宝鸡*")
replace citycode = 610400 if strmatch(`varlist', "*咸阳*")
replace citycode = 610500 if strmatch(`varlist', "*渭南*")
replace citycode = 610600 if strmatch(`varlist', "*延安*")
replace citycode = 610700 if strmatch(`varlist', "*汉中*")
replace citycode = 610800 if strmatch(`varlist', "*榆林*")
replace citycode = 610900 if strmatch(`varlist', "*安康*")
replace citycode = 611000 if strmatch(`varlist', "*商洛*")
replace citycode = 620100 if strmatch(`varlist', "*兰州*")
replace citycode = 620200 if strmatch(`varlist', "*嘉峪关*")
replace citycode = 620300 if strmatch(`varlist', "*金昌*")
replace citycode = 620400 if strmatch(`varlist', "*白银*")
replace citycode = 620500 if strmatch(`varlist', "*天水*")
replace citycode = 620600 if strmatch(`varlist', "*武威*")
replace citycode = 620700 if strmatch(`varlist', "*张掖*")
replace citycode = 620800 if strmatch(`varlist', "*平凉*")
replace citycode = 620900 if strmatch(`varlist', "*酒泉*")
replace citycode = 621000 if strmatch(`varlist', "*庆阳*")
replace citycode = 621100 if strmatch(`varlist', "*定西*")
replace citycode = 621200 if strmatch(`varlist', "*陇南*")
replace citycode = 630100 if strmatch(`varlist', "*西宁*")
replace citycode = 630200 if strmatch(`varlist', "*海东*")
replace citycode = 632500 if strmatch(`varlist', "*海南*")
replace citycode = 640100 if strmatch(`varlist', "*银川*")
replace citycode = 640200 if strmatch(`varlist', "*石嘴山*")
replace citycode = 640300 if strmatch(`varlist', "*吴忠*")
replace citycode = 640400 if strmatch(`varlist', "*固原*")
replace citycode = 640500 if strmatch(`varlist', "*中卫*")
replace citycode = 650100 if strmatch(`varlist', "*乌鲁木齐*")
replace citycode = 650200 if strmatch(`varlist', "*克拉玛依*")
replace citycode = 650400 if strmatch(`varlist', "*吐鲁番*")
replace citycode = 650500 if strmatch(`varlist', "*哈密*")
replace citycode = 420684 if strmatch(`varlist', "*宜城*")
replace citycode = 653101 if strmatch(`varlist', "*喀什*")
replace citycode = 652900 if strmatch(`varlist', "*阿克苏*")
replace citycode = 532300 if strmatch(`varlist', "*楚雄*")
replace citycode = 532900 if strmatch(`varlist', "*大理*")
replace citycode = 422800 if strmatch(`varlist', "*恩施*")
replace citycode = 152500 if strmatch(`varlist', "*锡林郭勒*")
replace citycode = 632700 if strmatch(`varlist', "*玉树*")
replace citycode = 152900 if strmatch(`varlist', "*阿拉善*")
replace citycode = 654301 if strmatch(`varlist', "*阿勒泰*")
replace citycode = 652301 if strmatch(`varlist', "*昌吉*")
replace citycode = 622900 if strmatch(`varlist', "*临夏*")
replace citycode = 654200 if strmatch(`varlist', "*塔城*")
replace citycode = 532600 if strmatch(`varlist', "*文山*")
replace citycode = 653201 if strmatch(`varlist', "*和田*")
replace citycode = 232700 if strmatch(`varlist', "*大兴安岭*")
replace citycode = 222400 if strmatch(`varlist', "*延边*")
replace citycode = 513400 if strmatch(`varlist', "*凉山*")
replace citycode = 522300 if strmatch(`varlist', "*黔西南*")
replace citycode = 522700 if strmatch(`varlist', "*黔南*")
replace citycode = 532800 if strmatch(`varlist', "*西双版纳*")
replace citycode = 533100 if strmatch(`varlist', "*德宏*")
replace citycode = 610403 if strmatch(`varlist', "*杨凌*")
replace citycode = 623000 if strmatch(`varlist', "*甘南*")
replace citycode = 632200 if strmatch(`varlist', "*海北*")
replace citycode = 632500 if strmatch(`varlist', "*黄南*")
replace citycode = 632800 if strmatch(`varlist', "*海西*")
replace citycode = 652800 if strmatch(`varlist', "*巴音郭楞*")
replace citycode = 660100 if strmatch(`varlist', "*一师*")
replace citycode = 660200 if strmatch(`varlist', "*二师*")
replace citycode = 660300 if strmatch(`varlist', "*三师*")
replace citycode = 660500 if strmatch(`varlist', "*五师*")
replace citycode = 660600 if strmatch(`varlist', "*六师*")
replace citycode = 660700 if strmatch(`varlist', "*七师*")
replace citycode = 660800 if strmatch(`varlist', "*八师*")
replace citycode = 661000 if strmatch(`varlist', "*十师*")
replace citycode = 661100 if strmatch(`varlist', "*工师*")
replace citycode = 661200 if strmatch(`varlist', "*十二师*")
replace citycode = 661300 if strmatch(`varlist', "*十三师*")
replace citycode = 661400 if strmatch(`varlist', "*十四师*")
replace citycode = 152200 if strmatch(`varlist', "*兴安盟*")
replace citycode = 232700 if strmatch(`varlist', "*大兴安岭*")
replace citycode = 419001 if strmatch(`varlist', "*济源*")
replace citycode = 429021 if strmatch(`varlist', "*神农架*")
replace citycode = 433100 if strmatch(`varlist', "*湘西*")
replace citycode = 522600 if strmatch(`varlist', "*黔东南*")
replace citycode = 532500 if strmatch(`varlist', "*红河*")
replace citycode = 533300 if strmatch(`varlist', "*怒江*")
replace citycode = 533400 if strmatch(`varlist', "*迪庆*")
replace citycode = 652700 if strmatch(`varlist', "*博尔塔拉*")
replace citycode = 653000 if strmatch(`varlist', "*克孜勒苏*")
replace citycode = 653201 if strmatch(`varlist', "*和田*")
replace citycode = 654002 if strmatch(`varlist', "*伊犁*")
replace citycode = 231081 if strmatch(`varlist', "*绥芬河*")
replace citycode = 433100 if strmatch(`varlist', "*湘西*")
replace citycode = 632600 if strmatch(`varlist', "*果洛*")
replace citycode = 632800 if strmatch(`varlist', "*海西*")
replace citycode = 660400 if strmatch(`varlist', "*四师*")
replace citycode = 660900 if strmatch(`varlist', "*九师*")
replace citycode = 411400 if strmatch(`varlist', "*永城*")
replace citycode = 429005 if strmatch(`varlist', "*潜江*")
replace citycode = 513200 if strmatch(`varlist', "*阿坝*")
replace citycode = 513300 if strmatch(`varlist', "*甘孜州*")
replace citycode = 652700 if strmatch(`varlist', "*博州*")
replace citycode = 230833 if strmatch(`varlist', "*抚远县*")
replace citycode = 350128 if strmatch(`varlist', "*平潭综合实验区*")
replace citycode = 550003 if strmatch(`varlist', "*贵安新区*")
replace citycode = 350128 if strmatch(`varlist', "*平潭*")
replace citycode = 429004 if strmatch(`varlist', "*仙桃*")
replace citycode = 220581 if strmatch(`varlist', "*梅河口*")
replace citycode = 610100 if strmatch(`varlist', "*西咸新区*")
replace citycode = 429006 if strmatch(`varlist', "*天门*")
replace citycode = 110000 if strmatch(`varlist', "*北京朝阳*")
replace citycode = 110000 if strmatch(`varlist', "*北京市朝阳*")
}
end
