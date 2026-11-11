import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { coverOf, fileUrl, groups } from '@/data/entries'
import { markPixel } from '@/lib/image'

// 首页：按分组列出实验入口
export function HomePage() {
  return (
    <div className='mx-auto max-w-6xl space-y-8'>
      <section className='space-y-1'>
        <h1 className='text-xl font-semibold'>AI 图像实验</h1>
        <p className='text-sm text-muted-foreground'>本地 ComfyUI 文生图、像素游戏素材，以及切图、去背景和本地识别模型的后处理</p>
      </section>
      {groups.map(group => (
        <section key={group.title} className='space-y-3'>
          <h2 className='text-sm font-medium text-muted-foreground'>{group.title}</h2>
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {group.entries.map(entry => {
              const cover = coverOf(entry)

              return (
                <Link key={entry.id} to={`/${entry.id}`} className='group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring'>
                  <Card className='h-full pt-0 shadow-none transition-colors group-hover:bg-accent/35'>
                    {/* 封面 */}
                    <div className='grid aspect-video place-items-center overflow-hidden bg-muted/50'>
                      {cover ? <img src={fileUrl(cover)} alt='' loading='lazy' onLoad={markPixel} className='size-full object-cover' /> : <FileText className='size-10 text-muted-foreground' />}
                    </div>
                    <CardHeader>
                      <CardTitle>{entry.title}</CardTitle>
                      {entry.desc ? <CardDescription>{entry.desc}</CardDescription> : null}
                    </CardHeader>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
