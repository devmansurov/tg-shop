import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import { FilterSheet } from '@/components/FilterSheet.tsx';
import { activeCount, apply, type Filters, readFilters, SORTS, writeFilters } from '@/components/filters.ts';
import { ProductCard } from '@/components/ProductCard.tsx';
import { tap } from '@/hooks/haptic.ts';

/** Sort row, filter sheet and the product grid; state is kept in the URL. */
export function ProductList() {
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  const [sheet, setSheet] = useState(false);
  const { pathname, search } = useLocation();

  const update = (patch: Partial<Filters>) => setParams(writeFilters({ ...filters, ...patch }), { replace: true });
  const items = useMemo(() => apply(filters), [params.toString()]);    
  const active = activeCount(filters);

  // back from a product page: return to the same scroll position
  const scrollKey = `scroll:${pathname}${search}`;
  useLayoutEffect(() => {
    const y = Number(sessionStorage.getItem(scrollKey) || 0);
    if (y) window.scrollTo(0, y);
  }, []);    
  useEffect(() => {
    const save = () => sessionStorage.setItem(scrollKey, String(window.scrollY));
    window.addEventListener('scroll', save, { passive: true });
    return () => window.removeEventListener('scroll', save);
  }, [scrollKey]);

  return (
    <>
      <div className="toolbar">
        <div className="sorts">
          {SORTS.map((s) => (
            <button
              key={s.key}
              className={s.key === filters.sort ? 'sort active' : 'sort'}
              onClick={() => { tap(); update({ sort: s.key }); }}
            >{s.title}</button>
          ))}
        </div>
        <button className={active ? 'filter-btn active' : 'filter-btn'} onClick={() => { tap(); setSheet(true); }}>
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path fill="currentColor" d="M3 5h18v2H3V5Zm3 6h12v2H6v-2Zm3 6h6v2H9v-2Z"/>
          </svg>
          Фильтры{active > 0 && <span className="filter-count">{active}</span>}
        </button>
      </div>

      {items.length ? (
        <main className="grid">
          {items.map((p) => <ProductCard key={p.id} product={p}/>)}
        </main>
      ) : (
        <div className="empty">
          <p>Ничего не найдено</p>
          {active > 0 && <button className="link accent" onClick={() => update({ genders: [], cats: [], sizes: [], min: null, max: null, sale: false })}>Сбросить фильтры</button>}
        </div>
      )}

      {sheet && <FilterSheet filters={filters} onApply={(f) => { update(f); setSheet(false); }} onClose={() => setSheet(false)}/>}
    </>
  );
}
