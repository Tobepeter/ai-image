"""从 Wikimedia Commons 按类别取公开授权的旅游题材样本，缩到长边 1024，写 manifest.json

用法：python3 scripts/vision/fetch-commons-samples.py data/input/samples/vision
已下载的文件会跳过；Commons 限流严格，请求之间留间隔
"""

import html
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

UA = {'User-Agent': 'ai-image-vision-samples/0.1 (research script)'}
API = 'https://commons.wikimedia.org/w/api.php'
ALLOWED = re.compile(r'^(CC0|CC BY(-SA)? [0-9.]+( [a-z]+)?|Public domain)$', re.I)

# 目录名 -> (Commons 类别, 取几张)
GROUPS = {
    'lake': ('Erhai Lake', 3),
    'old-town': ('Old Town of Lijiang', 3),
    'night': ('Night in Lijiang', 3),
    'food': ('Cuisine of Yunnan', 3),
    'menu': ('Food menus in China', 3),
    'hotel': ('Hotel rooms in China', 3),
    'map': ('Tourist maps of China', 3),
    'tourists': ('Tourists in China', 3),
    'receipt': ('Reimbursement receipt of China Railway', 3),
    'sign': ('Blue street signs in China', 3),
}


def get(url, tries=5):
    for i in range(tries):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()
        except urllib.error.HTTPError as err:
            if err.code != 429 or i == tries - 1:
                raise
            time.sleep(15 * (i + 1))


def strip_html(text):
    return html.unescape(re.sub(r'<[^>]+>', '', text or '')).strip()


def list_files(category):
    query = {
        'action': 'query', 'format': 'json', 'generator': 'categorymembers', 'gcmtitle': f'Category:{category}',
        'gcmtype': 'file', 'gcmlimit': '50', 'prop': 'imageinfo',
        'iiprop': 'url|extmetadata|size|mime', 'iiurlwidth': '1024',
    }
    data = json.loads(get(f'{API}?{urllib.parse.urlencode(query)}'))
    pages = sorted(data.get('query', {}).get('pages', {}).values(), key=lambda p: p['title'])
    files = []
    for page in pages:
        info = page['imageinfo'][0]
        meta = info.get('extmetadata', {})
        license_name = meta.get('LicenseShortName', {}).get('value', '')
        if info['mime'] != 'image/jpeg' or min(info['width'], info['height']) < 600 or not ALLOWED.match(license_name):
            continue
        files.append({
            'title': page['title'][5:],
            'thumb': info['thumburl'],
            'page': info['descriptionurl'],
            'author': strip_html(meta.get('Artist', {}).get('value')),
            'license': license_name,
        })
    return files


def spread(items, count):
    # 均匀间隔取，避免连拍
    if len(items) <= count:
        return items
    step = len(items) / count
    return [items[int(i * step)] for i in range(count)]


def main():
    root = Path(sys.argv[1] if len(sys.argv) > 1 else 'data/input/samples/vision')
    manifest_path = root / 'manifest.json'
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else []
    done = {item['path'] for item in manifest}

    for group, (category, count) in GROUPS.items():
        time.sleep(3)
        picks = spread(list_files(category), count)
        print(f'{group}: {category} -> {len(picks)}')
        for index, item in enumerate(picks, 1):
            path = f'{group}/{group}-{index:02d}.jpg'
            if path in done:
                continue
            time.sleep(2)
            target = root / path
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(get(item['thumb']))
            manifest.append({'path': path, 'group': group, 'category': category, **{k: item[k] for k in ('title', 'page', 'author', 'license')}})
            manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')

    print(f'共 {len(manifest)} 张，清单 {manifest_path}')


if __name__ == '__main__':
    main()
