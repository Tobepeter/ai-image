"""CLIP 类零样本分类：Chinese-CLIP（中文提示）、SigLIP 2（中文 / 英文提示），对照 labels.json 算准确率

用法：HF_HUB_OFFLINE=1 pnpm vision:clip
"""

import json
import sys
import time
from pathlib import Path

import torch
from PIL import Image
from transformers import AutoModel, AutoProcessor, ChineseCLIPModel, ChineseCLIPProcessor

root = Path(sys.argv[1] if len(sys.argv) > 1 else 'data/input/samples/vision')
output = Path(sys.argv[2] if len(sys.argv) > 2 else 'data/reports/vision/clip-zero-shot.json')
device = 'mps' if torch.backends.mps.is_available() else 'cpu'

labels = json.loads((root / 'labels.json').read_text())
categories = labels['categories']
files = sorted(labels['truth'])


def chinese_clip():
    name = 'OFA-Sys/chinese-clip-vit-base-patch16'
    model = ChineseCLIPModel.from_pretrained(name).to(device).eval()
    processor = ChineseCLIPProcessor.from_pretrained(name)
    prompts = [f'一张{c}的照片' for c in categories]

    def encode_text():
        inputs = processor(text=prompts, padding=True, return_tensors='pt').to(device)
        return model.get_text_features(**inputs)

    def encode_image(image):
        inputs = processor(images=image, return_tensors='pt').to(device)
        return model.get_image_features(**inputs)

    return encode_text, encode_image, prompts


def siglip2(lang):
    name = 'google/siglip2-base-patch16-224'
    model = AutoModel.from_pretrained(name).to(device).eval()
    processor = AutoProcessor.from_pretrained(name)
    prompts = [f'一张{c}的照片' for c in categories] if lang == 'zh' else [f'a photo of {labels["en"][c]}' for c in categories]

    def encode_text():
        # SigLIP 训练时文本按 64 长度补齐，推理也要一样
        inputs = processor(text=prompts, padding='max_length', max_length=64, return_tensors='pt').to(device)
        return model.get_text_features(**inputs)

    def encode_image(image):
        inputs = processor(images=image, return_tensors='pt').to(device)
        return model.get_image_features(**inputs)

    return encode_text, encode_image, prompts


def features(value):
    # 新版 transformers 可能返回带 pooler_output 的对象
    return getattr(value, 'pooler_output', value)


def run(name, build):
    start = time.time()
    encode_text, encode_image, prompts = build()
    with torch.no_grad():
        text = torch.nn.functional.normalize(features(encode_text()), dim=-1)
    load = time.time() - start

    rows, hits, cost = [], 0, 0.0
    with torch.no_grad():
        for file in files:
            image = Image.open(root / file).convert('RGB')
            t = time.time()
            vec = torch.nn.functional.normalize(features(encode_image(image)), dim=-1)
            scores = (vec @ text.T)[0].float().cpu()
            if device == 'mps':
                torch.mps.synchronize()
            cost += time.time() - t
            order = scores.argsort(descending=True).tolist()
            top = [categories[i] for i in order[:3]]
            hit = top[0] in labels['truth'][file]
            hits += hit
            rows.append({'file': file, 'top': top, 'hit': hit})

    result = {'name': name, 'prompts': prompts, 'hits': hits, 'total': len(files), 'ms': round(cost / len(files) * 1000), 'load_s': round(load, 1), 'rows': rows}
    print(f'{name}: {hits}/{len(files)}，单张 {result["ms"]}ms，加载 {result["load_s"]}s', file=sys.stderr)
    return result


runs = [
    run('Chinese-CLIP 中文', chinese_clip),
    run('SigLIP 2 中文', lambda: siglip2('zh')),
    run('SigLIP 2 英文', lambda: siglip2('en')),
]
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps({'device': device, 'categories': categories, 'runs': runs}, ensure_ascii=False, indent=2) + '\n')
print(f'写入 {output}')
