/* Обычный HTML редактора не требует специальных классов у таблиц. */
(() => {
    const prepare = (scope = document) => scope.querySelectorAll('[data-ui~="wyswig"] table').forEach(table => {
        if (table.parentElement.classList.contains('wyswig__table-scroll')) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'wyswig__table-scroll';
    wrapper.setAttribute('data-ui', wrapper.className);
        wrapper.tabIndex = 0;
        wrapper.setAttribute('role', 'region');
        wrapper.setAttribute('aria-label', table.caption?.textContent.trim() || 'Таблица — горизонтальная прокрутка');
        table.before(wrapper); wrapper.append(table);
    });
    prepare();
    document.querySelectorAll('[data-ui~="wyswig"]').forEach(container => new MutationObserver(() => prepare()).observe(container, { childList: true, subtree: true }));
    window.Content = { prepare };
})();
