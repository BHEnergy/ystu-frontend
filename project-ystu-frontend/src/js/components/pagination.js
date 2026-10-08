/* Визуальная демонстрация пагинации. Выдачу данных подключает CMS. */
(() => {
    document.querySelectorAll('.pagination').forEach(container => {
        const links = [...container.querySelectorAll('.pagination__page')];
        if (!links.length) return;
        const last = Math.max(...links.map(link => Number(link.textContent.trim()) || 1));
        let current = Number(container.querySelector('[aria-current="page"]')?.textContent.trim()) || 1;
        const render = () => {
            const middleCount = Math.max(0, links.length - 2);
            const start = Math.max(2, Math.min(current - 1, last - middleCount));
            const numbers = links.length > 2
                ? [1, ...Array.from({length: middleCount}, (_, i) => start + i), last]
                : links.map((_, i) => i + 1);
            links.forEach((link, i) => {
                const value = numbers[i];
                link.textContent = value;
                const url = new URL(link.href, location.href);
                url.searchParams.set('page', value);
                link.href = url.pathname + url.search + url.hash;
                link.classList.toggle('current', value === current);
                if (value === current) link.setAttribute('aria-current', 'page');
                else link.removeAttribute('aria-current');
            });
            [['.pagination__button-prev', current - 1], ['.pagination__button-next', current + 1]].forEach(([selector, value]) => {
                const link = container.querySelector(selector);
                if (!link) return;
                link.setAttribute('aria-disabled', String(value < 1 || value > last));
                const url = new URL(link.href, location.href);
                url.searchParams.set('page', Math.max(1, Math.min(last, value)));
                link.href = url.pathname + url.search + url.hash;
            });
        };
        container.addEventListener('click', event => {
            const link = event.target.closest('a');
            if (!link || !container.contains(link) || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            if (link.getAttribute('aria-disabled') === 'true') return;
            const page = Number(new URL(link.href).searchParams.get('page'));
            if (!Number.isInteger(page) || page < 1 || page > last) return;
            current = page;
            render();
            container.dispatchEvent(new CustomEvent('pagination:change', {bubbles: true, detail: {page}}));
        });
        render();
    });
    window.Pagination = {};
})();
