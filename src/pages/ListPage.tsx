import { useSearchParams } from 'react-router-dom';

import { readFilters, writeFilters } from '@/components/filters.ts';
import { Page } from '@/components/Page.tsx';
import { ProductList } from '@/components/ProductList.tsx';
import { SearchBar } from '@/components/SearchBar.tsx';
import { categoryTitle } from '@/data/catalog.ts';

/** Products of a category or a search query, with sorting and filters. */
export function ListPage() {
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  const searching = params.get('search') === '1';

  return (
    <Page>
      <header className="topbar column">
        <SearchBar
          value={filters.q}
          autoFocus={searching && !filters.q}
          onChange={(q) => {
            const next = writeFilters({ ...filters, q });
            if (searching) next.set('search', '1');
            setParams(next, { replace: true });
          }}
        />
        {filters.cat && <h1 className="list-title">{categoryTitle(filters.cat)}</h1>}
      </header>
      <ProductList/>
    </Page>
  );
}
