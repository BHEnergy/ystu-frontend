(() => {
const initialized = new WeakSet();
const init = (scope = document) => {
const find = selector => [
    ...(scope.matches?.(selector) ? [scope] : []),
    ...scope.querySelectorAll(selector)
];
find('[data-ui~="dropdown--item"]').forEach((item, index) => {
    if (initialized.has(item)) return;
    const header = item.querySelector('[data-ui~="dropdown--header"]');
    const trigger = header?.querySelector('[data-ui~="dropdown--trigger"]');
    const content = item.querySelector('[data-ui~="dropdown--content"]');
    if (!header || !trigger || !content) return;
    initialized.add(item);
    if (!content.id) {
        let id = `accordion-panel-${index + 1}`;
        while (document.getElementById(id)) id += '-panel';
        content.id = id;
    }
    trigger.setAttribute('aria-controls', content.id);
    const initialExpanded = trigger.getAttribute('aria-expanded') === 'true';
    item.classList.toggle('open', initialExpanded);
    content.hidden = !initialExpanded;
    content.inert = !initialExpanded;
    let animation = null;
    header.addEventListener('click', () => {
        const expanded = trigger.getAttribute('aria-expanded') !== 'true';
        const startHeight = content.getBoundingClientRect().height;
        animation?.cancel();
        trigger.setAttribute('aria-expanded', String(expanded));
        item.classList.toggle('open', expanded);
        content.hidden = false;
        content.inert = !expanded;
        content.style.display = 'flow-root';
        const finish = () => {
            content.hidden = !expanded;
            content.style.removeProperty('display');
            content.style.removeProperty('overflow');
            animation = null;
        };
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) return finish();
        const endHeight = expanded ? content.getBoundingClientRect().height : 0;
        animation = content.animate(
            [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
            { duration: 280, easing: 'cubic-bezier(.2, .7, .3, 1)' }
        );
        content.style.overflow = 'hidden';
        animation.onfinish = finish;
    });
});

/* Общий disclosure: не зависит от страницы, классов оформления и количества экземпляров. */
find('[data-ui~="disclosure"]').forEach(details => {
    if (initialized.has(details)) return;
    const summary = details.querySelector('summary');
    if (!summary) return;
    initialized.add(details);
    let animation = null;
    let expanded = details.open;
    summary.setAttribute('aria-expanded', String(expanded));
    summary.addEventListener('click', event => {
        event.preventDefault();
        const start = details.getBoundingClientRect().height;
        animation?.cancel();
        expanded = animation ? !expanded : !details.open;
        summary.setAttribute('aria-expanded', String(expanded));
        details.open = true;
        const finish = () => {
            details.open = expanded;
            details.style.removeProperty('overflow');
            animation = null;
        };
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) return finish();
        const end = expanded ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height;
        details.style.overflow = 'hidden';
        animation = details.animate([{ height: `${start}px` }, { height: `${end}px` }], {
            duration: 280, easing: 'cubic-bezier(.2, .7, .3, 1)'
        });
        animation.onfinish = finish;
    });
});
};
window.Dropdown = { init };
init();
})();
