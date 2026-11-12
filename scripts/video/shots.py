"""切镜头对比：PySceneDetect 内容检测 / 自适应检测 + TransNetV2，有标注时算准确率

用法：pnpm video:shots <视频目录> [只跑的方法，如 transnet]
视频目录里放视频；同名 .txt 是 BBC 格式标注（每行一个镜头的起止帧），有就算准确率
结果写 data/reports/video/shots.json，只存切点时间，不存画面
"""

import json
import subprocess
import sys
import time
from pathlib import Path

import numpy as np

root = Path(sys.argv[1])
output = Path('data/reports/video/shots.json')
exts = {'.mp4', '.webm', '.mov', '.mkv'}
transnet_path = Path.home() / '.cache/huggingface/hub/models--elya5--transnetv2/snapshots/e1cfcb717af91e41ffb84b5fd851505682c576ee/transnetv2.onnx'
tolerance = 5  # 帧，切点落在标注过渡区间 ±5 帧内算对


def probe(path):
    out = subprocess.run(
        ['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate', '-show_entries', 'format=duration', '-of', 'json', str(path)],
        capture_output=True, text=True, check=True,
    )
    info = json.loads(out.stdout)
    num, den = info['streams'][0]['r_frame_rate'].split('/')
    return {'width': info['streams'][0]['width'], 'height': info['streams'][0]['height'], 'fps': float(num) / float(den), 'duration': float(info['format']['duration'])}


def scenedetect_cuts(path, detector):
    from scenedetect import detect

    scenes = detect(str(path), detector)
    return [scene[0].frame_num for scene in scenes[1:]]


def transnet_cuts(path, info):
    import onnxruntime as ort

    # 官方做法：整段缩到 48×27，首尾各补帧，100 帧一窗、步长 50，只取中间 50 帧的预测
    raw = subprocess.run(
        ['ffmpeg', '-v', 'error', '-i', str(path), '-vf', 'scale=48:27', '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-'],
        capture_output=True, check=True,
    ).stdout
    frames = np.frombuffer(raw, np.uint8).reshape(-1, 27, 48, 3)
    count = len(frames)
    tail = 25 + 50 - (count % 50 if count % 50 else 50)
    padded = np.concatenate([np.repeat(frames[:1], 25, 0), frames, np.repeat(frames[-1:], tail, 0)])

    # 优先用 CoreML（Apple 芯片），不行退回 CPU
    session = ort.InferenceSession(str(transnet_path), providers=['CoreMLExecutionProvider', 'CPUExecutionProvider'])
    probs = []
    for start in range(0, len(padded) - 99, 50):
        # 这个 ONNX 的第一个输出已经是单帧切换概率，不用再过 sigmoid
        single = session.run(None, {'input': padded[start : start + 100][None].astype(np.float32)})[0]
        probs.append(single[0, 25:75, 0])
    probs = np.concatenate(probs)[:count]

    # 连续超过阈值的一段是过渡，切点取这段的中间
    cuts, run = [], []
    for index, prob in enumerate(probs):
        if prob > 0.5:
            run.append(index)
        elif run:
            cuts.append(run[len(run) // 2])
            run = []
    if run:
        cuts.append(run[len(run) // 2])
    return [cut for cut in cuts if cut > 0]


def load_truth(path):
    # BBC 格式：每行一个镜头的起止帧，相邻镜头之间的空档是渐变过渡
    shots = [tuple(map(int, line.split())) for line in path.read_text().splitlines() if line.strip()]
    return [(prev[1], cur[0]) for prev, cur in zip(shots, shots[1:])]


def score(cuts, truth):
    # 贪心一对一匹配：切点落在 [上一镜头末帧 - 容差, 下一镜头首帧 + 容差] 算命中
    used, hits = set(), 0
    for cut in cuts:
        for index, (end, start) in enumerate(truth):
            if index not in used and end - tolerance <= cut <= start + tolerance:
                used.add(index)
                hits += 1
                break
    precision = hits / len(cuts) if cuts else 0
    recall = hits / len(truth) if truth else 0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0
    return {'hits': hits, 'detected': len(cuts), 'truth': len(truth), 'precision': round(precision, 3), 'recall': round(recall, 3), 'f1': round(f1, 3)}


def main():
    from scenedetect import AdaptiveDetector, ContentDetector

    only = sys.argv[2:] or None
    report = json.loads(output.read_text()) if output.exists() else {}
    for path in sorted(p for p in root.iterdir() if p.suffix in exts):
        info = probe(path)
        truth_path = path.with_suffix('.txt')
        truth = load_truth(truth_path) if truth_path.exists() else None
        runs = dict(report.get(path.stem, {}).get('runs', {}))
        for name, build in [
            ('content', lambda: scenedetect_cuts(path, ContentDetector())),
            ('adaptive', lambda: scenedetect_cuts(path, AdaptiveDetector())),
            ('transnet', lambda: transnet_cuts(path, info)),
        ]:
            if only and name not in only and name in runs:
                continue
            start = time.time()
            cuts = build()
            cost = time.time() - start
            run = {'cuts': cuts, 'seconds': round(cost, 1), 'speed': round(info['duration'] / cost, 1)}
            if truth:
                run['score'] = score(cuts, truth)
            runs[name] = run
            print(f'{path.name} {name}: {len(cuts)} 个切点，{cost:.1f}s，{run["speed"]}x 实时 {run.get("score", "")}', file=sys.stderr)
        report[path.stem] = {'file': path.name, **info, 'truth': [start for _, start in truth] if truth else None, 'runs': runs}

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=1) + '\n')
    print(f'写入 {output}')


main()
