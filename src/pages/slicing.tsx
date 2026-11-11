import { ImageGrid } from '@/components/image-grid'
import { slicedSheets } from '@/data/postprocess'

// 拆图集：红框是自动找到的每个素材
export function SlicingPage() {
  return <ImageGrid shots={slicedSheets} fit='contain' className='grid-cols-1 gap-6 xl:grid-cols-2' />
}
