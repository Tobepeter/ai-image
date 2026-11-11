import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { LightboxShot } from './lightbox'
import { markPixel } from '@/lib/image'

// Markdown 报告，图片和链接按报告自身位置解析
export function MarkdownView(props: MarkdownViewProps) {
  const [doc, setDoc] = useState<{ src: string; text: string; failed?: boolean }>(null)

  useEffect(() => {
    let alive = true
    fetch(props.src)
      .then(res => (res.ok ? res.text() : Promise.reject(res.status)))
      .then(text => alive && setDoc({ src: props.src, text }))
      .catch(() => alive && setDoc({ src: props.src, text: '', failed: true }))
    return () => {
      alive = false
    }
  }, [props.src])

  if (doc?.src !== props.src) return <div className='h-40 animate-pulse rounded-lg bg-muted/50' />
  if (doc.failed) return <p className='text-sm text-muted-foreground'>报告读取失败，文件可能不在本机（生成产物不入库）</p>

  const resolve = (url: string) => new URL(url, location.origin + props.src).pathname

  return (
    <article className='prose max-w-none prose-neutral dark:prose-invert prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-code:wrap-anywhere prose-code:before:content-none prose-code:after:content-none prose-img:my-0 [&_td]:whitespace-nowrap [&_th]:whitespace-nowrap'>
      <Markdown
        remarkPlugins={[remarkGfm, remarkShots]}
        components={{
          img: img => {
            const src = resolve(img.src)
            return (
              <button type='button' onClick={() => props.onOpen({ src, title: img.alt })} className='block w-full cursor-zoom-in'>
                <img src={src} alt={img.alt} loading='lazy' onLoad={markPixel} className='mx-auto max-h-[560px] w-auto rounded-md border' />
              </button>
            )
          },
          a: a => {
            if (!a.href || /^(https?:|mailto:|#)/.test(a.href))
              return (
                <a href={a.href} target='_blank' rel='noreferrer'>
                  {a.children}
                </a>
              )
            const path = resolve(a.href)
            const route = props.routeOf(path)
            if (route) return <Link to={route}>{a.children}</Link>
            // 报告里的图片链接直接用大图打开
            if (/\.(png|jpe?g|webp|gif)$/i.test(path)) {
              return (
                <a href={path} onClick={e => (e.preventDefault(), props.onOpen({ src: path }))}>
                  {a.children}
                </a>
              )
            }
            return (
              <a href={path} target='_blank' rel='noreferrer'>
                {a.children}
              </a>
            )
          },
          table: table => (
            <div className='overflow-x-auto'>
              <table>{table.children}</table>
            </div>
          ),
        }}
      >
        {doc.text}
      </Markdown>
    </article>
  )
}

export type MarkdownViewProps = {
  src: string // 报告地址
  onOpen: (shot: LightboxShot) => void
  routeOf: (path: string) => string | null // 站内报告映射到路由
}

// 连续的单图段落合成一组，按网格排开
function remarkShots() {
  const isShot = node => node.type === 'paragraph' && node.children.every(child => child.type === 'image' || (child.type === 'text' && !child.value.trim()))
  return tree => {
    const out = []
    for (const node of tree.children) {
      const prev = out[out.length - 1]
      if (isShot(node) && prev?.data?.shots) {
        prev.children.push(...node.children)
        continue
      }
      if (isShot(node)) {
        out.push({
          ...node,
          data: { shots: true, hProperties: { className: 'not-prose my-4 grid grid-cols-2 gap-3 md:grid-cols-3 [&_img]:aspect-square [&_img]:w-full [&_img]:bg-muted/40 [&_img]:object-contain' } },
        })
        continue
      }
      out.push(node)
    }
    // 只有一张图的组不排网格
    for (const node of out) if (node.data?.shots && node.children.filter(child => child.type === 'image').length < 2) node.data.hProperties = { className: 'my-4' }
    tree.children = out
  }
}
