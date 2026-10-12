import type { ComponentType } from 'react';

import { CartPage } from '@/pages/CartPage.tsx';
import { CatalogPage } from '@/pages/CatalogPage.tsx';
import { ProductPage } from '@/pages/ProductPage.tsx';

interface Route {
  path: string;
  Component: ComponentType;
}

export const routes: Route[] = [
  { path: '/', Component: CatalogPage },
  { path: '/product/:id', Component: ProductPage },
  { path: '/cart', Component: CartPage },
];
