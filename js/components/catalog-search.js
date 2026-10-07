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
    const search = (query) => {
        inputs.forEach((input) => { input.value = query; });
        const words = normalize(query).split(/\s+/).filter(Boolean);
        let count = 0;
        cards.forEach((card) => {
            const text = normalize(card.textContent);
            card.hidden = !words.every((word) => text.includes(word));
            if (!card.hidden) count++;
        });
        status.hidden = !words.length || count > 0;
        status.textContent = status.hidden ? '' : 'По вашему запросу ничего не найдено.';
    };
    const forms = new Set(inputs.map((input) => input.form).filter(Boolean));
    forms.forEach((form) => {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            search(form.querySelector('.catalog-search__input').value);
        });
        form.addEventListener('reset', () => search(''));
    });
    inputs.forEach((input) => input.addEventListener('search', () => {
        if (!input.value) search('');
    }));
});
