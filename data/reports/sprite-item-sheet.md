# 五道具图集后处理实测

这次测试的目标很简单：确认一张 AI 生成的像素风道具图集，能不能稳定变成可用的透明散图和 atlas。

结论：这个样本适合走确定性处理。`solid-bg` 已经能切出 5 个道具、透明背景、bbox、散图和 atlas；VLM 适合辅助命名；SAM2 适合指定目标的 mask 补救

## 结果预览

### 切图结果

![contact sheet](../outputs/assets/sprite-postprocess/item-sheet/runs/solid-bg/previews/pixel-item-sprite-sheet.contact-sheet.png)

这张图展示了最终切出来的 5 个透明散图：`crystal`、`sword`、`potion`、`key`、`chest`

### Bbox 检查

![bbox overlay](../outputs/assets/sprite-postprocess/item-sheet/runs/solid-bg/debug/pixel-item-sprite-sheet.bbox-overlay.png)

红框是确定性流程识别出来的 bbox。5 个主体都被正确分开，顺序也是从左到右

### Atlas

![atlas](../outputs/assets/sprite-postprocess/item-sheet/runs/solid-bg/atlases/pixel-item-sprite-sheet.atlas.png)

生成了一个简单横向 atlas，可配套使用：

[atlas JSON](../outputs/assets/sprite-postprocess/item-sheet/runs/solid-bg/atlases/pixel-item-sprite-sheet.atlas.json)

## 主要产物

| 产物 | 路径 |
| --- | --- |
| 输入 manifest | [manifest.yaml](../input/assets/sprite-postprocess/item-sheet/manifest.yaml) |
| 原图 | [pixel-item-sprite-sheet.png](../input/assets/sprite-postprocess/item-sheet/originals/pixel-item-sprite-sheet.png) |
| 透明整图 | [pixel-item-sprite-sheet.alpha.png](../outputs/assets/sprite-postprocess/item-sheet/runs/solid-bg/transparent/pixel-item-sprite-sheet.alpha.png) |
| bbox JSON | [pixel-item-sprite-sheet.components.json](../outputs/assets/sprite-postprocess/item-sheet/runs/solid-bg/debug/pixel-item-sprite-sheet.components.json) |
| 散图目录 | [sprites](../outputs/assets/sprite-postprocess/item-sheet/runs/solid-bg/sprites/) |
| atlas PNG | [pixel-item-sprite-sheet.atlas.png](../outputs/assets/sprite-postprocess/item-sheet/runs/solid-bg/atlases/pixel-item-sprite-sheet.atlas.png) |
| 完整输出索引 | [sprite-output-index.md](./sprite-output-index.md) |

## Bbox 数据

| 名称 | x | y | w | h | area |
| --- | ---: | ---: | ---: | ---: | ---: |
| crystal | 49 | 466 | 199 | 292 | 24757 |
| sword | 274 | 466 | 231 | 302 | 17244 |
| potion | 534 | 460 | 213 | 304 | 34551 |
| key | 780 | 464 | 150 | 297 | 18099 |
| chest | 953 | 490 | 267 | 282 | 42079 |

## Bbox 检查方案

| 方案 | 用途 | 本次结果 | 实测耗时 |
| --- | --- | --- | ---: |
| ImageMagick connected components | 主流程：透明化、连通域、bbox、散图、atlas | 合并同一主体附近的小组件后，识别 5 个对象 | `2.63s` |
| OpenCV connectedComponentsWithStats | 复核和后续长期工具候选 | 合并离散组件后，bbox 与 ImageMagick 一致 | `0.29s` |
| Florence-2 OD | 语义检测辅助 | 只检出 bottle、sword，不适合作为主 bbox | `1.35s` |
| SAM2 box prompt | 指定目标 mask 补救 | chest mask 稳定，适合已知 bbox 后精修 | `0.46s` |
| rembg u2netp | 复杂背景兜底抠图 | 可抠图，但像素边缘和颜色损失明显 | `6.47s` |

日常开发建议：纯色或近纯色背景优先跑确定性流程；需要更快的交互预览时优先用 OpenCV；VLM、rembg、SAM2 不进入默认保存链路，只在命名、复杂背景或单个目标修补时触发

## 处理方式

当前主流程是 `solid-bg`：

```bash
npm run sprite:postprocess -- \
  data/input/assets/sprite-postprocess/item-sheet/manifest.yaml \
  configs/assets/sprite-postprocess/processors/solid-bg.yaml
```

