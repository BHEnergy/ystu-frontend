/* Демонстрационная выдача; данные и серверные URL подключаются при интеграции. */
(() => {
    const parameters = () => new URLSearchParams(location.search);
    document.querySelectorAll('.pagination').forEach(container => {
        const panel = container.closest('[data-pagination-size]');
        const wrapper = panel?.closest('.events__wrapper');
        const cards = panel ? [...panel.querySelectorAll('.news__card, .event__card')] : [];
        const size = Math.max(1, Number(panel?.dataset.paginationSize) || 6);
        const links = [...container.querySelectorAll('.pagination__page')];
        if (!links.length) return;
        const fallbackLast = Math.max(...links.map(link => Number(link.textContent.trim()) || 1));
        const eligible = () => cards.filter(card => card.dataset.filterHidden !== 'true');
        const total = () => cards.length ? Math.max(1, Math.ceil(eligible().length / size)) : fallbackLast;
        const fromUrl = () => Math.max(1, Math.min(total(), Number(parameters().get('page')) || 1));
        let current = Number.isInteger(fromUrl()) ? fromUrl() : 1;
        const status = document.createElement('p');
        status.className = 'visually-hidden';
        status.setAttribute('role', 'status');
        container.after(status);
        const href = page => {
            const url = new URL(location.href);
            url.searchParams.set('page', page);
            if (panel) url.searchParams.set('tab', panel.dataset.tab);
            return url.pathname + url.search + url.hash;
        };
        const updateUrl = (push = false) => {
            if (panel && !panel.classList.contains('active')) return;
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
                panel.querySelectorAll('.events__content').forEach(grid => {
                    grid.hidden = ![...grid.querySelectorAll('.news__card, .event__card')].some(card => !card.hidden);
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
            const ellipsis = container.querySelector('.pagination__ellipsis');
            if (ellipsis) ellipsis.hidden = last <= links.length || numbers.at(-2) === last - 1;
            [['.pagination__button-prev', current - 1], ['.pagination__button-next', current + 1]].forEach(([selector, page]) => {
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
            const page = Number(new URL(link.href).searchParams.get('page'));
            if (!Number.isInteger(page) || page < 1 || page > total()) return;
            current = page;
            render(true);
            updateUrl(true);
            if (link.hidden) container.querySelector('[aria-current="page"]')?.focus({preventScroll: true});
            container.dispatchEvent(new CustomEvent('pagination:change', {bubbles: true, detail: {page}}));
        });
        wrapper?.addEventListener('content-filter:change', event => {
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
            current = Number.isInteger(fromUrl()) ? fromUrl() : 1;
            const tab = parameters().get('tab') || 'news';
            if (wrapper && panel.dataset.tab === tab) wrapper.querySelector(`.tab[data-tab="${tab}"]`)?.click();
            render(true);
        });
        render();
        if (panel && parameters().get('tab') === panel.dataset.tab) wrapper.querySelector(`.tab[data-tab="${panel.dataset.tab}"]`)?.click();
        if (parameters().has('page') && (!panel || !parameters().has('tab') || parameters().get('tab') === panel.dataset.tab)) updateUrl();
    });
    window.Pagination = {};
})();
