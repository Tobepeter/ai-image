#!/usr/bin/env bash
set -euo pipefail

echo "== fastfetch memory =="
if command -v fastfetch >/dev/null 2>&1; then
  fastfetch --pipe false 2>/dev/null | sed -n '/Memory/p;/Swap/p'
else
  echo "fastfetch not found"
fi

echo
echo "== memory_pressure =="
memory_pressure 2>/dev/null | sed -n '1,80p' || true

echo
echo "== vm_stat =="
vm_stat 2>/dev/null | sed -n '1,40p' || true

echo
echo "Review the output before starting ComfyUI. If memory pressure is high, close heavy apps or lower generation settings."
