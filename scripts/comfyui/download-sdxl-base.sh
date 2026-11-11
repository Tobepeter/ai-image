#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LINK_PATH="$ROOT_DIR/models/checkpoints/sdxl-base-1.0.safetensors"
MODEL_FILE_NAME="sd_xl_base_1.0.safetensors"
SOURCE="${SDXL_SOURCE:-auto}"

link_model() {
  local model_file="$1"

  if [ ! -f "$model_file" ]; then
    echo "Expected model file not found: $model_file" >&2
    exit 1
  fi

  mkdir -p "$(dirname "$LINK_PATH")"
  ln -sfn "$model_file" "$LINK_PATH"

  echo "Downloaded: $model_file"
  echo "Linked: $LINK_PATH -> $model_file"
}

mkdir -p "$(dirname "$LINK_PATH")"

if { [ "$SOURCE" = "auto" ] || [ "$SOURCE" = "modelscope" ]; } && command -v modelscope >/dev/null 2>&1; then
  modelscope download \
    --model AI-ModelScope/stable-diffusion-xl-base-1.0 \
    "$MODEL_FILE_NAME" \
    --revision v1.0.0 \
    --max-workers "${MODELSCOPE_MAX_WORKERS:-4}"

  MODEL_FILE="$(find "${MODELSCOPE_CACHE:-$HOME/.cache/modelscope}" \
    -path "*AI-ModelScope/stable-diffusion-xl-base-1___0/$MODEL_FILE_NAME" \
    -type f \
    -print | head -n 1)"

  link_model "$MODEL_FILE"
  exit 0
fi

if ! command -v hf >/dev/null 2>&1; then
  echo "Neither modelscope nor hf is available for SDXL download." >&2
  exit 1
fi

if ! hf auth whoami >/dev/null 2>&1; then
  echo "Warning: hf is not logged in. Download can still work, but may be slower or rate-limited." >&2
  echo "Run 'hf auth login' first if the transfer is unstable." >&2
fi

if [ -n "${SDXL_HF_CACHE_DIR:-}" ]; then
  MODEL_FILE="$(hf download \
    stabilityai/stable-diffusion-xl-base-1.0 \
    "$MODEL_FILE_NAME" \
    --cache-dir "$SDXL_HF_CACHE_DIR" \
    --format quiet | tail -n 1)"
else
  MODEL_FILE="$(hf download \
    stabilityai/stable-diffusion-xl-base-1.0 \
    "$MODEL_FILE_NAME" \
    --format quiet | tail -n 1)"
fi

link_model "$MODEL_FILE"
