import { Copy, FileText, QrCode, ScanText, Sparkles, Tags, Users, type LucideIcon } from 'lucide-react'
import report from '../../data/reports/vision/apple-vision-samples.json'
import type { Verdict } from './verdict'

// Apple Vision 跑 30 张 Commons 旅游样本，原始结果在 data/reports/vision/apple-vision-samples.json
export const visionSampleRoot = 'data/input/samples/vision'

export const visionSamples: VisionSample[] = report.images

// 每项能力一句话，耗时是单张平均
export const appleVisionChecks: AppleVisionCheck[] = [
  { name: '文字图判断', icon: FileText, note: '地图、菜单、车票 9/9，多判 1 张包装盒', ms: 6, verdict: 'best' },
  { name: '印刷体 OCR', icon: ScanText, note: '车次、日期、票价、景区名都对，竖排和艺术字会乱', ms: 212, verdict: 'good' },
  { name: '美学评分', icon: Sparkles, note: '合影、夜景最高，文档接近 0，能拿来挑配图', ms: 6, verdict: 'good' },
  { name: '场景标签', icon: Tags, note: '只到湖、床、人群、地图这一级，认不出古城', ms: 8, verdict: 'ok' },
  { name: '人脸 / 人体', icon: Users, note: '合影能数，远景人群数不出', ms: 7, verdict: 'ok' },
  { name: '二维码', icon: QrCode, note: '车票 2/3', ms: 14, verdict: 'ok' },
  { name: '相似度', icon: Copy, note: '最近邻同类 19/30，真重复图还没测', ms: 6, verdict: 'ok' },
]

export type VisionSample = {
  file: string
  width: number
  height: number
  labels: { id: string; p: number }[]
  aesthetics: { score: number; utility: boolean }
  text: { lines: string[]; chars: number }
  faces: number
  humans: number
  animals: string[]
  barcodes: number
  salient: number[][]
  ms: Record<string, number>
}

export type AppleVisionCheck = {
  name: string
  icon: LucideIcon
  note: string
  ms: number // 单张平均毫秒
  verdict: Verdict
}
