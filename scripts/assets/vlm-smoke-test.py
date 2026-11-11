#!/usr/bin/env python3

import argparse
import json
import time
from pathlib import Path

from PIL import Image


MODEL_SNAPSHOTS = {
    "florence-2-base": Path(
        "/Users/tobe/.cache/huggingface/hub/models--microsoft--Florence-2-base/"
        "snapshots/5ca5edf5bd017b9919c05d08aebef5e4c7ac3bac"
    ),
    "moondream2": Path(
        "/Users/tobe/.cache/huggingface/hub/models--vikhyatk--moondream2/"
        "snapshots/6b714b26eea5cbd9f31e4edb2541c170afa935ba"
    ),
    "qwen2.5-vl-3b-instruct": Path(
        "/Users/tobe/.cache/huggingface/hub/models--Qwen--Qwen2.5-VL-3B-Instruct/"
        "snapshots/66285546d2b821cf421d4f5eb2576359d3770cd3"
    ),
    "smolvlm2-2.2b-instruct": Path(
        "/Users/tobe/.cache/huggingface/hub/models--HuggingFaceTB--SmolVLM2-2.2B-Instruct/"
        "snapshots/482adb537c021c86670beed01cd58990d01e72e4"
    ),
}

MOONDREAM_REPO = "vikhyatk/moondream2"
MOONDREAM_REVISION = "6b714b26eea5cbd9f31e4edb2541c170afa935ba"


FLORENCE_TASKS = {
    "caption": "<CAPTION>",
    "detailed_caption": "<DETAILED_CAPTION>",
    "od": "<OD>",
    "dense_region_caption": "<DENSE_REGION_CAPTION>",
}


def main() -> None:
    parser = argparse.ArgumentParser(description="Run a local VLM smoke test against a cached model.")
    parser.add_argument("--model", default="florence-2-base", choices=MODEL_SNAPSHOTS.keys())
    parser.add_argument("--image", required=True)
    parser.add_argument(
        "--task",
        default="caption",
        choices=["caption", "detailed_caption", "od", "dense_region_caption", "query", "detect"],
    )
    parser.add_argument("--prompt", default=None, help="Question for query or label for detect.")
    parser.add_argument("--output", required=True)
    parser.add_argument("--device", default="auto", choices=["auto", "cpu", "mps", "cuda"])
    args = parser.parse_args()

    if args.model == "florence-2-base":
        result = run_florence(args)
    elif args.model == "moondream2":
        result = run_moondream(args)
    elif args.model == "qwen2.5-vl-3b-instruct":
        result = run_qwen(args)
    elif args.model == "smolvlm2-2.2b-instruct":
        result = run_smolvlm(args)
    else:
        raise ValueError(f"Unsupported model: {args.model}")

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "model": result["model"],
        "task": result["task"],
        "device": result["device"],
        "elapsed_seconds": result["elapsed_seconds"],
        "output": str(output),
    }, ensure_ascii=False))


def run_florence(args: argparse.Namespace) -> dict:
    import torch
    from transformers import AutoModelForCausalLM, AutoProcessor

    snapshot = MODEL_SNAPSHOTS[args.model]
    if args.task not in FLORENCE_TASKS:
        raise ValueError(f"Florence task is not supported: {args.task}")
    if not snapshot.exists():
        raise FileNotFoundError(f"Model snapshot not found: {snapshot}")

    image_path = Path(args.image)
    image = Image.open(image_path).convert("RGB")
    task_prompt = FLORENCE_TASKS[args.task]
    device = resolve_device(args.device, torch)
    torch_dtype = torch.float16 if device == "cuda" else torch.float32

    started = time.time()
    model = AutoModelForCausalLM.from_pretrained(
        snapshot,
        torch_dtype=torch_dtype,
        trust_remote_code=True,
        local_files_only=True,
    ).to(device)
    processor = AutoProcessor.from_pretrained(
        snapshot,
        trust_remote_code=True,
        local_files_only=True,
    )

    inputs = processor(text=task_prompt, images=image, return_tensors="pt").to(device, torch_dtype)
    generated_ids = model.generate(
        input_ids=inputs["input_ids"],
        pixel_values=inputs["pixel_values"],
        max_new_tokens=256,
        do_sample=False,
        num_beams=3,
    )
    generated_text = processor.batch_decode(generated_ids, skip_special_tokens=False)[0]
    parsed = processor.post_process_generation(
        generated_text,
        task=task_prompt,
        image_size=(image.width, image.height),
    )

    elapsed = round(time.time() - started, 2)
    return {
        "model": args.model,
        "snapshot": str(snapshot),
        "task": args.task,
        "task_prompt": task_prompt,
        "image": str(image_path),
        "image_size": {"width": image.width, "height": image.height},
        "device": device,
        "elapsed_seconds": elapsed,
        "generated_text": generated_text,
        "parsed": parsed,
    }


