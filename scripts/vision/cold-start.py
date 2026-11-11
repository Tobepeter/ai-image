"""冷启动冒烟：新进程里分段计时（导入库、加载模型、第一张、之后每张），估批量总耗时

用法：HF_HUB_OFFLINE=1 uv run ... python scripts/vision/cold-start.py <siglip2|chinese-clip|mlx 模型 id> [张数]
结果按模型合并进 data/reports/vision/cold-start.json，键名和各报告里的模型名一致
"""

import time

begin = time.time()

import json
import sys
from pathlib import Path

kind = sys.argv[1]
count = int(sys.argv[2]) if len(sys.argv) > 2 else 30
root = Path('data/input/samples/vision')
output = Path('data/reports/vision/cold-start.json')
labels = json.loads((root / 'labels.json').read_text())
files = sorted(labels['truth'])[:count]
marks = {}


def mark(name, start):
    marks[name] = round(time.time() - start, 2)
    return time.time()


def resolve(name):
    # 魔搭缓存里有同名镜像就直接用（目录名把 . 写成 ___），不再往 HF 缓存下一份
    org, repo = name.split('/')
    local = Path.home() / '.cache/modelscope/hub/models' / org / repo.replace('.', '___')
    return str(local) if (local / 'config.json').exists() else name


def siglip2():
    t = time.time()
    import torch
    from PIL import Image
    from transformers import AutoModel, AutoProcessor

    t = mark('import_s', t)
    name = 'google/siglip2-base-patch16-224'
    model = AutoModel.from_pretrained(name).to('mps').eval()
    processor = AutoProcessor.from_pretrained(name)
    prompts = [f'a photo of {labels["en"][c]}' for c in labels['categories']]
    with torch.no_grad():
        inputs = processor(text=prompts, padding='max_length', max_length=64, return_tensors='pt').to('mps')
        text = model.get_text_features(**inputs)
    t = mark('load_s', t)

    def infer(file):
        with torch.no_grad():
            inputs = processor(images=Image.open(root / file).convert('RGB'), return_tensors='pt').to('mps')
            vec = model.get_image_features(**inputs)
            vec = getattr(vec, 'pooler_output', vec)
            (vec @ getattr(text, 'pooler_output', text).T).cpu()

    return infer


def chinese_clip():
    t = time.time()
    import torch
    from PIL import Image
    from transformers import ChineseCLIPModel, ChineseCLIPProcessor

    t = mark('import_s', t)
    name = 'OFA-Sys/chinese-clip-vit-base-patch16'
    model = ChineseCLIPModel.from_pretrained(name).to('mps').eval()
    processor = ChineseCLIPProcessor.from_pretrained(name)
    prompts = [f'一张{c}的照片' for c in labels['categories']]
    with torch.no_grad():
        inputs = processor(text=prompts, padding=True, return_tensors='pt').to('mps')
        text = model.get_text_features(**inputs)
    t = mark('load_s', t)

    def infer(file):
        with torch.no_grad():
            inputs = processor(images=Image.open(root / file).convert('RGB'), return_tensors='pt').to('mps')
            vec = model.get_image_features(**inputs)
            vec = getattr(vec, 'pooler_output', vec)
            (vec @ getattr(text, 'pooler_output', text).T).cpu()

    return infer


def vlm(name):
    def build():
        t = time.time()
        from mlx_vlm import generate, load
        from mlx_vlm.prompt_utils import apply_chat_template

        t = mark('import_s', t)
        model, processor = load(resolve(name))
        question = f'用一句中文描述这张图片，不超过 30 个字。再从这些类别里选最合适的一个：{"、".join(labels["categories"])}。只输出 JSON：{{"desc": "描述", "category": "类别"}}'
        prompt = apply_chat_template(processor, model.config, question, num_images=1, enable_thinking=False)
        t = mark('load_s', t)

        def infer(file):
            generate(model, processor, prompt, [str(root / file)], max_tokens=120, temperature=0.0, verbose=False)

        return infer

    return build


builders = {'siglip2': (siglip2, 'SigLIP 2'), 'chinese-clip': (chinese_clip, 'Chinese-CLIP')}
build, key = builders.get(kind) or (vlm(kind), kind.split('/')[-1])
infer = build()

t = time.time()
infer(files[0])
t = mark('first_s', t)
for file in files[1:]:
    infer(file)
rest = time.time() - t
marks['steady_ms'] = round(rest / max(len(files) - 1, 1) * 1000)
marks['images'] = len(files)
marks['script_s'] = round(time.time() - begin, 1)

report = json.loads(output.read_text()) if output.exists() else {}
report[key] = marks
output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(key, marks)
