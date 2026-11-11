import { ImageUp } from 'lucide-react'
import { ImageGrid } from '@/components/image-grid'
import { ResultCard } from '@/components/result-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cutoutInput, cutoutMethods } from '@/data/postprocess'

// 去背景：同一张图，四种方法
export function CutoutPage() {
  return (
    <div className='grid gap-4 md:grid-cols-3 xl:grid-cols-5'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <ImageUp className='size-4' />
            原图
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ImageGrid shots={[cutoutInput]} fit='contain' className='grid-cols-1' />
        </CardContent>
      </Card>
      {cutoutMethods.map(method => (
        <ResultCard key={method.name} icon={method.icon} name={method.name} verdict={method.verdict} issue={method.issue}>
          <ImageGrid shots={[method.shot]} fit='contain' className='grid-cols-1' />
        </ResultCard>
      ))}
    </div>
  )
}
