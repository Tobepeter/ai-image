import clipReport from '../../data/reports/vision/clip-zero-shot.json'
import vlmReport from '../../data/reports/vision/vlm-caption.json'
import appleReport from '../../data/reports/vision/apple-vision-samples.json'
import coldReport from '../../data/reports/vision/cold-start.json'
import labels from '../../data/input/samples/vision/labels.json'
import { specificLabels } from './vision-labels'
import type { Verdict } from './verdict'

// 分类：同 30 张样本、同 10 个中文类别，CLIP 类零样本 vs 小型多模态模型问答选类别
type Judge = { verdict: Verdict; way: string; pros: string; cons: string }

const judges: Record<string, Judge> = {
  'Chinese-CLIP 中文': { verdict: 'ok', way: 'CLIP 零样本', pros: '原生中文提示，快', cons: '带字的图（菜单、标语、包装）都判成导览图' },
  'SigLIP 2 中文': { verdict: 'ok', way: 'CLIP 零样本', pros: '快，比 Chinese-CLIP 稍准', cons: '中文提示吃亏，两张夜景认成古城' },
  'SigLIP 2 英文': { verdict: 'best', way: 'CLIP 零样本', pros: '最准也最快，只错一张展品', cons: '类别要先写成英文短语' },
  'Qwen3.5-0.8B-4bit': { verdict: 'weak', way: '多模态问答', pros: '多模态里最快', cons: '一半没按格式给类别' },
  'Qwen3.5-2B-4bit': { verdict: 'good', way: '多模态问答', pros: '和 SigLIP 一样准，顺带出描述', cons: '比 CLIP 慢约 50 倍' },
  'Qwen3.5-2B-8bit': { verdict: 'good', way: '多模态问答', pros: '和 4bit 一样准', cons: '体积大 0.8G，没有收益' },
  'Qwen3.5-4B-4bit': { verdict: 'ok', way: '多模态问答', pros: '描述最准', cons: '爱把夜景归成古城，最慢' },
  'InternVL3_5-1B-4bit': { verdict: 'ok', way: '多模态问答', pros: '体积小', cons: '长城认成古城，比 2B 还慢' },
  'MiniCPM-V-4.7-1B-4bit': { verdict: 'good', way: '多模态问答', pros: '28/30，比 Qwen 2B 快三成', cons: '比 CLIP 慢约 30 倍' },
}

const reports = [...clipReport.runs, ...vlmReport.runs]

export const classifyRuns: ClassifyRun[] = reports.map(run => ({
  name: displayName(run.name),
  hits: run.hits,
  total: run.total,
  ms: run.ms,
  coldS: coldStart(run.name),
  ...judges[run.name],
}))

export const sampleImages = new Map(appleReport.images.map(image => [image.file, image]))

// 每张图：参考答案、各模型选的类别、Apple Vision 标签
export const classifySamples: ClassifySample[] = Object.entries(labels.truth).map(([file, truth]) => {
  const apple = sampleImages.get(file)
  const results = reports.map(run => {
    const row = run.rows.find(item => item.file === file)
    return { category: 'top' in row ? row.top[0] : row.category, hit: row.hit }
  })
  return { file, width: apple.width, height: apple.height, truth, results, apple: specificLabels(apple.labels, 3) }
})

// 冷启动 = 导入库 + 加载模型（秒）；CLIP 中英文提示共用一个模型
export function coldStart(name: string) {
  const key = name.replace(/ (中文|英文)$/, '')
  const cold = coldReport[key as keyof typeof coldReport]
  if (!cold) return undefined
  // 机器忙时测的不算数，先占位
  if ('busy' in cold) return 'pending' as const
  return Math.round((cold.import_s + cold.load_s) * 10) / 10
}

// 估一批图的总耗时：冷启动一次 + 每张累加
export function batchTime(coldS: number | 'pending' | undefined, ms: number, count = 200) {
  const total = (typeof coldS === 'number' ? coldS : 0) + (ms * count) / 1000
  return total < 90 ? `约 ${Math.round(total)} 秒` : `约 ${Math.round(total / 6) / 10} 分钟`
}

// 去掉量化后缀，InternVL3_5 写回 3.5
export function displayName(name: string) {
  return name.replace('-4bit', '').replace('3_5', '3.5')
}

export type ClassifyRun = Judge & {
  name: string
  hits: number
  total: number
  ms: number // 单张平均
  coldS?: number | 'pending' // 冷启动秒数，pending 为待重测
}

export type ClassifySample = {
  file: string
  width: number
  height: number
  truth: string[] // 参考答案，命中任一算对
  results: { category: string; hit: boolean }[] // 和 classifyRuns 同序
  apple: string[] // Apple Vision 标签，作参照
}
