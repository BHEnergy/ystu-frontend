(() => {
    const panel = document.querySelector('[data-vacancy-filter-panel]');

    if (!panel) {
        return;
    }

    const openButtons = document.querySelectorAll('[data-open-vacancy-filters]');
    const closeButtons = panel.querySelectorAll('[data-close-vacancy-filters]');
    const drawer = panel.querySelector('.mobile-filter-panel__drawer');
    const form = panel.querySelector('form');

    const setOpen = (isOpen) => {
        if (isOpen) {
            const trigger = document.querySelector('[data-open-vacancy-filters]');
            const triggerRect = trigger?.getBoundingClientRect();
            const drawerWidth = Math.min(390, window.innerWidth);
            const drawerLeft = window.innerWidth - drawerWidth;

            if (triggerRect) {
                panel.style.setProperty('--filter-origin-top', `${triggerRect.top}px`);
                panel.style.setProperty('--filter-origin-right', `${Math.max(0, window.innerWidth - triggerRect.right)}px`);
                panel.style.setProperty('--filter-origin-bottom', `${Math.max(0, window.innerHeight - triggerRect.bottom)}px`);
                panel.style.setProperty('--filter-origin-left', `${Math.max(0, triggerRect.left - drawerLeft)}px`);
            }
        }

        panel.classList.toggle('is-open', isOpen);
        panel.setAttribute('aria-hidden', String(!isOpen));
        document.body.classList.toggle('has-open-panel', isOpen);
        openButtons.forEach((button) => button.setAttribute('aria-expanded', String(isOpen)));

        if (isOpen) {
            panel.querySelector('button, input, summary')?.focus();
        }
    };

    openButtons.forEach((button) => {
        button.addEventListener('click', () => setOpen(true));
    });

    closeButtons.forEach((button) => {
        button.addEventListener('click', () => setOpen(false));
    });

    form?.addEventListener('submit', (event) => {
        event.preventDefault();
        setOpen(false);
    });

    panel.addEventListener('click', (event) => {
        if (!drawer.contains(event.target)) {
            setOpen(false);
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && panel.classList.contains('is-open')) {
            setOpen(false);
        }
    });
})();
