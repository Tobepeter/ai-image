# SDXL 内置提示词测试报告

> 状态：历史 baseline。旧版 flat prompt suite 已归档，当前主验收入口是 [SDXL 主题套件测试报告](./sdxl-theme-suite.md)。

## 概览

- 运行入口：ComfyUI Desktop API
- API 地址：`http://127.0.0.1:8000`
- ComfyUI 版本：`0.22.0`
- 设备：`mps`
- 工作流：[sdxl-basic-t2i.api.json](../../configs/comfyui/workflows/sdxl-basic-t2i.api.json)
- 提示词套件：[t2i-basic-suite-2026-05-21.yaml](../input/prompts/built-in/_archived/t2i-basic-suite-2026-05-21.yaml)
- 模型：`sdxl-base-1.0.safetensors`
- 尺寸：`1024x1024`
- steps：`30`
- CFG：`7.0`
- sampler：`euler`
- scheduler：`normal`
- seed：`42`
- 运行 manifest：[built-in-suite-seed42-2026-05-21.json](../outputs/comfyui/built-in/sdxl-basic-t2i/built-in-suite-seed42-2026-05-21.json)

## 执行前检查

- 本轮开始前系统内存：`46.24 GiB / 64.00 GiB`
- swap：disabled
- `memory_pressure`：`System-wide memory free percentage: 74%`
- 第一条 prompt 执行前，ComfyUI API 可用内存约 `26.46 GiB`
- 整套 prompt 执行后，ComfyUI API 可用内存约 `26.60 GiB`

## 生成结果

| 用例 | 类型 | 耗时 | 可用内存变化 | 输出 |
|---|---|---:|---:|---|
| `animal-kitten-window` | 动物 | `5.01s` | `26.46 -> 25.98 GiB` | [图片](../outputs/comfyui/built-in/sdxl-basic-t2i/animal-kitten-window-seed42.png) |
| `still-life-glass-apple` | 静物 | `55.04s` | `25.96 -> 25.18 GiB` | [图片](../outputs/comfyui/built-in/sdxl-basic-t2i/still-life-glass-apple-seed42.png) |
| `city-night-neon` | 场景 | `110.07s` | `25.18 -> 20.85 GiB` | [图片](../outputs/comfyui/built-in/sdxl-basic-t2i/city-night-neon-seed42.png) |
| `watercolor-cottage` | 插画 | `185.12s` | `20.85 -> 20.19 GiB` | [图片](../outputs/comfyui/built-in/sdxl-basic-t2i/watercolor-cottage-seed42.png) |
| `portrait-natural-light` | 人像 | `160.12s` | `20.19 -> 25.72 GiB` | [图片](../outputs/comfyui/built-in/sdxl-basic-t2i/portrait-natural-light-seed42.png) |
| `product-minimalist-chair` | 产品 | `155.12s` | `25.73 -> 25.85 GiB` | [图片](../outputs/comfyui/built-in/sdxl-basic-t2i/product-minimalist-chair-seed42.png) |

## 图片预览

### animal-kitten-window

![animal-kitten-window](../outputs/comfyui/built-in/sdxl-basic-t2i/animal-kitten-window-seed42.png)

### still-life-glass-apple

![still-life-glass-apple](../outputs/comfyui/built-in/sdxl-basic-t2i/still-life-glass-apple-seed42.png)

### city-night-neon

![city-night-neon](../outputs/comfyui/built-in/sdxl-basic-t2i/city-night-neon-seed42.png)

### watercolor-cottage

![watercolor-cottage](../outputs/comfyui/built-in/sdxl-basic-t2i/watercolor-cottage-seed42.png)

### portrait-natural-light

![portrait-natural-light](../outputs/comfyui/built-in/sdxl-basic-t2i/portrait-natural-light-seed42.png)

### product-minimalist-chair

![product-minimalist-chair](../outputs/comfyui/built-in/sdxl-basic-t2i/product-minimalist-chair-seed42.png)

## 输出 Hash

| 用例 | SHA256 |
|---|---|
| `animal-kitten-window` | `cea8b51d00a763362a9ec6b0c50762fb649d9fa2db263b7b4f561c76959d53c5` |
| `still-life-glass-apple` | `85b836ea45beb0845fd7db80f7fe635a0ec22bf65814b829e719b0b65194209f` |
| `city-night-neon` | `f78120016b9c11f25f1dd862cee458c18aa86842ef5108912918f06365d633d3` |
| `watercolor-cottage` | `4fe6ba0f292819c4caf8f5ceaf40d7c3bc61e9b53118b1b915a4d44fc8982f5f` |
| `portrait-natural-light` | `55a3f747a244fff5bfba1d2ef8dfad5c4dc713145ecfab3ea3b4180de0a4dd28` |
| `product-minimalist-chair` | `b34fe4459e6a62d4f8b62a177e9350cd74c27be28b70152f39ee9b34745bd214` |

## 快速观察

- `animal-kitten-window`：提示词跟随较好，小猫、窗边、暖光、浅景深都明确出现
- `still-life-glass-apple`：玻璃、水、苹果、木桌和晨光表现不错；但生成了两个苹果，数量控制不完全稳定
- `city-night-neon`：雨夜、霓虹、湿地反射和低机位街景都比较强；招牌出现伪文字，说明当前 negative prompt 还不能完全抑制文字痕迹
- `watercolor-cottage`：水彩风格跟随较强，小屋、花园、柔和光线和纸面质感都明显
- `portrait-natural-light`：自然光人像干净，脸部结构稳定；皮肤略偏平滑，但作为 baseline 可以接受
- `product-minimalist-chair`：产品形体和材质比较完整，构图接近商品目录图

## 验收建议

这轮可以作为第一版 SDXL 内置 prompt baseline。下一步不建议继续随机出图，更值得做受控变量测试：

- 同一组 6 个 prompt，扩展 seeds `[42, 43, 44, 45]`
- 或同一组 6 个 prompt，对比 `cfg: 5.5` 和 `7.0`
- 或先优化 negative prompt，重点改善招牌伪文字、数量控制、材质一致性，再扩展矩阵
