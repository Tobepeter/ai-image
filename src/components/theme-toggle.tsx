import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

const options = [
  { value: 'system', label: '跟随系统', icon: Monitor },
  { value: 'light', label: '浅色', icon: Sun },
  { value: 'dark', label: '深色', icon: Moon },
]

// 主题切换，按 系统 → 浅色 → 深色 循环
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const index = Math.max(
    0,
    options.findIndex(option => option.value === theme)
  )
  const curr = options[index]
  const next = options[(index + 1) % options.length]
  const Icon = curr.icon

  return (
    <Button variant='ghost' size='icon' aria-label={`主题：${curr.label}，切换到${next.label}`} title={curr.label} onClick={() => setTheme(next.value)}>
      <Icon className='size-4' />
    </Button>
  )
}
