import { Link } from 'react-router-dom';

import { Page } from '@/components/Page.tsx';
import { ProductList } from '@/components/ProductList.tsx';
import { SearchBar } from '@/components/SearchBar.tsx';
import { TabBar } from '@/components/TabBar.tsx';
import { categories, inCategory, products } from '@/data/catalog.ts';
import { publicUrl } from '@/helpers/publicUrl.ts';

/** Subcategories with a product photo, most popular first: quick entry points like on Poizon's main page. */
const shortcuts = categories
  .filter((c) => c.parent)
  .map((c) => {
    const items = products.filter((p) => inCategory(p, c.slug)).sort((a, b) => b.sold - a.sold);
    return { ...c, photo: items[0]?.photos[0], sold: items.reduce((s, p) => s + p.sold, 0) };
  })
  .filter((c) => c.photo)
  .sort((a, b) => b.sold - a.sold);

export function HomePage() {
  return (
    <Page back={false}>
      <header className="topbar">
        <SearchBar/>
      </header>

      <nav className="shortcuts">
        {shortcuts.map((c) => (
          <Link key={c.slug} to={`/list?cat=${c.slug}`} className="shortcut">
            <span className="shortcut-photo"><img src={publicUrl(c.photo)} alt=""/></span>
            {c.title}
          </Link>
        ))}
      </nav>

      <h2 className="section-title">Популярное</h2>
      <ProductList/>
      <TabBar/>
    </Page>
  );
}
