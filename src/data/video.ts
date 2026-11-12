import shotsReport from '../../data/reports/video/shots.json'
import keyframesReport from '../../data/reports/video/keyframes.json'

// 视频快速理解：切镜头对比 + 关键帧去重和一句话，原片在任务目录 .temp/tasks/ai-image/files/video/source/
export const videoSourceRoot = '.temp/tasks/ai-image/files/video/source'

export const detectorNames: Record<DetectorId, string> = {
  content: '内容检测（算法）',
  adaptive: '自适应检测（算法）',
  transnet: 'TransNetV2（小模型）',
}

export const detectorIds: DetectorId[] = ['content', 'adaptive', 'transnet']

// 每段视频的中文名和看点
const titles: Record<string, { title: string; note: string }> = {
  bbc_02: { title: 'BBC 地球脉动·山脉', note: '纪录片，带人工标注切点' },
  'tears-of-steel': { title: 'Tears of Steel', note: '真人短片，剪辑多' },
  'walking-noodle': { title: '街拍·拉面师傅', note: '一镜到底，边走边拍' },
  'walking-nanjing-road': { title: '街拍·南京路', note: '一镜到底，边走边拍' },
}

export const videos: VideoItem[] = Object.entries(shotsReport).map(([stem, shot]) => {
  const frames = keyframesReport[stem as keyof typeof keyframesReport]
  return {
    stem,
    ...titles[stem],
    file: shot.file,
    fps: shot.fps,
    duration: shot.duration,
    truth: shot.truth,
    runs: shot.runs as VideoItem['runs'],
    frames: frames as VideoFrames | undefined,
  }
})

// 秒转 分:秒
export function clock(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

export type DetectorId = 'content' | 'adaptive' | 'transnet'

export type ShotScore = { hits: number; detected: number; truth: number; precision: number; recall: number; f1: number }

export type VideoItem = {
  stem: string
  title: string
  note: string
  file: string
  fps: number
  duration: number // 秒
  truth: number[] | null // 标注切点（帧），没有标注为空
  runs: Record<DetectorId, { cuts: number[]; seconds: number; speed: number; score?: ShotScore }>
  frames?: VideoFrames
}

export type VideoScene = {
  start: number // 帧
  end: number
  mid: number
  split?: boolean // 长镜头细分出来的段
  image: string // 关键帧路径，相对工程根目录
  group: number // 归到哪张代表帧
  sim?: number // 和代表帧的相似度
  desc?: string // 代表帧的一句话
}

export type VideoFrames = {
  detector: DetectorId
  threshold: number // 去重相似度阈值
  max_scene_s: number // 长镜头细分间隔
  model: string
  scenes: VideoScene[]
  reps: number[]
  kept: Record<string, number> // 不同去重阈值下剩几张
  summary: { frames: number[]; text: string }
  timing: Record<string, number>
}
