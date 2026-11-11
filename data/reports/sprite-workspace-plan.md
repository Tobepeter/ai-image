# Sprite 后处理项目级工作区规划

## 背景

当前项目已经有两类像素风素材实验：

- ComfyUI 生成实验：`data/outputs/comfyui/built-in/sdxl-pixel-item-icons/`、`sdxl-pixel-tile-textures/`、`sdxl-pixel-sprite-sheets/`
- Codex 内置 imagegen 快速样例：任务目录里保存过一张 5 个道具横排 sprite sheet

下一步不是继续把素材放进任务目录，而是把 sprite 后处理作为项目级实验链路管理，类似现有 AI 生图测试。

## 设计原则

- 输入素材、处理输出、报告都放项目级目录
- 任务目录只记录讨论上下文，不作为长期素材仓库
- 一个 case 可以包含多张输入图
- 一个 case 可以跑多个 processor / model variant
- 同一输入可以产出透明图、散图、atlas、preview、debug mask、质量报告
- 输入素材属于实验来源，默认可以进 `data/input/`
- 生成产物和大模型不进 git，输出、模型权重仍然走忽略规则
- case manifest 放在 `data/input/` 更符合语义；processor / model variant 配置放在 `configs/`

## 推荐目录

```text
data/
  input/
    assets/
      sprite-postprocess/
        item-sheet/
          manifest.yaml
          originals/
            pixel-item-sprite-sheet.png
          references/
          masks/

  outputs/
    assets/
      sprite-postprocess/
        item-sheet/
          manifest.json
          runs/
            chroma-green/
              config.snapshot.yaml
              input/
                pixel-item-sprite-sheet.png
              transparent/
                pixel-item-sprite-sheet.alpha.png
              masks/
                pixel-item-sprite-sheet.mask.png
              debug/
                bbox-overlay.png
                components.json
              sprites/
                crystal.png
                sword.png
                potion.png
                key.png
                chest.png
              atlases/
                atlas.json
                atlas.png
              previews/
                contact-sheet.png
            rembg/
            rembg-isnet/
            sam-box/

configs/
  assets/
    sprite-postprocess/
      processors/
        chroma-green.yaml
        chroma-magenta.yaml
        rembg.yaml
        rembg-isnet.yaml
        sam-box.yaml

scripts/
  assets/
    sprite-postprocess.mjs
    sprite-atlas.mjs
    sprite-contact-sheet.mjs

data/
  reports/
    sprite-postprocess-item-sheet.md
```

## 输入层

输入素材建议按 case 分组，而不是把所有图片平铺到一个目录。

```text
data/input/assets/sprite-postprocess/{case_id}/
```

输入目录每个 case 至少包含：

```text
manifest.yaml
originals/
```

`manifest.yaml` 是这个 case 的入口，建议记录：

```yaml
id: item-sheet
type: sprite-sheet
source:
  kind: codex-imagegen
  note: 5 fantasy item icons in one sheet
inputs:
  - id: pixel-item-sprite-sheet
    path: originals/pixel-item-sprite-sheet.png
    expected_objects:
      - crystal
      - sword
      - potion
      - key
      - chest
expected_outputs:
  transparent: true
  sprites: true
  atlas: true
```

如果后续是文件夹多图输入，则同一个 case 的 `originals/` 可以放多张图，case 配置逐个列出。

## 输出层

输出按 case，再按 run variant 分组。

```text
data/outputs/assets/sprite-postprocess/{case_id}/runs/{run_id}/
```

这样可以同时测试：

- `chroma-green`
- `chroma-magenta`
- `solid-bg`
- `opencv-components`
- `rembg`
- `rembg-isnet`
- `sam-box`

每个 run 内建议固定这些产物类型：

| 目录 | 内容 |
|---|---|
| `input/` | 本轮实际使用的输入快照或软链接 |
| `transparent/` | 背景透明化后的整图 |
| `masks/` | alpha/binary mask |
| `debug/` | bbox overlay、连通域 JSON、阈值调试图 |
| `sprites/` | 散图 |
| `atlases/` | atlas PNG / JSON |
| `previews/` | contact sheet、对比图 |
| `logs/` | 命令输出、耗时、错误 |
| `config.snapshot.yaml` | 本轮配置快照 |

## 配置层

处理配置放在：

```text
configs/assets/sprite-postprocess/processors/
```

每个配置描述一个可复现处理器或模型变体。

示例：

```yaml
id: chroma-green
processor: chroma-key
engine: imagemagick
background:
  key_color: "#00ff00"
  fuzz_percent: 3
postprocess:
  alpha_cleanup: true
  min_component_area: 64
  sort: left-to-right
outputs:
  transparent: true
  masks: true
  sprites: true
  atlas: true
  preview: true
```

