/* Получаем все табы */
let tabs = document.querySelectorAll('.tab');
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

tabs.forEach( (tab) => {
    tab.addEventListener('click', async () => {
        const header = tab.closest('.events__header--fade');

        if (header?.hasAttribute('aria-busy')) {
            return;
        }

        if(tab.classList.contains('unactive')) {
            let clickTab = tab;
            let currentTab = tab.closest('.events__wrapper').querySelector('.active.tab');
            let activeTabContainer = tab.closest('.events__wrapper').querySelectorAll('.active[data-value="tab-container"]');
            let selectTabContainer = tab.closest('.events__wrapper').querySelectorAll(`[data-value="tab-container"][data-tab="${tab.dataset.tab}"]`);

            if (header) {
                header.setAttribute('aria-busy', 'true');
                await fadeEventsTitles([clickTab, currentTab], [
                    { opacity: 1, transform: 'translateY(0)' },
                    { opacity: 0, transform: 'translateY(4px)' },
                ], 120);
            }

            clickTab.classList.replace('unactive', 'active');
            currentTab.classList.replace('active', 'unactive');
            activeTabContainer.forEach( (tabContainer) => {
                tabContainer.classList.replace('active', 'unactive');
            });
            selectTabContainer.forEach( (tabContainer) => {
                tabContainer.classList.replace('unactive', 'active');
            });
            tab.closest('.events__wrapper').dispatchEvent(new CustomEvent('content-tab:change', {detail: {tab: tab.dataset.tab}}));

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

/* Общая логика фильтров: повторный клик не сбрасывает выбранную кнопку.
   CMS может передать категории через data-filter / data-category. */
const initContentFilter = (group, selector, selectedClass, items, categoryOf) => {
    const controls = [...group.querySelectorAll(selector)];
    if (!controls.length) return;
    const status = document.createElement('p');
    status.className = 'content-filter-status';
    status.setAttribute('role', 'status');
    status.hidden = true;
    const newsPanel = group.matches('.events__tags')
        ? group.closest('.events__wrapper')?.querySelector('.events__container[data-tab="news"]')
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
        if (newsPanel) group.closest('.events__wrapper').dispatchEvent(new CustomEvent('content-filter:change', {detail: {container: newsPanel, initial}}));
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
    activate(controls.find((item) => item.classList.contains(selectedClass)) || controls[0], true);
};

document.querySelectorAll('.structure__tags').forEach((group) => {
    const scope = group.closest('.structure__container') || group.parentElement;
    initContentFilter(group, '.tag', 'select', [...scope.querySelectorAll('.structure__institutes')],
        (item) => [item.dataset.category || 'Институты']);
});

document.querySelectorAll('.structure-detail__tabs').forEach((group) => {
    const scope = group.closest('.structure-detail__section') || group.parentElement;
    initContentFilter(group, '.structure-detail__tab', 'select', [...scope.querySelectorAll('.training-program-card')],
        (item) => [item.dataset.category || item.querySelector('.training-program-card__tag')?.textContent.trim()]);
});

document.querySelectorAll('.events__tags').forEach((group) => {
    const scope = group.closest('.events__wrapper');
    const container = scope?.querySelector('.events__container[data-tab="news"]');
    initContentFilter(group, '.events__tag', 'current', [...(container?.querySelectorAll('.news__card') || [])],
        (item) => item.dataset.category ? item.dataset.category.split(' ') :
            [...item.querySelectorAll('.news__tag')].map((tag) => '#' + tag.textContent.trim()));
});
