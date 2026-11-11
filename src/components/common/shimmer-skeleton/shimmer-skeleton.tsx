import Skeleton, { type SkeletonProps } from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

const shimmerBackground = 'linear-gradient(90deg, var(--base-color) 42%, var(--highlight-color) 50%, var(--base-color) 58%)'

// 项目统一的流光骨架：页面只描述布局，主题色和动画节奏在这里保持一致
export function ShimmerSkeleton(props: SkeletonProps) {
  return <Skeleton baseColor='var(--muted)' highlightColor='var(--background)' borderRadius='0.375rem' duration={1.8} customHighlightBackground={shimmerBackground} {...props} />
}
