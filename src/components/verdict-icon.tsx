import { Check, Minus, Star, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { verdictLabel, type Verdict } from '@/data/verdict'

const styles = {
  best: { icon: Star, variant: 'default' },
  good: { icon: Check, variant: 'secondary' },
  ok: { icon: Minus, variant: 'outline' },
  weak: { icon: X, variant: 'destructive' },
} as const

// 评级徽标：图标 + 中文
export function VerdictIcon(props: { verdict: Verdict }) {
  const style = styles[props.verdict]
  const Icon = style.icon

  return (
    <Badge variant={style.variant}>
      <Icon />
      {verdictLabel[props.verdict]}
    </Badge>
  )
}
