import type { Entry, Group } from './types'

const sheets = 'data/outputs/reports/contact-sheets'
const task = '.temp/tasks/ai-image'
const frameronin = ['home', 'sprite-sheet-upload', 'sprite-sheet-adjust', 'video-to-frames', 'free-generate', 'free-generate-failed', 'api-settings']

// 展示目录：按实验分组，报告直接读 data/reports
export const groups: Group[] = [
  {
    title: '文生图',
    entries: [
      {
        id: 'first-run',
        title: '首跑冒烟',
        desc: 'SD1.5 冒烟和 SDXL 第一张基线图，确认本机 ComfyUI 能跑',
        date: '2026-05-21',
        items: [
          { src: 'data/outputs/comfyui/smoke/sd15-smoke-t2i/sd15-smoke-t2i-seed42.png', title: 'SD1.5', caption: '512×512 · 约 7 秒' },
          { src: 'data/outputs/comfyui/built-in/sdxl-basic-t2i/sdxl-basic-t2i-seed42.png', title: 'SDXL base', caption: '1024×1024 · 约 98 秒' },
        ],
        md: 'data/reports/comfyui-first-run.md',
      },
      {
        id: 'built-in',
        title: '早期内置提示词',
        desc: 'SDXL 跑 6 条通用提示词，已被主题套件替代',
        date: '2026-05-21',
        cover: 'data/outputs/comfyui/built-in/sdxl-basic-t2i/city-night-neon-seed42.png',
        md: 'data/reports/sdxl-built-in-suite.md',
      },
      {
        id: 'theme-suite',
        title: '主题套件',
        desc: '7 个主题 × 5 张，共 35 张 SDXL base 图',
        date: '2026-05-21',
        cover: `${sheets}/sdxl-theme-suite-contact-sheet.jpg`,
        md: 'data/reports/sdxl-theme-suite.md',
      },
    ],
  },
  {
    title: '像素游戏素材',
    entries: [
      {
        id: 'pixel-overview',
        title: '三套素材总览',
        desc: 'SDXL + 像素 LoRA，道具图标、地砖、精灵图各一小套',
        date: '2026-05-21',
        cover: `${sheets}/sdxl-pixel-item-icons-contact-sheet.jpg`,
        md: 'data/reports/sdxl-pixel-game-assets.md',
      },
      {
        id: 'pixel-icons',
        title: '道具图标',
        desc: '5 张，三套里效果最好',
        cover: 'data/outputs/comfyui/built-in/sdxl-pixel-item-icons/processed/128x128/sword.png',
        md: 'data/reports/sdxl-pixel-item-icons.md',
      },
      { id: 'pixel-tiles', title: '地砖纹理', desc: '5 张，还要验证能不能无缝拼接', cover: `${sheets}/sdxl-pixel-tile-textures-contact-sheet.jpg`, md: 'data/reports/sdxl-pixel-tile-textures.md' },
      { id: 'pixel-sheets', title: '精灵图', desc: '3 张，网格布局还控制不住', cover: `${sheets}/sdxl-pixel-sprite-sheets-contact-sheet.jpg`, md: 'data/reports/sdxl-pixel-sprite-sheets.md' },
    ],
  },
  {
    title: '素材后处理',
    entries: [
      {
        id: 'item-sheet',
        title: '五道具图集',
        desc: '确定性切图、透明背景、bbox 和 atlas，对比 rembg、SAM2、OpenCV',
        date: '2026-05-22',
        cover: 'data/outputs/assets/sprite-postprocess/item-sheet/runs/solid-bg/previews/pixel-item-sprite-sheet.contact-sheet.png',
        md: 'data/reports/sprite-item-sheet.md',
      },
      {
        id: 'dungeon',
        title: 'Dungeon 图集',
        desc: '去掉烘进像素的棋盘格背景，拆出 56 + 79 张散图',
        date: '2026-05-23',
        cover: 'data/outputs/assets/sprite-postprocess/dungeon-sheets/runs/checker-bg/previews/dungeon01.contact-sheet.png',
        md: 'data/reports/dungeon-sheets.md',
      },
      { id: 'model-install', title: '本地识别模型', desc: 'Florence-2、Moondream2、Qwen2.5-VL、SmolVLM2、SAM2 的安装和冒烟结果', date: '2026-05-22', md: 'data/reports/model-install.md' },
    ],
  },
  {
    title: '外部参考',
    entries: [
      {
        id: 'external',
        title: 'imagegen 与 FrameRonin',
        desc: 'Codex 内置 imagegen 出的道具图集，以及 FrameRonin 网站的像素工具试用',
        date: '2026-05-21',
        items: [
          { src: `${task}/files/imagegen/pixel-item-sprite-sheet-20260521-221111.png`, title: 'Codex imagegen', caption: '5 个道具的像素图集，后处理用的就是这张' },
          ...frameronin.map(name => ({ src: `${task}/files/frameronin/${name}.png`, title: `FrameRonin · ${name}` })),
        ],
        md: `${task}/research/frameronin-exploration-2026-05-21.md`,
      },
    ],
  },
]

export const entries = groups.flatMap(group => group.entries)

// 工程内文件地址，开发服务直接从根目录提供
export function fileUrl(file: string) {
  return `/${file}`
}

export function coverOf(entry: Entry) {
  return entry.cover ?? entry.items?.[0]?.src
}
