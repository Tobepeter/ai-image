import { imagePreviewFallbackSize, openImagePreview, openImagePreviewGroup } from './image-preview'
import type { ImageFrameProps, ImagePreviewGroup, ImagePreviewItem, ImagePreviewSize } from './types'

// ImageFrame 预览数据
export class ImageFramePreview {
  constructor(
    private readonly props: ImageFrameProps,
    private readonly element: HTMLImageElement,
    private readonly src: string
  ) {}

  // 预览入口
  open() {
    if (this.props.previewGroup) {
      openImagePreviewGroup(this.createGroup(this.props.previewGroup))
      return
    }

    openImagePreview(this.createItem())
  }

  // 当前图片项
  private createItem(): ImagePreviewItem {
    const props = this.props
    const previewSrc = props.previewItem?.src ?? this.src
    const usesDisplayedSource = this.isDisplayedSource(previewSrc)

    return {
      alt: props.previewItem?.alt ?? props.alt,
      element: this.element,
      height: props.previewItem?.height ?? (usesDisplayedSource ? this.element.naturalHeight : (props.height ?? this.element.naturalHeight)),
      msrc: props.previewItem?.msrc ?? this.element.currentSrc,
      src: previewSrc,
      srcset: props.previewItem?.srcset,
      thumbCropped: props.previewItem?.thumbCropped ?? props.fit !== 'contain',
      width: props.previewItem?.width ?? (usesDisplayedSource ? this.element.naturalWidth : (props.width ?? this.element.naturalWidth)),
    }
  }

  // 当前已加载图片的真实比例比外部元数据更可靠，避免缩略图与预览图过渡时跳变
  private isDisplayedSource(src: string) {
    try {
      return new URL(src, this.element.baseURI).href === this.element.currentSrc
    } catch {
      return src === this.element.currentSrc
    }
  }

  // 预览组快照
  private createGroup(group: ImagePreviewGroup): ImagePreviewGroup {
    const index = group.index ?? 0
    const curr = this.createItem()
    const size = this.getGroupSize(group, index)

    return {
      ...group,
      items: group.items.map((item, itemIndex) => this.createGroupItem(item, itemIndex, index, curr, size)),
    }
  }

  // 预览组条目
  private createGroupItem(item: ImagePreviewItem, itemIndex: number, currIndex: number, curr: ImagePreviewItem, size: ImagePreviewSize): ImagePreviewItem {
    const nextItem = itemIndex === currIndex ? { ...item, ...curr } : item

    return {
      ...nextItem,
      height: item.height ?? size.height,
      width: item.width ?? size.width,
    }
  }

  // 组内兜底尺寸
  private getGroupSize(group: ImagePreviewGroup, index: number): ImagePreviewSize {
    return {
      height: group.items[index]?.height ?? this.props.previewItem?.height ?? this.props.height ?? imagePreviewFallbackSize.height,
      width: group.items[index]?.width ?? this.props.previewItem?.width ?? this.props.width ?? imagePreviewFallbackSize.width,
    }
  }
}
