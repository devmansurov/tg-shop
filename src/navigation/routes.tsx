import type { ComponentType } from 'react';

import { CartPage } from '@/pages/CartPage.tsx';
import { CatalogPage } from '@/pages/CatalogPage.tsx';
import { HomePage } from '@/pages/HomePage.tsx';
import { ListPage } from '@/pages/ListPage.tsx';
import { ProductPage } from '@/pages/ProductPage.tsx';

interface Route {
  path: string;
  Component: ComponentType;
}

export const routes: Route[] = [
  { path: '/', Component: HomePage },
  { path: '/catalog', Component: CatalogPage },
  { path: '/list', Component: ListPage },
  { path: '/product/:id', Component: ProductPage },
  { path: '/cart', Component: CartPage },
];
