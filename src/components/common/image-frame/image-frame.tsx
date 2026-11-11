import { useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { ImageFrameFallback } from './image-frame-fallback'
import { ImageFramePreview } from './image-frame-preview'
import { ImageSkeleton } from './image-skeleton'
import type { ImageFrameProps, ImageFrameState } from './types'

// 图片加载框架
export function ImageFrame(props: ImageFrameProps) {
  const imageRef = useRef<HTMLImageElement>(null)
  const pendingSrcRef = useRef(props.src ?? '')
  const [imageState, setImageState] = useState<ImageFrameState>(() => ({
    displaySrc: props.placeholderSrc ?? '',
    errorSrc: '',
  }))
  const src = props.src ?? ''
  const displaySrc = imageState.displaySrc
  // 优先保留已显示图片，新图先后台加载
  const imageSrc = src ? displaySrc || src : ''
  const isInitialLoading = Boolean(src) && !displaySrc && imageState.errorSrc !== src
  const isError = !src || (!displaySrc && imageState.errorSrc === src)
  const isPreviewEnabled = props.preview !== false
  // src 变化时先加载隐藏图，成功后再替换 displaySrc
  const shouldLoadPending = Boolean(src) && Boolean(displaySrc) && src !== displaySrc
  const fitClassName = props.fit === 'contain' ? 'object-contain' : 'object-cover'
  const containerClassName = cn('relative overflow-hidden bg-muted', props.className)

  // 待加载源
  useLayoutEffect(() => {
    pendingSrcRef.current = src
  }, [src])

  // 预览入口
  function handlePreview() {
    if (!imageRef.current || !imageSrc || isError) {
      return
    }

    new ImageFramePreview(props, imageRef.current, src).open()
  }

  if (isError) {
    return <div className={containerClassName}>{props.fallback ?? <ImageFrameFallback />}</div>
  }

  const imageContent = (
    <>
      {/* 当前图片 */}
      <img
        ref={imageRef}
        src={imageSrc}
        alt={props.alt}
        decoding={props.decoding}
        fetchPriority={props.fetchPriority}
        height={props.height}
        loading={props.loading}
        width={props.width}
        className={cn('h-full w-full', fitClassName, props.imageClassName)}
        onError={() => {
          // 首图失败才进入 fallback；已有旧图时继续保留旧图
          if (!displaySrc || displaySrc === src) {
            setImageState({ displaySrc: '', errorSrc: src })
          }
        }}
        onLoad={() => setImageState({ displaySrc: imageSrc, errorSrc: '' })}
      />
      {shouldLoadPending ? (
        /* 后台换源 */
        <img
          src={src}
          alt=''
          aria-hidden='true'
          decoding={props.decoding}
          fetchPriority={props.fetchPriority}
          height={props.height}
          loading={props.loading}
          width={props.width}
          className='pointer-events-none absolute size-px opacity-0'
          onError={() => {
            // 新图失败不影响当前稳定显示源
            setImageState(current => (current.displaySrc ? current : { displaySrc: '', errorSrc: src }))
          }}
          onLoad={() => {
            // 只接收最新 src，避免旧请求后完成覆盖新图
            setImageState(current => (pendingSrcRef.current === src && current.displaySrc !== src ? { displaySrc: src, errorSrc: '' } : current))
          }}
        />
      ) : null}
    </>
  )

  return (
    <div className={containerClassName}>
      {isInitialLoading ? <ImageSkeleton /> : null}
      {isPreviewEnabled ? (
        <button
          type='button'
          className='block h-full w-full cursor-zoom-in border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
          onClick={handlePreview}
          // CUSTOM: 本工程没有 i18n，直接写中文
          aria-label='放大预览图'
        >
          {imageContent}
        </button>
      ) : (
        imageContent
      )}
    </div>
  )
}
