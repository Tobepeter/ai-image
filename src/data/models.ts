import type { Verdict } from './verdict'

// 用过的模型按用途分组，组内按推荐程度排，耗时取自 data/reports/ 和 runs/*/ 的记录，体积是本机权重大小
export const modelGroups: ModelGroup[] = [
  {
    name: '生成',
    models: [
      { name: 'SDXL base', task: '全部题材出图', mb: 6500, sec: 86, verdict: 'best' },
      { name: '像素 LoRA', task: '道具、图块、精灵图', mb: 218, sec: 76, verdict: 'good', issue: '叠在 SDXL 上' },
      { name: 'SD1.5', task: '512 冒烟', mb: 2000, sec: 7.3, verdict: 'ok', issue: '没正式用' },
    ],
  },
  {
    name: '识别',
    models: [
      { name: 'SigLIP 2', task: '旅游图分类', mb: 1500, sec: 0.013, verdict: 'best', issue: '用英文提示' },
      { name: 'Qwen3.5-2B', task: '分类 + 一句话中文', mb: 1750, sec: 0.63, verdict: 'best' },
      { name: 'Qwen3.5-4B', task: '一句话中文，最准', mb: 2900, sec: 1.04, verdict: 'good', issue: '慢一倍' },
      { name: 'MiniCPM-V 4.7 1B', task: '一句话中文', mb: 2700, sec: 0.44, verdict: 'good', issue: '不读票面' },
      { name: 'Apple Vision', task: '分流、OCR、场景标签', mb: 0, sec: 0.25, verdict: 'good', issue: '标签只到大类' },
      { name: 'Chinese-CLIP', task: '旅游图分类', mb: 750, sec: 0.022, verdict: 'ok', issue: '文字图分不清' },
      { name: 'InternVL3.5 1B', task: '一句话中文', mb: 1100, sec: 0.99, verdict: 'ok', issue: '比 2B 还慢' },
      { name: 'Qwen3.5-0.8B', task: '一句话中文', mb: 650, sec: 0.39, verdict: 'ok', issue: '常漏类别' },
      { name: 'Moondream2', task: '给素材起名', mb: 3600, sec: 3.22, verdict: 'good', issue: '只出英文' },
      { name: 'Qwen2.5-VL-3B', task: '问答', mb: 7000, sec: 7.1, verdict: 'good' },
      { name: 'SmolVLM2', task: '问答', mb: 8400, sec: 7.78, verdict: 'ok', issue: '最大最慢' },
      { name: 'Florence-2', task: '描述、检测框', mb: 444, sec: 1.33, verdict: 'ok', issue: '漏认一个' },
    ],
  },
  {
    name: '分割',
    models: [
      { name: 'SAM2 small', task: '框选切宝箱', mb: 176, sec: 0.46, verdict: 'good', issue: '要先给框' },
      { name: 'rembg u2netp', task: '自动去背景', mb: 4.4, sec: 6.47, verdict: 'weak', issue: '边缘发灰' },
    ],
  },
]

export type ModelGroup = {
  name: string
  models: ModelInfo[]
}

export type ModelInfo = {
  name: string
  task: string // 在本工程做了什么
  mb: number // 权重体积，0 表示系统自带
  sec: number // 单次耗时
  verdict: Verdict
  issue?: string
}
