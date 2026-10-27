/* Получаем все табы */
(() => {
const tabInitialized = new WeakSet();
const groupInitialized = new WeakSet();
const select = (scope, selector) => [...(scope.matches?.(selector) ? [scope] : []), ...scope.querySelectorAll(selector)];
const eventsReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const eventsTabAnimations = new Set();

eventsReducedMotion.addEventListener('change', () => {
    if (eventsReducedMotion.matches) {
        eventsTabAnimations.forEach((animation) => animation.finish());
    }
});

const fadeEventsTitles = async (items, keyframes, duration) => {
    if (eventsReducedMotion.matches || typeof items[0].animate !== 'function') {
        return;
    }

    const animations = items.map((item) => {
        const animation = item.animate(keyframes, { duration, easing: 'ease-out', fill: 'forwards' });
        eventsTabAnimations.add(animation);
        return animation;
    });

    await Promise.allSettled(animations.map((animation) => animation.finished));
    animations.forEach((animation) => {
        animation.cancel();
        eventsTabAnimations.delete(animation);
    });
};

const initTabButtons = (scope = document) => {
select(scope, '[data-ui~="tab"]').forEach((tab) => {
    if (tabInitialized.has(tab)) return;
    tabInitialized.add(tab);
    tab.addEventListener('click', async () => {
        const header = tab.closest('[data-ui~="events__header--fade"]');

        if (header?.hasAttribute('aria-busy')) {
            return;
        }

        const wrapper = tab.closest('[data-ui~="events__wrapper"]');
        if (!wrapper) return;
        const currentTab = wrapper.querySelector('[data-ui~="tab"][aria-pressed="true"]');
        if (currentTab && currentTab !== tab) {
            let clickTab = tab;
            const tabContainers = wrapper.querySelectorAll('[data-value="tab-container"]');

            if (header) {
                header.setAttribute('aria-busy', 'true');
                await fadeEventsTitles([clickTab, currentTab], [
                    { opacity: 1, transform: 'translateY(0)' },
                    { opacity: 0, transform: 'translateY(4px)' },
                ], 120);
            }

            clickTab.setAttribute('aria-pressed', 'true');
            currentTab.setAttribute('aria-pressed', 'false');
            clickTab.classList.add('active');
            clickTab.classList.remove('unactive');
            currentTab.classList.add('unactive');
            currentTab.classList.remove('active');
            tabContainers.forEach((tabContainer) => {
                const selected = tabContainer.dataset.tab === tab.dataset.tab;
                tabContainer.classList.toggle('active', selected);
                tabContainer.classList.toggle('unactive', !selected);
                tabContainer.setAttribute('aria-hidden', String(!selected));
            });
            tab.closest('[data-ui~="events__wrapper"]').dispatchEvent(new CustomEvent('content-tab:change', {detail: {tab: tab.dataset.tab}}));

            if (header) {
                clickTab.setAttribute('aria-pressed', 'true');
                currentTab.setAttribute('aria-pressed', 'false');
                await fadeEventsTitles([clickTab, currentTab], [
                    { opacity: 0, transform: 'translateY(4px)' },
                    { opacity: 1, transform: 'translateY(0)' },
                ], 180);
                header.removeAttribute('aria-busy');
            }
        }
    })
});

};

/* Общая логика фильтров: повторный клик не сбрасывает выбранную кнопку.
   CMS может передать категории через data-filter / data-category. */
const initContentFilter = (group, selector, selectedClass, items, categoryOf) => {
    const controls = [...group.querySelectorAll(selector)];
    if (!controls.length || groupInitialized.has(group)) return;
    groupInitialized.add(group);
    const status = document.createElement('p');
    status.className = 'content-filter-status';
    status.setAttribute('data-ui', 'content-filter-status');
    status.setAttribute('role', 'status');
    status.hidden = true;
    const newsPanel = group.matches('[data-ui~="events__tags"]')
        ? group.closest('[data-ui~="events__wrapper"]')?.querySelector('[data-ui~="events__container"][data-tab="news"]')
        : null;
    if (newsPanel) newsPanel.prepend(status);
    else group.insertAdjacentElement('afterend', status);
    const activate = (control, initial = false) => {
        controls.forEach((item) => {
            const selected = item === control;
            item.classList.toggle(selectedClass, selected);
            item.setAttribute('aria-pressed', String(selected));
        });
        if (!items.length) return;
        const category = control.dataset.filter || control.textContent.trim();
        let visible = 0;
        items.forEach((item) => {
            const categories = categoryOf(item);
            item.hidden = category !== 'all' && category !== 'Все' && !categories.includes(category);
            item.dataset.filterHidden = String(item.hidden);
            if (!item.hidden) visible++;
        });
        status.hidden = visible > 0;
        status.textContent = visible ? '' : 'В этом разделе пока нет материалов.';
        if (newsPanel) group.closest('[data-ui~="events__wrapper"]').dispatchEvent(new CustomEvent('content-filter:change', {detail: {container: newsPanel, initial}}));
    };
    controls.forEach((control) => {
        if (control.tagName !== 'BUTTON') {
            control.setAttribute('role', 'button');
            control.tabIndex = 0;
            control.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    control.click();
                }
            });
        }
        control.addEventListener('click', () => activate(control));
    });
    activate(controls.find((item) => item.getAttribute('aria-pressed') === 'true') || controls[0], true);
};

const initFilters = (scope = document) => {
select(scope, '[data-ui~="structure__tags"]').forEach((group) => {
    const scope = group.closest('[data-ui~="structure__container"]') || group.parentElement;
    initContentFilter(group, '[data-filter]', 'select', [...scope.querySelectorAll('[data-ui~="structure__institutes"]')],
        (item) => [item.dataset.category || 'Институты']);
});

select(scope, '[data-ui~="structure-detail__tabs"]').forEach((group) => {
    const scope = group.closest('[data-ui~="structure-detail__section"]') || group.parentElement;
    initContentFilter(group, 'button', 'select', [...scope.querySelectorAll('[data-ui~="training-program-card"]')],
        (item) => [item.dataset.category || item.querySelector('[data-ui~="training-program-card__tag"]')?.textContent.trim()]);
});

select(scope, '[data-ui~="events__tags"]').forEach((group) => {
    const scope = group.closest('[data-ui~="events__wrapper"]');
    const container = scope?.querySelector('[data-ui~="events__container"][data-tab="news"]');
    initContentFilter(group, '[data-filter]', 'current', [...(container?.querySelectorAll('[data-ui~="news__card"]') || [])],
        (item) => item.dataset.category ? item.dataset.category.split(' ') :
            [...item.querySelectorAll('[data-ui~="news__tag"]')].map((tag) => '#' + tag.textContent.trim()));
});
};
const init = (scope = document) => { initTabButtons(scope); initFilters(scope); };
window.Tabs = { init };
init();
})();
