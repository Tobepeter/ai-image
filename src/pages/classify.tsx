import { ImageFrame } from '@/components/common/image-frame/image-frame'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress, ProgressLabel } from '@/components/ui/progress'
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
        <CardHeader>
          <CardTitle>方法对比</CardTitle>
          <CardDescription>同 30 张旅游图、10 个中文类别；估 200 张 = 冷启动一次 + 200 × 每张</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>模型</TableHead>
                <TableHead>方式</TableHead>
                <TableHead>优点</TableHead>
                <TableHead>问题</TableHead>
                <TableHead>分对</TableHead>
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
                  <TableCell className='whitespace-normal'>{run.pros}</TableCell>
                  <TableCell className='whitespace-normal'>{run.cons}</TableCell>
                  <TableCell>
                    <Progress value={(run.hits / run.total) * 100}>
                      <ProgressLabel>
                        {run.hits}/{run.total}
                      </ProgressLabel>
                    </Progress>
                  </TableCell>
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

      {/* 横向对比：每行一张图，每列一个模型 */}
      <Card>
        <CardHeader>
          <CardTitle>每张图的结果</CardTitle>
          <CardDescription>红色是分错；最后一列是 Apple Vision 自带标签，作参照</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>图</TableHead>
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
