"""Товары одного бренда из Dewu через телефон (adb) -> private/raw/<brand>.json + фото в public/img/<brand>/.

Страница бренда в Dewu недоступна из поиска и каталога, поэтому идём через поиск: «<бренд> <категория>»,
сортировка «销量» (по продажам). Берём карточки, название которых начинается с бренда и содержит слово
категории (так в выдачу не попадают чужие бренды и соседние категории), без детского и кастома.
У каждого товара: название, цена выпуска, 3 фото (вырезаются из скриншота галереи), цены по размерам
из панели «立即购买» (панель только открывается и закрывается, покупка не нажимается).

Прогресс сохраняется после каждого товара: повторный запуск продолжает с того же места.
Usage: dewu_brand.py <brand> [товаров на категорию] [сколько запросов, для проверки]"""
import base64
import io
import json
import pathlib
import re
import subprocess
import sys
import time

sys.path.insert(0, str(pathlib.Path.home() / 'Documents/Development/Personal/dewu-brands'))
import crawl_brands as cb  # noqa: E402
import dewu  # noqa: E402
from PIL import Image  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent

# (запрос после названия бренда, наша категория, обязательное слово в названии товара)
TASKS = [
    ('跑步鞋', 'running', r'跑步鞋|跑鞋'),
    ('板鞋', 'sneakers', r'板鞋'),
    ('休闲鞋', 'sneakers', r'休闲鞋|运动鞋|老爹鞋'),
    ('篮球鞋', 'basketball', r'篮球鞋'),
    ('足球鞋', 'football', r'足球鞋'),
    ('羽绒服', 'down', r'羽绒'),
    ('卫衣', 'hoodies', r'卫衣|帽衫'),
    ('夹克', 'jackets', r'夹克|外套|风衣|棉服'),
    ('运动套装', 'suits', r'套装'),
    ('运动裤', 'pants', r'(?<!短)裤'),
    ('T恤', 'tshirts', r'T恤|短袖|Polo|POLO'),
    ('短裤', 'shorts', r'短裤'),
]
SKIP = re.compile(r'童|婴|定制|\bPS\b|\bTD\b|鞋带|袜')
PRICE = re.compile(r'^¥[\d ]+$')
PHOTOS = 3
SAMSUNG_IME = 'com.samsung.android.honeyboard/.service.HoneyBoardService'


def is_results(ns):
    """Выдача поиска; вкладки «商品/内容» при прокрутке прячутся, поэтому и по карточкам и сортировке."""
    return cb.is_search_page(ns) or any(n[1] == 'search_title' for n in ns) \
        or (any(n[0] == '综合' for n in ns) and any(n[0] == '筛选' for n in ns))


