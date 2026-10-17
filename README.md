# tg-shop — адрес витрины dm-market в Telegram

Исходники мини-приложения переехали в монорепозиторий **dm-market** (`miniapp/`) вместе с историей своих файлов — там они и развиваются.

Этот репозиторий остаётся адресом витрины: GitHub Pages отдаёт ветку `gh-pages` по ссылке https://devmansurov.github.io/tg-shop/, её открывает бот [@dm_market_shop_bot](https://t.me/dm_market_shop_bot) кнопкой «Магазин».

- Выкладывает витрину dm-market: `make miniapp-deploy` — один коммит в `gh-pages` поверх прежнего, откат — отменить его.
- Каталог витрина читает из публичного репозитория [dm-market-data](https://github.com/devmansurov/dm-market-data): его публикует ядро dm-market.
- Код в `main` — старая витрина со вшитым каталогом; он больше не меняется. `npm run deploy` здесь отключён: он выложил бы старую витрину поверх новой. Сборщик каталога `scripts/build_catalog.py` убран — каталог теперь собирает ядро.
