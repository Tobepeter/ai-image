import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress, ProgressLabel } from '@/components/ui/progress'
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
              <CardTitle>{group.name}</CardTitle>
              <CardDescription>体积和耗时的条长按组内最大值比</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>模型</TableHead>
                    <TableHead>做了什么</TableHead>
                    <TableHead>问题</TableHead>
                    <TableHead>体积</TableHead>
                    <TableHead>每张耗时</TableHead>
                    <TableHead>评价</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.models.map(model => (
                    <TableRow key={model.name}>
                      <TableCell className='font-medium'>{model.name}</TableCell>
                      <TableCell>{model.task}</TableCell>
                      <TableCell>{model.issue ?? '—'}</TableCell>
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

// 对比条，数值放 Progress 自带的标签
function Bar(props: { value: number; label: string }) {
  return (
    <Progress value={Math.max(props.value * 100, 2)}>
      <ProgressLabel>{props.label}</ProgressLabel>
    </Progress>
  )
}

function formatSize(mb: number) {
  if (!mb) return '系统自带'
  return mb >= 1000 ? `${(mb / 1000).toFixed(1)}G` : `${mb}M`
}
