// 带尺寸的图片：预览按真实比例展开，不靠缩略图猜
export type Shot = {
  src: string // 相对工程根目录
  width: number
  height: number
}

export function square(src: string, size: number): Shot {
  return { src, width: size, height: size }
}
