import type { Shot } from '@/data/types'
import type { LightboxShot } from './lightbox'
import { markPixel } from '@/lib/image'

// 图片墙
export function ShotGrid(props: ShotGridProps) {
  return (
    <div className='grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4'>
      {props.items.map(item => {
        const src = props.resolve(item.src)

        return (
          <button key={item.src} type='button' onClick={() => props.onOpen({ src, title: item.title })} className='group text-left outline-none'>
            <div className='aspect-square overflow-hidden rounded-lg border bg-muted/40'>
              <img
                src={src}
                alt={item.title ?? ''}
                loading='lazy'
                onLoad={markPixel}
                className='size-full object-contain transition-transform group-hover:scale-[1.02] group-focus-visible:scale-[1.02]'
              />
            </div>
            {item.title ? <div className='mt-1.5 truncate text-sm'>{item.title}</div> : null}
            {item.caption ? <div className='line-clamp-2 text-xs text-muted-foreground'>{item.caption}</div> : null}
          </button>
        )
      })}
    </div>
  )
}

export type ShotGridProps = {
  items: Shot[]
  resolve: (src: string) => string // 相对路径转地址
  onOpen: (shot: LightboxShot) => void
}
