import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { Page } from '@/components/Page.tsx';
import { sortSizes } from '@/components/filters.ts';
import {
  categoryTitle, deliveries, findProduct, formatPrice, formatSold, GENDERS, hasPriceRange, priceFor, shortTitle,
} from '@/data/catalog.ts';
import { publicUrl } from '@/helpers/publicUrl.ts';
import { success, tap } from '@/hooks/haptic.ts';
import { useMainButton } from '@/hooks/useMainButton.tsx';
import { useCart } from '@/store/cart.tsx';

export function ProductPage() {
  const { id } = useParams();
  const product = findProduct(Number(id));
  const navigate = useNavigate();
  const cart = useCart();
  const [size, setSize] = useState<string | null>(product && !product.sizes.length ? '' : null);
  const [photo, setPhoto] = useState(0);

  const inCart = product !== undefined && size !== null && cart.has(product.id, size);
  const price = product && size ? priceFor(product, size) : product?.price ?? 0;
  const fallback = useMainButton(
    !product ? null
      : size === null ? 'Выберите размер'
        : inCart ? `В корзине · перейти (${cart.count})`
          : `Добавить в корзину · ${formatPrice(price)}`,
    () => {
      if (!product || size === null) return;
      if (inCart) {
        navigate('/cart');
      } else {
        cart.add(product.id, size);
        success();
      }
    },
    size !== null,
  );

  if (!product) return <Navigate to="/" replace/>;
  const sizes = sortSizes(product.sizes.map((s) => s.size));

  return (
    <Page>
      <div
        className="gallery"
        onScroll={(e) => setPhoto(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
      >
        {product.photos.map((src) => <img key={src} src={publicUrl(src)} alt=""/>)}
      </div>
      {product.photos.length > 1 && (
        <div className="gallery-counter">{photo + 1} / {product.photos.length}</div>
      )}

      <section className="block">
        <div className="pp-price">
          {size === null && hasPriceRange(product) && <span className="from">от</span>}
          <span className="price big">{formatPrice(price)}</span>
          {product.oldPrice && <s>{formatPrice(product.oldPrice)}</s>}
        </div>
        <div className="pp-note">Цена с обычной доставкой из Китая</div>
        <h1 className="pp-title">{product.brand && <b>{product.brand} </b>}{shortTitle(product)}</h1>
        <div className="pp-meta">
          <span>{formatSold(product.sold)} купили</span>
          <span>{categoryTitle(product.category)}</span>
          <span>{GENDERS.find((g) => g.key === product.gender)?.title}</span>
        </div>
      </section>

      {sizes.length > 0 && (
        <section className="block">
          <div className="block-title">Размер <span className="hint">EU / международный</span></div>
          <div className="sizes">
            {sizes.map((s) => (
              <button
                key={s}
                className={s === size ? 'size active' : 'size'}
                onClick={() => { tap(); setSize(s); }}
              >
                <span>{s}</span>
                <small>{formatPrice(priceFor(product, s))}</small>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="block">
        <div className="block-title">Доставка</div>
        <ul className="delivery-info">
          {deliveries.map((d) => (
            <li key={d.key}>
              <span><b>{d.title}</b> · {d.days}</span>
              <span>{d.key === 'express' ? `+${formatPrice(product.expressExtra)}` : 'включена в цену'}</span>
            </li>
          ))}
        </ul>
        <p className="hint">Способ доставки выбирается в корзине.</p>
      </section>
      {fallback}
    </Page>
  );
}
