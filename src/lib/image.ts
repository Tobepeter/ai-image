import type { SyntheticEvent } from 'react'

// 小图（像素素材）放大时用最近邻，避免糊边
export function markPixel(e: SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget
  if (img.naturalWidth && img.naturalWidth <= 256) img.dataset.pixel = ''
}
