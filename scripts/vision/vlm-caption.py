"""小型多模态模型（MLX 4bit）：一句中文描述 + 从固定类别里选一个，对照 labels.json 算准确率

用法：HF_HUB_OFFLINE=1 pnpm vision:caption [模型 ...]
不给模型就跑默认全部；结果按模型名合并进已有报告，只重跑指定的
"""

import json
import re
import sys
import time
from pathlib import Path

from mlx_vlm import generate, load
from mlx_vlm.prompt_utils import apply_chat_template

root = Path('data/input/samples/vision')
output = Path('data/reports/vision/vlm-caption.json')
models = [
    'mlx-community/Qwen3.5-0.8B-4bit',
    'mlx-community/Qwen3.5-2B-4bit',
    'mlx-community/Qwen3.5-2B-8bit',
    'mlx-community/Qwen3.5-4B-4bit',
    'mlx-community/InternVL3_5-1B-4bit',
    'mlx-community/MiniCPM-V-4.7-1B-4bit',
]
selected = sys.argv[1:] or models

labels = json.loads((root / 'labels.json').read_text())
categories = labels['categories']
files = sorted(labels['truth'])
question = (
    '用一句中文描述这张图片，不超过 30 个字。'
    f'再从这些类别里选最合适的一个：{"、".join(categories)}。'
    '只输出 JSON：{"desc": "描述", "category": "类别"}'
)


def resolve(name):
    # 魔搭缓存里有同名镜像就直接用（目录名把 . 写成 ___），不再往 HF 缓存下一份
    org, repo = name.split('/')
    local = Path.home() / '.cache/modelscope/hub/models' / org / repo.replace('.', '___')
    return str(local) if (local / 'config.json').exists() else name


def parse(text):
    # 小模型常把 category 写到花括号外，按字段名宽松提取
    answer = {}
    for key in ('desc', 'category'):
        match = re.search(rf'"?{key}"?\s*[:：]\s*"([^"]*)"', text)
        if match:
            answer[key] = match.group(1).strip()
    return answer


def run(name):
    start = time.time()
    model, processor = load(resolve(name))
    # 关掉思考模式，只要直接回答
    prompt = apply_chat_template(processor, model.config, question, num_images=1, enable_thinking=False)
    load_s = time.time() - start

    rows, hits, cost = [], 0, 0.0
    for file in files:
        t = time.time()
        result = generate(model, processor, prompt, [str(root / file)], max_tokens=120, temperature=0.0, verbose=False)
        cost += time.time() - t
        text = getattr(result, 'text', result)
        answer = parse(text)
        category = answer.get('category', '')
        hit = category in labels['truth'][file]
        hits += hit
        rows.append({'file': file, 'desc': answer.get('desc', ''), 'category': category, 'hit': hit, 'raw': text.strip()})
        print(f'  {file} {category} {answer.get("desc", text[:40])}', file=sys.stderr)

    result = {'name': name.split('/')[-1], 'hits': hits, 'total': len(files), 'ms': round(cost / len(files) * 1000), 'load_s': round(load_s, 1), 'rows': rows}
    print(f'{name}: {hits}/{len(files)}，单张 {result["ms"]}ms，加载 {result["load_s"]}s', file=sys.stderr)
    return result


# 合并：新结果覆盖同名，顺序按默认列表
previous = json.loads(output.read_text())['runs'] if output.exists() else []
merged = {item['name']: item for item in previous}
for name in selected:
    merged[name.split('/')[-1]] = run(name)
order = [name.split('/')[-1] for name in models]
runs = sorted(merged.values(), key=lambda item: order.index(item['name']) if item['name'] in order else len(order))
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps({'question': question, 'runs': runs}, ensure_ascii=False, indent=2) + '\n')
print(f'写入 {output}')
