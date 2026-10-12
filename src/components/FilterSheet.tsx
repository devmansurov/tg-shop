import { useMemo, useState } from 'react';

import { apply, type Filters, scoped, sortSizes } from '@/components/filters.ts';
import { categoryTitle, childrenOf, findCategory, GENDERS } from '@/data/catalog.ts';
import { tap } from '@/hooks/haptic.ts';

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

export function FilterSheet({ filters, onApply, onClose }: {
  filters: Filters;
  onApply: (f: Filters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(filters);
  const set = (patch: Partial<Filters>) => { tap(); setDraft((d) => ({ ...d, ...patch })); };

  // offer only values that exist within the page scope
  const base = useMemo(() => scoped(filters), [filters.q, filters.cat]);    
  const genders = GENDERS.filter((g) => base.some((p) => p.gender === g.key));
  const scope = findCategory(filters.cat);
  const subcats = scope?.parent
    ? []
    : [...new Set(base.map((p) => p.category))]
      .filter((c) => !scope || childrenOf(scope.slug).some((x) => x.slug === c));
  const sizes = sortSizes([...new Set(base.flatMap((p) => p.sizes.map((s) => s.size)))]);
  const count = apply(draft).length;

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet filter-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>Фильтры</h2>
          <button className="link" onClick={() => set({ genders: [], cats: [], sizes: [], min: null, max: null, sale: false })}>Сбросить</button>
        </div>

        <div className="sheet-body">
          {genders.length > 1 && (
            <section>
              <div className="block-title">Пол</div>
              <div className="opts">
                {genders.map((g) => (
                  <button key={g.key} className={draft.genders.includes(g.key) ? 'opt active' : 'opt'}
                    onClick={() => set({ genders: toggle(draft.genders, g.key) })}>{g.title}</button>
                ))}
              </div>
            </section>
          )}

          {subcats.length > 1 && (
            <section>
              <div className="block-title">Категория</div>
              <div className="opts">
                {subcats.map((c) => (
                  <button key={c} className={draft.cats.includes(c) ? 'opt active' : 'opt'}
                    onClick={() => set({ cats: toggle(draft.cats, c) })}>{categoryTitle(c)}</button>
                ))}
              </div>
            </section>
          )}

          {sizes.length > 0 && (
            <section>
              <div className="block-title">Размер</div>
              <div className="opts sizes-opts">
                {sizes.map((s) => (
                  <button key={s} className={draft.sizes.includes(s) ? 'opt active' : 'opt'}
                    onClick={() => set({ sizes: toggle(draft.sizes, s) })}>{s}</button>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="block-title">Цена, смн</div>
            <div className="range">
              <input inputMode="numeric" placeholder="от" value={draft.min ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, min: e.target.value ? Number(e.target.value.replace(/\D/g, '')) : null }))}/>
              <span>—</span>
              <input inputMode="numeric" placeholder="до" value={draft.max ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, max: e.target.value ? Number(e.target.value.replace(/\D/g, '')) : null }))}/>
            </div>
          </section>

          <section>
            <label className="switch-row">
              <span>Только со скидкой</span>
              <input type="checkbox" checked={draft.sale} onChange={(e) => set({ sale: e.target.checked })}/>
            </label>
          </section>
        </div>

        <button className="sheet-ok" disabled={!count} onClick={() => onApply(draft)}>
          {count ? `Показать ${count} товаров` : 'Нет подходящих товаров'}
        </button>
      </div>
    </div>
  );
}