rembg 示例：

```yaml
id: rembg
processor: rembg
model:
  name: u2netp
geometry:
  bbox_source: alpha
  min_component_area: 64
outputs:
  transparent: true
  masks: true
  sprites: true
  atlas: true
```

SAM 示例：

```yaml
id: sam-box
processor: sam
prompt_source: bbox
prompt_provider: opencv-components
model:
  family: segment-anything
outputs:
  masks: true
  transparent: true
```

## 产物类型

### 透明整图

用于检查背景移除效果：

```text
transparent/{input_id}.alpha.png
```

### mask

用于调试和复现：

```text
masks/{input_id}.mask.png
```

### 散图

单个 sprite 输出：

```text
sprites/{sprite_id}.png
```

### atlas

图集输出：

```text
atlases/atlas.png
atlases/atlas.json
```

推荐 atlas JSON 初始格式：

```json
{
  "meta": {
    "case_id": "item-sheet",
    "run_id": "chroma-green",
    "image": "atlas.png"
  },
  "frames": {
    "crystal": { "x": 0, "y": 0, "w": 64, "h": 64 },
    "sword": { "x": 64, "y": 0, "w": 64, "h": 64 }
  }
}
```

## 多图输入

多图输入不要拆成多个 case，除非它们语义上是不同实验。推荐：

```text
case = 一组实验问题
input = case 里的多张图片
run = 同一组输入上的一个处理变体
```

例如：

```text
case: item-icons-batch-a
inputs:
  - sword-sheet.png
  - potion-sheet.png
  - chest-sheet.png
runs:
  - chroma-green
  - rembg
```

这样报告可以比较“同一批输入，不同处理器”的效果。

## 模型变体

模型或处理器变体不应该混在输出文件名里，而应该是 run 层级：

```text
runs/
  chroma-green/
  rembg/
  rembg-isnet/
  sam-box/
```

这样每个 run 都能拥有完整产物树，便于对比、清理和复跑。

## 和现有项目结构的关系

当前项目已有：

```text
data/outputs/comfyui/built-in/{suite}/raw
data/outputs/comfyui/built-in/{suite}/processed
```

这个结构适合“生成结果的简单后处理”，例如把单图缩到 `128x128`。

新的 sprite 后处理工作区更适合“输入多图 + 多处理器 + 产物类型复杂”的场景，因此建议新建：

```text
data/input/assets/sprite-postprocess/
data/outputs/assets/sprite-postprocess/
configs/assets/sprite-postprocess/
```

不要把复杂后处理结果继续塞进 `data/outputs/comfyui/.../processed`，否则后面 rembg/SAM/OpenCV/atlas 结果会混在生图套件下面，职责会变乱。

## 首个 case 建议

首个项目级 case 可以用前面测试过的 5 道具 sprite sheet：

```text
case_id: item-sheet
目标：从一张横排道具图中得到透明整图、5 张散图、atlas JSON、bbox overlay、contact sheet
第一 run：chroma / threshold 或按实际背景色做 ImageMagick 透明化
第二 run：OpenCV alpha components 切分
第三 run：必要时再加 rembg-u2netp
```

如果输入图不是纯色 chroma key，而是深色底板，则第一轮不要假装它是 chroma green；应该先做“背景采样 + 颜色阈值”或“人工指定背景色”的 deterministic run。

## 推荐推进顺序

1. 先建 `data/input/assets/sprite-postprocess/item-sheet/manifest.yaml`
2. 建 `configs/assets/sprite-postprocess/processors/solid-bg.yaml`
3. 建一个最小 runner：读取 case 配置，输出 transparent / debug / sprites / atlas
4. 跑前面那张 5 道具 sprite sheet
5. 写项目报告，记录 bbox 稳定性、边缘质量、散图是否干净
6. 再接入 rembg-u2netp 做同 case 对比
7. 最后才考虑 SAM 或 VLM 命名

## 当前结论

项目级测试应该把“生成”和“资产后处理”拆开：

- `data/outputs/comfyui/...` 继续保存生图实验输出
- `data/input/assets/sprite-postprocess/...` 保存要处理的输入批次和 case manifest
- `data/outputs/assets/sprite-postprocess/...` 保存后处理 run 结果
- `configs/assets/sprite-postprocess/processors/...` 保存处理器和模型变体配置
- `data/reports/...` 保存人工观察和结论

这样能同时支持文件夹多图、透明化、散图、图集、debug mask、模型变体对比和后续自动报告
