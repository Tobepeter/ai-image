import { Building2, Clapperboard, Grid3x3, Mountain, Smile, Swords, User, type LucideIcon } from 'lucide-react'
import { square } from './shot'
import type { Verdict } from './verdict'

// SDXL base 主题套件，结论取自 data/reports/sdxl-theme-suite.md
const root = 'data/outputs/comfyui/built-in/sdxl-theme-suite'

export const themes: Theme[] = [
  { id: 'landscape', name: '风景', icon: Mountain, verdict: 'best', cases: ['alpine-lake', 'coastal-cliff', 'forest-trail', 'desert-dunes', 'waterfall-valley'] },
  { id: 'clear-portrait', name: '人像', icon: User, verdict: 'good', issue: '脸型雷同', cases: ['window-light', 'studio-softbox', 'golden-hour', 'black-white', 'profile'] },
  { id: 'city-night', name: '夜景', icon: Building2, verdict: 'good', issue: '招牌伪文字', cases: ['rainy-alley', 'rooftop-skyline', 'subway-entrance', 'empty-street', 'food-stall'] },
  { id: 'poster-cover', name: '海报', icon: Clapperboard, verdict: 'good', issue: '文字不能直出', cases: ['sci-fi-film', 'fantasy-book', 'music-album', 'travel', 'game-launch'] },
  {
    id: 'game-assets',
    name: '游戏素材',
    icon: Swords,
    verdict: 'good',
    issue: '单物体会变成一组',
    prefix: 'game-asset',
    cases: ['sword-icon', 'potion-bottle', 'isometric-house', 'treasure-room', 'creature-companion'],
  },
  { id: 'cartoon-anime', name: '动漫', icon: Smile, verdict: 'ok', issue: '角色不一致', cases: ['girl-garden', 'boy-bike', 'cat-wizard', 'mecha-pilot', 'food-cafe'] },
  { id: 'pixel-art', name: '像素', icon: Grid3x3, verdict: 'weak', issue: '不是真像素格', cases: ['forest-cabin', 'hero-idle', 'city-rain', 'treasure-chest', 'platformer-level'] },
]

export function themeImage(theme: Theme, name: string) {
  return square(`${root}/${theme.id}/${theme.prefix ?? theme.id}-${name}-seed42.png`, 1024)
}

export type Theme = {
  id: string
  name: string
  icon: LucideIcon
  verdict: Verdict
  issue?: string // 主要问题，几个字
  prefix?: string // 文件名前缀，缺省同 id
  cases: string[]
}
