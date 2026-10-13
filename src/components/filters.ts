import { categoryTitle, type Gender, inCategory, type Product, products } from '@/data/catalog.ts';

export const SORTS = [
  { key: 'popular', title: 'Популярные' },
  { key: 'price-asc', title: 'Цена ↑' },
  { key: 'price-desc', title: 'Цена ↓' },
  { key: 'sale', title: 'Скидки' },
] as const;
export type SortKey = typeof SORTS[number]['key'];

/** Every filter lives in the URL, so "back" from a product page restores the list as it was. */
export interface Filters {
  q: string;
  cat: string;          // scope of the page: '' = everything, or a top/sub category
  sort: SortKey;
  genders: Gender[];
  cats: string[];       // subcategories ticked in the filter sheet
  sizes: string[];
  min: number | null;
  max: number | null;
  sale: boolean;
}

const list = (v: string | null) => (v ? v.split(',').filter(Boolean) : []);
const num = (v: string | null) => (v && !Number.isNaN(Number(v)) ? Number(v) : null);

export function readFilters(p: URLSearchParams): Filters {
  return {
    q: p.get('q') ?? '',
    cat: p.get('cat') ?? '',
    sort: (p.get('sort') ?? 'popular') as SortKey,
    genders: list(p.get('g')) as Gender[],
    cats: list(p.get('c')),
    sizes: list(p.get('s')),
    min: num(p.get('min')),
    max: num(p.get('max')),
    sale: p.get('sale') === '1',
  };
}

export function writeFilters(f: Filters): URLSearchParams {
  const p = new URLSearchParams();
  const set = (k: string, v: string) => v && p.set(k, v);
  set('q', f.q);
  set('cat', f.cat);
  set('sort', f.sort === 'popular' ? '' : f.sort);
  set('g', f.genders.join(','));
  set('c', f.cats.join(','));
  set('s', f.sizes.join(','));
  set('min', f.min?.toString() ?? '');
  set('max', f.max?.toString() ?? '');
  set('sale', f.sale ? '1' : '');
  return p;
}

/** How many filters from the sheet are on (search, scope and sorting are not counted). */
export function activeCount(f: Filters): number {
  return f.genders.length + f.cats.length + f.sizes.length + (f.min !== null || f.max !== null ? 1 : 0) + (f.sale ? 1 : 0);
}

/** Products of the page scope before the sheet filters: the sheet offers only values that exist here. */
export function scoped(f: Pick<Filters, 'q' | 'cat'>): Product[] {
  const needle = f.q.trim().toLowerCase();
  return products.filter((p) => (!f.cat || inCategory(p, f.cat)) && (!needle
    || `${p.brand} ${p.title} ${p.article} ${categoryTitle(p.category)}`.toLowerCase().includes(needle)));
}

export function apply(f: Filters): Product[] {
  const found = scoped(f).filter((p) => (!f.genders.length || f.genders.includes(p.gender))
    && (!f.cats.length || f.cats.includes(p.category))
    && (!f.sizes.length || p.sizes.some((s) => f.sizes.includes(s.size)))
    && (f.min === null || p.price >= f.min)
    && (f.max === null || p.price <= f.max)
    && (!f.sale || p.oldPrice !== null));
  const discount = (p: Product) => (p.oldPrice ? 1 - p.price / p.oldPrice : 0);
  const cmp: Record<SortKey, (a: Product, b: Product) => number> = {
    'popular': (a, b) => b.sold - a.sold,
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    'sale': (a, b) => discount(b) - discount(a) || b.sold - a.sold,
  };
  return found.sort(cmp[f.sort]);
}

// Dewu mixes both spellings: XXL = 2XL, XXXL = 3XL, XXXXL = 4XL
const LETTERS = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', 'XXXL', '3XL', 'XXXXL', '4XL', '5XL'];

/** Shoe sizes numerically, clothes by the letter scale. */
export function sortSizes(sizes: string[]): string[] {
  const rank = (s: string) => {
    if (/^\d+(\.\d+)?$/.test(s)) return parseFloat(s);
    const i = LETTERS.indexOf(s.toUpperCase());
    return i < 0 ? 1000 : 500 + i;
  };
  return [...sizes].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}
