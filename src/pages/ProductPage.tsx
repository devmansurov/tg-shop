import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { Page } from '@/components/Page.tsx';
import { categoryTitle, findProduct, formatPrice, formatSold, shortTitle } from '@/data/catalog.ts';
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
  const fallback = useMainButton(
    !product ? null
      : size === null ? 'Выберите размер'
        : inCart ? `В корзине · перейти (${cart.count})`
          : `Добавить в корзину · ${formatPrice(product.price)}`,
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
          <span className="price big">{formatPrice(product.price)}</span>
          {product.oldPrice && <s>{formatPrice(product.oldPrice)}</s>}
          {product.oldPrice && (
            <span className="discount">−{Math.round((1 - product.price / product.oldPrice) * 100)}%</span>
          )}
        </div>
        <h1 className="pp-title">{product.brand && <b>{product.brand} </b>}{shortTitle(product)}</h1>
        <div className="pp-meta">
          <span>★ {product.rating.toFixed(1)}</span>
          <span>{formatSold(product.sold)} купили</span>
          <span>{categoryTitle(product.category)}</span>
        </div>
      </section>

      {product.sizes.length > 0 && (
        <section className="block">
          <div className="block-title">Размер</div>
          <div className="sizes">
            {product.sizes.map((s) => (
              <button
                key={s}
                className={s === size ? 'size active' : 'size'}
                onClick={() => { tap(); setSize(s); }}
              >{s}</button>
            ))}
          </div>
        </section>
      )}

      <section className="block">
        <div className="block-title">Описание</div>
        <p className="pp-desc">{product.description}</p>
      </section>
      {fallback}
    </Page>
  );
}
