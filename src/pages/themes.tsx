import { ImageGrid } from '@/components/image-grid'
import { ResultCard } from '@/components/result-card'
import { themeImage, themes } from '@/data/themes'

// SDXL base 各题材效果
export function ThemesPage() {
  return (
    <div className='grid gap-4'>
      {themes.map(theme => (
        <ResultCard key={theme.id} name={theme.name} verdict={theme.verdict} issue={theme.issue}>
          <ImageGrid shots={theme.cases.map(name => themeImage(theme, name))} />
        </ResultCard>
      ))}
    </div>
  )
}
