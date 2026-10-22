/**
 * 在售插排规格（用于与本设计对照）。
 *
 * 来源：排插数据(2).xlsx，共 12 款，价格单位为元。
 * 原始表里 E2 写作「28.9rm」，按 28.9 元处理；尺寸分隔符已统一成「×」。
 * 该文件由 scripts/gen-measured.py 从原始 xlsx 直接生成，请勿手改数值。
 */
export type StripSpec = {
  name: string
  brand: '公牛' | '绿联'
  /** 原始孔位描述，含 USB 口 */
  ports: string
  /** 可排序的插孔数，含 USB 的描述按数字部分取值 */
  portsCount: number
  maxW: number
  size: string
  /** 参考价（元） */
  price: number
}

export const STRIP_SPECS: StripSpec[] = [
  {
    name: "公牛小白USB插座1.8m长",
    brand: "公牛",
    ports: "15孔+3*USB-A",
    portsCount: 15,
    maxW: 2500,
    size: "239×46×28.5mm",
    price: 28.9,
  },
  {
    name: "公牛R2220延长线插座1.8m长",
    brand: "公牛",
    ports: "15孔+2*USB-A+1*USB-C",
    portsCount: 15,
    maxW: 2500,
    size: "周长110×高度29mm",
    price: 42.9,
  },
  {
    name: "公牛A01一插位",
    brand: "公牛",
    ports: "5 孔",
    portsCount: 5,
    maxW: 2500,
    size: "101×53×31mm",
    price: 14.9,
  },
  {
    name: "公牛A02二插位",
    brand: "公牛",
    ports: "10 孔",
    portsCount: 10,
    maxW: 2500,
    size: "153×53×31mm",
    price: 20.8,
  },
  {
    name: "公牛101四插位",
    brand: "公牛",
    ports: "14 孔",
    portsCount: 14,
    maxW: 2500,
    size: "200×53×31mm",
    price: 27.8,
  },
  {
    name: "公牛402六插位",
    brand: "公牛",
    ports: "21 孔",
    portsCount: 21,
    maxW: 2500,
    size: "193×75×31mm",
    price: 37.8,
  },
  {
    name: "公牛B09二插位",
    brand: "公牛",
    ports: "7 孔",
    portsCount: 7,
    maxW: 2500,
    size: "148×53×31mm",
    price: 21.8,
  },
  {
    name: "公牛427三插位",
    brand: "公牛",
    ports: "12 孔",
    portsCount: 12,
    maxW: 2500,
    size: "191×53×31mm",
    price: 25.8,
  },
  {
    name: "公牛407四插位",
    brand: "公牛",
    ports: "14 孔",
    portsCount: 14,
    maxW: 2500,
    size: "214×53×31mm",
    price: 29.8,
  },
  {
    name: "绿联四位总控延长线插座5m长",
    brand: "绿联",
    ports: "20 孔",
    portsCount: 20,
    maxW: 2500,
    size: "130×93.5×34.5mm",
    price: 53.66,
  },
  {
    name: "绿联六位总控延长线插座5m长",
    brand: "绿联",
    ports: "30 孔",
    portsCount: 30,
    maxW: 2500,
    size: "175×93.5×34.5mm",
    price: 63.33,
  },
  {
    name: "公牛UL1012延长线插座1.6m长",
    brand: "公牛",
    ports: "60孔+2*USB-A+2*USB-C",
    portsCount: 60,
    maxW: 2500,
    size: "88×88×175mm",
    price: 84.9,
  },
]
