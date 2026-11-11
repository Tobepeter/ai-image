import { ImageFrame } from '@/components/common/image-frame/image-frame'
import type { Shot } from '@/data/shot'
import { fileUrl } from '@/lib/file'
import { cn } from '@/lib/utils'

// 一组图，点开后可在组内左右切换；宽高必须给真实值，预览才不会变形
export function ImageGrid(props: ImageGridProps) {
  const items = props.shots.map(shot => ({ src: fileUrl(shot.src), width: shot.width, height: shot.height }))

  return (
    <div className={cn('grid grid-cols-5 gap-3', props.className)}>
      {items.map((item, index) => (
        <ImageFrame
          key={item.src}
          src={item.src}
          alt=''
          width={item.width}
          height={item.height}
          fit={props.fit}
          loading='lazy'
          className='aspect-square w-full rounded-lg'
          imageClassName={props.pixel ? 'pixelated' : undefined}
          previewGroup={{ index, items }}
        />
      ))}
    </div>
  )
}

export type ImageGridProps = {
  shots: Shot[]
  fit?: 'contain' | 'cover' // 默认 cover
  pixel?: boolean // 像素图放大不糊
  className?: string
}