它做了三件事：

- 按近似背景色 `srgb(35,40,46)` 移除背景
- 从 alpha/mask 里找连通域，并把同一横向范围内的小组件合并到主体 bbox
- 按 bbox 裁散图，再横向合成 atlas

配置文件：

[solid-bg.yaml](../../configs/assets/sprite-postprocess/processors/solid-bg.yaml)

## AI 抠图对比

### rembg

![rembg checker preview](../outputs/assets/sprite-postprocess/item-sheet/runs/rembg/pixel-item-sprite-sheet.checker-preview.png)

`rembg u2netp` 输出的是彩色 RGBA，不是灰白图。之前看到的灰白更容易来自 alpha mask / 灰度预览的观察方式；真实透明图仍保留 RGB 颜色。

但这个样本上 `u2netp` 的 alpha 是软边，不是像素风常用的硬边二值 mask。剑等细长物体边缘会出现大量半透明像素，放到棋盘格或浅色背景上会显得发灰、发软，所以它不适合作为默认方案。它更适合复杂背景兜底。

输出：

[rembg 透明图](../outputs/assets/sprite-postprocess/item-sheet/runs/rembg/transparent/pixel-item-sprite-sheet.alpha.png)

### SAM2

![sam2 chest checker preview](../outputs/assets/sprite-postprocess/item-sheet/runs/sam2-box/chest.checker-preview.png)

SAM2 用 `chest` 的 bbox 做 box prompt，可以稳定切出 chest mask。它适合“我已经知道要切哪个目标”的补救场景。

| 项 | 值 |
| --- | --- |
| target | `chest` |
| box | `[953, 490, 1220, 772]` |
| selected mask | `1` |
| IOU score | `0.9538` |

输出：

- [SAM2 mask](../outputs/assets/sprite-postprocess/item-sheet/runs/sam2-box/chest.mask.png)
- [SAM2 cutout](../outputs/assets/sprite-postprocess/item-sheet/runs/sam2-box/chest.cutout.png)
- [SAM2 JSON](../outputs/assets/sprite-postprocess/item-sheet/runs/sam2-box/sam2-smoke.json)

## OpenCV 验证

![opencv bbox overlay](../outputs/assets/sprite-postprocess/item-sheet/runs/opencv-components/bbox-overlay.png)

OpenCV 也能识别出 5 个组件，bbox 和 ImageMagick 结果一致。后续如果要做更长期的工具，可以把确定性处理逐步迁到 OpenCV，方便做形态学清理、组件合并和更细的质量检查。

输出：

[OpenCV components.json](../outputs/assets/sprite-postprocess/item-sheet/runs/opencv-components/components.json)

## VLM 语义辅助

VLM 不负责主切图，只用来回答“这是什么”和辅助命名。

| 模型 | 输出摘要 | 判断 |
| --- | --- | --- |
| Florence-2 caption | A set of pixel art items including a sword, a chest, a key, and a crystal | 能看懂大意 |
| Florence-2 OD | bottle、sword | bbox 覆盖不完整 |
| Moondream2 query | crystal、sword、bottle、key、chest | 最适合自动命名 |
| Qwen2.5-VL query | diamond、sword、potion、key、chest | 可用，但把 crystal 叫成 diamond |
| SmolVLM2 query | crystal、sword、potion、key、chest | 可用 |

输出 JSON：

- [Florence caption](../outputs/assets/sprite-postprocess/item-sheet/runs/florence-caption/vlm-smoke.caption.json)
- [Florence OD](../outputs/assets/sprite-postprocess/item-sheet/runs/florence-od/vlm-smoke.od.json)
- [Moondream2 query](../outputs/assets/sprite-postprocess/item-sheet/runs/moondream-query/vlm-smoke.query.json)
- [Qwen query](../outputs/assets/sprite-postprocess/item-sheet/runs/qwen-query/vlm-smoke.query.json)
- [SmolVLM query](../outputs/assets/sprite-postprocess/item-sheet/runs/smolvlm-query/vlm-smoke.query.json)

## 当前判断

- 纯色或近纯色背景：先用 `solid-bg`
- 需要 xywh、散图、atlas：用确定性 bbox，不让 VLM 主导
- 背景复杂或主体边界不好：再试 `rembg` 或 `SAM2`
- 需要自动命名：优先试 `Moondream2` 或 `SmolVLM2`
