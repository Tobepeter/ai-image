import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Lightbox, type LightboxShot } from '@/components/viewer/lightbox'
import { MarkdownView } from '@/components/viewer/markdown-view'
import { ShotGrid } from '@/components/viewer/shot-grid'
import { entries, fileUrl } from '@/data/entries'
import type { Entry } from '@/data/types'

// 单个条目：图片墙 + 报告
export function EntryView(props: EntryViewProps) {
  const entry = props.entry
  const [shot, setShot] = useState<LightboxShot>(null)

  // 报告互相引用时跳到站内条目
  const routeOf = (path: string) => {
    const hit = entries.find(item => item.md && fileUrl(item.md) === decodeURI(path))
    return hit ? `/${hit.id}` : null
  }

  return (
    <div className='min-w-0 space-y-5'>
      {/* 标题区 */}
      <header className='flex flex-wrap items-start gap-3'>
        <div className='min-w-0 flex-1 space-y-1'>
          <h1 className='text-xl font-semibold'>{entry.title}</h1>
          {entry.desc ? <p className='text-sm text-muted-foreground'>{entry.desc}</p> : null}
        </div>
        <div className='flex items-center gap-2'>
          {entry.date ? <Badge variant='outline'>{entry.date}</Badge> : null}
          {entry.md ? (
            <Button variant='outline' size='sm' nativeButton={false} render={<a href={fileUrl(entry.md)} target='_blank' rel='noreferrer' />}>
              原文件
              <ExternalLink />
            </Button>
          ) : null}
        </div>
      </header>

      {/* 内容区 */}
      {entry.items ? <ShotGrid items={entry.items} resolve={fileUrl} onOpen={setShot} /> : null}
      {entry.md ? <MarkdownView src={fileUrl(entry.md)} onOpen={setShot} routeOf={routeOf} /> : null}

      <Lightbox shot={shot} onClose={() => setShot(null)} />
    </div>
  )
}

export type EntryViewProps = {
  entry: Entry
}
