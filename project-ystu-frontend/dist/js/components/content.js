/* Обычный HTML редактора не требует специальных классов у таблиц. */
(() => {
    const prepare = (scope = document) => scope.querySelectorAll('[data-ui~="wyswig"] table').forEach(table => {
        const wrapped = table.parentElement.classList.contains('wyswig__table-scroll');
        const wrapper = wrapped ? table.parentElement : document.createElement('div');
        if (!wrapped) {
            wrapper.className = 'wyswig__table-scroll';
            wrapper.setAttribute('data-ui', wrapper.className);
            wrapper.tabIndex = 0;
            wrapper.setAttribute('role', 'region');
            wrapper.setAttribute('aria-label', table.caption?.textContent.trim() || 'Таблица — горизонтальная прокрутка');
            table.before(wrapper);
        }
        const caption = table.caption;
        if (caption) {
            const title = document.createElement('div');
            title.className = 'wyswig__table-caption';
            let index = 1;
            while (document.getElementById(`cms-table-caption-${index}`)) index++;
            title.id = `cms-table-caption-${index}`;
            title.append(...caption.childNodes);
            caption.remove();
            const group = document.createElement('div');
            group.className = 'wyswig__table';
            wrapper.before(group);
            group.append(title, wrapper);
            wrapper.removeAttribute('aria-label');
            wrapper.setAttribute('aria-labelledby', title.id);
            if (!table.hasAttribute('aria-label') && !table.hasAttribute('aria-labelledby')) {
                table.setAttribute('aria-labelledby', title.id);
            }
        }
        if (!wrapped) wrapper.append(table);
    });
    prepare();
    document.querySelectorAll('[data-ui~="wyswig"]').forEach(container => new MutationObserver(() => prepare()).observe(container, { childList: true, subtree: true }));
    window.Content = { prepare };
})();
