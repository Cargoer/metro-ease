const test = [
  // 彩虹桥直接变成换乘站问题
  {
    type: 'line',
    name: '8号线',
    section: ['文化公园', '鹅掌坦'],
    except: ['彩虹桥'],
    date: '2020-11-26',
    description: '8号线北延段（文化公园-滘心）开通运营'
  },
  {
    type: 'station',
    name: '彩虹桥',
    with: ['8号线'],
    date: '2022-09-28',
    description: '8号线彩虹桥站投入运营'
  },

  // 天员拆解没有执行问题
  {
    type: 'line',
    name: '21号线',
    section: ['黄村', '员村'],
    date: '2019-12-20',
    description: '21号线后通段（镇龙西-员村）开通运营'
  },
  {
    type: 'lineSub',
    name: '21号线',
    section: ['员村', '天河公园'],
    date: '2024-10-03',
    description: '21号线（员村-天河公园）拆离划归11号线运营'
  },
  {
    type: 'line',
    name: '11号线',
    section: ['赤沙', '龙潭'],
    except: ['广州东站', '广州火车站'],
    date: '2024-12-28',
    description: '11号线环线开通运营（'
  },
]

const lanzhou = [
  {
    type: 'line',
    name: '兰州1号线',
    section: ['陈官营', '东岗'],
    except: ['省政府'],
    givenName: { '奥体中心': '深安大桥南' },
    date: '2019-06-23',
    description: '兰州地铁1号线（陈官营-东岗）开通运营'
  },
  {
    type: 'station',
    name: '省政府',
    date: '2020-09-28',
    description: '兰州1号线省政府站投入运营'
  },
  {
    type: 'line',
    name: '兰州2号线',
    section: ['东方红广场', '雁白大桥'],
    date: '2023-06-29',
    description: '兰州地铁2号线（东方红广场-雁白大桥）开通运营'
  },
  {
    type: 'changeName',
    name: '深安大桥南',
    newName: '奥体中心',
    date: '2023-11-22',
    description: '深安大桥南站名称变更为奥体中心站'
  },
  {
    type: 'showAll',
    date: '2023-11-22',
    description: '现状展示'
  }
]

export default lanzhou

