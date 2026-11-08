# Каталог компонентов

Снимок библиотеки: 08.11.2026. Всего шаблонов: 61. Подробно описанные контракты — 31. Актуальный автоматический индекс после каждой сборки: `src/data/components.json`; карта миграции и связи HTML/CSS/JS — `src/data/component-contracts.json`.

Шаблоны с макросами принимают данные, составные шаблоны собирают секции из общих блоков. Правила передачи данных, доверенного HTML и AJAX-инициализации: [COMPONENTS.md](COMPONENTS.md). Названия предметных компонентов (карточка программы, сотрудника, журнала) обозначают тип содержимого, а не требуемую родительскую страницу.

| Шаблон | Владелец оформления | Где используется |
| --- | --- | --- |
| [accordion.njk](src/templates/components/accordion.njk) | styles/components/dropdown.css | components/journal-card.njk |
| [action.njk](src/templates/components/action.njk) | styles/components/buttons.css | pages/programs.njk, pages/ui-kit.njk, components/event-card.njk |
| [banner-featured-slides.njk](src/templates/components/banner-featured-slides.njk) | styles/components/slider.css | pages/index.njk, pages/ui-kit.njk |
| [banner-survey-slides.njk](src/templates/components/banner-survey-slides.njk) | styles/components/slider.css | pages/ui-kit.njk |
| [breadcrumbs.njk](src/templates/components/breadcrumbs.njk) | styles/components/breadcrumbs.css | pages/detail-sotrudnik.njk, pages/ui-kit.njk |
| [button-states.njk](src/templates/components/button-states.njk) | styles/components/buttons.css | pages/ui-kit.njk, components/button-states.njk |
| [campus-filter.njk](src/templates/components/campus-filter.njk) | styles/components/campus-map.css | pages/map.njk, pages/ui-kit.njk |
| [catalog-filter-group.njk](src/templates/components/catalog-filter-group.njk) | styles/components/catalog-filters.css | pages/programs.njk, pages/ui-kit.njk, pages/vacancies.njk |
| [catalog-filter-option.njk](src/templates/components/catalog-filter-option.njk) | styles/components/catalog-filters.css | pages/programs.njk, pages/ui-kit.njk |
| [catalog-search.njk](src/templates/components/catalog-search.njk) | styles/components/catalog-filters.css | pages/programs.njk, pages/ui-kit.njk, pages/vacancies.njk |
| [contact-card.njk](src/templates/components/contact-card.njk) | styles/components/contact-card.css | pages/detail-structure.njk, pages/ui-kit.njk |
| [contact-list.njk](src/templates/components/contact-list.njk) | styles/components/contact-list.css | components/contact-card.njk, components/person-card.njk |
| [contact-section.njk](src/templates/components/contact-section.njk) | styles/components/contact-section.css | pages/program.njk, pages/student-life.njk, pages/ui-kit.njk |
| [cookie-banner.njk](src/templates/components/cookie-banner.njk) | styles/components/cookie-banner.css | pages/404.njk, pages/detail-sotrudnik.njk, pages/detail-structure.njk, pages/detail-vacancy.njk, pages/index.njk, pages/map.njk, pages/nauka.njk, pages/news-events.njk, pages/program.njk, pages/programs.njk, pages/search.njk, pages/structure.njk, pages/student-life.njk, pages/vacancies.njk |
| [curriculum.njk](src/templates/components/curriculum.njk) | styles/components/curriculum.css | pages/program.njk, pages/ui-kit.njk |
| [default-slider-controls.njk](src/templates/components/default-slider-controls.njk) | styles/components/slider.css | pages/index.njk, pages/ui-kit.njk |
| [demo-extra-events.njk](src/templates/components/demo-extra-events.njk) | композиция event-card | pages/news-events.njk |
| [demo-extra-news.njk](src/templates/components/demo-extra-news.njk) | композиция news-card | pages/news-events.njk |
| [department-card.njk](src/templates/components/department-card.njk) | styles/components/department-card.css | pages/structure.njk, pages/ui-kit.njk, components/university-statistics.njk |
| [disclosure.njk](src/templates/components/disclosure.njk) | styles/components/disclosure.css | components/entry-requirements.njk |
| [document-list.njk](src/templates/components/document-list.njk) | styles/components/document-list.css | pages/detail-structure.njk, pages/detail-vacancy.njk, pages/ui-kit.njk, pages/vacancies.njk |
| [dropdown--content.njk](src/templates/components/dropdown--content.njk) | styles/components/dropdown.css + employee-profile.css | pages/ui-kit.njk |
| [employee-contacts.njk](src/templates/components/employee-contacts.njk) | styles/components/employee-profile.css | pages/detail-sotrudnik.njk, pages/ui-kit.njk |
| [employee-summary.njk](src/templates/components/employee-summary.njk) | styles/components/employee-profile.css | pages/detail-sotrudnik.njk, pages/ui-kit.njk |
| [entry-requirements.njk](src/templates/components/entry-requirements.njk) | styles/components/entry-requirements.css | pages/program.njk, pages/ui-kit.njk |
| [error-page.njk](src/templates/components/error-page.njk) | styles/pages/error-page.css | pages/404.njk, pages/ui-kit.njk |
| [event-card.njk](src/templates/components/event-card.njk) | styles/components/events.css | pages/index.njk, pages/news-events.njk, pages/ui-kit.njk, components/demo-extra-events.njk |
| [event-modal.njk](src/templates/components/event-modal.njk) | styles/components/modal.css + form.css | pages/index.njk, pages/news-events.njk, pages/ui-kit.njk |
| [feature-section.njk](src/templates/components/feature-section.njk) | styles/components/feature-sections.css | pages/student-life.njk, pages/ui-kit.njk |
| [ficher.njk](src/templates/components/ficher.njk) | styles/components/fichers.css | components/fichers.njk |
| [fichers.njk](src/templates/components/fichers.njk) | styles/components/fichers.css | pages/index.njk, pages/ui-kit.njk |
| [flagship-card.njk](src/templates/components/flagship-card.njk) | styles/components/flagship-projects.css | pages/ui-kit.njk, components/flagship-grid.njk |
| [flagship-grid.njk](src/templates/components/flagship-grid.njk) | styles/components/flagship-projects.css | pages/index.njk, pages/ui-kit.njk |
| [footer.njk](src/templates/components/footer.njk) | styles/layout/footer.css | pages/404.njk, pages/detail-sotrudnik.njk, pages/detail-structure.njk, pages/detail-vacancy.njk, pages/index.njk, pages/map.njk, pages/nauka.njk, pages/news-events.njk, pages/program.njk, pages/programs.njk, pages/search.njk, pages/structure.njk, pages/student-life.njk, pages/ui-kit.njk, pages/vacancies.njk |
| [head-metadata.njk](src/templates/components/head-metadata.njk) | — (метаданные) | templates/layouts/base.njk |
| [header.njk](src/templates/components/header.njk) | styles/layout/header.css + mega-menu.css | pages/404.njk, pages/detail-sotrudnik.njk, pages/detail-structure.njk, pages/detail-vacancy.njk, pages/index.njk, pages/map.njk, pages/nauka.njk, pages/news-events.njk, pages/program.njk, pages/programs.njk, pages/search.njk, pages/structure.njk, pages/student-life.njk, pages/ui-kit.njk, pages/vacancies.njk |
| [hero-slider.njk](src/templates/components/hero-slider.njk) | styles/components/slider.css | pages/index.njk, pages/ui-kit.njk |
| [hero-variants.njk](src/templates/components/hero-variants.njk) | styles/components/hero-banner.css | pages/ui-kit.njk |
| [information-banner.njk](src/templates/components/information-banner.njk) | styles/layout/information_banner.css | pages/index.njk, pages/ui-kit.njk |
| [journal-card.njk](src/templates/components/journal-card.njk) | styles/components/journal-card.css | pages/nauka.njk, pages/ui-kit.njk |
| [link-cards.njk](src/templates/components/link-cards.njk) | styles/components/link-cards.css | pages/student-life.njk, pages/ui-kit.njk |
| [media-gallery.njk](src/templates/components/media-gallery.njk) | styles/components/media-gallery.css | components/feature-section.njk |
| [metric-card.njk](src/templates/components/metric-card.njk) | styles/components/metric-card.css | components/entry-requirements.njk |
| [modal-close.njk](src/templates/components/modal-close.njk) | styles/components/modal.css | components/vacancy-modal.njk |
| [navbar.njk](src/templates/components/navbar.njk) | styles/layout/header.css | components/header.njk |
| [news-arrow.njk](src/templates/components/news-arrow.njk) | styles/components/news.css | components/news-card.njk |
| [news-card.njk](src/templates/components/news-card.njk) | styles/components/news.css | pages/index.njk, pages/news-events.njk, pages/ui-kit.njk, components/demo-extra-news.njk |
| [pagination.njk](src/templates/components/pagination.njk) | styles/components/pagination.css | pages/news-events.njk |
| [person-card.njk](src/templates/components/person-card.njk) | styles/components/person-card.css | pages/detail-structure.njk, pages/ui-kit.njk, components/structure-employees.njk |
| [preparatory-courses.njk](src/templates/components/preparatory-courses.njk) | styles/components/preparatory-courses.css | pages/index.njk, pages/program.njk, pages/student-life.njk, pages/ui-kit.njk |
| [program-card.njk](src/templates/components/program-card.njk) | styles/components/program-card.css | pages/programs.njk, pages/ui-kit.njk |
| [structure-employees.njk](src/templates/components/structure-employees.njk) | styles/components/person-card.css | pages/detail-structure.njk, pages/ui-kit.njk |
| [structure-gallery.njk](src/templates/components/structure-gallery.njk) | styles/components/structure-gallery.css | pages/detail-structure.njk, pages/ui-kit.njk |
| [text-media.njk](src/templates/components/text-media.njk) | styles/components/text-media.css | pages/student-life.njk, pages/ui-kit.njk |
| [training-program-card.njk](src/templates/components/training-program-card.njk) | styles/components/training-program-card.css | pages/detail-structure.njk, pages/ui-kit.njk |
| [university-statistics.njk](src/templates/components/university-statistics.njk) | styles/components/university-statistics.css | pages/index.njk, pages/ui-kit.njk |
| [vacancy-card.njk](src/templates/components/vacancy-card.njk) | styles/components/vacancy-card.css | pages/ui-kit.njk, pages/vacancies.njk |
| [vacancy-conditions.njk](src/templates/components/vacancy-conditions.njk) | styles/pages/detail-vacancy.css | pages/detail-vacancy.njk, pages/ui-kit.njk |
| [vacancy-description.njk](src/templates/components/vacancy-description.njk) | styles/pages/detail-vacancy.css | pages/detail-vacancy.njk, pages/ui-kit.njk |
| [vacancy-intro.njk](src/templates/components/vacancy-intro.njk) | styles/pages/detail-vacancy.css | pages/detail-vacancy.njk, pages/ui-kit.njk |
| [vacancy-modal.njk](src/templates/components/vacancy-modal.njk) | styles/components/modal.css + form.css | pages/detail-vacancy.njk, pages/ui-kit.njk |

В `pages/` исходников остаётся компоновка страниц; базовые стили общих блоков находятся в `styles/components/`. Например, `styles/pages/detail-structure.css` может задавать позицию карточки внутри секции, но не содержит её базового оформления. Шапка, подвал и системные сервисы относятся к оболочке сайта и не размножаются произвольно в одном DOM.
