import { NavLink, Outlet } from 'react-router-dom'
import { Image } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'

// 根布局
export function RootLayout() {
  return (
    <div className='min-h-screen bg-background text-foreground'>
      {/* 顶栏 */}
      <header className='sticky top-0 z-40 border-b bg-background/90 backdrop-blur'>
        <div className='flex h-14 items-center justify-between gap-2 px-4 lg:px-6'>
          <NavLink to='/' className='flex items-center gap-2 font-semibold'>
            <Image className='size-5' />
            AI 图像
          </NavLink>
          <ThemeToggle />
        </div>
      </header>
      <main className='px-4 py-6 lg:px-6'>
        <Outlet />
      </main>
    </div>
  )
}
