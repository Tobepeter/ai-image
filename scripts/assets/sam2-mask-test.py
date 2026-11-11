#!/usr/bin/env python3

import argparse
import json
import time
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image, ImageDraw
from transformers import Sam2Model, Sam2Processor


SAM2_SNAPSHOT = Path(
    "/Users/tobe/.cache/huggingface/hub/models--facebook--sam2-hiera-small/"
    "snapshots/e080ada8afd19df5e165abe71b006edc7f4c3d4e"
)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run SAM2 box-prompt mask smoke test.")
    parser.add_argument("--image", required=True)
    parser.add_argument("--components", required=True)
    parser.add_argument("--target", default="chest")
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--device", default="auto", choices=["auto", "cpu", "mps", "cuda"])
    args = parser.parse_args()

    image_path = Path(args.image)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    image = Image.open(image_path).convert("RGB")
    component = load_component(Path(args.components), args.target)
    box = [
        int(component["x"]),
        int(component["y"]),
        int(component["x"] + component["w"]),
        int(component["y"] + component["h"]),
    ]
    device = resolve_device(args.device)

    started = time.time()
    processor = Sam2Processor.from_pretrained(SAM2_SNAPSHOT, local_files_only=True)
    model = Sam2Model.from_pretrained(SAM2_SNAPSHOT, local_files_only=True).to(device)
    inputs = processor(images=image, input_boxes=[[box]], return_tensors="pt").to(device)

    with torch.no_grad():
        outputs = model(**inputs)

    scores = outputs.iou_scores.detach().cpu().numpy().reshape(-1)
    selected_mask_index = int(scores.argmax())
    mask_logits = outputs.pred_masks[:, 0, selected_mask_index:selected_mask_index + 1, :, :]
    mask_full = F.interpolate(
        mask_logits,
        size=(image.height, image.width),
        mode="bilinear",
        align_corners=False,
    )[0, 0].detach().cpu().numpy()
    mask = (mask_full > 0).astype(np.uint8) * 255

    mask_img = Image.fromarray(mask, mode="L")
    mask_path = output_dir / f"{args.target}.mask.png"
    cutout_path = output_dir / f"{args.target}.cutout.png"
    preview_path = output_dir / f"{args.target}.checker-preview.png"
    report_path = output_dir / "sam2-smoke.json"

    mask_img.save(mask_path)
    rgba = image.convert("RGBA")
    rgba.putalpha(mask_img)
    rgba.crop(tuple(box)).save(cutout_path)
    checker_preview(image.size, rgba).save(preview_path)

    report = {
        "model": "sam2-hiera-small",
        "snapshot": str(SAM2_SNAPSHOT),
        "target": args.target,
        "box": box,
        "device": device,
        "elapsed_seconds": round(time.time() - started, 2),
        "iou_scores": scores.tolist(),
        "selected_mask_index": selected_mask_index,
        "mask_area_pixels": int((mask > 0).sum()),
        "mask": str(mask_path),
        "cutout": str(cutout_path),
        "preview": str(preview_path),
    }
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False))


def load_component(path: Path, target: str) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    for component in data["components"]:
        if component["name"] == target:
            return component
    raise ValueError(f"Target component not found: {target}")


def checker_preview(size: tuple[int, int], rgba: Image.Image) -> Image.Image:
    width, height = size
    cell = 24
    checker = Image.new("RGBA", size, (0, 0, 0, 255))
    draw = ImageDraw.Draw(checker)
    for y in range(0, height, cell):
        for x in range(0, width, cell):
            color = (180, 180, 180, 255) if ((x // cell + y // cell) % 2 == 0) else (120, 120, 120, 255)
            draw.rectangle((x, y, min(x + cell, width), min(y + cell, height)), fill=color)
    return Image.alpha_composite(checker, rgba)


def resolve_device(requested: str) -> str:
    if requested != "auto":
        return requested
    if torch.cuda.is_available():
        return "cuda"
    if torch.backends.mps.is_available():
        return "mps"
    return "cpu"


if __name__ == "__main__":
    main()
