import { useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { clock, videoSourceRoot, type VideoItem } from '@/data/video'
import { fileUrl } from '@/lib/file'
import { cn } from '@/lib/utils'

// 单段视频体验：左边视频 + 选中帧的描述（整段概括默认收起），右边只放代表帧缩略图
export function VideoReview(props: { video: VideoItem }) {
  const { video } = props
  const player = useRef<HTMLVideoElement>(null)
  const [selected, setSelected] = useState(0)
  const frames = video.frames
  if (!frames) return null

  // 每张代表帧覆盖的时间：从它开始，到下一张代表帧开始
  const items = frames.reps.map((index, order) => {
    const next = frames.reps[order + 1]
    return {
      start: frames.scenes[index].start / video.fps,
      end: next === undefined ? video.duration : frames.scenes[next].start / video.fps,
      scene: frames.scenes[index],
    }
  })
  const curr = items[selected]

  // 点缩略图：选中并跳过去
  const pick = (order: number) => {
    setSelected(order)
    if (!player.current) return
    player.current.currentTime = items[order].start
    player.current.play()
  }

  // 播放时选中跟着走
  const follow = (seconds: number) => {
    const order = items.findIndex(item => seconds >= item.start && seconds < item.end)
    if (order >= 0 && order !== selected) setSelected(order)
  }

  return (
    // CUSTOM: 固定高度让整块一屏放下，缩略图在卡片内滚动
    <div className='grid h-[calc(100vh-15rem)] min-h-[32rem] gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'>
      {/* 视频 + 选中帧 */}
      <div className='flex min-h-0 flex-col gap-4'>
        {/* CUSTOM: 固定 16:9，切换视频时不跳高度 */}
        <video
          ref={player}
          src={fileUrl(`${videoSourceRoot}/${video.file}`)}
          controls
          preload='metadata'
          className='aspect-video w-full rounded-xl bg-black object-contain'
          onTimeUpdate={event => follow(event.currentTarget.currentTime)}
        />
        <Card className='min-h-0 flex-1 overflow-auto'>
          <CardHeader>
            <CardTitle>{clock(curr.start)}</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-2'>
            <p>{curr.scene.desc}</p>
            <Collapsible>
              <CollapsibleTrigger render={<Button variant='ghost' size='sm' />}>
                整段概括
                <ChevronDown />
              </CollapsibleTrigger>
              <CollapsibleContent className='whitespace-pre-line'>{frames.summary.text.replaceAll('**', '')}</CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      </div>

      {/* 代表帧缩略图 */}
      <Card className='min-h-0'>
        <CardHeader>
          <CardTitle>代表帧</CardTitle>
          <CardAction>
            <Badge variant='secondary'>{items.length} 张</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className='min-h-0 flex-1'>
          <ScrollArea className='h-full'>
            <div className='grid grid-cols-3 gap-2'>
              {items.map((item, order) => (
                <button
                  key={item.scene.image}
                  type='button'
                  aria-label={`跳到 ${clock(item.start)}`}
                  onClick={() => pick(order)}
                  className={cn('overflow-hidden rounded-md ring-2 ring-transparent', order === selected && 'ring-primary')}
                >
                  <img src={fileUrl(item.scene.image)} alt='' loading='lazy' className='aspect-video w-full object-cover' />
                </button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
