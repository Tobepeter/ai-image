#!/usr/bin/env python3

import argparse
import csv
import json
import math
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw


def main() -> None:
    parser = argparse.ArgumentParser(description="Remove bright checker-like background and extract sprite bboxes.")
    parser.add_argument("--images", nargs="+", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--bright-min", type=int, default=220)
    parser.add_argument("--neutral-delta", type=int, default=18)
    parser.add_argument("--min-area", type=int, default=80)
    parser.add_argument("--group-gap", type=int, default=24)
    parser.add_argument("--max-components", type=int, default=0)
    parser.add_argument("--contact-tile", type=int, default=128)
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    for name in ["transparent", "masks", "debug", "sprites", "previews"]:
        (output_dir / name).mkdir(parents=True, exist_ok=True)

    results = []
    for image_arg in args.images:
        result = process_image(Path(image_arg), output_dir, args)
        results.append(result)

    write_json(output_dir / "run.manifest.json", {
        "processor": "checker-bg",
        "params": {
            "bright_min": args.bright_min,
            "neutral_delta": args.neutral_delta,
            "min_area": args.min_area,
            "group_gap": args.group_gap,
            "max_components": args.max_components,
        },
        "results": results,
    })
    print(json.dumps({
        "processed": len(results),
        "components": sum(len(result["components"]) for result in results),
        "output": str(output_dir),
    }, ensure_ascii=False))


def process_image(image_path: Path, output_dir: Path, args: argparse.Namespace) -> dict:
    image_id = image_path.stem
    image = Image.open(image_path).convert("RGB")
    rgb = np.asarray(image)

    background = detect_connected_bright_background(
        rgb,
        bright_min=args.bright_min,
        neutral_delta=args.neutral_delta,
    )
    foreground = np.logical_not(background)
    components = extract_grouped_components(
        foreground,
        min_area=args.min_area,
        group_gap=args.group_gap,
        max_components=args.max_components,
    )

    alpha = np.where(background, 0, 255).astype(np.uint8)
    rgba = np.dstack([rgb, alpha])
    rgba_image = Image.fromarray(rgba, mode="RGBA")

    transparent_path = output_dir / "transparent" / f"{image_id}.alpha.png"
    mask_path = output_dir / "masks" / f"{image_id}.mask.png"
    overlay_path = output_dir / "debug" / f"{image_id}.bbox-overlay.png"
    components_path = output_dir / "debug" / f"{image_id}.components.json"
    components_csv_path = output_dir / "debug" / f"{image_id}.components.csv"
    sprite_dir = output_dir / "sprites" / image_id
    sprite_dir.mkdir(parents=True, exist_ok=True)
    contact_path = output_dir / "previews" / f"{image_id}.contact-sheet.png"

    rgba_image.save(transparent_path)
    Image.fromarray((foreground.astype(np.uint8) * 255), mode="L").save(mask_path)

    named_components = []
    sprite_paths = []
    for index, component in enumerate(components, start=1):
        name = f"{image_id}-{index:03d}"
        sprite_path = sprite_dir / f"{name}.png"
        crop = rgba_image.crop((
            component["x"],
            component["y"],
            component["x"] + component["w"],
            component["y"] + component["h"],
        ))
        crop.save(sprite_path)
        sprite_paths.append(sprite_path)
        named_components.append({
            "name": name,
            **component,
            "sprite": rel(output_dir, sprite_path),
        })

    draw_overlay(image, overlay_path, named_components)
    write_contact_sheet(sprite_paths, contact_path, args.contact_tile)
    write_components_csv(components_csv_path, named_components)

    payload = {
        "image": str(image_path),
        "width": image.width,
        "height": image.height,
        "background": {
            "mode": "connected_bright_neutral",
            "bright_min": args.bright_min,
            "neutral_delta": args.neutral_delta,
            "background_pixels": int(background.sum()),
            "foreground_pixels": int(foreground.sum()),
        },
        "components": named_components,
        "outputs": {
            "transparent": rel(output_dir, transparent_path),
            "mask": rel(output_dir, mask_path),
            "overlay": rel(output_dir, overlay_path),
            "components_csv": rel(output_dir, components_csv_path),
            "sprites": rel(output_dir, sprite_dir),
            "contact_sheet": rel(output_dir, contact_path),
        },
    }
    write_json(components_path, payload)

    return {
        "input": str(image_path),
        "image_id": image_id,
        "components": named_components,
        "transparent": rel(output_dir, transparent_path),
        "mask": rel(output_dir, mask_path),
        "overlay": rel(output_dir, overlay_path),
        "components_json": rel(output_dir, components_path),
        "components_csv": rel(output_dir, components_csv_path),
        "contact_sheet": rel(output_dir, contact_path),
    }


def detect_connected_bright_background(rgb: np.ndarray, bright_min: int, neutral_delta: int) -> np.ndarray:
    max_channel = rgb.max(axis=2)
    min_channel = rgb.min(axis=2)
    candidate = (min_channel >= bright_min) & ((max_channel - min_channel) <= neutral_delta)
    candidate_u8 = candidate.astype(np.uint8)

    count, labels = cv2.connectedComponents(candidate_u8, connectivity=8)
    if count <= 1:
        return candidate

    border_labels = set(np.unique(labels[0, :]).tolist())
    border_labels.update(np.unique(labels[-1, :]).tolist())
    border_labels.update(np.unique(labels[:, 0]).tolist())
    border_labels.update(np.unique(labels[:, -1]).tolist())
    border_labels.discard(0)

    background = np.zeros(candidate.shape, dtype=bool)
    for label in border_labels:
        background |= labels == label
    return background


def extract_grouped_components(
    foreground: np.ndarray,
    min_area: int,
    group_gap: int,
    max_components: int,
) -> list[dict]:
    kernel_size = max(1, group_gap)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kernel_size, kernel_size))
    grouped = cv2.dilate(foreground.astype(np.uint8), kernel, iterations=1)
    count, labels = cv2.connectedComponents(grouped, connectivity=8)

    components = []
    for label in range(1, count):
        pixels = (labels == label) & foreground
        area = int(pixels.sum())
        if area < min_area:
            continue

        ys, xs = np.where(pixels)
        x = int(xs.min())
        y = int(ys.min())
        w = int(xs.max() - x + 1)
        h = int(ys.max() - y + 1)
        components.append({
            "x": x,
            "y": y,
            "w": w,
            "h": h,
            "area": area,
            "centroid_x": round(float(xs.mean()), 2),
            "centroid_y": round(float(ys.mean()), 2),
        })

    components.sort(key=lambda item: (row_bucket(item), item["x"], item["y"]))
    if max_components > 0:
        components = components[:max_components]
    return components


