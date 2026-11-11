# ComfyUI 首次运行记录

## 环境

- ComfyUI Desktop：`/Applications/ComfyUI.app`
- API 地址：`http://127.0.0.1:8000`
- ComfyUI 版本：`0.22.0`
- 设备：`mps`
- 外部模型配置：`/Users/tobe/Library/Application Support/ComfyUI/extra_models_config.yaml`
- ComfyUI 原始输出目录：`/Users/tobe/Documents/ComfyUI/output`

## 执行前检查

- 启动前内存：`37.82 GiB / 64.00 GiB`
- swap：disabled
- `memory_pressure`：`System-wide memory free percentage: 74%`
- `CheckpointLoaderSimple` 能看到 SD1.5 和 SDXL 两个短名 checkpoint

## 运行记录

| 运行 | 工作流 | 模型 | 尺寸 | steps | CFG | seed | 耗时 | 状态 |
|---|---|---|---:|---:|---:|---:|---:|---|
| SD1.5 smoke | [sd15-smoke-t2i.api.json](../../configs/comfyui/workflows/sd15-smoke-t2i.api.json) | `sd15-v1-5-pruned-emaonly-fp16.safetensors` | 512x512 | 20 | 7.0 | 42 | 7.34s | success |
| SDXL baseline 首图 | [sdxl-basic-t2i.api.json](../../configs/comfyui/workflows/sdxl-basic-t2i.api.json) | `sdxl-base-1.0.safetensors` | 1024x1024 | 30 | 7.0 | 42 | 98.09s | success |

## 输出

- SD1.5 项目副本：[sd15-smoke-t2i-seed42.png](../outputs/comfyui/smoke/sd15-smoke-t2i/sd15-smoke-t2i-seed42.png)
- SD1.5 ComfyUI 原始输出：`/Users/tobe/Documents/ComfyUI/output/ai-image/smoke/sd15-smoke-t2i_00001_.png`
- SD1.5 SHA256：`5452d3b41e7ac1c6b6a542786cadbc092c8581cbb74ee49f69d528d1afb7b287`
- SDXL 项目副本：[sdxl-basic-t2i-seed42.png](../outputs/comfyui/built-in/sdxl-basic-t2i/sdxl-basic-t2i-seed42.png)
- SDXL ComfyUI 原始输出：`/Users/tobe/Documents/ComfyUI/output/ai-image/built-in/sdxl-basic-t2i/sdxl-basic-t2i-seed42_00001_.png`
- SDXL SHA256：`16f27b40f003b9762d506542ca22755cdaa68c3273f00f763095043a87c03dce`

## 后续报告

- 当前主题套件报告：[sdxl-theme-suite.md](./sdxl-theme-suite.md)
- 历史 flat prompt baseline：[sdxl-built-in-suite.md](./sdxl-built-in-suite.md)

## 备注

- ComfyUI 已正常启动在 `8000` 端口
- Desktop 日志中有 custom node 的 deprecation warning，但没有阻断本轮运行
- SDXL 首图执行完成后没有耗尽内存，后置可用内存约 `27 GiB`
- 完整内置提示词测试以后续主题套件报告为准
