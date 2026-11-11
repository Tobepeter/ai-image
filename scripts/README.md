# AI Image Scripts

这个目录存放可重复执行的本地脚本。

## 当前命令

```bash
pnpm validate:hf-vision-models
pnpm sprite:postprocess -- \
  data/input/assets/sprite-postprocess/item-sheet/manifest.yaml \
  configs/assets/sprite-postprocess/processors/solid-bg.yaml
pnpm vlm:smoke -- \
  --model florence-2-base \
  --task caption \
  --image data/input/assets/sprite-postprocess/item-sheet/originals/pixel-item-sprite-sheet.png \
  --output data/outputs/assets/sprite-postprocess/item-sheet/runs/florence-caption/vlm-smoke.caption.json
HF_HUB_OFFLINE=1 pnpm vlm:smoke -- \
  --model qwen2.5-vl-3b-instruct \
  --task query \
  --prompt "List the fantasy game items in this image. Answer as a short comma-separated list." \
  --image data/input/assets/sprite-postprocess/item-sheet/originals/pixel-item-sprite-sheet.png \
  --output data/outputs/assets/sprite-postprocess/item-sheet/runs/qwen-query/vlm-smoke.query.json
HF_HUB_OFFLINE=1 pnpm sam2:mask -- \
  --image data/input/assets/sprite-postprocess/item-sheet/originals/pixel-item-sprite-sheet.png \
  --components data/outputs/assets/sprite-postprocess/item-sheet/runs/solid-bg/debug/pixel-item-sprite-sheet.components.json \
  --target chest \
  --output-dir data/outputs/assets/sprite-postprocess/item-sheet/runs/sam2-box
pnpm opencv:components -- \
  --image data/input/assets/sprite-postprocess/item-sheet/originals/pixel-item-sprite-sheet.png \
  --expected crystal sword potion key chest \
  --key-color 35,40,46 \
  --fuzz-percent 9 \
  --min-area 1000 \
  --max-components 5 \
  --padding 8 \
  --merge-detached \
  --merge-min-area 12 \
  --merge-x-margin 24 \
  --output-dir data/outputs/assets/sprite-postprocess/item-sheet/runs/opencv-components
pnpm checker:postprocess -- \
  --images data/input/assets/sprite-postprocess/dungeon-sheets/originals/dungeon01.png data/input/assets/sprite-postprocess/dungeon-sheets/originals/dungeon02.png \
  --output-dir data/outputs/assets/sprite-postprocess/dungeon-sheets/runs/checker-bg \
  --bright-min 220 \
  --neutral-delta 18 \
  --min-area 80 \
  --group-gap 8
pnpm comfyui:run-pixel-suite -- configs/comfyui/params/built-in/sdxl-pixel-item-icons.seed42.yaml
```

## 语言边界

- Node/JS：项目编排、manifest 校验、ImageMagick 调用、atlas/report 产物
- Python/uv：后续模型推理、OpenCV、SAM、Florence、Qwen、Moondream2 等 AI/CV 逻辑
