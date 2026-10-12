import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Page } from '@/components/Page.tsx';
import { SearchBar } from '@/components/SearchBar.tsx';
import { TabBar } from '@/components/TabBar.tsx';
import { childrenOf, inCategory, products, topCategories } from '@/data/catalog.ts';
import { publicUrl } from '@/helpers/publicUrl.ts';
import { tap } from '@/hooks/haptic.ts';

const KEY = 'catalog-top';

/** Two panes like on Poizon: sections on the left, their subcategories on the right. */
export function CatalogPage() {
  const [top, setTop] = useState(() => sessionStorage.getItem(KEY) || topCategories[0]?.slug || '');
  const pick = (slug: string) => { tap(); setTop(slug); sessionStorage.setItem(KEY, slug); };
  const subs = childrenOf(top).map((c) => {
    const items = products.filter((p) => inCategory(p, c.slug)).sort((a, b) => b.sold - a.sold);
    return { ...c, count: items.length, photo: items[0]?.photos[0] };
  }).filter((c) => c.count);
  const all = products.filter((p) => inCategory(p, top)).sort((a, b) => b.sold - a.sold);

  return (
    <Page back={false}>
      <header className="topbar"><SearchBar/></header>
      <div className="catalog">
        <aside className="cat-left">
          {topCategories.map((c) => (
            <button key={c.slug} className={c.slug === top ? 'cat-top active' : 'cat-top'} onClick={() => pick(c.slug)}>
              {c.title}
            </button>
          ))}
        </aside>
        <section className="cat-right">
          <Link to={`/list?cat=${top}`} className="cat-all">
            Все товары раздела <span>{all.length} ›</span>
          </Link>
          <div className="cat-tiles">
            {subs.map((c) => (
              <Link key={c.slug} to={`/list?cat=${c.slug}`} className="cat-tile">
                <span className="cat-photo">{c.photo && <img src={publicUrl(c.photo)} alt="" loading="lazy"/>}</span>
                <span className="cat-name">{c.title}</span>
                <span className="cat-count">{c.count}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
      <TabBar/>
    </Page>
  );
}
