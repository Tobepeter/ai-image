import { ImageOff } from 'lucide-react'

// 默认图片占位
export function ImageFrameFallback() {
  return (
    <div className='absolute inset-0 grid place-items-center text-muted-foreground'>
      <ImageOff className='size-6' />
    </div>
  )
}
