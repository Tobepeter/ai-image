# 本地视觉模型安装验收

## 目标

为 sprite 后处理和素材理解实验准备本地模型缓存。当前策略是：

- 模型权重保留在 Hugging Face 默认缓存：`/Users/tobe/.cache/huggingface/hub`
- 项目内只记录 manifest、脚本、报告，不复制大模型文件
- `rembg` 自管模型保留在：`/Users/tobe/.u2net`

## 当前环境

- `hf` 已安装：`/Users/tobe/.local/bin/hf`
- HF 当前已登录：`tobeei`
- Python 推理依赖不固定安装到项目环境，按脚本用 `uv run --with ...` 临时隔离加载
- `rembg u2netp` 已完成真实图片推理测试

## 安装结果

| 模型 | 用途 | 状态 | 缓存位置 |
| --- | --- | --- | --- |
| Florence-2 base | caption / bbox / grounding 辅助 | 通过 | `/Users/tobe/.cache/huggingface/hub/models--microsoft--Florence-2-base` |
| SAM2 Hiera small | 交互式/提示式分割兜底 | 通过 | `/Users/tobe/.cache/huggingface/hub/models--facebook--sam2-hiera-small` |
| Qwen2.5-VL-3B-Instruct | 较强语义理解、JSON 输出、视觉定位辅助 | 通过 | `/Users/tobe/.cache/huggingface/hub/models--Qwen--Qwen2.5-VL-3B-Instruct` |
| Moondream2 | 快速标签、自动命名、小 VLM 探针 | 通过 | `/Users/tobe/.cache/huggingface/hub/models--vikhyatk--moondream2` |
| moondream/starmie-v1 tokenizer | Moondream2 remote code 依赖 | 通过 | `/Users/tobe/.cache/huggingface/hub/models--moondream--starmie-v1` |
| SmolVLM2-2.2B-Instruct | 轻量多模态 VLM 备选 | 通过 | `/Users/tobe/.cache/huggingface/hub/models--HuggingFaceTB--SmolVLM2-2.2B-Instruct` |
| rembg u2netp | 背景移除兜底 | 通过 | `/Users/tobe/.u2net/u2netp.onnx` |

当前空间占用：

- Hugging Face hub cache：约 `49G`
- rembg u2net cache：约 `5.1M`
- 本次 sprite 后处理输出：约 `7.8M`

## 校验方式

模型清单：

`configs/models/hf-vision-models.manifest.yaml`

校验脚本：

```bash
npm run validate:hf-vision-models
```

最新校验输出：

`.temp/logs/hf-vision-model-validation.json`

校验结果：

- `florence-2-base`：required files 齐全，无 `.incomplete`，usable
- `sam2-hiera-small`：required files 齐全，无 `.incomplete`，usable
- `qwen2.5-vl-3b-instruct`：两个 safetensors 分片和 metadata 齐全，无 `.incomplete`，usable
- `moondream2`：`model.safetensors` 和 tokenizer/config 齐全，无 `.incomplete`，usable
- `moondream-starmie-v1-tokenizer`：Moondream2 依赖 tokenizer 齐全，无 `.incomplete`，usable
- `smolvlm2-2.2b-instruct`：两个 safetensors 分片和 metadata 齐全，无 `.incomplete`，usable
- `rembg-models`：`u2netp.onnx` 存在，SHA256 匹配，usable

## 推理 smoke test

已对 `Florence-2 base`、`Moondream2`、`Qwen2.5-VL-3B`、`SmolVLM2` 做真实本地推理测试。

Florence-2 caption：

```bash
npm run vlm:smoke -- \
  --model florence-2-base \
  --task caption \
  --image data/input/assets/sprite-postprocess/item-sheet/originals/pixel-item-sprite-sheet.png \
  --output data/outputs/assets/sprite-postprocess/item-sheet/runs/florence-caption/vlm-smoke.caption.json
```

运行约束：

- `transformers` 需要固定在 `4.52.4`；默认安装的 `5.9.0` 与 Florence-2 remote code 不兼容
- 当前设备自动选择 `mps`
- caption smoke test 首次成功耗时 `6.5s`，依赖缓存后复跑约 `1.33s`

输出摘要：

```text
A set of pixel art items including a sword, a chest, a key, and a crystal.
```

另外跑过 `<OD>` 检测：

- 输出：`data/outputs/assets/sprite-postprocess/item-sheet/runs/florence-od/vlm-smoke.od.json`
- 检出了 `bottle` 和 `sword` 两个 bbox
- 对这个像素道具 sheet 来说，OD 只能作为语义辅助，不足以替代确定性 bbox 切图

Moondream2 caption / query：

```bash
HF_HUB_OFFLINE=1 npm run vlm:smoke -- \
  --model moondream2 \
  --task query \
  --prompt 'List the fantasy game items shown in the image.' \
  --image data/input/assets/sprite-postprocess/item-sheet/originals/pixel-item-sprite-sheet.png \
  --output data/outputs/assets/sprite-postprocess/item-sheet/runs/moondream-query/vlm-smoke.query.json
```

输出摘要：

```text
The fantasy game items shown are a crystal, a sword, a bottle, a key, and a chest.
```

观察：Moondream2 在这个 case 上比 Florence-2 更适合做“道具列表 / 自动命名”辅助；它准确列出了 5 个道具，但仍然不负责主 bbox 切图。

Qwen2.5-VL-3B query：

- 输出：`data/outputs/assets/sprite-postprocess/item-sheet/runs/qwen-query/vlm-smoke.query.json`
- 设备：`mps`
- 耗时：`7.1s`
- 输出摘要：`diamond, sword, potion, key, chest`

SmolVLM2 query：

- 输出：`data/outputs/assets/sprite-postprocess/item-sheet/runs/smolvlm-query/vlm-smoke.query.json`
- 设备：`mps`
- 耗时：`7.78s`
- 输出摘要：`crystal, sword, potion, key, chest`

## SAM2 smoke test

已对 `SAM2 Hiera small` 做 box prompt 分割测试：

```bash
HF_HUB_OFFLINE=1 npm run sam2:mask -- \
  --image data/input/assets/sprite-postprocess/item-sheet/originals/pixel-item-sprite-sheet.png \
  --components data/outputs/assets/sprite-postprocess/item-sheet/runs/solid-bg/debug/pixel-item-sprite-sheet.components.json \
  --target chest \
  --output-dir data/outputs/assets/sprite-postprocess/item-sheet/runs/sam2-box
```

输出：

- `sam2-smoke.json`
- `chest.mask.png`
- `chest.cutout.png`
- `chest.checker-preview.png`

观察：用确定性 bbox 做 box prompt 时，SAM2 能稳定切出 chest mask；它适合做疑难目标补救，不适合作为无提示自动切图第一步。

## 下载备注

下载阶段曾经处于 HF 未登录状态，大文件容易卡在 Xet 路径。实际完成方式是：

- 大 safetensors 分片使用 `HF_HUB_DISABLE_XET=1`
- 每次只拉一个大文件，避免并发连接互相拖慢
- metadata 最后用 `--exclude "*.safetensors" --exclude "*.bin"` 补齐

这一方式虽然慢，但可续传、可验收，适合当时未登录的网络状态。现在 HF 已登录，后续优先正常 `hf download`；如果个别大文件仍卡住，再临时加 `HF_HUB_DISABLE_XET=1`。

## 未完成项

当前还没做大批量评测，只做了单图 smoke test。下一步如果要继续扩展模型评测，应复用 `scripts/assets/vlm-smoke-test.py` 的输出格式，增加多图 case、失败样本和耗时统计。
