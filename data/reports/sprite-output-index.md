# Sprite 后处理输出索引

## 预览

### Contact Sheet

![contact sheet](../outputs/assets/sprite-postprocess/item-sheet/runs/solid-bg/previews/pixel-item-sprite-sheet.contact-sheet.png)

### Bbox Overlay

![bbox overlay](../outputs/assets/sprite-postprocess/item-sheet/runs/solid-bg/debug/pixel-item-sprite-sheet.bbox-overlay.png)

### Atlas

![atlas](../outputs/assets/sprite-postprocess/item-sheet/runs/solid-bg/atlases/pixel-item-sprite-sheet.atlas.png)

### rembg 预览

![rembg checker preview](../outputs/assets/sprite-postprocess/item-sheet/runs/rembg/pixel-item-sprite-sheet.checker-preview.png)

### SAM2 Chest Mask 预览

![sam2 chest checker preview](../outputs/assets/sprite-postprocess/item-sheet/runs/sam2-box/chest.checker-preview.png)

### OpenCV Bbox Overlay

![opencv bbox overlay](../outputs/assets/sprite-postprocess/item-sheet/runs/opencv-components/bbox-overlay.png)

## 重要输出路径

| 类型 | 路径 |
| --- | --- |
| 透明整图 | `data/outputs/assets/sprite-postprocess/item-sheet/runs/solid-bg/transparent/pixel-item-sprite-sheet.alpha.png` |
| 散图目录 | `data/outputs/assets/sprite-postprocess/item-sheet/runs/solid-bg/sprites/` |
| Atlas | `data/outputs/assets/sprite-postprocess/item-sheet/runs/solid-bg/atlases/pixel-item-sprite-sheet.atlas.png` |
| Atlas JSON | `data/outputs/assets/sprite-postprocess/item-sheet/runs/solid-bg/atlases/pixel-item-sprite-sheet.atlas.json` |
| 组件 bbox | `data/outputs/assets/sprite-postprocess/item-sheet/runs/solid-bg/debug/pixel-item-sprite-sheet.components.json` |
| Florence caption | `data/outputs/assets/sprite-postprocess/item-sheet/runs/florence-caption/vlm-smoke.caption.json` |
| Florence OD | `data/outputs/assets/sprite-postprocess/item-sheet/runs/florence-od/vlm-smoke.od.json` |
| Moondream2 caption | `data/outputs/assets/sprite-postprocess/item-sheet/runs/moondream-caption/vlm-smoke.caption.json` |
| Moondream2 query | `data/outputs/assets/sprite-postprocess/item-sheet/runs/moondream-query/vlm-smoke.query.json` |
| Qwen2.5-VL query | `data/outputs/assets/sprite-postprocess/item-sheet/runs/qwen-query/vlm-smoke.query.json` |
| SmolVLM2 query | `data/outputs/assets/sprite-postprocess/item-sheet/runs/smolvlm-query/vlm-smoke.query.json` |
| SAM2 chest mask | `data/outputs/assets/sprite-postprocess/item-sheet/runs/sam2-box/chest.mask.png` |
| SAM2 chest cutout | `data/outputs/assets/sprite-postprocess/item-sheet/runs/sam2-box/chest.cutout.png` |
| OpenCV 组件结果 | `data/outputs/assets/sprite-postprocess/item-sheet/runs/opencv-components/components.json` |

## 当前结论

- 确定性切图产物是主结果，输出了 5 张散图和 atlas
- VLM 输出是语义辅助结果，主要用于命名、检查、报告
- SAM2 输出是 box prompt 补救结果，可对指定目标做更细 mask
- OpenCV 输出和 ImageMagick bbox 一致，后续可以迁到 Python/OpenCV 做更可控的 CV 管线
