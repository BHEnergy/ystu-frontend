# Метаданные и favicon

Общий head: `src/templates/components/head-metadata.njk`. Настройки и отдельные заголовки/описания страниц: `src/data/seo.json`. Сборщик передаёт шаблонам объект `metadata`; HTML-экранирование включено.

`siteUrl` сейчас указывает на демоверсию GitHub Pages. При интеграции заменить на реальный базовый URL с завершающим `/`. URL страницы и изображения должны быть абсолютными. Для динамических страниц CMS должна передавать актуальные название, описание, URL и изображение записи вместо демонстрационных значений.

`facebookAppId`, `twitterSite`, `twitterCreator` пусты: теги выводятся только при наличии реальных значений. Не публиковать `@user`, `[%...%]` и вымышленные идентификаторы.

Временное общее превью — существующее `images/fallback/main-slide.png`, у сотрудника — его фотография. После получения согласованной картинки для соцсетей заменить `image`.

Иконки положить в корневую `favicon/` и синхронизировать с `src/favicon/` перед сборкой:

- `apple-touch-icon.png` — 180×180;
- `favicon-32x32.png` — 32×32;
- `favicon-16x16.png` — 16×16;
- `safari-pinned-tab.svg` — SVG для mask-icon;
- `android-chrome-192x192.png` — 192×192;
- `android-chrome-512x512.png` — 512×512.

PNG, ICO, плитки Windows и `safari-pinned-tab.svg` загружены и подключены. Имя SVG для Safari задаётся в `maskIcon` в `seo.json`; цвет mask-icon — `#2C2C2C`.

У значков вкладки PNG 16/32 и ICO синий затемнён до `#062B59`, оранжевый — `#E55700`, форма и прозрачность сохранены. Повторная генерация: `node scripts/build-tab-favicons.cjs`. Query `?v=4` обновляет URL для кеша браузера. Android, Apple touch и плитки Windows этим изменением не перекрашиваются.

Манифест называется `manifest.json`, как в согласованном head. Он находится в корне основного комплекта и в `src/`; сборка копирует его, `browserconfig.xml` и `src/favicon/` в корень dist. `browserconfig.xml` содержит белый TileColor и ссылки на загруженные плитки Windows.

Страницы `pages/` используют относительные пути `../favicon/`, `../manifest.json`, `../browserconfig.xml`. В `dist/index.html` (редирект) пути относительны корню dist. Упаковщик включает новые файлы и папку favicon в оба комплекта.
