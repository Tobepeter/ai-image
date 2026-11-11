// 本地识别模型对同一张五道具图的回答，取自 data/outputs/assets/sprite-postprocess/item-sheet/runs/*/ 的结果
import { square } from './shot'

export const visionInput = square('data/outputs/assets/sprite-postprocess/item-sheet/runs/solid-bg/input/pixel-item-sprite-sheet.png', 1254)

export const visionTotal = 5

export const visionRuns: VisionRun[] = [
  { model: 'SmolVLM2', size: '2.2B', hit: 5, sec: 7.78, answer: 'crystal, sword, potion, key, chest' },
  { model: 'Moondream2', size: '1.9B', hit: 5, sec: 3.22, answer: 'a crystal, a sword, a bottle, a key, and a chest' },
  { model: 'Qwen2.5-VL-3B', size: '3.8B', hit: 5, sec: 7.1, answer: 'diamond, sword, potion, key, chest' },
  { model: 'Florence-2', size: '0.23B', hit: 4, sec: 1.33, answer: 'A set of pixel art items including a sword, a chest, a key, and a crystal.' },
]

export type VisionRun = {
  model: string
  size: string // 参数量
  hit: number // 认对几个
  sec: number // 单次耗时
  answer: string // 原始回答，悬停看
}
