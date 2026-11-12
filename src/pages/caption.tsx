import { ImageFrame } from '@/components/common/image-frame/image-frame'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { VerdictIcon } from '@/components/verdict-icon'
import { visionSampleRoot } from '@/data/apple-vision'
import { captionRuns, captionSamples } from '@/data/caption'
import { batchTime } from '@/data/classify'
import { fileUrl } from '@/lib/file'

// 一句话描述：模型一览（优缺点、类别分对、字数、体积、耗时、批量估算）+ 每张图各模型的类别和描述
export function CaptionPage() {
  const items = captionSamples.map(sample => ({ src: fileUrl(`${visionSampleRoot}/${sample.file}`), width: sample.width, height: sample.height }))

  return (
    <div className='grid gap-4'>
      {/* 模型一览 */}
      <Card>
        <CardHeader>
          <CardTitle>模型对比</CardTitle>
          <CardDescription>同 30 张旅游图，要求一句中文描述 + 从 10 个类别里选一个</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>模型</TableHead>
                <TableHead>优点</TableHead>
                <TableHead>问题</TableHead>
                <TableHead>类别分对</TableHead>
                <TableHead>平均字数</TableHead>
                <TableHead>体积</TableHead>
                <TableHead>冷启动</TableHead>
                <TableHead>每张耗时</TableHead>
                <TableHead>估 200 张</TableHead>
                <TableHead>评价</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {captionRuns.map(run => (
                <TableRow key={run.name}>
                  <TableCell className='font-medium'>{run.name}</TableCell>
                  <TableCell className='whitespace-normal'>{run.pros}</TableCell>
                  <TableCell className='whitespace-normal'>{run.cons}</TableCell>
                  <TableCell>
                    <Badge variant={run.hits === run.total ? 'default' : 'secondary'}>
                      {run.hits}/{run.total}
                    </Badge>
                  </TableCell>
                  <TableCell>{run.chars} 字</TableCell>
                  <TableCell>{run.size}</TableCell>
                  <TableCell>{run.coldS === 'pending' ? <Badge variant='outline'>待重测</Badge> : run.coldS ? `${run.coldS}s` : '—'}</TableCell>
                  <TableCell>{run.ms}ms</TableCell>
                  <TableCell>{batchTime(run.coldS, run.ms)}</TableCell>
                  <TableCell>
                    <VerdictIcon verdict={run.verdict} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 横向对比：每行一张图，每列一个模型的描述 */}
      <Card>
        <CardHeader>
          <CardTitle>每张图的结果</CardTitle>
          <CardDescription>红色是类别分错或没给</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>图</TableHead>
                <TableHead>参考</TableHead>
                {captionRuns.map(run => (
                  <TableHead key={run.name}>{run.name}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {captionSamples.map((sample, index) => (
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
                    <TableCell key={captionRuns[runIndex].name} className='whitespace-normal'>
                      <div className='grid justify-items-start gap-1'>
                        <Badge variant={result.hit ? 'secondary' : 'destructive'}>{result.category || '没给类别'}</Badge>
                        {result.desc}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
