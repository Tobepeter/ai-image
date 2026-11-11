import { ImageGrid } from '@/components/image-grid'
import { ResultCard } from '@/components/result-card'
import { pixelSuites } from '@/data/pixel'

// 像素游戏素材三套小样本
export function PixelPage() {
  return (
    <div className='grid gap-4'>
      {pixelSuites.map(suite => (
        <ResultCard key={suite.id} icon={suite.icon} name={suite.name} verdict={suite.verdict} issue={suite.issue}>
          <ImageGrid shots={suite.items} fit='contain' pixel />
        </ResultCard>
      ))}
    </div>
  )
}
