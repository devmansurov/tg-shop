import { NavLink } from 'react-router-dom';

import { useCart } from '@/store/cart.tsx';

const ICONS = {
  home: 'M12 3 2 11h3v9h6v-6h2v6h6v-9h3L12 3Z',
  catalog: 'M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z',
  cart: 'M7 18a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm10 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM1 2h3.27l.94 2H21a1 1 0 0 1 .96 1.27l-2.8 9.5A2 2 0 0 1 17.24 16H8.1a2 2 0 0 1-1.96-1.6L4 4H1V2Z',
};

/** Bottom menu of the three root screens. */
export function TabBar() {
  const { count } = useCart();
  const tabs = [
    { to: '/', title: 'Главная', icon: ICONS.home },
    { to: '/catalog', title: 'Каталог', icon: ICONS.catalog },
    { to: '/cart', title: 'Корзина', icon: ICONS.cart, badge: count },
  ];
  return (
    <nav className="tabbar">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} end replace className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
          <span className="tab-icon">
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="currentColor" d={t.icon}/></svg>
            {t.badge ? <span className="badge">{t.badge}</span> : null}
          </span>
          {t.title}
        </NavLink>
      ))}
    </nav>
  );
}
