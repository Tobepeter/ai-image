import { Check, Minus, Star, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { verdictLabel, type Verdict } from '@/data/verdict'

const styles = {
  best: { icon: Star, variant: 'default' },
  good: { icon: Check, variant: 'secondary' },
  ok: { icon: Minus, variant: 'outline' },
  weak: { icon: X, variant: 'destructive' },
} as const

// 评级图标，悬停看文字
export function VerdictIcon(props: { verdict: Verdict }) {
  const style = styles[props.verdict]
  const Icon = style.icon

  return (
    <Tooltip>
      <TooltipTrigger render={<Badge variant={style.variant} />}>
        <Icon />
      </TooltipTrigger>
      <TooltipContent>{verdictLabel[props.verdict]}</TooltipContent>
    </Tooltip>
  )
}
