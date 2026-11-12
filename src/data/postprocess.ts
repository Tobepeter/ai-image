import { square, type Shot } from './shot'
import type { Verdict } from './verdict'

// 五道具图集的去背景方法对比，结论取自 data/reports/sprite-item-sheet.md
const run = 'data/outputs/assets/sprite-postprocess/item-sheet/runs'

export const cutoutInput = square(`${run}/solid-bg/input/pixel-item-sprite-sheet.png`, 1254)

export const cutoutMethods: Method[] = [
  { name: '纯色抠除', verdict: 'best', shot: { src: `${run}/solid-bg/previews/pixel-item-sprite-sheet.contact-sheet.png`, width: 900, height: 180 } },
  { name: 'OpenCV 连通域', verdict: 'good', shot: square(`${run}/opencv-components/bbox-overlay.png`, 1254) },
  { name: 'SAM2 框选', verdict: 'good', issue: '要先给框', shot: square(`${run}/sam2-box/chest.checker-preview.png`, 1254) },
  { name: 'rembg', verdict: 'weak', issue: '发灰发软', shot: square(`${run}/rembg/pixel-item-sprite-sheet.checker-preview.png`, 1254) },
]

// Dungeon 图集：棋盘格背景烘进了像素，去掉后按连通域拆开
const dungeon = 'data/outputs/assets/sprite-postprocess/dungeon-sheets/runs/checker-bg/debug'

export const slicedSheets = ['dungeon01', 'dungeon02'].map(name => square(`${dungeon}/${name}.bbox-overlay.png`, 1254))

export type Method = {
  name: string
  verdict: Verdict
  issue?: string
  shot: Shot
}
