import { FileText, Image, ScanFace, Sparkles } from 'lucide-react'
import { ImageFrame } from '@/components/common/image-frame/image-frame'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-40'>能力</TableHead>
                <TableHead>效果</TableHead>
                <TableHead className='w-24'>每张耗时</TableHead>
                <TableHead className='w-20'>评价</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appleVisionChecks.map(check => (
                <TableRow key={check.name}>
                  <TableCell className='font-medium'>
                    <div className='flex items-center gap-2'>
                      <check.icon className='size-4' />
                      {check.name}
                    </div>
                  </TableCell>
                  <TableCell>{check.note}</TableCell>
                  <TableCell className='text-muted-foreground tabular-nums'>{check.ms}ms</TableCell>
                  <TableCell>
                    <VerdictIcon verdict={check.verdict} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <SampleSection icon={FileText} title='文字图 → OCR' samples={textual} mode='text' />
      <SampleSection icon={Image} title='场景图 → 标签，按美学分排' samples={scenes} mode='scene' />
    </div>
  )
}

// 一组样本，点开可在组内左右切换
function SampleSection(props: { icon: typeof Image; title: string; samples: VisionSample[]; mode: 'text' | 'scene' }) {
  const items = props.samples.map(sample => ({
    src: fileUrl(`${visionSampleRoot}/${sample.file}`),
    width: sample.width,
    height: sample.height,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <props.icon className='size-4' />
          {props.title}
        </CardTitle>
      </CardHeader>
      <CardContent className='grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8'>
        {props.samples.map((sample, index) => (
          <div key={sample.file} className='grid content-start gap-2'>
            <ImageFrame
              src={items[index].src}
              alt=''
              width={sample.width}
              height={sample.height}
              fit='cover'
              loading='lazy'
              className='aspect-square w-full rounded-lg'
              previewGroup={{ index, items }}
            />
            {props.mode === 'text' ? <TextResult sample={sample} /> : <SceneResult sample={sample} />}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// OCR 结果：字数 + 前两行
function TextResult(props: { sample: VisionSample }) {
  const { text } = props.sample
  return (
    <>
      <Badge variant='secondary'>{text.chars} 字</Badge>
      <p className='line-clamp-2 text-sm text-muted-foreground'>{text.lines.slice(0, 2).join(' / ')}</p>
    </>
  )
}

// 场景结果：美学分、人脸、去掉大类后的前三个标签
function SceneResult(props: { sample: VisionSample }) {
  const { aesthetics, faces, labels } = props.sample
  return (
    <div className='flex flex-wrap gap-1'>
      <Badge>
        <Sparkles />
        {aesthetics.score.toFixed(2)}
      </Badge>
      {faces ? (
        <Badge variant='secondary'>
          <ScanFace />
          {faces}
        </Badge>
      ) : null}
      {specificLabels(labels, 3).map(label => (
        <Badge key={label} variant='outline'>
          {label}
        </Badge>
      ))}
    </div>
  )
}
