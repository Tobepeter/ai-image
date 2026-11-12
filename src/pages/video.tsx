import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { VerdictIcon } from '@/components/verdict-icon'
import { VideoReview } from '@/components/video-review'
import { clock, detectorIds, detectorNames, videos } from '@/data/video'
import type { Verdict } from '@/data/verdict'

// 视频快速理解：结论（两张表）和体验（看视频 + 关键帧）分开
export function VideoPage() {
  const bbc = videos.find(video => video.truth)

  return (
    <Tabs defaultValue='summary'>
      <TabsList>
        <TabsTrigger value='summary'>结论</TabsTrigger>
        <TabsTrigger value='try'>体验</TabsTrigger>
      </TabsList>

      {/* 结论 */}
      <TabsContent value='summary' className='grid gap-4 xl:grid-cols-2'>
        {bbc ? (
          <Card>
            <CardHeader>
              <CardTitle>切镜头准不准</CardTitle>
              <CardDescription>BBC 纪录片 48 分钟，人工标了 {bbc.truth.length} 个切点；综合分（F1）把“切对”和“不漏”合成一个数，1 最好</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>方法</TableHead>
                    <TableHead>综合分（F1）</TableHead>
                    <TableHead>切对</TableHead>
                    <TableHead>漏掉</TableHead>
                    <TableHead>耗时</TableHead>
                    <TableHead>评价</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detectorIds.map(id => {
                    const run = bbc.runs[id]
                    return (
                      <TableRow key={id}>
                        <TableCell className='font-medium'>{detectorNames[id]}</TableCell>
                        <TableCell>{run.score.f1}</TableCell>
                        <TableCell>{Math.round(run.score.precision * 100)}%</TableCell>
                        <TableCell>{Math.round((1 - run.score.recall) * 100)}%</TableCell>
                        <TableCell>{Math.round(run.seconds)} 秒</TableCell>
                        <TableCell>
                          <VerdictIcon verdict={cutVerdicts[id]} />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>一段视频压成几张图</CardTitle>
            <CardDescription>切镜头 → 每段一帧 → 去重 → 每张一句话</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>视频</TableHead>
                  <TableHead>时长</TableHead>
                  <TableHead>镜头段</TableHead>
                  <TableHead>剩几张</TableHead>
                  <TableHead>总耗时</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videos.map(video => {
                  const frames = video.frames
                  const total = frames ? Object.values(frames.timing).reduce((sum, value) => sum + value, 0) : 0
                  return (
                    <TableRow key={video.stem}>
                      <TableCell className='font-medium'>{video.title}</TableCell>
                      <TableCell>{clock(video.duration)}</TableCell>
                      <TableCell>{frames?.scenes.length}</TableCell>
                      <TableCell>
                        <Badge variant='secondary'>{frames?.reps.length} 张</Badge>
                      </TableCell>
                      <TableCell>{Math.round(total)} 秒</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>每一步是谁做的</CardTitle>
            <CardDescription>切镜头不靠语言模型；描述和概括都是 Qwen3.5-2B 看图写的</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>步骤</TableHead>
                  <TableHead>谁来做</TableHead>
                  <TableHead>怎么做</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {steps.map(step => (
                  <TableRow key={step.name}>
                    <TableCell className='font-medium'>{step.name}</TableCell>
                    <TableCell>
                      <Badge variant='outline'>{step.who}</Badge>
                    </TableCell>
                    <TableCell className='whitespace-normal'>{step.how}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>要点</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className='grid list-disc gap-2 pl-5'>
              <li>
                <strong>切镜头用自适应检测就够</strong>：三种方法都几乎不切错，差在漏掉淡入淡出；TransNetV2 漏得最少，但慢 30 倍
              </li>
              <li>
                <strong>一镜到底要补帧</strong>：街拍没有剪辑、切不出镜头，长镜头每 10 秒补一帧，再靠去重合并
              </li>
              <li>
                <strong>去重还偏松</strong>：纪录片 48 分钟剩 230 张，阈值放宽一点能到 110 张左右
              </li>
              <li>
                <strong>整段概括能用</strong>：拉面那段概括成“擀面 → 切条 → 拉面 → 下锅”
              </li>
            </ul>
          </CardContent>
        </Card>
      </TabsContent>

      {/* 体验：选一段视频 */}
      <TabsContent value='try'>
        <Tabs defaultValue={videos[0]?.stem}>
          <TabsList variant='line'>
            {videos.map(video => (
              <TabsTrigger key={video.stem} value={video.stem}>
                {video.title}
              </TabsTrigger>
            ))}
          </TabsList>
          {videos.map(video => (
            <TabsContent key={video.stem} value={video.stem}>
              <VideoReview video={video} />
            </TabsContent>
          ))}
        </Tabs>
      </TabsContent>
    </Tabs>
  )
}

// 流水线每一步
const steps = [
  { name: '切镜头', who: '自适应检测 / TransNetV2', how: '算法比相邻帧颜色差，突变就切；TransNetV2 是 31MB 的小模型，专认转场' },
  { name: '每段取一帧', who: 'ffmpeg', how: '取每段中间一帧；超过 10 秒的长镜头每 10 秒补一帧' },
  { name: '去重', who: 'SigLIP 2', how: '把每帧变成向量，和已留下的帧相似度 ≥ 0.9 就算重复' },
  { name: '每张一句话', who: 'Qwen3.5-2B', how: '逐张看留下的代表帧，各写一句中文' },
  { name: '整段概括', who: 'Qwen3.5-2B', how: '一次看 8 张均匀挑出的代表帧，写几句话说讲了什么、有几个场景' },
]

const cutVerdicts: Record<string, Verdict> = { content: 'ok', adaptive: 'good', transnet: 'best' }
