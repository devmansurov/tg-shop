import { Link } from 'react-router-dom';

import { formatPrice, formatSold, hasPriceRange, type Product, shortTitle } from '@/data/catalog.ts';
import { publicUrl } from '@/helpers/publicUrl.ts';

export function ProductCard({ product: p }: { product: Product }) {
  return (
    <Link to={`/product/${p.id}`} className="card">
      <div className="card-photo">
        <img src={publicUrl(p.photos[0])} alt="" loading="lazy"/>
      </div>
      <div className="card-title">{p.brand && <b>{p.brand} </b>}{shortTitle(p)}</div>
      <div className="card-price">
        {hasPriceRange(p) && <span className="from">от</span>}
        <span className="price">{formatPrice(p.price)}</span>
        {p.oldPrice && <s>{formatPrice(p.oldPrice)}</s>}
      </div>
      <div className="card-sold">{formatSold(p.sold)} купили</div>
    </Link>
  );
}
