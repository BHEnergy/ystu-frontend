/* Поиск по карточкам демонстрационной страницы. Серверный поиск подключается в CMS. */
document.querySelectorAll('.listing-page').forEach((page) => {
    const results = page.querySelector('.listing-page__results');
    if (!results) return;
    const cards = [...results.querySelectorAll('.program-card, .vacancy-card')];
    const inputs = [...page.querySelectorAll('.catalog-search__input')];
    const status = document.createElement('p');
    status.className = 'catalog-search-status';
    status.setAttribute('role', 'status');
    status.hidden = true;
    results.insertAdjacentElement('beforebegin', status);
    const normalize = (value) => value.trim().toLocaleLowerCase('ru').replace(/ё/g, 'е');
    const filterForms = [...page.querySelectorAll('form')].filter(form => form.querySelector('input[type="checkbox"], input[type="radio"]'));
    let applied = new Map();
    const syncControls = () => filterForms.forEach(form => {
        form.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(input => {
            input.checked = (applied.get(input.name.replace(/\[\]$/, '')) || []).includes(input.value);
        });
    });
    const search = (query) => {
        inputs.forEach((input) => { input.value = query; });
        const words = normalize(query).split(/\s+/).filter(Boolean);
        let count = 0;
        cards.forEach((card) => {
            const text = normalize(card.textContent);
            let filters = {};
            try { filters = JSON.parse(card.dataset.catalogFilters || '{}'); } catch { /* Неизвестные данные не ломают каталог. */ }
            card.hidden = !words.every((word) => text.includes(word)) || ![...applied].every(([name, values]) =>
                !values.length || values.some(value => (filters[name] || []).includes(value)));
            if (!card.hidden) count++;
        });
        status.hidden = count > 0;
        status.textContent = status.hidden ? '' : 'По вашему запросу ничего не найдено.';
    };
    const forms = new Set([...inputs.map((input) => input.form).filter(Boolean), ...filterForms]);
    forms.forEach((form) => {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            if (filterForms.includes(form)) {
                applied = new Map();
                form.querySelectorAll('input:checked').forEach(input => {
                    const name = input.name.replace(/\[\]$/, '');
                    applied.set(name, [...(applied.get(name) || []), input.value]);
                });
                syncControls();
            }
            search(form.querySelector('.catalog-search__input')?.value ?? inputs[0]?.value ?? '');
        });
        form.addEventListener('reset', event => {
            event.preventDefault();
            applied.clear(); syncControls(); search('');
            const url = new URL(location.href);
            ['query', ...filterForms.flatMap(f => [...f.elements].map(el => el.name).filter(Boolean))].forEach(name => url.searchParams.delete(name));
            history.replaceState(null, '', url);
        });
    });
    inputs.forEach((input) => input.addEventListener('search', () => {
        if (!input.value) search('');
    }));
    // Начальная демонстрация показывает полный набор без скрытых предвыбранных условий.
    syncControls();
});
