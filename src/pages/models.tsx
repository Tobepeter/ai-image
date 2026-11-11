import { TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { VerdictIcon } from '@/components/verdict-icon'
import { modelGroups } from '@/data/models'

// 模型总览：每组内比体积和耗时，条长按组内最大值
export function ModelsPage() {
  return (
    <div className='grid gap-4'>
      {modelGroups.map(group => {
        const maxMb = Math.max(...group.models.map(model => model.mb))
        const maxSec = Math.max(...group.models.map(model => model.sec))

        return (
          <Card key={group.name}>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <group.icon className='size-4' />
                {group.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* 固定列宽，三组表格上下对齐 */}
              <Table className='table-fixed'>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[20%]'>模型</TableHead>
                    <TableHead className='w-[30%]'>做了什么</TableHead>
                    <TableHead>体积</TableHead>
                    <TableHead>每张耗时</TableHead>
                    <TableHead className='w-20'>评价</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.models.map(model => (
                    <TableRow key={model.name}>
                      <TableCell className='font-medium'>{model.name}</TableCell>
                      <TableCell>
                        <div className='flex flex-wrap items-center gap-2'>
                          {model.task}
                          {model.issue ? (
                            <Badge variant='outline'>
                              <TriangleAlert />
                              {model.issue}
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Bar value={model.mb / maxMb} label={formatSize(model.mb)} />
                      </TableCell>
                      <TableCell>
                        <Bar value={model.sec / maxSec} label={`${model.sec}s`} />
                      </TableCell>
                      <TableCell>
                        <VerdictIcon verdict={model.verdict} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// 对比条 + 数值
function Bar(props: { value: number; label: string }) {
  return (
    <div className='flex items-center gap-3 pr-6'>
      <Progress value={Math.max(props.value * 100, 2)} className='flex-1' />
      <span className='w-16 text-muted-foreground tabular-nums'>{props.label}</span>
    </div>
  )
}

function formatSize(mb: number) {
  if (!mb) return '系统自带'
  return mb >= 1000 ? `${(mb / 1000).toFixed(1)}G` : `${mb}M`
}
