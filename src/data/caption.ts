import vlmReport from '../../data/reports/vision/vlm-caption.json'
import labels from '../../data/input/samples/vision/labels.json'
import { coldStart, displayName, sampleImages } from './classify'
import type { Verdict } from './verdict'

// 一句话中文描述：中文友好的小型多模态模型，同 30 张样本
type Judge = { verdict: Verdict; size: string; pros: string; cons: string }

const judges: Record<string, Judge> = {
  'Qwen3.5-0.8B-4bit': { verdict: 'ok', size: '0.65G', pros: '最快最小，描述能看', cons: '一半没给类别，偶尔编细节（车票“有效期 10 年”）' },
  'Qwen3.5-2B-4bit': { verdict: 'best', size: '1.75G', pros: '描述详细，能读出车票站名、时间、票价', cons: '偶有空话，如“意境优美”' },
  'Qwen3.5-2B-8bit': { verdict: 'good', size: '2.5G', pros: '和 4bit 效果、速度都一样', cons: '体积大 0.8G，没有收益' },
  'Qwen3.5-4B-4bit': { verdict: 'good', size: '2.9G', pros: '描述最准：佛像、风干火腿、卷心菜沙拉', cons: '慢近一倍' },
  'InternVL3_5-1B-4bit': { verdict: 'ok', size: '1.1G', pros: '体积小', cons: '比 2B 还慢，描述偏短，腊肉说成“整只猪”' },
  'MiniCPM-V-4.7-1B-4bit': { verdict: 'good', size: '2.7G', pros: '快，短而准：覆盆子、佛像雕刻', cons: '不读票面细节' },
}

export const captionRuns: CaptionRun[] = vlmReport.runs.map(run => ({
  name: displayName(run.name),
  ms: run.ms,
  hits: run.hits,
  total: run.total,
  coldS: coldStart(run.name),
  // 平均描述字数，看详略
  chars: Math.round(run.rows.reduce((sum, row) => sum + row.desc.length, 0) / run.rows.length),
  ...judges[run.name],
}))

// 每张图：参考答案 + 各模型的类别和一句话
export const captionSamples: CaptionSample[] = Object.entries(labels.truth).map(([file, truth]) => {
  const image = sampleImages.get(file)
  const results = vlmReport.runs.map(run => {
    const row = run.rows.find(item => item.file === file)
    return { desc: row.desc, category: row.category, hit: row.hit }
  })
  return { file, width: image.width, height: image.height, truth, results }
})

export type CaptionRun = Judge & {
  name: string
  ms: number // 单张平均
  hits: number // 类别分对
  total: number
  coldS?: number | 'pending' // 冷启动：导入库 + 加载模型，pending 为待重测
  chars: number // 平均描述字数
}

export type CaptionSample = {
  file: string
  width: number
  height: number
  truth: string[] // 参考类别
  results: { desc: string; category: string; hit: boolean }[] // 和 captionRuns 同序
}