class Shop:
    def __init__(self, brand, per_task):
        self.brand, self.per_task = brand, per_task
        self.out = ROOT / 'private' / 'raw' / f'{brand.lower()}.json'
        self.img = ROOT / 'public' / 'img' / brand.lower()
        self.img.mkdir(parents=True, exist_ok=True)
        self.items = json.loads(self.out.read_text()) if self.out.exists() else []
        self.titles = {p['titleCn'] for p in self.items}

    def save(self):
        self.out.write_text(json.dumps(self.items, ensure_ascii=False, indent=1))

    # ---------- поиск ----------
    def search(self, query):
        """Из главной, выдачи поиска или карточки товара - выдача по запросу, отсортированная по продажам."""
        for _ in range(3):
            ns = dewu.nodes()
            if any(n[1] == 'etSearch' for n in ns):
                break
            if is_results(ns):
                dewu.tap(400, 145, jitter=6)
            elif any(n[0] == '分类' for n in ns) and any(n[0] == '推荐' for n in ns):   # главная
                dewu.tap(350, 145, jitter=6)
            elif any(n[1] in ('bottomButtonViews', 'buyButtonContainer') for n in ns):  # карточка товара
                dewu.back()
            else:
                raise dewu.Retry('непонятный экран, нужен поиск или главная Dewu')
            time.sleep(2.5)
        else:
            raise dewu.Retry('не открылась строка поиска')
        try:
            dewu.adb('shell', 'ime', 'set', 'com.android.adbkeyboard/.AdbIME')
            time.sleep(1)
            dewu.adb('shell', 'input', 'keyevent', 'KEYCODE_MOVE_END', *(['67'] * 40))
            time.sleep(0.5)
            dewu.adb('shell', 'am', 'broadcast', '-a', 'ADB_INPUT_B64', '--es', 'msg',
                     base64.b64encode(query.encode()).decode())
            time.sleep(1.5)
            dewu.adb('shell', 'am', 'broadcast', '-a', 'ADB_EDITOR_CODE', '--ei', 'code', '3')   # «искать»
            time.sleep(5)
        finally:
            dewu.adb('shell', 'ime', 'set', SAMSUNG_IME)
        ns = dewu.nodes()
        shown = ' '.join(n[0] for n in ns if n[2][1] < 200).lower()
        if not is_results(ns) or query.lower() not in shown:
            raise dewu.Retry(f'не открылась выдача по «{query}»: {shown[:60]}')
        sales = [n for n in ns if n[0] == '销量' and 250 < n[2][1] < 760]
        if not sales:
            raise dewu.Retry('нет сортировки 销量')
        dewu.tap_node(sales[0][2])
        time.sleep(4)

    def back_to_results(self):
        """«Назад» только с карточки товара или панели размеров; на главной не нажимать (Dewu закроется)."""
        for _ in range(6):
            ns = dewu.nodes()
            if is_results(ns):
                return
            if any(n[0] == '分类' for n in ns) and any(n[0] == '推荐' for n in ns):
                raise dewu.Retry('оказался на главной')
            if any(n[1] in ('bottomButtonViews', 'buyButtonContainer', 'buyButton', 'ivOBClose') for n in ns):
                dewu.back()
            time.sleep(2.5)
        raise dewu.Retry('не вернулся к выдаче поиска')

    # ---------- выдача ----------
    def cards(self, ns):
        """Карточки, у которых видно и фото, и цену: (название, продано, точка для нажатия)."""
        out = []
        for t in (n for n in ns if n[1] == 'search_title'):
            b = t[2]
            col = [n for n in ns if b[0] - 20 <= n[2][0] < b[2] and b[1] < n[2][1] < b[1] + 220]
            price = [n for n in col if n[1] == 'search_price']
            if b[1] < 940 or not price or price[0][2][3] > 2180:
                continue
            sold = next((n[0] for n in col if n[1] == 'search_sold'), '')
            out.append((t[0].replace('\n', ''), sold, ((b[0] + b[2]) // 2, b[1] - 230)))
        return out

    # ---------- карточка товара ----------
    def scrape(self, card_title, sold, category, pid):
        for _ in range(5):   # карточка грузится по-разному: ждать нижнюю панель покупки
            ns = dewu.nodes()
            if any(n[1] in ('buyButton', 'buyButtonContainer', 'bottomButtonViews') for n in ns) \
                    and any(PRICE.match(n[0]) for n in ns):
                break
            time.sleep(2)
        else:
            raise dewu.Retry('не открылась карточка товара')
        price = [n for n in ns if PRICE.match(n[0]) and 1000 < n[2][1] < 1700]
        py = price[0][2][1] if price else 1290
        title = max((n for n in ns if py < n[2][1] < py + 260 and len(n[0]) > 12), key=lambda n: len(n[0]),
                    default=(card_title,))[0].rstrip(' +')
        release = next((int(m.group(1)) for n in ns if (m := re.match(r'发售价¥(\d+)', n[0]))), None)

        photos = self.photos(pid)
        sizes = self.sizes()
        dewu.back()
        time.sleep(2.5)
        if not sizes:
            dewu.log('  нет размеров в наличии, пропуск:', title[:50])
            return None
        low = min(s['priceCny'] for s in sizes)
        return {
            'id': pid, 'brand': self.brand, 'titleCn': title, 'title': title, 'category': category,
            'gender': 'unisex' if re.search('男女|情侣|通用', title) else 'men' if '男' in title
            else 'women' if '女' in title else 'unisex',
            'priceCny': low, 'oldPriceCny': release if release and release > low else None,
            'sold': parse_sold(sold), 'sizes': sizes, 'photos': photos, 'article': '',
            'listTitle': card_title,
        }

    def gallery_label(self):
        for n in dewu.nodes():
            m = re.match(r'商品(\d+)/(\d+)', n[0])
            if m:
                return int(m.group(1)), int(m.group(2)), n[2][1]
        return None

    def photos(self, pid):
        """Фото 2..4 галереи (первое часто видео или фото на модели); если фото одно - оно."""
        label = self.gallery_label()
        total = label[1] if label else 1
        saved = []
        for target in list(range(2, total + 1))[:PHOTOS] or [1]:
            for _ in range(6):
                if not label or label[0] >= target:
                    break
                dewu.adb('shell', 'input', 'swipe', '900', '600', '150', '600', '300')
                time.sleep(1.8)
                label = self.gallery_label()
            bottom = (label[2] - 15) if label else 990
            name = f'{pid}-{len(saved)}.jpg'
            Image.open(io.BytesIO(screencap())).convert('RGB').crop((0, 200, 1080, bottom)).save(self.img / name, quality=82)
            saved.append(f'img/{self.brand.lower()}/{name}')
        return saved

    def sizes(self):
        ns = dewu.nodes()
        buy = [n for n in ns if n[1] in ('buyButton', 'buyButtonContainer')]
        if buy:
            dewu.tap_node(buy[0][2])
        elif any(n[1] == 'bottomButtonViews' for n in ns):   # у части карточек кнопка без своего узла
            dewu.tap(800, 2140, jitter=8)
        else:
            return []
        time.sleep(3)
        found = {}
        for _ in range(4):
            ns = dewu.nodes()
            names = [n for n in ns if n[1] == 'tvName']
            prices = [n for n in ns if n[1] == 'tvPrice']
            new = 0
            for p in prices:
                name = next((n for n in names if n[2][0] == p[2][0] and 0 <= p[2][1] - n[2][3] < 20), None)
                m = re.match(r'¥(\d+)', p[0])
                if name and name[0] not in found and p[2][3] - p[2][1] > 30:
                    found[name[0]] = int(m.group(1)) if m else None
                    new += 1
            if not new:
                break
            dewu.adb('shell', 'input', 'swipe', '540', '1850', '540', '1350', '600')
            time.sleep(1.5)
        close = [n for n in dewu.nodes() if n[1] == 'ivOBClose']
        if close:
            dewu.tap_node(close[0][2])
        else:
            dewu.back()
        time.sleep(1.5)
        return [{'size': s, 'priceCny': p} for s, p in found.items() if p]

    # ---------- задача ----------
    def run_task(self, word, category, must):
        query = f'{self.brand} {word}'
        have = sum(1 for p in self.items if p.get('task') == query)
        if have >= self.per_task:
            return
        dewu.log(f'== {query} -> {category}: уже {have}')
        self.search(query)
        seen, idle = set(), 0
        brand = re.compile(rf'^{re.escape(self.brand)}\b', re.I)
        while have < self.per_task and idle < 3:
            ns = dewu.nodes()
            todo = [c for c in self.cards(ns) if c[0] not in seen]
            if not todo:
                sig = dewu.signature(ns)
                dewu.scroll(y1=1750, y2=1050, ms=900)
                time.sleep(2.5)
                idle = idle + 1 if dewu.signature(dewu.nodes()) == sig else 0
                continue
            title, sold, (x, y) = todo[0]
            seen.add(title)
            if not brand.search(title) or not re.search(must, title) or SKIP.search(title) \
                    or title in {p.get('listTitle') for p in self.items}:
                continue
            dewu.tap(x, y, jitter=10)
            time.sleep(4)
            pid = max([p['id'] for p in self.items] or [10000]) + 1
            item = self.scrape(title, sold, category, pid)
            self.back_to_results()
            if item and item['titleCn'] not in self.titles:
                item['task'] = query
                self.items.append(item)
                self.titles.add(item['titleCn'])
                self.save()
                have += 1
                dewu.log(f'  {have}/{self.per_task} ¥{item["priceCny"]} {len(item["sizes"])} разм. {item["titleCn"][:60]}')
            dewu.pause(2, 5)


def parse_sold(s):
    m = re.match(r'([\d.]+)(万)?', s or '')
    if not m:
        return 0
    return int(float(m.group(1)) * (10000 if m.group(2) else 1))


def screencap():
    return subprocess.run(['adb', 'exec-out', 'screencap', '-p'], capture_output=True, timeout=30).stdout


def main():
    brand = sys.argv[1]
    per_task = int(sys.argv[2]) if sys.argv[2:] else 15
    shop = Shop(brand, per_task)
    tasks = TASKS[:int(sys.argv[3])] if sys.argv[3:] else TASKS
    for word, category, must in tasks:
        for attempt in range(3):
            try:
                shop.run_task(word, category, must)
                break
            except dewu.Retry as e:
                dewu.log('повтор:', e)
                time.sleep(5)
    dewu.log(f'готово: {len(shop.items)} товаров')


if __name__ == '__main__':
    try:
        main()
    except dewu.CaptchaStop as e:
        dewu.log('СТОП: проверка на бота, нужен человек:', e)
        sys.exit(2)
