# tg-shop — магазин в Telegram Mini App

Каталог товаров и корзина в стиле Poizon. Оплаты и доставки пока нет.
Основа — официальный шаблон [Telegram-Mini-Apps/reactjs-template](https://github.com/Telegram-Mini-Apps/reactjs-template)
(React, TypeScript, Vite, `@tma.js/sdk-react`).

- Бот: [@dm_market_shop_bot](https://t.me/dm_market_shop_bot), кнопка «Магазин» в меню
- Приложение: https://devmansurov.github.io/tg-shop/

## Как устроено

- `src/data/products.json` — каталог (сейчас демо-товары с dummyjson.com), фото в `public/img/`.
  Обновить: `python3 scripts/fetch_products.py`.
- `src/store/cart.tsx` — корзина; в Telegram хранится в CloudStorage (общая для всех устройств пользователя).
- `src/hooks/useMainButton.tsx` — нативная нижняя кнопка Telegram; в браузере вместо неё обычная кнопка.
- Страницы: каталог `/`, товар `/product/:id`, корзина `/cart` (HashRouter).

## Команды

```bash
npm install
npm run dev        # http://localhost:5173/tg-shop/ — окружение Telegram подменяется заглушкой
npm run deploy     # сборка и публикация на GitHub Pages (ветка gh-pages)
```

`scripts/bot_setup.py` — создание бота через BotFather и привязка кнопки меню.
Секреты в `.env.bot` (токен бота) и `.env.tg` (Telegram API владельца) — в git не попадают.