def run_moondream(args: argparse.Namespace) -> dict:
    import torch
    from transformers import AutoModelForCausalLM

    snapshot = MODEL_SNAPSHOTS[args.model]
    if not snapshot.exists():
        raise FileNotFoundError(f"Model snapshot not found: {snapshot}")

    image_path = Path(args.image)
    image = Image.open(image_path).convert("RGB")
    device = resolve_device(args.device, torch)

    started = time.time()
    model = AutoModelForCausalLM.from_pretrained(
        MOONDREAM_REPO,
        revision=MOONDREAM_REVISION,
        trust_remote_code=True,
        local_files_only=True,
        device_map={"": device},
    )

    if args.task == "caption":
        parsed = model.caption(image, length="short")
    elif args.task == "detailed_caption":
        parsed = model.caption(image, length="normal")
    elif args.task == "query":
        question = args.prompt or "What objects are shown in this image?"
        parsed = model.query(image, question)
    elif args.task == "detect":
        label = args.prompt or "item"
        parsed = model.detect(image, label)
    else:
        raise ValueError(f"Moondream task is not supported: {args.task}")

    elapsed = round(time.time() - started, 2)
    return {
        "model": args.model,
        "snapshot": str(snapshot),
        "task": args.task,
        "prompt": args.prompt,
        "image": str(image_path),
        "image_size": {"width": image.width, "height": image.height},
        "device": device,
        "elapsed_seconds": elapsed,
        "parsed": parsed,
    }


def run_qwen(args: argparse.Namespace) -> dict:
    import torch
    from qwen_vl_utils import process_vision_info
    from transformers import AutoProcessor, Qwen2_5_VLForConditionalGeneration

    snapshot = MODEL_SNAPSHOTS[args.model]
    if not snapshot.exists():
        raise FileNotFoundError(f"Model snapshot not found: {snapshot}")

    image_path = Path(args.image)
    device = resolve_device(args.device, torch)
    torch_dtype = torch.float16 if device == "mps" else torch.float32
    prompt = args.prompt or "List the fantasy game items in this image. Answer as a short comma-separated list."

    started = time.time()
    model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
        snapshot,
        torch_dtype=torch_dtype,
        local_files_only=True,
    ).to(device)
    processor = AutoProcessor.from_pretrained(
        snapshot,
        min_pixels=256 * 28 * 28,
        max_pixels=640 * 28 * 28,
        local_files_only=True,
    )

    messages = [{
        "role": "user",
        "content": [
            {"type": "image", "image": str(image_path.resolve())},
            {"type": "text", "text": prompt},
        ],
    }]
    text = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    image_inputs, video_inputs = process_vision_info(messages)
    inputs = processor(
        text=[text],
        images=image_inputs,
        videos=video_inputs,
        padding=True,
        return_tensors="pt",
    ).to(device)

    generated = model.generate(**inputs, max_new_tokens=64, do_sample=False)
    generated_trimmed = [
        output_ids[len(input_ids):]
        for input_ids, output_ids in zip(inputs.input_ids, generated)
    ]
    answer = processor.batch_decode(
        generated_trimmed,
        skip_special_tokens=True,
        clean_up_tokenization_spaces=False,
    )[0]

    elapsed = round(time.time() - started, 2)
    return {
        "model": args.model,
        "snapshot": str(snapshot),
        "task": args.task,
        "prompt": prompt,
        "image": str(image_path),
        "device": device,
        "elapsed_seconds": elapsed,
        "parsed": {"answer": answer},
    }


def run_smolvlm(args: argparse.Namespace) -> dict:
    import torch
    from transformers import AutoModelForImageTextToText, AutoProcessor

    snapshot = MODEL_SNAPSHOTS[args.model]
    if not snapshot.exists():
        raise FileNotFoundError(f"Model snapshot not found: {snapshot}")

    image_path = Path(args.image)
    device = resolve_device(args.device, torch)
    torch_dtype = torch.float16 if device == "mps" else torch.float32
    prompt = args.prompt or "List the fantasy game items in this image. Answer as a short comma-separated list."

    started = time.time()
    processor = AutoProcessor.from_pretrained(snapshot, local_files_only=True)
    model = AutoModelForImageTextToText.from_pretrained(
        snapshot,
        torch_dtype=torch_dtype,
        local_files_only=True,
    ).to(device)

    messages = [{
        "role": "user",
        "content": [
            {"type": "image", "path": str(image_path.resolve())},
            {"type": "text", "text": prompt},
        ],
    }]
    inputs = processor.apply_chat_template(
        messages,
        add_generation_prompt=True,
        tokenize=True,
        return_dict=True,
        return_tensors="pt",
    ).to(device, dtype=torch_dtype)
    generated = model.generate(**inputs, do_sample=False, max_new_tokens=64)
    answer = processor.batch_decode(generated, skip_special_tokens=True)[0]

    elapsed = round(time.time() - started, 2)
    return {
        "model": args.model,
        "snapshot": str(snapshot),
        "task": args.task,
        "prompt": prompt,
        "image": str(image_path),
        "device": device,
        "elapsed_seconds": elapsed,
        "parsed": {"answer": answer},
    }


def resolve_device(requested: str, torch_module) -> str:
    if requested != "auto":
        return requested
    if torch_module.cuda.is_available():
        return "cuda"
    if getattr(torch_module.backends, "mps", None) and torch_module.backends.mps.is_available():
        return "mps"
    return "cpu"


if __name__ == "__main__":
    main()
