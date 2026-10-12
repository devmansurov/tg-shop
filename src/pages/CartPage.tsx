import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Page } from '@/components/Page.tsx';
import { findProduct, formatPrice, shortTitle } from '@/data/catalog.ts';
import { publicUrl } from '@/helpers/publicUrl.ts';
import { tap } from '@/hooks/haptic.ts';
import { useMainButton } from '@/hooks/useMainButton.tsx';
import { useCart } from '@/store/cart.tsx';

export function CartPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(false);

  const fallback = useMainButton(
    cart.count ? `Оформить заказ · ${formatPrice(cart.total)}` : 'Перейти в каталог',
    () => (cart.count ? setNotice(true) : navigate('/')),
  );

  return (
    <Page>
      <header className="page-head">
        <h1>Корзина</h1>
        {cart.count > 0 && <button className="link" onClick={cart.clear}>Очистить</button>}
      </header>

      {cart.count === 0 && <p className="empty">В корзине пока пусто</p>}

      <ul className="cart">
        {cart.lines.map((l) => {
          const p = findProduct(l.id)!;
          return (
            <li key={`${l.id}|${l.size}`} className="cart-line">
              <Link to={`/product/${p.id}`} className="cart-photo">
                <img src={publicUrl(p.photos[0])} alt=""/>
              </Link>
              <div className="cart-info">
                <div className="cart-title">{p.brand && <b>{p.brand} </b>}{shortTitle(p)}</div>
                {l.size && <div className="cart-size">Размер: {l.size}</div>}
                <div className="cart-bottom">
                  <span className="price">{formatPrice(p.price * l.qty)}</span>
                  <div className="stepper">
                    <button onClick={() => { tap(); cart.setQty(l.id, l.size, l.qty - 1); }} aria-label="Меньше">−</button>
                    <span>{l.qty}</span>
                    <button onClick={() => { tap(); cart.setQty(l.id, l.size, l.qty + 1); }} aria-label="Больше">+</button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {cart.count > 0 && (
        <div className="cart-total">
          <span>Итого, {cart.count} шт</span>
          <span className="price big">{formatPrice(cart.total)}</span>
        </div>
      )}

      {notice && (
        <div className="sheet-backdrop" onClick={() => setNotice(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <h2>Скоро</h2>
            <p>Оплата и доставка пока не подключены. Корзина сохранена — она будет ждать вас здесь.</p>
            <button className="sheet-ok" onClick={() => setNotice(false)}>Понятно</button>
          </div>
        </div>
      )}
      {fallback}
    </Page>
  );
}
