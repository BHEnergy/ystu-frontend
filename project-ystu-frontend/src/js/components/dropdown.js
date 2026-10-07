document.querySelectorAll('.dropdown--item').forEach((item, index) => {
    const header = item.querySelector('.dropdown--header');
    const trigger = header?.querySelector('.dropdown--trigger');
    const content = item.querySelector('.dropdown--content');
    if (!header || !trigger || !content) return;

    if (!content.id) {
        let id = `accordion-panel-${index + 1}`;
        while (document.getElementById(id)) id += '-panel';
        content.id = id;
    }
    trigger.setAttribute('aria-controls', content.id);
    const syncState = () => {
        const expanded = item.classList.contains('open');
        trigger.setAttribute('aria-expanded', String(expanded));
        content.hidden = !expanded;
    };
    syncState();
    // Нативная кнопка поддерживает Enter/Space; вся область заголовка также кликабельна.
    header.addEventListener('click', () => {
        item.classList.toggle('open');
        syncState();
    });
});
