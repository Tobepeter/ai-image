import type { PropsWithChildren } from 'react'
import { TriangleAlert, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { VerdictIcon } from '@/components/verdict-icon'
import type { Verdict } from '@/data/verdict'

// 一项结果：标题带图标和评级，问题用徽标，内容放图
export function ResultCard(props: PropsWithChildren<ResultCardProps>) {
  const Icon = props.icon

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Icon className='size-4' />
          {props.name}
          {props.issue ? (
            <Badge variant='outline'>
              <TriangleAlert />
              {props.issue}
            </Badge>
          ) : null}
        </CardTitle>
        <CardAction>
          <VerdictIcon verdict={props.verdict} />
        </CardAction>
      </CardHeader>
      <CardContent>{props.children}</CardContent>
    </Card>
  )
}

export type ResultCardProps = {
  icon: LucideIcon
  name: string
  verdict: Verdict
  issue?: string
}
