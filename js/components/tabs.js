/* Получаем все табы */
let tabs = document.querySelectorAll('.tab');
tabs.forEach( (tab) => {
    tab.addEventListener('click', () => {
        if(tab.classList.contains('unactive')) {
            let clickTab = tab;
            let currentTab = tab.closest('.events__wrapper').querySelector('.active.tab');
            let activeTabContainer = tab.closest('.events__wrapper').querySelectorAll('.active[data-value="tab-container"]');
            let selectTabContainer = tab.closest('.events__wrapper').querySelectorAll(`[data-value="tab-container"][data-tab="${tab.dataset.tab}"]`);
            
            clickTab.classList.replace('unactive', 'active');
            currentTab.classList.replace('active', 'unactive');
            activeTabContainer.forEach( (tabContainer) => {
                tabContainer.classList.replace('active', 'unactive');
            });
            selectTabContainer.forEach( (tabContainer) => {
                tabContainer.classList.replace('unactive', 'active');
            });
        }
    })
});