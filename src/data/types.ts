// 展示条目：图片墙在上，Markdown 报告在下，可只有其一
export type Entry = {
  id: string
  title: string
  desc?: string // 一句话说明
  date?: string // 物料产出日期
  cover?: string // 首页封面，缺省用第一张图
  items?: Shot[] // 图片墙
  md?: string // 报告路径
}

// 路径都相对工程根目录
export type Shot = {
  src: string
  title?: string
  caption?: string
}

export type Group = {
  title: string
  entries: Entry[]
}