const data = [
  {
    type: 'line',
    name: '1号线',
    section: ['西塱', '黄沙'],
    // givenColor: '#C1221F',
    givenName: { '西塱': '西朗' },
    date: '1997-06-28',
    description: '1号线首通段（西朗-黄沙）开通运营'
  },
  {
    type: 'line',
    name: '1号线',
    section: ['黄沙', '广州东站'],
    date: '1999-02-16',
    description: '1号线全线（西朗-广州东站）开通运营'
  },
  {
    type: 'line',
    name: '2/8号线', // 额外绘制
    section: ['三元里', '晓港'],
    // givenColor: '#42B121',
    date: '2002-12-29',
    description: '2号线首通段（三元里-晓港）开通运营'
  },
  {
    type: 'line',
    name: '2/8号线', // 额外绘制
    section: ['晓港', '琶洲'],
    date: '2003-06-28',
    description: '2号线后通段（晓港-琶洲）开通运营'
  },
  {
    type: 'line',
    name: '3号线',
    section: ['广州东站', '客村'],
    // givenColor: '#1C609F',
    givenName: { '广州塔': '赤岗塔' },
    date: '2005-12-26',
    description: '3号线首通段（广州东站-客村）开通运营'
  },
  {
    type: 'line',
    name: '2/8号线', // 额外绘制
    section: ['琶洲', '万胜围'],
    date: '2005-12-26',
    description: '2号线调整工程（琶洲-万胜围）开通运营'
  },
  {
    type: 'line',
    name: '4号线',
    section: ['万胜围', '新造'],
    // givenColor: '#D07F20',
    givenName: { '大学城北': '北亭', '大学城南': '南亭' },
    date: '2005-12-26',
    description: '4号线大学城专线（万胜围-新造）开通运营'
  },
  {
    type: 'changeName',
    name: '北亭',
    newName: '大学城北',
    date: '2006-05-10',
    description: '北亭站名称变更为大学城北站'
  },
  {
    type: 'changeName',
    name: '南亭',
    newName: '大学城南',
    date: '2006-05-10',
    description: '南亭站名称变更为大学城南站'
  },
  {
    type: 'line',
    name: '4号线',
    section: ['新造', '黄阁'],
    except: ['官桥', '庆盛'],
    date: '2006-12-30',
    description: '4号线二期（新造-黄阁）开通运营'
  },
  {
    type: 'line',
    name: '3号线支线',
    section: ['体育西路', '天河客运站'],
    date: '2006-12-30',
    description: '3号线支线（体育西路-天河客运站）开通运营'
  },
  {
    type: 'line',
    name: '3号线',
    section: ['客村', '番禺广场'],
    date: '2006-12-30',
    description: '3号线一期（客村-番禺广场）开通运营'
  },
  {
    type: 'line',
    name: '4号线',
    section: ['黄阁', '金洲'],
    date: '2007-06-28',
    description: '4号线二期（黄阁-金洲）开通运营' 
  },
  {
    type: 'showAll',
    date: '2007-06-28',
    description: '10周年展示'
  },
  {
    type: 'line',
    name: '4号线',
    section: ['万胜围', '车陂南'],
    date: '2009-12-28',
    description: '4号线北延段（万胜围-车陂南）开通运营' 
  },
  {
    type: 'line',
    name: '5号线',
    section: ['滘口', '文冲'],
    date: '2009-12-28',
    description: '5号线（滘口-文冲）开通运营' 
  },
  {
    type: 'abandon',
    name: '2/8号线',
    date: '2010-09-22',
    description: '二八拆解'
  },
  {
    type: 'line',
    name: '8号线',
    section: ['万胜围', '昌岗'],
    date: '2010-09-25',
    description: '8号线（万胜围-昌岗）开通运营' 
  },
  {
    type: 'line',
    name: '2号线',
    section: ['嘉禾望岗', '广州南站'],
    date: '2010-09-25',
    description: '2号线（嘉禾望岗-广州南站）开通运营'
  },
  {
    type: 'line',
    name: '4号线',
    section: ['车陂南', '黄村'],
    date: '2010-09-25',
    description: '4号线北延段（车陂南-黄村）开通运营'
  },
  {
    type: 'line',
    name: '3号线',
    section: ['广州东站', '机场南'],
    except: ['高增'],
    date: '2010-10-30',
    description: '3号线北延段（广州东站-机场南）开通运营'
  },
  {
    type: 'line',
    name: '8号线',
    section: ['昌岗', '凤凰新村'],
    date: '2010-11-03',
    description: '8号线西延段（昌岗-凤凰新村）开通运营'
  },
  {
    type: 'line',
    name: '广佛线',
    section: ['西塱', '魁奇路'],
    date: '2010-11-03',
    description: '广佛线首通段（西朗-魁奇路）开通运营'
  },
  {
    type: 'showAll',
    date: '2012-06-28',
    description: '15周年展示'
  },
  {
    type: 'changeName',
    name: '赤岗塔',
    newName: '广州塔',
    date: '2013-12-26',
    description: '赤岗塔名称变更为广州塔'
  },
  {
    type: 'line',
    name: '6号线',
    section: ['浔峰岗', '长湴'],
    except: ['一德路'],
    date: '2013-12-28',
    description: '6号线首期（浔峰岗-长湴）开通运营'
  },
  {
    type: 'station',
    name: '一德路',
    date: '2015-01-28',
    description: '6号线一德路站投入运营'
  },
  {
    type: 'line',
    name: '广佛线',
    section: ['西塱', '燕岗'],
    date: '2015-12-28',
    description: '广佛线首期后通段（西朗-燕岗）开通运营'
  },
  {
    type: 'line',
    name: '广佛线',
    section: ['魁奇路', '新城东'],
    date: '2016-12-28',
    description: '广佛线二期（魁奇路-新城东）开通运营'
  },
  {
    type: 'line',
    name: '7号线',
    section: ['广州南站', '大学城南'],
    date: '2016-12-28',
    description: '7号线首期（广州南站-大学城南）开通运营'
  },
  {
    type: 'line',
    name: '6号线',
    section: ['长湴', '香雪'],
    except: ['植物园', '柯木塱'],
    date: '2016-12-28',
    description: '6号线二期（长湴-香雪）开通运营'
  },
  {
    type: 'station',
    name: '柯木塱',
    date: '2017-06-28',
    description: '6号线植物园站投入运营'
  },
  {
    type: 'station',
    name: '植物园',
    date: '2017-06-28',
    description: '6号线植物园站投入运营'
  },
  {
    type: 'showAll',
    date: '2017-06-28',
    description: '20周年展示'
  },
  {
    type: 'line',
    name: '13号线',
    section: ['鱼珠', '新沙'],
    date: '2017-12-28',
    description: '13号线一期（鱼珠-新沙）开通运营'
  },
  {
    type: 'line',
    name: '14号线知识城支线',
    section: ['镇龙', '新和'],
    date: '2017-12-28',
    description: '14号线知识城支线（镇龙-新和）开通运营'
  },
  {
    type: 'line',
    name: '4号线',
    section: ['金洲', '南沙客运港'],
    date: '2017-12-28',
    description: '4号线南延段（金洲-南沙客运港）开通运营'
  },
  {
    type: 'station',
    name: '庆盛',
    date: '2017-12-28',
    description: '4号线庆盛站投入运营'
  },
  {
    type: 'line',
    name: '9号线',
    section: ['高增', '飞鹅岭'],
    with: { '高增': ['3号线'] },
    except: ['清塘'],
    date: '2017-12-28',
    description: '9号线（高增-飞鹅岭）开通运营'
  },
  {
    type: 'line',
    name: '3号线',
    section: ['机场南', '机场北'],
    date: '2018-04-26',
    description: '3号线机场北投入运营'
  },
  {
    type: 'station',
    name: '清塘',
    date: '2018-06-30',
    description: '9号线清塘站投入运营'
  },
  {
    type: 'changeName',
    name: '西朗',
    newName: '西塱',
    date: '2018-12-28',
    description: '西朗站更名为西塱站'
  },
  {
    type: 'line',
    name: '广佛线',
    section: ['燕岗', '沥滘'],
    date: '2018-12-28',
    description: '广佛线一期后通段（燕岗-沥滘）开通运营'
  },
  {
    type: 'line',
    name: '14号线',
    section: ['嘉禾望岗', '东风'],
    date: '2018-12-28',
    description: '14号线一期（嘉禾望岗-东风）开通运营'
  },
  {
    type: 'line',
    name: '21号线',
    section: ['镇龙西', '增城广场'],
    date: '2018-12-28',
    description: '21号线首通段（镇龙西-增城广场）开通运营'
  },
  {
    type: 'line',
    name: '21号线',
    section: ['镇龙西', '员村'],
    date: '2019-12-20',
    description: '21号线后通段（镇龙西-员村）开通运营'
  },
  {
    type: 'line',
    name: '8号线',
    section: ['凤凰新村', '文化公园'],
    date: '2019-12-28',
    description: '8号线延长段（凤凰新村-文化公园）开通运营'
  },
  {
    type: 'line',
    name: '8号线',
    section: ['文化公园', '滘心'],
    except: ['彩虹桥'],
    date: '2020-11-26',
    description: '8号线北延段（文化公园-滘心）开通运营'
  },
  {
    type: 'line',
    name: '18号线',
    section: ['冼村', '万顷沙'],
    date: '2021-09-28',
    description: '18号线首通段（冼村-万顷沙）开通运营'
  },
  {
    type: 'line',
    name: '佛山2号线',
    section: ['广州南站', '南庄'],
    date: '2021-12-28',
    description: '佛山2号线一期（广州南站-南庄）开通运营'
  },
  {
    type: 'line',
    name: '22号线',
    section: ['番禺广场', '陈头岗'],
    date: '2022-03-31',
    description: '22号线一期（番禺广场-陈头岗）开通运营'
  },
  {
    type: 'line',
    name: '7号线',
    section: ['广州南站', '美的大道'],
    date: '2022-05-01',
    description: '7号线西延段（广州南站-美的大道）开通运营'
  },
  {
    type: 'showAll',
    date: '2022-06-28',
    description: '25周年展示'
  },
  {
    type: 'station',
    name: '彩虹桥',
    with: ['8号线'],
    date: '2022-09-28',
    description: '8号线彩虹桥站投入运营'
  },
  {
    type: 'line',
    name: '佛山3号线',
    section: ['镇安', '顺德学院'],
    date: '2022-12-28',
    description: '佛山3号线首通段（镇安-顺德学院）开通运营'
  },
  {
    type: 'line',
    name: '5号线',
    section: ['文冲', '黄埔新港'],
    date: '2023-12-28',
    description: '5号线东延段（文冲-黄埔新港）开通运营'
  },
  {
    type: 'line',
    name: '7号线',
    section: ['大学城南', '燕山'],
    date: '2023-12-28',
    description: '7号线二期（大学城南-燕山）开通运营'
  },
  {
    type: 'line',
    name: '佛山3号线',
    section: ['镇安', '中山公园'],
    date: '2024-08-23',
    description: '佛山3号线后通段（镇安-中山公园）开通运营'
  },
  {
    type: 'line',
    name: '佛山3号线',
    section: ['联和', '佛山大学'],
    date: '2024-08-23',
    description: '佛山3号线后通段（联和-佛山大学）开通运营'
  },
  {
    type: 'lineSub',
    name: '21号线',
    section: ['员村', '天河公园'],
    date: '2024-10-03',
    description: '21号线（员村-天河公园）拆离划归11号线运营'
  },
  {
    type: 'line',
    name: '3号线',
    section: ['番禺广场', '海傍'],
    date: '2024-11-01',
    description: '3号线东延段（番禺广场-海傍）开通运营'
  },
  {
    type: 'line',
    name: '11号线',
    section: ['赤沙', '龙潭'],
    except: ['广州东站', '广州火车站'],
    date: '2024-12-28',
    description: '11号线环线开通运营（除了广州东站、广州火车站）'
  },
  {
    type: 'line',
    name: '10号线',
    section: ['西塱', '杨箕东'],
    date: '2025-06-29',
    description: '10号线（西塱-杨箕东）开通运营'
  },
  {
    type: 'line',
    name: '12号线北段',
    section: ['浔峰岗', '广州体育馆'],
    date: '2025-06-29',
    description: '12号线（浔峰岗-广州体育馆）开通运营'
  },
  {
    type: 'line',
    name: '12号线南段',
    section: ['二沙岛', '大学城南'],
    date: '2025-06-29',
    description: '12号线（二沙岛-大学城南）开通运营'
  },
  {
    type: 'station',
    name: '广州东站',
    with: ['11号线'],
    date: '2025-09-29',
    description: '11号线广州东站投入运营'
  },
  {
    type: 'line',
    name: '13号线',
    section: ['鱼珠', '天河公园'],
    date: '2025-09-29',
    description: '13号线二期（鱼珠-天河公园）开通运营'
  },
  {
    type: 'line',
    name: '14号线',
    section: ['嘉禾望岗', '乐嘉路'],
    date: '2025-09-29',
    description: '14号线二期（嘉禾望岗-乐嘉路）开通运营'
  },
  {
    type: 'showAll',
    date: '2025-09-29',
    description: '现状'
  },
  {
    type: 'station',
    name: '中大南门',
    // with: ['11号线'],
    date: '2025-12-29',
    description: '10号线中大南门站投入运营'
  },
  {
    type: 'line',
    name: '22号线',
    section: ['陈头岗', '芳村'],
    date: '2025-12-29',
    description: '22号线一期后通段（陈头岗-芳村）开通运营'
  },
  {
    type: 'showAll',
    date: '2025-12-28',
    description: '2025年底开通情况'
  }
]

// export default data