# Dungeon 图集后处理实测

## 结论

两张输入图不是透明 PNG，而是把棋盘格背景烘进了 RGB 像素里。当前用 `checker-bg` 流程移除接触画布边缘的亮色中性背景，再从 alpha mask 提取 bbox 和散图。

| 输入 | 组件数 | 内容识别 |
| --- | ---: | --- |
| `dungeon01` | 56 | Ground tiles, treasure chests, torches, skulls, banners, crates, pillars, barrels, bones, cobwebs, chains |
| `dungeon02` | 79 | Characters, Monsters, Effects, Items |

## 预览

### dungeon01 bbox

![dungeon01 bbox](../outputs/assets/sprite-postprocess/dungeon-sheets/runs/checker-bg/debug/dungeon01.bbox-overlay.png)

### dungeon01 散图预览

![dungeon01 contact sheet](../outputs/assets/sprite-postprocess/dungeon-sheets/runs/checker-bg/previews/dungeon01.contact-sheet.png)

### dungeon02 bbox

![dungeon02 bbox](../outputs/assets/sprite-postprocess/dungeon-sheets/runs/checker-bg/debug/dungeon02.bbox-overlay.png)

### dungeon02 散图预览

![dungeon02 contact sheet](../outputs/assets/sprite-postprocess/dungeon-sheets/runs/checker-bg/previews/dungeon02.contact-sheet.png)

## 坐标产物

| 输入 | CSV | JSON | 透明图 | 散图目录 |
| --- | --- | --- | --- | --- |
| `dungeon01` | [dungeon01.components.csv](../outputs/assets/sprite-postprocess/dungeon-sheets/runs/checker-bg/debug/dungeon01.components.csv) | [dungeon01.components.json](../outputs/assets/sprite-postprocess/dungeon-sheets/runs/checker-bg/debug/dungeon01.components.json) | [dungeon01.alpha.png](../outputs/assets/sprite-postprocess/dungeon-sheets/runs/checker-bg/transparent/dungeon01.alpha.png) | [sprites/dungeon01](../outputs/assets/sprite-postprocess/dungeon-sheets/runs/checker-bg/sprites/dungeon01/) |
| `dungeon02` | [dungeon02.components.csv](../outputs/assets/sprite-postprocess/dungeon-sheets/runs/checker-bg/debug/dungeon02.components.csv) | [dungeon02.components.json](../outputs/assets/sprite-postprocess/dungeon-sheets/runs/checker-bg/debug/dungeon02.components.json) | [dungeon02.alpha.png](../outputs/assets/sprite-postprocess/dungeon-sheets/runs/checker-bg/transparent/dungeon02.alpha.png) | [sprites/dungeon02](../outputs/assets/sprite-postprocess/dungeon-sheets/runs/checker-bg/sprites/dungeon02/) |

CSV 字段：`name,x,y,w,h,area,sprite`

## 坐标样例

### dungeon01 前 10 个

| name | x | y | w | h | area |
| --- | ---: | ---: | ---: | ---: | ---: |
| dungeon01-001 | 40 | 51 | 134 | 134 | 17903 |
| dungeon01-002 | 191 | 51 | 135 | 134 | 17982 |
| dungeon01-003 | 342 | 51 | 134 | 134 | 17812 |
| dungeon01-004 | 493 | 51 | 133 | 134 | 17764 |
| dungeon01-005 | 656 | 55 | 210 | 187 | 38379 |
| dungeon01-006 | 882 | 103 | 129 | 135 | 16727 |
| dungeon01-007 | 1038 | 76 | 147 | 170 | 18221 |
| dungeon01-008 | 40 | 202 | 134 | 136 | 18144 |
| dungeon01-009 | 191 | 202 | 134 | 136 | 18150 |
| dungeon01-010 | 341 | 202 | 135 | 136 | 18157 |

### dungeon02 前 10 个

| name | x | y | w | h | area |
| --- | ---: | ---: | ---: | ---: | ---: |
| dungeon02-001 | 59 | 59 | 92 | 120 | 7403 |
| dungeon02-002 | 212 | 59 | 100 | 120 | 7212 |
| dungeon02-003 | 377 | 61 | 97 | 118 | 6918 |
| dungeon02-004 | 535 | 61 | 99 | 118 | 7112 |
| dungeon02-005 | 696 | 66 | 152 | 113 | 7801 |
| dungeon02-006 | 858 | 65 | 136 | 114 | 7103 |
| dungeon02-007 | 63 | 210 | 86 | 121 | 7389 |
| dungeon02-008 | 236 | 213 | 96 | 118 | 7097 |
| dungeon02-009 | 400 | 211 | 100 | 119 | 6834 |
| dungeon02-010 | 545 | 213 | 99 | 115 | 6875 |

## 处理参数

```bash
npm run checker:postprocess -- \
  --images data/input/assets/sprite-postprocess/dungeon-sheets/originals/dungeon01.png data/input/assets/sprite-postprocess/dungeon-sheets/originals/dungeon02.png \
  --output-dir data/outputs/assets/sprite-postprocess/dungeon-sheets/runs/checker-bg \
  --bright-min 220 \
  --neutral-delta 18 \
  --min-area 80 \
  --group-gap 8
```

实测耗时：`2.35s`

## 观察

- `group-gap=8` 能把地砖、火把和角色帧分开，适合当前“拿坐标和散图”的目标
- 分离粒子类特效会被拆成多个小 bbox，后续需要按格子、手动框选或交互式合并
- 棋盘格是 RGB 背景，不是 alpha；这类图从生成阶段要求真透明或纯色 chroma key 会更稳定