def row_bucket(component: dict) -> int:
    return math.floor((component["y"] + component["h"] / 2) / 48)


def draw_overlay(image: Image.Image, output: Path, components: list[dict]) -> None:
    overlay = image.copy()
    draw = ImageDraw.Draw(overlay)
    for component in components:
        x = component["x"]
        y = component["y"]
        right = x + component["w"]
        bottom = y + component["h"]
        draw.rectangle((x, y, right, bottom), outline=(255, 0, 0), width=3)
    overlay.save(output)


def write_contact_sheet(sprite_paths: list[Path], output: Path, tile_size: int) -> None:
    if not sprite_paths:
        Image.new("RGB", (tile_size, tile_size), "#22272e").save(output)
        return

    columns = min(10, len(sprite_paths))
    rows = math.ceil(len(sprite_paths) / columns)
    sheet = Image.new("RGBA", (columns * tile_size, rows * tile_size), "#22272eff")

    for index, sprite_path in enumerate(sprite_paths):
        sprite = Image.open(sprite_path).convert("RGBA")
        sprite.thumbnail((tile_size - 16, tile_size - 16), Image.Resampling.NEAREST)
        x = (index % columns) * tile_size + (tile_size - sprite.width) // 2
        y = (index // columns) * tile_size + (tile_size - sprite.height) // 2
        sheet.alpha_composite(sprite, (x, y))

    sheet.save(output)


def write_json(file_path: Path, value: dict) -> None:
    file_path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_components_csv(file_path: Path, components: list[dict]) -> None:
    fieldnames = ["name", "x", "y", "w", "h", "area", "sprite"]
    with file_path.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        for component in components:
            writer.writerow({field: component[field] for field in fieldnames})


def rel(from_dir: Path, target: Path) -> str:
    return target.relative_to(from_dir).as_posix()


if __name__ == "__main__":
    main()
