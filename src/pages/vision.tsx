import { Timer } from 'lucide-react'
import { ImageGrid } from '@/components/image-grid'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { visionInput, visionRuns, visionTotal } from '@/data/vision'

// 本地识别模型：同一张图，认对几个、多快
export function VisionPage() {
  return (
    <Card>
      <CardContent className='grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]'>
        <ImageGrid shots={[visionInput]} fit='contain' className='grid-cols-1' />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>模型</TableHead>
              <TableHead>参数</TableHead>
              <TableHead>认对</TableHead>
              <TableHead>
                <Timer className='size-4' />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visionRuns.map(run => (
              <TableRow key={run.model}>
                <TableCell>
                  {/* 悬停看原始回答 */}
                  <Tooltip>
                    <TooltipTrigger render={<span />}>{run.model}</TooltipTrigger>
                    <TooltipContent>{run.answer}</TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>{run.size}</TableCell>
                <TableCell>
                  <Badge variant={run.hit === visionTotal ? 'default' : 'secondary'}>
                    {run.hit}/{visionTotal}
                  </Badge>
                </TableCell>
                <TableCell>{run.sec}s</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
