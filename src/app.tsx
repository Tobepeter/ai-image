import { useEffect, useState } from 'react'
import { Aperture, Boxes, Clapperboard, MessageSquareText, Tags, Gamepad2, Image, LayoutGrid, Lightbulb, Palette, ScanEye, Scissors } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { AppleVisionPage } from '@/pages/apple-vision'
import { CaptionPage } from '@/pages/caption'
import { ClassifyPage } from '@/pages/classify'
import { CutoutPage } from '@/pages/cutout'
import { ModelsPage } from '@/pages/models'
import { PixelPage } from '@/pages/pixel'
import { SlicingPage } from '@/pages/slicing'
import { ThemesPage } from '@/pages/themes'
import { VideoPage } from '@/pages/video'
import { VisionPage } from '@/pages/vision'

// 每页只说一件事，claim 就是那件事
const pages = [
  { id: 'models', label: '模型', icon: Boxes, claim: '出图靠 SDXL，分类用 SigLIP 2，一句话用 Qwen3.5-2B', page: ModelsPage },
  { id: 'themes', label: '题材', icon: Palette, claim: 'SDXL base 风景最稳，像素和文字是短板', page: ThemesPage },
  { id: 'pixel', label: '像素素材', icon: Gamepad2, claim: '道具图标能用，精灵图还不行', page: PixelPage },
  { id: 'vision', label: '识别', icon: ScanEye, claim: '本地小模型能认全，只拿来给素材起名', page: VisionPage },
  { id: 'apple-vision', label: 'Apple Vision', icon: Aperture, claim: '每张 0.25 秒：文字图分得出、印刷字读得准，场景只认大类', page: AppleVisionPage },
  { id: 'classify', label: '分类', icon: Tags, claim: '分类用 SigLIP 2 + 英文提示：29/30，每张 13ms', page: ClassifyPage },
  { id: 'caption', label: '一句话描述', icon: MessageSquareText, claim: '一句话用 Qwen3.5-2B，要准换 4B，要快选 MiniCPM-V 4.7 1B', page: CaptionPage },
  { id: 'video', label: '视频理解', icon: Clapperboard, claim: '切镜头 TransNetV2 最准、自适应检测快 30 倍，关键帧去重后约剩一半', page: VideoPage },
  { id: 'cutout', label: '去背景', icon: Scissors, claim: '像素图用纯色抠除，模型只做补救', page: CutoutPage },
  { id: 'slicing', label: '拆图集', icon: LayoutGrid, claim: '假透明的图集也能自动拆开', page: SlicingPage },
]

// 视觉看板：shadcn 默认 Sidebar，右侧一页一个结论
export function App() {
  const [currId, setCurrId] = useHashPage()
  const curr = pages.find(page => page.id === currId) ?? pages[0]
  const Page = curr.page

  return (
    <SidebarProvider>
      <Sidebar collapsible='icon'>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              {/* 照官方 sidebar-07 的头部：方块图标 + 两行文字 */}
              <SidebarMenuButton size='lg'>
                <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
                  <Image className='size-4' />
                </div>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-medium'>AI 图像</span>
                  <span className='truncate text-xs'>实验看板</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {pages.map(page => (
                  <SidebarMenuItem key={page.id}>
                    <SidebarMenuButton isActive={page.id === curr.id} tooltip={page.label} onClick={() => setCurrId(page.id)}>
                      <page.icon />
                      <span>{page.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        {/* 顶栏：照官方 sidebar-07，折叠按钮 + 短分隔线 + 面包屑 */}
        <header className='flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
          <div className='flex items-center gap-2 px-4'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='mr-2 data-[orientation=vertical]:h-4' />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className='hidden md:block'>AI 图像</BreadcrumbItem>
                <BreadcrumbSeparator className='hidden md:block' />
                <BreadcrumbItem>
                  <BreadcrumbPage>{curr.label}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className='ml-auto px-4'>
            <ThemeToggle />
          </div>
        </header>
        <div className='flex flex-1 flex-col gap-4 p-4 pt-0'>
          {/* 本页结论 */}
          <Alert>
            <Lightbulb />
            <AlertTitle>{curr.claim}</AlertTitle>
          </Alert>
          <Page />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

// 当前页记在地址 hash 里，刷新和前进后退都保留
function useHashPage() {
  const read = () => location.hash.slice(1)
  const [id, setId] = useState(read)

  useEffect(() => {
    const onChange = () => setId(read())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const go = (next: string) => {
    location.hash = next
  }
  return [id, go] as const
}
