import raw from './products.json';

export interface SizePrice {
  size: string;
  price: number;
}

export type Gender = 'men' | 'women' | 'unisex';

export interface Product {
  id: number;
  brand: string;
  title: string;
  category: string;
  gender: Gender;
  price: number;              // lowest size price, regular delivery and margin included
  oldPrice: number | null;
  expressExtra: number;       // surcharge for express delivery, per item
  sold: number;
  sizes: SizePrice[];
  photos: string[];
  article: string;
}

export interface Category {
  slug: string;
  title: string;
  parent: string | null;
}

export type DeliveryKey = 'regular' | 'express';

export interface Delivery {
  key: DeliveryKey;
  title: string;
  days: string;
}

export const categories = raw.categories as Category[];
export const products = raw.products as Product[];
export const deliveries = raw.delivery as Delivery[];

export const GENDERS: { key: Gender; title: string }[] = [
  { key: 'men', title: 'Мужское' },
  { key: 'women', title: 'Женское' },
  { key: 'unisex', title: 'Унисекс' },
];

const byId = new Map(products.map((p) => [p.id, p]));

export function findProduct(id: number): Product | undefined {
  return byId.get(id);
}

export function findCategory(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function categoryTitle(slug: string): string {
  return findCategory(slug)?.title ?? '';
}

export const topCategories = categories.filter((c) => !c.parent);

export function childrenOf(slug: string): Category[] {
  return categories.filter((c) => c.parent === slug);
}

/** A top-level category covers its subcategories; products always sit in a subcategory. */
export function inCategory(p: Product, slug: string): boolean {
  return p.category === slug || findCategory(p.category)?.parent === slug;
}

export function priceFor(p: Product, size: string): number {
  return p.sizes.find((s) => s.size === size)?.price ?? p.price;
}

export function hasPriceRange(p: Product): boolean {
  return p.sizes.some((s) => s.price !== p.price);
}

/** Shop data often repeats the brand in the title ("Nike Nike Air Max"). */
export function shortTitle(p: Product): string {
  return p.brand && p.title.startsWith(`${p.brand} `) ? p.title.slice(p.brand.length + 1) : p.title;
}

export function formatPrice(somoni: number): string {
  return `${somoni.toLocaleString('ru-RU')} смн`;
}

export function formatSold(n: number): string {
  if (n < 1000) return `${n}`;
  return `${(n / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} тыс.`;
}
