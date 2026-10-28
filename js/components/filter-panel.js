(() => {
    const controllers = [];
    const initialized = new WeakSet();
    const init = (scope = document) => {
    const panels = [...(scope.matches?.('[data-filter-panel]') ? [scope] : []), ...scope.querySelectorAll('[data-filter-panel]')];
    panels.forEach((panel) => {
        if (initialized.has(panel)) return;
        const panelId = panel.id;
        const owner = panel.closest('[data-ui~="listing-page"]') || (scope === panel ? panel.parentElement : scope);
        const openButtons = owner.querySelectorAll(`[data-open-filter-panel="${CSS.escape(panelId)}"]`
        );
        const closeButtons = panel.querySelectorAll('[data-close-filter-panel]');
        const form = panel.querySelector('form');

        if (!panelId || !openButtons.length) {
            return;
        }
        initialized.add(panel);
        let openingButton = openButtons[0];

        const setOpen = (isOpen, restoreFocus = false) => {
            panel.classList.toggle('is-open', isOpen);
            panel.setAttribute('aria-hidden', String(!isOpen));
            openButtons.forEach((button) => {
                button.setAttribute('aria-expanded', String(isOpen));
                button.closest('[data-ui~="listing-page__mobile-tools"]')?.classList.toggle(
                    'is-filter-open',
                    isOpen,
                );
            });
            if (!isOpen && restoreFocus) {
                openingButton?.focus();
            }
        };

        openButtons.forEach((button) => {
            button.insertAdjacentElement('afterend', panel);
            button.addEventListener('click', () => {
                openingButton = button;
                setOpen(!panel.classList.contains('is-open'));
            });
        });

        closeButtons.forEach((button) => {
            button.addEventListener('click', () => {
                setOpen(false, true);
            });
        });

        form?.addEventListener('submit', () => setOpen(false));

        controllers.push({ panel, setOpen });
    });
    };

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') {
            return;
        }

        controllers.forEach(({ panel, setOpen }) => {
            if (panel.classList.contains('is-open')) {
                setOpen(false, panel.contains(document.activeElement));
            }
        });
    });

    window.FilterPanel = { controllers, init };
    init();
})();
