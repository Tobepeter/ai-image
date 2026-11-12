import type { PropsWithChildren } from 'react'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { VerdictIcon } from '@/components/verdict-icon'
import type { Verdict } from '@/data/verdict'

// 一项结果：标题 + 评级，主要问题放说明行，内容放图
export function ResultCard(props: PropsWithChildren<ResultCardProps>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.name}</CardTitle>
        {props.issue ? <CardDescription>问题：{props.issue}</CardDescription> : null}
        <CardAction>
          <VerdictIcon verdict={props.verdict} />
        </CardAction>
      </CardHeader>
      <CardContent>{props.children}</CardContent>
    </Card>
  )
}

export type ResultCardProps = {
  name: string
  verdict: Verdict
  issue?: string
}
