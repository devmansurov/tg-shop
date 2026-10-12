import { useEffect, useLayoutEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { Page } from '@/components/Page.tsx';
import { ProductCard } from '@/components/ProductCard.tsx';
import { categories, categoryTitle, formatPrice, products } from '@/data/catalog.ts';
import { tap } from '@/hooks/haptic.ts';
import { useMainButton } from '@/hooks/useMainButton.tsx';
import { useCart } from '@/store/cart.tsx';

const SORTS = [
  { key: 'popular', title: 'Популярные' },
  { key: 'price-asc', title: 'Цена ↑' },
  { key: 'price-desc', title: 'Цена ↓' },
  { key: 'rating', title: 'Рейтинг' },
] as const;
type SortKey = typeof SORTS[number]['key'];

const SCROLL_KEY = 'catalog-scroll';

export function CatalogPage() {
  const navigate = useNavigate();
  const cart = useCart();
  // filters live in the URL, so "back" from a product restores them
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const cat = params.get('cat') ?? '';
  const sort = (params.get('sort') ?? 'popular') as SortKey;

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const found = products.filter((p) => (!cat || p.category === cat) && (!needle
      || `${p.title} ${p.brand} ${categoryTitle(p.category)}`.toLowerCase().includes(needle)));
    const cmp: Record<SortKey, (a: typeof products[number], b: typeof products[number]) => number> = {
      'popular': (a, b) => b.sold - a.sold,
      'price-asc': (a, b) => a.price - b.price,
      'price-desc': (a, b) => b.price - a.price,
      'rating': (a, b) => b.rating - a.rating,
    };
    return found.sort(cmp[sort]);
  }, [q, cat, sort]);

  // restore the scroll position after coming back from a product page
  useLayoutEffect(() => {
    const y = Number(sessionStorage.getItem(SCROLL_KEY) || 0);
    if (y) window.scrollTo(0, y);
  }, []);
  useEffect(() => () => sessionStorage.setItem(SCROLL_KEY, String(window.scrollY)), []);

  const fallback = useMainButton(
    cart.count ? `Корзина · ${cart.count} шт · ${formatPrice(cart.total)}` : null,
    () => navigate('/cart'),
  );

  return (
    <Page back={false}>
      <header className="topbar">
        <label className="search">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path fill="currentColor" d="M10 2a8 8 0 0 1 6.32 12.9l5.39 5.4-1.41 1.4-5.4-5.38A8 8 0 1 1 10 2Zm0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z"/>
          </svg>
          <input
            type="search"
            placeholder="Поиск товаров и брендов"
            value={q}
            onChange={(e) => update('q', e.target.value)}
          />
        </label>
        <Link to="/cart" className="cart-icon" aria-label="Корзина">
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path fill="currentColor" d="M7 18a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm10 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM1 2h3.27l.94 2H21a1 1 0 0 1 .96 1.27l-2.8 9.5A2 2 0 0 1 17.24 16H8.1a2 2 0 0 1-1.96-1.6L4 4H1V2Zm5.13 4 1.96 8h9.15l2.36-8H6.13Z"/>
          </svg>
          {cart.count > 0 && <span className="badge">{cart.count}</span>}
        </Link>
      </header>

      <nav className="chips">
        {[{ slug: '', title: 'Все' }, ...categories].map((c) => (
          <button
            key={c.slug}
            className={c.slug === cat ? 'chip active' : 'chip'}
            onClick={() => { tap(); update('cat', c.slug); }}
          >{c.title}</button>
        ))}
      </nav>

      <div className="sorts">
        {SORTS.map((s) => (
          <button
            key={s.key}
            className={s.key === sort ? 'sort active' : 'sort'}
            onClick={() => { tap(); update('sort', s.key === 'popular' ? '' : s.key); }}
          >{s.title}</button>
        ))}
      </div>

      {list.length ? (
        <main className="grid">
          {list.map((p) => <ProductCard key={p.id} product={p}/>)}
        </main>
      ) : (
        <p className="empty">Ничего не найдено</p>
      )}
      {fallback}
    </Page>
  );
}
