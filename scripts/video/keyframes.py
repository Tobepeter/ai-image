"""关键帧：按切点取每段中间一帧 → SigLIP 2 相似去重 → Qwen3.5-2B 一句话 → 代表帧整段概括

用法：pnpm video:keyframes <视频目录> [检测器]
读 data/reports/video/shots.json 的切点，检测器缺省用 transnet（BBC 标注上最准）
一镜到底的视频切不出镜头，超过 max_scene_s 的段再按固定间隔细分
关键帧图片写到视频目录旁的 keyframes/，结果写 data/reports/video/keyframes.json
"""

import json
import subprocess
import sys
import time
from pathlib import Path

root = Path(sys.argv[1])
detector = sys.argv[2] if len(sys.argv) > 2 else 'transnet'
shots = json.loads(Path('data/reports/video/shots.json').read_text())
output = Path('data/reports/video/keyframes.json')
frame_dir = root.parent / 'keyframes'
threshold = 0.9  # 和已保留代表帧的余弦相似度达到这个值就算重复
summary_frames = 8  # 整段概括最多看几张代表帧
caption_model = 'mlx-community/Qwen3.5-2B-4bit'
max_scene_s = 10  # 长于这个秒数的段，每 10 秒再取一帧


def resolve(name):
    # 魔搭缓存里有同名镜像就直接用
    org, repo = name.split('/')
    local = Path.home() / '.cache/modelscope/hub/models' / org / repo.replace('.', '___')
    return str(local) if (local / 'config.json').exists() else name


def extract(video, stem, scenes, fps):
    # 每段取中间一帧，缩到宽 480
    target = frame_dir / stem
    target.mkdir(parents=True, exist_ok=True)
    for index, scene in enumerate(scenes):
        path = target / f'{index:04d}.jpg'
        scene['image'] = str(path)
        if path.exists():
            continue
        subprocess.run(
            ['ffmpeg', '-v', 'error', '-ss', f'{scene["mid"] / fps:.3f}', '-i', str(video), '-frames:v', '1', '-vf', 'scale=480:-2', '-q:v', '4', str(path)],
            check=True,
        )


def dedup(scenes):
    import torch
    from PIL import Image
    from transformers import AutoModel, AutoProcessor

    name = 'google/siglip2-base-patch16-224'
    model = AutoModel.from_pretrained(name).to('mps').eval()
    processor = AutoProcessor.from_pretrained(name)
    vecs = []
    with torch.no_grad():
        for start in range(0, len(scenes), 32):
            images = [Image.open(scene['image']).convert('RGB') for scene in scenes[start : start + 32]]
            feats = model.get_image_features(**processor(images=images, return_tensors='pt').to('mps'))
            feats = getattr(feats, 'pooler_output', feats)
            vecs.append(torch.nn.functional.normalize(feats, dim=-1).cpu())
    vecs = torch.cat(vecs)

    # 按时间顺序贪心：和已有代表帧最像的超过阈值就并进那一组
    reps = []
    for index, scene in enumerate(scenes):
        sims = (vecs[reps] @ vecs[index]).tolist() if reps else []
        best = max(range(len(sims)), key=sims.__getitem__) if sims else None
        if best is not None and sims[best] >= threshold:
            scene['group'] = reps[best]
            scene['sim'] = round(sims[best], 3)
        else:
            scene['group'] = index
            reps.append(index)
    # 不同阈值下剩几张，方便调阈值
    stats = {}
    for value in (0.8, 0.85, 0.9, 0.95):
        kept = []
        for index in range(len(scenes)):
            if not kept or max((vecs[kept] @ vecs[index]).tolist()) < value:
                kept.append(index)
        stats[str(value)] = len(kept)
    return reps, stats


def caption(model, processor, scenes, reps):
    from mlx_vlm import generate
    from mlx_vlm.prompt_utils import apply_chat_template

    prompt = apply_chat_template(processor, model.config, '用一句中文描述这张图片，不超过 30 个字，只输出这句话。', num_images=1, enable_thinking=False)
    for index in reps:
        result = generate(model, processor, prompt, [scenes[index]['image']], max_tokens=60, temperature=0.0, verbose=False)
        scenes[index]['desc'] = getattr(result, 'text', result).strip()


def summarize(model, processor, scenes, reps):
    from mlx_vlm import generate
    from mlx_vlm.prompt_utils import apply_chat_template

    step = max(len(reps) / summary_frames, 1)
    picks = [reps[int(i * step)] for i in range(min(summary_frames, len(reps)))]
    question = f'这是一段视频按时间顺序抽出的 {len(picks)} 张画面。用两三句中文概括这段视频讲了什么，并说出大概有几个主要场景、分别是什么。'
    prompt = apply_chat_template(processor, model.config, question, num_images=len(picks), enable_thinking=False)
    result = generate(model, processor, prompt, [scenes[i]['image'] for i in picks], max_tokens=200, temperature=0.0, verbose=False)
    return {'frames': picks, 'text': getattr(result, 'text', result).strip()}


def split_long(bounds, fps):
    # 镜头内按 max_scene_s 均分，细分出来的段标 split
    scenes, step = [], int(max_scene_s * fps)
    for a, b in zip(bounds, bounds[1:]):
        if b <= a:
            continue
        parts = max(1, round((b - a) / step))
        edges = [a + (b - a) * i // parts for i in range(parts + 1)]
        for index, (start, end) in enumerate(zip(edges, edges[1:])):
            scenes.append({'start': start, 'end': end, 'mid': (start + end) // 2, 'split': index > 0})
    return scenes


def main():
    from mlx_vlm import load

    report = json.loads(output.read_text()) if output.exists() else {}
    model, processor = load(resolve(caption_model))
    for stem, item in shots.items():
        video = root / item['file']
        if not video.exists():
            continue
        fps = item['fps']
        total = int(item['duration'] * fps)
        bounds = [0, *item['runs'][detector]['cuts'], total]
        scenes = split_long(bounds, fps)
        marks = {}

        t = time.time()
        extract(video, stem, scenes, fps)
        marks['extract_s'] = round(time.time() - t, 1)
        t = time.time()
        reps, stats = dedup(scenes)
        marks['dedup_s'] = round(time.time() - t, 1)
        t = time.time()
        caption(model, processor, scenes, reps)
        marks['caption_s'] = round(time.time() - t, 1)
        t = time.time()
        summary = summarize(model, processor, scenes, reps)
        marks['summary_s'] = round(time.time() - t, 1)

        report[stem] = {'detector': detector, 'threshold': threshold, 'max_scene_s': max_scene_s, 'model': caption_model, 'fps': fps, 'scenes': scenes, 'reps': reps, 'kept': stats, 'summary': summary, 'timing': marks}
        print(f'{stem}: {len(scenes)} 段 → 去重后 {len(reps)} 张，{marks}', file=sys.stderr)
        output.write_text(json.dumps(report, ensure_ascii=False, indent=1) + '\n')
    print(f'写入 {output}')


main()
