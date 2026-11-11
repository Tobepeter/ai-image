#!/usr/bin/env python3

import argparse
import json
import math
from pathlib import Path

import cv2
import numpy as np
from PIL import Image


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract foreground components with OpenCV.")
    parser.add_argument("--image", required=True)
    parser.add_argument("--expected", nargs="*", default=[])
    parser.add_argument("--key-color", default="35,40,46")
    parser.add_argument("--fuzz-percent", type=float, default=9.0)
    parser.add_argument("--min-area", type=float, default=1000)
    parser.add_argument("--max-components", type=int, default=5)
    parser.add_argument("--padding", type=int, default=8)
    parser.add_argument("--merge-detached", action="store_true")
    parser.add_argument("--merge-min-area", type=float, default=12)
    parser.add_argument("--merge-x-margin", type=float, default=24)
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args()

    image_path = Path(args.image)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    image = Image.open(image_path).convert("RGB")
    rgb = np.asarray(image)
    key = np.array(parse_rgb(args.key_color), dtype=np.float32)
    distance = np.linalg.norm(rgb.astype(np.float32) - key, axis=2)
    tolerance = args.fuzz_percent / 100.0 * math.sqrt(3 * (255 ** 2))
    foreground = (distance > tolerance).astype(np.uint8)

    count, labels, stats, centroids = cv2.connectedComponentsWithStats(foreground, connectivity=8)
    raw_components = []
    for index in range(1, count):
        x, y, w, h, area = stats[index]
        raw_components.append({
            "id": int(index),
            "x": int(x),
            "y": int(y),
            "w": int(w),
            "h": int(h),
            "area": float(area),
            "centroid_x": float(centroids[index][0]),
            "centroid_y": float(centroids[index][1]),
        })

    if args.merge_detached:
        components = merge_detached_components(
            raw_components,
            seed_min_area=args.min_area,
            max_components=args.max_components,
            merge_min_area=args.merge_min_area,
            x_margin=args.merge_x_margin,
        )
    else:
        components = [
            component for component in raw_components
            if component["area"] >= args.min_area
        ]
        components = sorted(components, key=lambda item: -item["area"])[:args.max_components]

    components = [pad_box(component, image.width, image.height, args.padding) for component in components]
    components.sort(key=lambda item: (item["x"], item["y"]))

    for index, component in enumerate(components):
        component["name"] = args.expected[index] if index < len(args.expected) else f"component-{index + 1}"

    mask_path = output_dir / "foreground.mask.png"
    overlay_path = output_dir / "bbox-overlay.png"
    components_path = output_dir / "components.json"

    Image.fromarray(foreground * 255, mode="L").save(mask_path)
    overlay = cv2.cvtColor(rgb.copy(), cv2.COLOR_RGB2BGR)
    for component in components:
        x, y, w, h = component["x"], component["y"], component["w"], component["h"]
        cv2.rectangle(overlay, (x, y), (x + w, y + h), (0, 0, 255), 4)
    cv2.imwrite(str(overlay_path), overlay)

    payload = {
        "image": str(image_path),
        "key_color": args.key_color,
        "fuzz_percent": args.fuzz_percent,
        "tolerance": tolerance,
        "components": components,
        "mask": str(mask_path),
        "overlay": str(overlay_path),
    }
    components_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "components": len(components),
        "output": str(components_path),
    }, ensure_ascii=False))


def parse_rgb(text: str) -> tuple[int, int, int]:
    parts = [int(part.strip()) for part in text.split(",")]
    if len(parts) != 3:
        raise ValueError("--key-color must be R,G,B")
    return tuple(parts)


def pad_box(component: dict, image_w: int, image_h: int, padding: int) -> dict:
    x = max(component["x"] - padding, 0)
    y = max(component["y"] - padding, 0)
    right = min(component["x"] + component["w"] + padding, image_w)
    bottom = min(component["y"] + component["h"] + padding, image_h)
    return {
        **component,
        "x": x,
        "y": y,
        "w": right - x,
        "h": bottom - y,
    }


def merge_detached_components(
    components: list[dict],
    seed_min_area: float,
    max_components: int,
    merge_min_area: float,
    x_margin: float,
) -> list[dict]:
    seeds = [
        component for component in components
        if component["area"] >= seed_min_area
    ]
    seeds = sorted(seeds, key=lambda item: -item["area"])[:max_components]
    groups = [{**seed, "member_ids": [seed["id"]]} for seed in seeds]
    seed_ids = {seed["id"] for seed in seeds}

    for component in components:
        if component["id"] in seed_ids or component["area"] < merge_min_area:
            continue

        group = find_group_by_x(groups, component, x_margin)
        if group is None:
            continue

        merge_box(group, component)
        group["area"] += component["area"]
        group["member_ids"].append(component["id"])

    return groups


def find_group_by_x(groups: list[dict], component: dict, x_margin: float) -> dict | None:
    for group in groups:
        left = group["x"] - x_margin
        right = group["x"] + group["w"] + x_margin
        if left <= component["centroid_x"] <= right:
            return group
    return None


def merge_box(target: dict, component: dict) -> None:
    left = min(target["x"], component["x"])
    top = min(target["y"], component["y"])
    right = max(target["x"] + target["w"], component["x"] + component["w"])
    bottom = max(target["y"] + target["h"], component["y"] + component["h"])
    target["x"] = left
    target["y"] = top
    target["w"] = right - left
    target["h"] = bottom - top


if __name__ == "__main__":
    main()
