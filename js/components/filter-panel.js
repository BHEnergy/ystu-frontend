(() => {
    const panels = document.querySelectorAll('[data-filter-panel]');

    if (!panels.length) {
        window.FilterPanel = {};
        return;
    }

    const controllers = [];

    panels.forEach((panel) => {
        const panelId = panel.id;
        const openButtons = document.querySelectorAll(
            `[data-open-filter-panel="${panelId}"]`
        );
        const form = panel.querySelector('form');

        if (!panelId || !openButtons.length) {
            return;
        }

        const setOpen = (isOpen) => {
            panel.classList.toggle('is-open', isOpen);
            panel.setAttribute('aria-hidden', String(!isOpen));
            openButtons.forEach((button) => {
                button.setAttribute('aria-expanded', String(isOpen));
            });
        };

        openButtons.forEach((button) => {
            button.insertAdjacentElement('afterend', panel);
            button.addEventListener('click', () => {
                setOpen(!panel.classList.contains('is-open'));
            });
        });

        form?.addEventListener('submit', () => setOpen(false));

        controllers.push({ panel, setOpen });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') {
            return;
        }

        controllers.forEach(({ panel, setOpen }) => {
            if (panel.classList.contains('is-open')) {
                setOpen(false);
            }
        });
    });

    window.FilterPanel = { controllers };
})();
