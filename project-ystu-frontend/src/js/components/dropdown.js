document.querySelectorAll('[data-ui~="dropdown--item"]').forEach((item, index) => {
    const header = item.querySelector('[data-ui~="dropdown--header"]');
    const trigger = header?.querySelector('[data-ui~="dropdown--trigger"]');
    const content = item.querySelector('[data-ui~="dropdown--content"]');
    if (!header || !trigger || !content) return;

    if (!content.id) {
        let id = `accordion-panel-${index + 1}`;
        while (document.getElementById(id)) id += '-panel';
        content.id = id;
    }
    trigger.setAttribute('aria-controls', content.id);
    const syncState = () => {
        const expanded = trigger.getAttribute('aria-expanded') === 'true';
        item.classList.toggle('open', expanded);
        content.hidden = !expanded;
    };
    syncState();
    // Нативная кнопка поддерживает Enter/Space; вся область заголовка также кликабельна.
    header.addEventListener('click', () => {
        trigger.setAttribute('aria-expanded', String(trigger.getAttribute('aria-expanded') !== 'true'));
        syncState();
    });
});
