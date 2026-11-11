import { BrickWall, Film, Sword, type LucideIcon } from 'lucide-react'
import { square, type Shot } from './shot'
import type { Verdict } from './verdict'

// SDXL base + 像素 LoRA 三套小样本，结论取自 data/reports/sdxl-pixel-*.md
const root = 'data/outputs/comfyui/built-in'

export const pixelSuites: PixelSuite[] = [
  {
    id: 'icons',
    name: '道具图标',
    icon: Sword,
    verdict: 'best',
    items: ['sword', 'health-potion', 'shield', 'treasure-chest', 'key'].map(id => square(`${root}/sdxl-pixel-item-icons/processed/128x128/${id}.png`, 128)),
  },
  {
    id: 'tiles',
    name: '地砖',
    icon: BrickWall,
    verdict: 'ok',
    issue: '未验证无缝',
    items: ['grass', 'stone-floor', 'water', 'dirt', 'dungeon-wall-floor'].map(id => square(`${root}/sdxl-pixel-tile-textures/processed/128x128/${id}.png`, 128)),
  },
  {
    id: 'sheets',
    name: '精灵图',
    icon: Film,
    verdict: 'weak',
    issue: '帧数和布局不受控',
    items: ['adventurer-idle', 'slime-bounce', 'knight-walk'].map(id => square(`${root}/sdxl-pixel-sprite-sheets/raw/${id}-seed42.png`, 1024)),
  },
]

export type PixelSuite = {
  id: string
  name: string
  icon: LucideIcon
  verdict: Verdict
  issue?: string
  items: Shot[]
}
