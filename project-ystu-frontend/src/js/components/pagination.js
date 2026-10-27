/* Демонстрационная выдача; данные и серверные URL подключаются при интеграции. */
(() => {
    if (window.Pagination?.init) { window.Pagination.init(); return; }
    const instances = new WeakMap();
    const ownerNamespaces = new WeakMap();
    const reservedNamespaces = new Set();
    let primaryOwner = null;
    let nextNamespace = 2;
    let restoringHistory = false;
    const parameters = () => new URLSearchParams(location.search);
    const find = (scope, selector) => [
        ...(scope.matches?.(selector) ? [scope] : []), ...scope.querySelectorAll(selector),
    ];
    const namespaceOf = (container, panel, wrapper) => {
        const namedOwner = container.closest('[data-pagination-key], [data-pagination-namespace]');
        const owner = namedOwner || wrapper || panel || container;
        if (ownerNamespaces.has(owner)) return ownerNamespaces.get(owner);
        let namespace = namedOwner?.dataset.paginationKey ?? namedOwner?.dataset.paginationNamespace;
        if (!namespace && !primaryOwner) {
            primaryOwner = owner;
            namespace = '';
        } else if (!namespace || reservedNamespaces.has(namespace)) {
            do { namespace = `listing-${nextNamespace++}`; } while (reservedNamespaces.has(namespace));
        }
        reservedNamespaces.add(namespace);
        ownerNamespaces.set(owner, namespace);
        return namespace;
    };
    const init = (scope = document) => find(scope, '[data-ui~="pagination"]').forEach(container => {
        if (instances.has(container)) { instances.get(container).refresh(); return; }
        const panel = container.closest('[data-pagination-size]');
        const wrapper = panel?.closest('[data-ui~="events__wrapper"]');
        const cardSelector = '[data-ui~="news__card"], [data-ui~="event__card"], [data-ui~="pagination-item"]';
        let cards = panel ? [...panel.querySelectorAll(cardSelector)] : [];
        const size = Math.max(1, Number(panel?.dataset.paginationSize) || 6);
        const links = [...container.querySelectorAll('[data-ui~="pagination__page"]')];
        if (!links.length) return;
        const namespace = namespaceOf(container, panel, wrapper);
        const pageKey = namespace ? `${namespace}-page` : 'page';
        const tabKey = namespace ? `${namespace}-tab` : 'tab';
        const syncUrl = container.closest('[data-pagination-url]')?.dataset.paginationUrl !== 'off';
        let restoring = false;
        const fallbackLast = Math.max(...links.map(link => Number(link.textContent.trim()) || 1));
        const eligible = () => cards.filter(card => card.dataset.filterHidden !== 'true');
        const total = () => cards.length ? Math.max(1, Math.ceil(eligible().length / size)) : fallbackLast;
        const fromUrl = () => syncUrl ? Math.max(1, Math.min(total(), Number(parameters().get(pageKey)) || 1)) : 1;
        let current = Number.isInteger(fromUrl()) ? fromUrl() : 1;
        const status = document.createElement('p');
        status.className = 'visually-hidden';
        status.setAttribute('data-ui', 'pagination-status');
        status.setAttribute('role', 'status');
        container.after(status);
        const href = page => {
            const url = new URL(location.href);
            url.searchParams.set(pageKey, page);
            if (wrapper && panel?.dataset.tab) url.searchParams.set(tabKey, panel.dataset.tab);
            return url.pathname + url.search + url.hash;
        };
        const updateUrl = (push = false) => {
            if (!syncUrl || restoring || restoringHistory || !container.isConnected) return;
            if (panel) {
                const selectedTab = wrapper?.querySelector('[data-ui~="tab"][aria-pressed="true"]');
                if (wrapper ? selectedTab?.dataset.tab !== panel.dataset.tab : panel.getAttribute('aria-hidden') === 'true') return;
            }
            const target = href(current);
            if (target === location.pathname + location.search + location.hash) return;
            history[push ? 'pushState' : 'replaceState'](null, '', target);
        };
        const render = (announce = false) => {
            const last = total();
            current = Math.min(current, last);
            const shown = eligible();
            if (cards.length) {
                const visible = new Set(shown.slice((current - 1) * size, current * size));
                cards.forEach(card => { card.hidden = !visible.has(card); });
                panel.querySelectorAll('[data-ui~="events__content"]').forEach(grid => {
                    grid.hidden = ![...grid.querySelectorAll(cardSelector)].some(card => !card.hidden);
                });
            }
            const middleCount = Math.max(0, links.length - 2);
            const start = Math.max(2, Math.min(current - 1, last - middleCount));
            const numbers = last <= links.length ? Array.from({length: last}, (_, i) => i + 1)
                : [1, ...Array.from({length: middleCount}, (_, i) => start + i), last];
            links.forEach((link, index) => {
                const number = numbers[index];
                link.hidden = number === undefined;
                link.classList.toggle('current', number === current);
                if (number === current) link.setAttribute('aria-current', 'page');
                else link.removeAttribute('aria-current');
                if (number === undefined) return;
                link.textContent = number;
                link.href = href(number);
            });
            const ellipsis = container.querySelector('[data-ui~="pagination__ellipsis"]');
            if (ellipsis) ellipsis.hidden = last <= links.length || numbers.at(-2) === last - 1;
            [['[data-ui~="pagination-prev"]', current - 1], ['[data-ui~="pagination-next"]', current + 1]].forEach(([selector, page]) => {
                const link = container.querySelector(selector);
                if (!link) return;
                link.setAttribute('aria-disabled', String(page < 1 || page > last));
                link.href = href(Math.max(1, Math.min(last, page)));
            });
            container.hidden = cards.length > 0 && shown.length === 0;
            if (announce) status.textContent = `Страница ${current} из ${last}.`;
        };
        container.addEventListener('click', event => {
            const link = event.target.closest('a');
            if (!link || !container.contains(link) || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            if (link.getAttribute('aria-disabled') === 'true') return;
            const page = Number(new URL(link.href).searchParams.get(pageKey));
            if (!Number.isInteger(page) || page < 1 || page > total()) return;
            current = page;
            render(true);
            updateUrl(true);
            if (link.hidden) container.querySelector('[aria-current="page"]')?.focus({preventScroll: true});
            container.dispatchEvent(new CustomEvent('pagination:change', {bubbles: true, detail: {page, namespace}}));
        });
        (wrapper || panel)?.addEventListener('content-filter:change', event => {
            if (event.detail.container !== panel) return;
            if (!event.detail.initial) current = 1;
            render(true);
            updateUrl();
        });
        wrapper?.addEventListener('content-tab:change', () => {
            render();
            updateUrl(true);
        });
        window.addEventListener('popstate', () => {
            if (!syncUrl || !container.isConnected) return;
            restoringHistory = true;
            queueMicrotask(() => { restoringHistory = false; });
            restoring = true;
            current = Number.isInteger(fromUrl()) ? fromUrl() : 1;
            const tab = parameters().get(tabKey) || 'news';
            if (wrapper && panel.dataset.tab === tab) {
                [...wrapper.querySelectorAll('[data-ui~="tab"]')].find(control => control.dataset.tab === tab)?.click();
            }
            render(true);
            restoring = false;
        });
        instances.set(container, {
            refresh() {
                cards = panel ? [...panel.querySelectorAll(cardSelector)] : [];
                render();
            },
        });
        render();
        const tab = parameters().get(tabKey);
        if (syncUrl && wrapper && tab === panel.dataset.tab) {
            [...wrapper.querySelectorAll('[data-ui~="tab"]')].find(control => control.dataset.tab === tab)?.click();
        }
        if (syncUrl && parameters().has(pageKey) && (!panel || !tab || tab === panel.dataset.tab)) updateUrl();
    });
    window.Pagination = { init };
    init();
})();
