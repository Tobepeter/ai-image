import { ExternalLink } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { markPixel } from '@/lib/image'

// 大图查看
export function Lightbox(props: LightboxProps) {
  const shot = props.shot

  return (
    <Dialog open={!!shot} onOpenChange={open => !open && props.onClose()}>
      <DialogContent className='max-w-[min(96vw,1400px)] gap-3 sm:max-w-[min(96vw,1400px)]'>
        {shot ? (
          <>
            <img src={shot.src} alt={shot.title ?? ''} onLoad={markPixel} className='mx-auto max-h-[80vh] min-h-48 w-auto max-w-full rounded-md object-contain' />
            <div className='flex items-center gap-3 pr-8'>
              <DialogTitle className='min-w-0 truncate text-sm font-normal text-muted-foreground'>{shot.title || shot.src.split('/').pop()}</DialogTitle>
              <a href={shot.src} target='_blank' rel='noreferrer' className='ml-auto flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground'>
                原图
                <ExternalLink className='size-3' />
              </a>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

export type LightboxShot = {
  src: string // 已解析的地址
  title?: string
}

export type LightboxProps = {
  shot: LightboxShot | null
  onClose: () => void
}
