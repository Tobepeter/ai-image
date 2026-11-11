import type { ImgHTMLAttributes, ReactNode } from 'react'
import type { SlideData } from 'photoswipe'

export type ImagePreviewItem = {
  alt?: string // 大图 alt
  element?: HTMLElement // 打开动画起点元素
  height?: number // PhotoSwipe 布局高度
  msrc?: string // 低清占位图 / 缩略图
  src: string // 大图地址
  srcset?: string // 响应式大图候选
  thumbCropped?: boolean // 起点缩略图是否被 cover 裁剪
  width?: number // PhotoSwipe 布局宽度
}

export type ImagePreviewGroup = {
  index?: number // 初始打开位置
  items: ImagePreviewItem[] // 可切换图片组
}

export type ImagePreviewSize = {
  height: number // PhotoSwipe 布局高度
  width: number // PhotoSwipe 布局宽度
}

export type ImagePreviewDirection = 'next' | 'prev'

export type ImagePreviewZoomContext = {
  elementSize: { x: number; y: number } | null // PhotoSwipe 认为的图片尺寸
  fit: number // PhotoSwipe 默认 contain 缩放
  panAreaSize: { x: number; y: number } | null // 可用预览区域
}

export type ImageFrameProps = {
  alt: string // 替代文本
  className?: string // 外层样式
  decoding?: ImgHTMLAttributes<HTMLImageElement>['decoding'] // 解码策略
  fallback?: ReactNode // 缺图 / 加载失败占位
  fetchPriority?: ImgHTMLAttributes<HTMLImageElement>['fetchPriority'] // 请求优先级
  fit?: 'contain' | 'cover' // 图片填充模式
  height?: number // img height 属性
  imageClassName?: string // 图片样式
  loading?: ImgHTMLAttributes<HTMLImageElement>['loading'] // 加载策略
  placeholderSrc?: string | null // 高清图完成前显示的低清图
  preview?: boolean // 是否允许点击预览
  previewGroup?: ImagePreviewGroup // 多图预览配置
  previewItem?: Partial<ImagePreviewItem> // 单图预览覆盖项
  src?: string | null // 图片地址
  width?: number // img width 属性
}

export type ImageFrameState = {
  displaySrc: string // 当前稳定显示源
  errorSrc: string // 最近失败源
}

export type PhotoSwipeSlideData = SlideData
