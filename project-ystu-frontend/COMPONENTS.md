# Компоненты для интеграции в 1С-Битрикс

Актуализация: 08.11.2026. Это библиотека статических frontend-компонентов, а не установленный PHP-модуль Битрикс.

## Где искать

- `src/templates/components/` — общие Nunjucks-шаблоны и макросы.
- `src/styles/components/` — самостоятельные стили блоков; `layout/` — оболочка сайта, `pages/` — только компоновка конкретных страниц.
- `src/js/components/` — общая интерактивная логика.
- `src/data/component-examples.json` — демонстрационные данные, отдельно от renderer.
- `src/data/component-contracts.json` — реестр основных компонентов, CSS, JS-hooks и карта переименований.
- `src/data/components.json` — автоматически обновляемый полный индекс шаблонов и мест их подключения.
- `dist/` — готовый HTML/CSS/JS; основные `pages/`, `css/`, `js/` в корне сохраняются как самостоятельная статическая версия.

Подключать одну общую точку стилей и `js/main.js`. Нельзя смешивать `css/` основной версии и `styles/` production.

## Параметризованные renderer

| Макрос / файл | Входные данные |
| --- | --- |
| `programCard / program-card.njk` | classes, filters, tags, code, title, href, profilesTitle, profiles[], stats[{label,value}] |
| `vacancyCard / vacancy-card.njk` | filters, pattern, title, category, description, button |
| `newsCard / news-card.njk` | href, image, date, title, tags[]; необязательные overrides title/tags |
| `eventCard / event-card.njk` | image, title, date, time, location, register, details, tags[] |
| `trainingCard / training-program-card.njk` | code, level, tagClasses, titleHtml, href, footer[]; необязательная category |
| `departmentCard / department-card.njk` | category, href, titleHtml, badges[{classes,text}] |
| `personCard / person-card.njk` | image, name, role, href, contacts[] |
| `contactCard / contact-card.njk` | groups[{label,values[{text,href}]}] |
| `contactList / contact-list.njk` | массив групп label/values; вариант подписи h2 или span |
| `contactSection / contact-section.njk` | classes, title, image, groups[{title,modifier,contentHtml}] |
| `featureSection / feature-section.njk` | classes, title, titleClasses, descriptionHtml, button, images[] |
| `mediaGallery / media-gallery.njk` | массив изображений src/alt/loading/decoding |
| `journalCard, journalAccordion / journal-card.njk` | image, columns[][], button, descriptionHtml; для аккордеона title/expanded/headerClasses/titleClasses |
| `filterGroup / catalog-filter-group.njk` | title, titleTag, options[{text,type,name,value,checked}] |
| `catalogSearch / catalog-search.njk` | form, caption, placeholder, label, name; form=false для вложенного поиска без вложенной form |
| `campusFilter / campus-filter.njk` | classes, type, label, panelClasses, items[] |
| `metricCard / metric-card.njk` | label, value |
| `linkCards / link-cards.njk` | classes, title, links[{href,label}] |
| `projectCard / flagship-card.njk` | href, titleHtml, необязательное image; варианты сетки собирает flagship-grid |
| `teaserCard / ficher.njk` | href, image, titleHtml; коллекция — fichers |
| `action / action.njk` | classes, label, href либо type; необязательные modal/ui |
| `disclosure / disclosure.njk` | title, expanded и caller — содержимое |
| `accordionItem / accordion.njk` | title, expanded, headerClasses, titleClasses и caller |

Примеры данных для всех этих renderer находятся в `component-examples.json`. Предметные составные секции (учебный план, профиль сотрудника, статистика, баннеры) собирают общие блоки; их названия отражают предметную область, а не обязательный родитель конкретной страницы. Шапка, cookie и поиск сайта — сервисы оболочки, а не произвольное число экземпляров на странице. Подвал сохранён по отдельному указанию пользователя.

```njk
{% from "components/contact-section.njk" import contactSection %}
{{ contactSection(contacts) }}

{% from "components/disclosure.njk" import disclosure %}
{% call disclosure("Документы", false) %}
  <!-- Любое содержимое: список документов, таблица, текст редактора. -->
{% endcall %}
```

## Контракт интеграции

Макросы Nunjucks не выполняются в PHP. Их структура и данные переносятся в шаблоны компонентов Битрикс; `dist/pages/` служит эталоном итогового HTML. Реальная выборка, поля, проверка прав, серверные формы, фильтрация и SEO остаются задачей интеграции.

- Обычные поля экранируются автоматически. Поля `*Html` — только доверенный, очищенный на сервере HTML редактора; их renderer намеренно использует `safe`. Не передавать туда пользовательский ввод без очистки.
- Проверять разрешённые URL и допустимые значения classes/type на стороне CMS. HTML-экранирование не является проверкой протокола ссылки.
- `data-catalog-filters` содержит JSON с ключами фильтров. Передавать одинаковые значения в карточки и элементы фильтров.
- `data-ui`, `data-slider-control`, `data-modal-*`, `data-filter`, `data-category` и связи `aria-*/id/for` — публичный контракт. Некоторые hooks сохраняют прежние имена для совместимости; оформление от этих старых имён классов больше не зависит.
- Новые CSS-классы нужно переносить вместе с HTML. Карта старых и новых имён — `component-contracts.json`; совместимость старых CSS-селекторов не обещается.
- Шаблоны не требуют родителя `program` или `student-life`. У контактов роль группы задаётся modifier (address/phones/schedule), а не её порядковым номером.
- Декор Полезных ссылок по порядку 6n и согласованные варианты сеток флагманских проектов сохранены намеренно.

## AJAX и независимые экземпляры

После вставки полного экземпляра вызвать `await window.SiteUI.init(container)`. Готовность страницы — `await window.SiteUI.ready`; повторный init не удваивает обработчики. Для галерей доступен `await window.Galleries.init(element)`. Новый общий hook галереи — `js-init-media-gallery`; прежний `js-init-student-slider` поддерживается JS как alias.

- Выдачи: стабильный уникальный `data-pagination-key`; `data-pagination-url="off"` отключает изменение URL. Первый неназванный листинг сохраняет page/tab, последующие получают namespace.
- Модалки: уникальные ID, `data-modal-target`/aria-controls, при необходимости `data-ui="modal-scope"`. Для event-modal передавать eventModalId, eventModalKey и modalIdPrefix. Сохраняется прежний data-modal.
- Панели фильтров: уникальные ID и data-open-filter-panel; область поиска — ближайший listing-page.
- Аккордеоны: data-ui=disclosure либо существующий набор dropdown--item/header/trigger/content. Общая логика — Dropdown.init(scope), клавиатура и reduced motion сохранены.
- Карта: обёртка `data-campus-map-component`, внутри `data-campus-map`. Необязательный data-campus-objects — JSON-массив объектов. У экземпляров собственные фильтры, popup и данные. API: CampusMap.init(scope), CampusMap.get(mapElement); прежние focusObject/clearFilters/campusObjects обращаются к первому экземпляру.
- Демонстрационные объекты карты вынесены в `js/data/campus-objects.js`. При интеграции задавать свои данные экземпляра. Внешний API и ключи не настраивались в рамках этого рефакторинга.

Общего destroy API для всех модулей нет. Для полной замены структуры уже инициализированного компонента вставлять новый экземпляр; для пагинации повторный init обновляет набор карточек. Backend и интеграционные проверки на рабочем Битрикс-сайте этим не заменяются.
