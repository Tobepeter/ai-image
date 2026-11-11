import { useEffect } from 'react'
import { Navigate, NavLink, useParams } from 'react-router-dom'
import { entries, groups } from '@/data/entries'
import { cn } from '@/lib/utils'
import { EntryView } from './entry-view'

// 条目页：左侧目录，右侧内容
export function EntryPage() {
  const params = useParams()
  const entry = entries.find(item => item.id === params.entryId)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [params.entryId])

  if (!entry) return <Navigate to='/' replace />

  return (
    <div className='mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[220px_minmax(0,1fr)]'>
      {/* 目录 */}
      <aside className='lg:sticky lg:top-20 lg:self-start'>
        <nav className='flex gap-4 overflow-x-auto pb-2 lg:block lg:space-y-4 lg:overflow-visible lg:pb-0'>
          {groups.map(group => (
            <div key={group.title} className='shrink-0 space-y-1'>
              <div className='px-2 text-xs text-muted-foreground'>{group.title}</div>
              <div className='flex gap-1 lg:block lg:space-y-0.5'>
                {group.entries.map(item => (
                  <NavLink
                    key={item.id}
                    to={`/${item.id}`}
                    className={state =>
                      cn(
                        'block rounded-md px-2 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                        state.isActive && 'bg-accent text-accent-foreground'
                      )
                    }
                  >
                    {item.title}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <EntryView key={entry.id} entry={entry} />
    </div>
  )
}
