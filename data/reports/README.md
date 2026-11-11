# AI 图像报告

这里存放图像生成、图像编辑和工作流实验的人工报告与观察记录。

报告里引用的生成图在 `data/outputs/` 下，不入库，按报告里的 workflow、参数和 seed 可以重跑；入库的只有 `data/outputs/reports/contact-sheets/` 里的拼图。本机带图浏览用工程自带的展示页（`pnpm dev`，端口 5184，见根目录 README）

## 当前报告

- [SDXL 主题套件测试报告](./sdxl-theme-suite.md)：当前主验收报告，7 个主题、每个主题 5 张图
- [SDXL 像素风游戏素材小样本报告](./sdxl-pixel-game-assets.md)：三条小路线验证，道具图标、tile 纹理、sprite sheet
- [SDXL 像素风道具图标报告](./sdxl-pixel-item-icons.md)：5 个 inventory icon 小样本
- [SDXL 像素风 Tile 纹理报告](./sdxl-pixel-tile-textures.md)：5 个 terrain/material tile 小样本
- [SDXL 像素风 Sprite Sheet 报告](./sdxl-pixel-sprite-sheets.md)：3 个小型图集样本
- [Sprite 后处理项目级工作区规划](./sprite-workspace-plan.md)：规划 sprite 输入批次、处理变体、透明图、散图、atlas、debug mask 和报告目录
- [Sprite 后处理实测：五道具图集](./sprite-item-sheet.md)：验证透明化、bbox、散图、atlas、rembg 兜底效果和自我验收结果
- [Dungeon 图集后处理实测](./dungeon-sheets.md)：验证棋盘格假透明背景移除、bbox、散图和 Qwen2.5-VL 内容识别
- [Sprite 后处理输出索引](./sprite-output-index.md)：集中查看 sprite 后处理预览图和关键产物路径
- [本地视觉模型安装验收](./model-install.md)：记录 Florence-2、SAM2、Qwen2.5-VL、Moondream2、SmolVLM2、rembg 的安装与缓存校验状态
- [ComfyUI 首次运行记录](./comfyui-first-run.md)：SD1.5 smoke test 和 SDXL 首图验证
- [SDXL 内置提示词测试报告](./sdxl-built-in-suite.md)：历史 baseline，6 个旧版 flat prompt，已被主题套件替代

## 建议记录内容

- 输入材料：prompt、参考图、控制图、mask、seed、模型来源和授权备注
- 运行配置：engine、workflow、params、模型文件、分辨率、steps、CFG、sampler、scheduler
- 输出文件：内置测试按 `data/outputs/comfyui/built-in/{suite}/{theme}/{case_id}-seed{seed}.png` 归档，用户实验按 `data/outputs/comfyui/user/{workflow}/{case_id}/` 归档
- 观察结论：视觉质量、prompt 跟随、主体一致性、伪影、速度、内存占用和可复现性
