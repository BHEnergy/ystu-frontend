/* Раскрываемый поиск. Без JS иконка остаётся ссылкой на страницу поиска. */
(() => {
    document.querySelectorAll('.header').forEach((header, index) => {
        const links = () => [...header.querySelectorAll('a[href="search.html"]')];
        if (!links().length || header.querySelector('.header-search')) return;
        const form = document.createElement('form');
        form.id = `header-search-${index}`;
        form.className = 'header-search';
        form.hidden = true;
        form.action = 'search.html'; form.method = 'get'; form.setAttribute('role', 'search');
        form.innerHTML = '<input type="search" name="query" aria-label="Поиск по сайту" placeholder="Поиск по сайту" required><button type="submit" class="btn btn--blue">Найти</button><button type="button" class="header-search__close" aria-label="Закрыть поиск">×</button>';
        header.append(form);
        form.querySelector('input').name = 'q';
        let trigger;
        const close = (restore = true) => {
            form.hidden = true;
            links().forEach(link => link.setAttribute('aria-expanded', 'false'));
            if (restore) trigger?.focus({preventScroll:true});
        };
        links().forEach(link => {
            link.setAttribute('aria-controls', form.id); link.setAttribute('aria-expanded', 'false');
        });
        // Делегирование охватывает и ссылки, которые header.js клонирует позднее.
        header.addEventListener('click', event => {
            const link = event.target.closest('a[href="search.html"]');
            if (!link || !header.contains(link) || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
            event.preventDefault(); trigger = link;
            if (!form.hidden) return close();
            form.hidden = false;
            links().forEach(item => {
                item.setAttribute('aria-controls', form.id);
                item.setAttribute('aria-expanded', 'true');
            });
            form.querySelector('input').focus({preventScroll:true});
        });
        form.querySelector('.header-search__close').addEventListener('click', () => close());
        header.addEventListener('header:mobile-menu-close', () => close(false));
        header.addEventListener('keydown', event => { if (event.key === 'Escape' && !form.hidden) { event.stopPropagation(); close(); } });
        document.addEventListener('click', event => { if (!header.contains(event.target)) close(false); });
    });
    window.HeaderSearch = {};
})();
