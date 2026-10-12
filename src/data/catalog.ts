import raw from './products.json';

export interface Product {
  id: number;
  title: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  oldPrice: number | null;
  rating: number;
  sold: number;
  sizes: string[];
  photos: string[];
}

export interface Category {
  slug: string;
  title: string;
}

export const categories: Category[] = raw.categories;
export const products: Product[] = raw.products;

const byId = new Map(products.map((p) => [p.id, p]));

export function findProduct(id: number): Product | undefined {
  return byId.get(id);
}

export function categoryTitle(slug: string): string {
  return categories.find((c) => c.slug === slug)?.title ?? '';
}

/** Shop data often repeats the brand in the title ("Puma Puma Future Rider"). */
export function shortTitle(p: Product): string {
  return p.brand && p.title.startsWith(`${p.brand} `) ? p.title.slice(p.brand.length + 1) : p.title;
}

export function formatPrice(yuan: number): string {
  return `¥${yuan.toLocaleString('ru-RU')}`;
}

/** "1234" -> "1,2 тыс.", like the "bought 1.2万+" counters in Chinese stores. */
export function formatSold(n: number): string {
  if (n < 1000) return `${n}`;
  return `${(n / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} тыс.`;
}
