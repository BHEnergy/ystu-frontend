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

/* Получаем все тэги */
let tags = document.querySelectorAll('.tag');
tags.forEach( (tag) => {
    tag.addEventListener('click', () => {
        let clickTag = tag;
        let currentTag = tag.closest('.structure__tags').querySelector('.tag.select');

        clickTag.classList.add('select');
        currentTag.classList.remove('select');
    })
});

/* Табы структуры */
let structureTabs = document.querySelectorAll('.structure-detail__tab');
structureTabs.forEach( (tab) => {
    tab.addEventListener('click', () => {
        let clickTab = tab;
        let currentTab = tab.closest('.structure-detail__tabs').querySelector('.select');

        clickTab.classList.add('select');
        currentTab.classList.remove('select');
    })
});

/* Получаем все тэги */
let eventsTags = document.querySelectorAll('.events__tag');
eventsTags.forEach( (tag) => {
    tag.addEventListener('click', () => {
        let clickTag = tag;
        let currentTag = tag.closest('.events__tags').querySelector('.current');

        clickTag.classList.add('current');
        currentTag.classList.remove('current');
    })
});
