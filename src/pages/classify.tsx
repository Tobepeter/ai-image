import { ThumbsUp, TriangleAlert } from 'lucide-react'
import { ImageFrame } from '@/components/common/image-frame/image-frame'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { VerdictIcon } from '@/components/verdict-icon'
import { batchTime, classifyRuns, classifySamples } from '@/data/classify'
import { visionSampleRoot } from '@/data/apple-vision'
import { fileUrl } from '@/lib/file'

// 分类：准确率和耗时对比 + 每张图各模型横向对比
export function ClassifyPage() {
  const items = classifySamples.map(sample => ({ src: fileUrl(`${visionSampleRoot}/${sample.file}`), width: sample.width, height: sample.height }))

  return (
    <div className='grid gap-4'>
      {/* 对比表 */}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>模型</TableHead>
                <TableHead>方式</TableHead>
                <TableHead>优点</TableHead>
                <TableHead>问题</TableHead>
                <TableHead className='w-56'>分对</TableHead>
                <TableHead>冷启动</TableHead>
                <TableHead>每张耗时</TableHead>
                <TableHead>估 200 张</TableHead>
                <TableHead>评价</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classifyRuns.map(run => (
                <TableRow key={run.name}>
                  <TableCell className='font-medium'>{run.name}</TableCell>
                  <TableCell>
                    <Badge variant='outline'>{run.way}</Badge>
                  </TableCell>
                  <TableCell className='whitespace-normal'>
                    <div className='flex items-start gap-2'>
                      <ThumbsUp className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
                      {run.pros}
                    </div>
                  </TableCell>
                  <TableCell className='whitespace-normal'>
                    <div className='flex items-start gap-2'>
                      <TriangleAlert className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
                      {run.cons}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-3'>
                      <Progress value={(run.hits / run.total) * 100} className='flex-1' />
                      <span className='w-12 text-muted-foreground tabular-nums'>
                        {run.hits}/{run.total}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className='text-muted-foreground tabular-nums'>{run.coldS === 'pending' ? <Badge variant='outline'>待重测</Badge> : run.coldS ? `${run.coldS}s` : '—'}</TableCell>
                  <TableCell className='text-muted-foreground tabular-nums'>{run.ms}ms</TableCell>
                  <TableCell className='text-muted-foreground tabular-nums'>{batchTime(run.coldS, run.ms)}</TableCell>
                  <TableCell>
                    <VerdictIcon verdict={run.verdict} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 横向对比：每行一张图，每列一个模型 */}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-28'>图</TableHead>
                <TableHead>参考</TableHead>
                {classifyRuns.map(run => (
                  <TableHead key={run.name}>{run.name}</TableHead>
                ))}
                <TableHead>Apple Vision 标签</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classifySamples.map((sample, index) => (
                <TableRow key={sample.file}>
                  <TableCell>
                    <ImageFrame
                      src={items[index].src}
                      alt=''
                      width={sample.width}
                      height={sample.height}
                      fit='cover'
                      loading='lazy'
                      className='aspect-square w-24 rounded-lg'
                      previewGroup={{ index, items }}
                    />
                  </TableCell>
                  <TableCell>
                    <div className='flex flex-col items-start gap-1'>
                      {sample.truth.map(item => (
                        <Badge key={item} variant='outline'>
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  {sample.results.map((result, runIndex) => (
                    <TableCell key={classifyRuns[runIndex].name}>
                      <Badge variant={result.hit ? 'secondary' : 'destructive'}>{result.category || '没给'}</Badge>
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className='flex flex-col items-start gap-1'>
                      {sample.apple.map(item => (
                        <Badge key={item} variant='outline'>
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
