import { ImageFrame } from '@/components/common/image-frame/image-frame'
import { Item, ItemContent, ItemDescription, ItemHeader, ItemTitle } from '@/components/ui/item'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { VerdictIcon } from '@/components/verdict-icon'
import { appleVisionChecks, visionSampleRoot, visionSamples, type VisionSample } from '@/data/apple-vision'
import { specificLabels } from '@/data/vision-labels'
import { fileUrl } from '@/lib/file'

// Apple Vision：能力一览 + 按“文字图判断”分流后的样本
export function AppleVisionPage() {
  const textual = visionSamples.filter(sample => sample.aesthetics.utility)
  const scenes = visionSamples.filter(sample => !sample.aesthetics.utility).sort((a, b) => b.aesthetics.score - a.aesthetics.score)

  return (
    <div className='grid gap-4'>
      {/* 能力一览 */}
      <Card>
        <CardHeader>
          <CardTitle>能力一览</CardTitle>
          <CardDescription>30 张 Commons 旅游样本，耗时是单张平均</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>能力</TableHead>
                <TableHead>效果</TableHead>
                <TableHead>每张耗时</TableHead>
                <TableHead>评价</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appleVisionChecks.map(check => (
                <TableRow key={check.name}>
                  <TableCell className='font-medium'>{check.name}</TableCell>
                  <TableCell>{check.note}</TableCell>
                  <TableCell>{check.ms}ms</TableCell>
                  <TableCell>
                    <VerdictIcon verdict={check.verdict} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <SampleSection title='文字图 → 走 OCR' description='“文字图判断”挑出来的，下面是识别出的字数和前两行' samples={textual} mode='text' />
      <SampleSection title='场景图 → 打标签' description='按美学分从高到低排，下面是美学分、人脸数和最具体的三个标签' samples={scenes} mode='scene' />
    </div>
  )
}

// 一组样本，点图可在组内左右切换
function SampleSection(props: { title: string; description: string; samples: VisionSample[]; mode: 'text' | 'scene' }) {
  const items = props.samples.map(sample => ({
    src: fileUrl(`${visionSampleRoot}/${sample.file}`),
    width: sample.width,
    height: sample.height,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
        <CardDescription>{props.description}</CardDescription>
      </CardHeader>
      <CardContent className='grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8'>
        {props.samples.map((sample, index) => (
          <Item key={sample.file} variant='outline'>
            <ItemHeader>
              <ImageFrame
                src={items[index].src}
                alt=''
                width={sample.width}
                height={sample.height}
                fit='cover'
                loading='lazy'
                className='aspect-square w-full rounded-md'
                previewGroup={{ index, items }}
              />
            </ItemHeader>
            <ItemContent>
              <ItemTitle>{props.mode === 'text' ? `${sample.text.chars} 字` : sceneTitle(sample)}</ItemTitle>
              <ItemDescription>{props.mode === 'text' ? sample.text.lines.slice(0, 2).join(' / ') : specificLabels(sample.labels, 3).join('、')}</ItemDescription>
            </ItemContent>
          </Item>
        ))}
      </CardContent>
    </Card>
  )
}

// 场景图标题：美学分，有人脸再带人脸数
function sceneTitle(sample: VisionSample) {
  const score = `美学 ${sample.aesthetics.score.toFixed(2)}`
  return sample.faces ? `${score} · ${sample.faces} 张脸` : score
}
