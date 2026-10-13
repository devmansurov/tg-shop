"""private/raw/*.json (товары Dewu с ценами в ¥) -> src/data/products.json (цены в сомони).

В публичный products.json попадает только итоговая цена: закупка, доставка и наценка остаются в private/.
Курсы ¥ и $ к сомони берутся с open.er-api.com, если не заданы в private/pricing.json (rates_override).

Сырой товар: {id, brand, title, titleCn, category, gender: men|women|unisex, priceCny, oldPriceCny,
              sold, sizes: [{size, priceCny}], photos: [img/...], article}"""
import json
import math
import pathlib
import sys
import urllib.request

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
PRIVATE = ROOT / 'private'
OUT = ROOT / 'src' / 'data' / 'products.json'


def rates(override):
    """Сомони за 1 ¥ и за 1 $."""
    if override.get('CNY') and override.get('USD'):
        return override['CNY'], override['USD']
    with urllib.request.urlopen('https://open.er-api.com/v6/latest/TJS', timeout=30) as r:
        data = json.load(r)
    return override.get('CNY') or 1 / data['rates']['CNY'], override.get('USD') or 1 / data['rates']['USD']


def whiteness(path):
    """Доля почти белых пикселей по краю фото: снимок товара на белом фоне ~1, фото на модели ~0."""
    if not path.exists():
        return 0.0
    im = Image.open(path).convert('L').resize((60, 60))
    px = im.load()
    edge = [px[x, y] for x in range(60) for y in range(60) if x in (0, 1, 58, 59) or y in (0, 1, 58, 59)]
    return sum(v > 240 for v in edge) / len(edge)


def order_photos(photos):
    """Первым - фото на белом фоне (для карточки в каталоге), остальные в исходном порядке."""
    files = [ROOT / 'public' / p for p in photos]
    if not all(f.exists() for f in files):
        return photos
    best = max(range(len(photos)), key=lambda i: (whiteness(files[i]) > 0.9, -i))
    return [photos[best]] + [p for i, p in enumerate(photos) if i != best]


def cats_leaf(cats, slug):
    return any(c['slug'] == slug and c['parent'] for c in cats)


def main():
    cfg = json.loads((PRIVATE / 'pricing.json').read_text())
    cats = json.loads((ROOT / 'scripts' / 'categories.json').read_text())
    weight_of = {c['slug']: cfg['weight_kg'].get(c.get('weight', ''), cfg['weight_kg']['default']) for c in cats}
    cny, usd = rates(cfg['rates_override'])
    print(f'курс: 1 ¥ = {cny:.4f} смн, 1 $ = {usd:.4f} смн')

    regular, express = cfg['delivery']['regular'], cfg['delivery']['express']
    step = cfg['round_to']

    def up(x):
        return int(math.ceil(x / step) * step)

    def sell(price_cny, category):
        """Цена с обычной доставкой."""
        cost = price_cny * (1 + cfg['payment_fee']) * cny + weight_of[category] * regular['usd_per_kg'] * usd
        return up(cost * (1 + cfg['margin']))

    def express_extra(category):
        return up(weight_of[category] * (express['usd_per_kg'] - regular['usd_per_kg']) * usd * (1 + cfg['margin']))

    tr_file = PRIVATE / 'translations.json'
    translations = json.loads(tr_file.read_text()) if tr_file.exists() else {}
    products, seen, no_photo = [], set(), []
    for f in sorted((PRIVATE / 'raw').glob('*.json')):
        for p in json.loads(f.read_text()):
            if p['id'] in seen or p['category'] not in weight_of or not cats_leaf(cats, p['category']):
                continue
            # без снимка товара на белом фоне карточка выглядит как чужой пост: такие не показываем
            if p['photos'] and max(whiteness(ROOT / 'public' / f) for f in p['photos']) < 0.5:
                no_photo.append(p['id'])
                continue
            seen.add(p['id'])
            sizes = [{'size': s['size'], 'price': sell(s['priceCny'], p['category'])} for s in p.get('sizes', [])]
            price = min([s['price'] for s in sizes] or [sell(p['priceCny'], p['category'])])
            old = sell(p['oldPriceCny'], p['category']) if p.get('oldPriceCny') else None
            photos = [f for f in p['photos'] if (ROOT / 'public' / f).exists()]
            products.append({
                'id': p['id'], 'brand': p['brand'], 'category': p['category'],
                'title': translations.get(p.get('titleCn') or '', p['title']),
                'gender': p.get('gender', 'unisex'), 'price': price,
                'oldPrice': old if old and old > price * 1.05 else None,
                'expressExtra': express_extra(p['category']),
                'sold': p.get('sold', 0), 'sizes': sizes, 'photos': order_photos(photos), 'article': p.get('article', ''),
            })
    used = {p['category'] for p in products}
    tree = [c for c in cats if c['slug'] in used or any(x['parent'] == c['slug'] and x['slug'] in used for x in cats)]
    delivery = [{'key': k, 'title': d['title'], 'days': d['days']} for k, d in cfg['delivery'].items()]
    OUT.write_text(json.dumps({'delivery': delivery, 'categories': [{k: c[k] for k in ('slug', 'title', 'parent')} for c in tree],
                               'products': products}, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'{len(products)} товаров, {len(used)} категорий -> {OUT.relative_to(ROOT)}')
    if no_photo:
        print(f'без фото на белом фоне, пропущены: {len(no_photo)} {no_photo}')


if __name__ == '__main__':
    sys.exit(main())
