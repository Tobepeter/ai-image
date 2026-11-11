import { ShimmerSkeleton } from '@/components/common/shimmer-skeleton'

export type ImageSkeletonProps = {
  borderRadius?: string // 圆角
}

// 图片骨架占位
export function ImageSkeleton(props: ImageSkeletonProps) {
  return (
    <div className='absolute inset-0'>
      <ShimmerSkeleton height='100%' width='100%' borderRadius={props.borderRadius ?? '0.5rem'} className='block leading-none' containerClassName='block h-full w-full leading-none' />
    </div>
  )
}
