# AI Image

AI 图像工程工作区，用于本地模型生图、工作流配置、参数化实验、输出归档和人工验收报告。

## Structure

```text
ai-image/
├── .temp/tasks/ai-image/       # task context, decisions, progress
├── configs/
│   └── comfyui/
│       ├── workflows/          # ComfyUI UI/API workflow JSON
│       ├── params/             # reusable params split by built-in/user
│       └── models.manifest.yaml
├── data/
│   ├── input/prompts/          # built-in/user prompt material
│   ├── outputs/comfyui/        # generated images grouped by workflow suite
│   ├── reports/                # Chinese observation reports
│   └── models/                 # project-level temporary model files
├── external/                   # third-party source checkouts
├── models/                     # short-name symlink view for model weights
├── scripts/                    # ComfyUI 运行、素材后处理、模型冒烟脚本
├── src/                        # 展示页（Vite + React + shadcn）
└── tests/
```

## 展示页

把报告和生成图放在一起看，开发服务直接读本地 `data/` 和 `.temp/`，不复制物料

```bash
pnpm install
pnpm dev
```

打开 http://127.0.0.1:5184 。展示目录在 `src/data/entries.ts`，报告直接渲染 `data/reports/*.md`，连续图片自动排成网格，点图看大图。生成产物不入库，新 clone 下来只有报告文字和拼图

## 当前入口

- 当前内置验收套件：[`data/reports/sdxl-theme-suite.md`](data/reports/sdxl-theme-suite.md)
- 当前参数文件：[`configs/comfyui/params/built-in/sdxl-theme-suite.seed42.yaml`](configs/comfyui/params/built-in/sdxl-theme-suite.seed42.yaml)
- 当前提示词物料：[`data/input/prompts/built-in/sdxl-theme-suite.yaml`](data/input/prompts/built-in/sdxl-theme-suite.yaml)
- 当前输出目录：[`data/outputs/comfyui/built-in/sdxl-theme-suite/`](data/outputs/comfyui/built-in/sdxl-theme-suite/)

大模型优先放在 Hugging Face、ModelScope 或引擎自己的缓存里。项目根目录下的 `models/` 只做短名字软链接视图，避免把大模型权重塞进项目目录。
