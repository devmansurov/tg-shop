"""Demo catalog from dummyjson.com -> src/data/products.json + resized photos in public/img/.

Prices are converted to yuan, sizes are assigned per category (shoes / clothes / one size).
Run again any time: already downloaded photos are skipped."""
import json
import pathlib
import subprocess
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG = ROOT / 'public' / 'img'
OUT = ROOT / 'src' / 'data' / 'products.json'
YUAN_PER_USD = 7.1
MAX_PHOTOS = 3

CATEGORIES = {  # slug -> (name shown in the app, size kind)
    'mens-shoes': ('Мужская обувь', 'shoes'),
    'womens-shoes': ('Женская обувь', 'shoes'),
    'mens-shirts': ('Мужская одежда', 'clothes'),
    'tops': ('Женская одежда', 'clothes'),
    'womens-dresses': ('Платья', 'clothes'),
    'womens-bags': ('Сумки', 'one'),
    'mens-watches': ('Мужские часы', 'one'),
    'womens-watches': ('Женские часы', 'one'),
    'sunglasses': ('Очки', 'one'),
    'womens-jewellery': ('Украшения', 'one'),
    'fragrances': ('Парфюм', 'one'),
    'sports-accessories': ('Спорт', 'one'),
}
SIZES = {
    'shoes': ['39', '40', '40.5', '41', '42', '42.5', '43', '44', '45'],
    'clothes': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    'one': [],
}


def get_json(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'tg-shop'}), timeout=30) as r:
        return json.load(r)


def save_photo(url, name):
    """Download and shrink to 600 px JPEG with macOS sips; returns the public path."""
    dst = IMG / f'{name}.jpg'
    if not dst.exists():
        raw = IMG / f'{name}.src'
        with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'tg-shop'}), timeout=60) as r:
            raw.write_bytes(r.read())
        subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '78', '-Z', '600',
                        str(raw), '--out', str(dst)], check=True, capture_output=True)
        raw.unlink()
    return f'img/{name}.jpg'


def main():
    IMG.mkdir(parents=True, exist_ok=True)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    products = []
    for slug, (title, kind) in CATEGORIES.items():
        for p in get_json(f'https://dummyjson.com/products/category/{slug}?limit=0')['products']:
            photos = [save_photo(u, f"{p['id']}-{i}") for i, u in enumerate(p['images'][:MAX_PHOTOS])]
            price = round(p['price'] * YUAN_PER_USD)
            products.append({
                'id': p['id'],
                'title': p['title'],
                'brand': p.get('brand') or '',
                'category': slug,
                'description': p['description'],
                'price': price,
                # "was" price only when there is a real discount, like crossed-out prices in the store
                'oldPrice': round(price / (1 - p['discountPercentage'] / 100)) if p['discountPercentage'] >= 5 else None,
                'rating': p['rating'],
                'sold': p['stock'] * 37 + p['id'] * 11,   # demo "bought N" counter
                'sizes': SIZES[kind],
                'photos': photos,
            })
            print(slug, p['id'], p['title'])
    data = {'categories': [{'slug': s, 'title': t} for s, (t, _) in CATEGORIES.items()], 'products': products}
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'{len(products)} products -> {OUT}')


if __name__ == '__main__':
    main()
