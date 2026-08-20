(() => {
    const header = document.querySelector('.header');

    if (!header) {
        window.Header = {};
        return;
    }

    const headerWrapper = header.querySelector('.header__wrapper') || header;
    const informationBanner = document.querySelector('.information-banner');
    let frameId = 0;

    const updateHeaderPosition = () => {
        const bannerBottom = informationBanner
            ? Math.max(0, informationBanner.getBoundingClientRect().bottom)
            : 0;

        document.documentElement.style.setProperty('--header-top', `${bannerBottom}px`);
        header.classList.toggle(
            'header--scrolled',
            window.scrollY > (informationBanner?.offsetHeight || 0),
        );
        frameId = 0;
    };

    const requestPositionUpdate = () => {
        if (!frameId) {
            frameId = window.requestAnimationFrame(updateHeaderPosition);
        }
    };

    const resizeObserver = new ResizeObserver(() => {
        const headerHeight = headerWrapper.getBoundingClientRect().height;

        document.documentElement.style.setProperty(
            '--header-height',
            `${headerHeight + 30}px`,
        );
        document.documentElement.style.setProperty('--header-panel-height', `${headerHeight}px`);
        requestPositionUpdate();
    });

    resizeObserver.observe(headerWrapper);
    window.addEventListener('scroll', requestPositionUpdate, { passive: true });
    window.addEventListener('resize', requestPositionUpdate);
    updateHeaderPosition();

    window.Header = {
        update: updateHeaderPosition,
    };


    /* Кнопка раскрытия меню */
    const openBtn = header.querySelector('[data-trigger="open-menu"]');
    const megaMenu = header.querySelector('.mega-menu');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileMenuMedia = window.matchMedia('(max-width: 768px)');

    if (openBtn && !openBtn.querySelector('.btn__menu-label')) {
        const labelNode = [...openBtn.childNodes].find(
            (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim(),
        );

        if (labelNode) {
            const label = document.createElement('span');
            label.className = 'btn__menu-label';
            label.textContent = labelNode.textContent.trim();
            labelNode.replaceWith(label);
        }
    }

    if (openBtn && megaMenu) {
        const menuItems = megaMenu.querySelectorAll(
            '.mega-menu__primary > a, .mega-menu__section, .mega-menu__additional > a',
        );
        const navbarPanel = header.querySelector('.navbar__panel');
        const mobileTools = document.createElement('div');

        mobileTools.className = 'header__mobile-tools';
        mobileTools.setAttribute('aria-label', 'Сервисы сайта');

        if (navbarPanel) {
            [...navbarPanel.children].forEach((item) => {
                mobileTools.append(item.cloneNode(true));
            });
        }

        openBtn.before(mobileTools);

        const submenuLinks = [...megaMenu.querySelectorAll('[data-menu-section]')];
        const submenuPanels = [...megaMenu.querySelectorAll('[data-menu-panel]')];

        const getTextRect = (link) => {
            const range = document.createRange();

            range.selectNodeContents(link);
            const textRect = range.getBoundingClientRect();
            range.detach();

            return textRect;
        };

        const updateTextHighlight = (link) => {
            const textWidth = Math.ceil(getTextRect(link).width) + 8;

            link.style.setProperty('--mega-menu-text-width', `${textWidth}px`);
        };

        const isTextClick = (link, event) => {
            const textRect = getTextRect(link);

            return event.clientX >= textRect.left
                && event.clientX <= textRect.right
                && event.clientY >= textRect.top
                && event.clientY <= textRect.bottom;
        };

        const resetSubmenu = () => {
            megaMenu.classList.remove('mega-menu--submenu-open');
            submenuLinks.forEach((link) => link.setAttribute('aria-expanded', 'false'));
            submenuPanels.forEach((panel) => {
                panel.classList.remove('is-open');
                panel.setAttribute('aria-hidden', String(mobileMenuMedia.matches));
            });
            submenuLinks.forEach((link) => link.classList.remove('is-active'));
        };

        const openSubmenu = (trigger, panel) => {
            resetSubmenu();
            trigger.classList.add('is-active');
            updateTextHighlight(trigger);
            trigger.setAttribute('aria-expanded', 'true');
            panel.classList.add('is-open');
            panel.setAttribute('aria-hidden', 'false');
            panel.scrollTop = 0;

            if (mobileMenuMedia.matches) {
                megaMenu.classList.add('mega-menu--submenu-open');
            }
        };

        submenuPanels.forEach((panel, index) => {
            const sectionName = panel.dataset.menuPanel;
            const trigger = submenuLinks.find(
                (link) => link.dataset.menuSection === sectionName,
            );

            panel.id ||= `mega-menu-panel-${sectionName || index}`;
            panel.setAttribute('aria-hidden', String(mobileMenuMedia.matches));

            if (!panel.querySelector('.mega-menu__back')) {
                const backButton = document.createElement('button');

                backButton.className = 'mega-menu__back';
                backButton.type = 'button';
                backButton.textContent = 'Назад';
                backButton.addEventListener('click', () => {
                    resetSubmenu();
                    trigger?.focus();
                });
                panel.prepend(backButton);
            }

            if (!trigger) {
                return;
            }

            trigger.classList.add('has-submenu');
            trigger.setAttribute('aria-controls', panel.id);
            trigger.setAttribute('aria-expanded', 'false');

            trigger.addEventListener('click', (event) => {
                if (trigger.classList.contains('is-muted') || isTextClick(trigger, event)) {
                    return;
                }

                event.preventDefault();
                openSubmenu(trigger, panel);
            });
        });

        const initialTrigger = submenuLinks.find((link) => link.classList.contains('is-active'))
            || submenuLinks.find((link) => !link.classList.contains('is-muted'));
        const initialPanel = initialTrigger && submenuPanels.find(
            (panel) => panel.dataset.menuPanel === initialTrigger.dataset.menuSection,
        );

        if (!mobileMenuMedia.matches && initialTrigger && initialPanel) {
            openSubmenu(initialTrigger, initialPanel);
            megaMenu.classList.remove('mega-menu--submenu-open');
        }

        let lockedScrollX = 0;
        let lockedScrollY = 0;

        const setMobileScrollLock = (isLocked) => {
            const root = document.documentElement;
            const shouldLock = isLocked && mobileMenuMedia.matches;
            const isCurrentlyLocked = root.classList.contains('mobile-menu-open');

            if (shouldLock === isCurrentlyLocked) {
                return;
            }

            if (shouldLock) {
                lockedScrollX = window.scrollX;
                lockedScrollY = window.scrollY;
                root.style.setProperty('--mobile-menu-scroll-offset', `${-lockedScrollY}px`);
                root.classList.add('mobile-menu-open');
                return;
            }

            const previousScrollBehavior = root.style.scrollBehavior;

            root.classList.remove('mobile-menu-open');
            root.style.removeProperty('--mobile-menu-scroll-offset');
            root.style.scrollBehavior = 'auto';
            window.scrollTo(lockedScrollX, lockedScrollY);
            root.style.scrollBehavior = previousScrollBehavior;
        };

        const setMenuState = (isOpen) => {
            header.classList.toggle('header--menu-open', isOpen);
            openBtn.setAttribute('aria-expanded', String(isOpen));
            openBtn.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
            setMobileScrollLock(isOpen);

            if (!isOpen) {
                resetSubmenu();
            } else if (!mobileMenuMedia.matches && initialTrigger && initialPanel) {
                openSubmenu(initialTrigger, initialPanel);
                megaMenu.classList.remove('mega-menu--submenu-open');
            }
        };

        openBtn.setAttribute(
            'aria-expanded',
            String(header.classList.contains('header--menu-open')),
        );
        openBtn.setAttribute('aria-label', 'Открыть меню');

        openBtn.addEventListener('click', () => {
            const isOpen = header.classList.contains('header--menu-open');
            const gsapInstance = window.gsap;

            if (mobileMenuMedia.matches || !gsapInstance || prefersReducedMotion.matches) {
                setMenuState(!isOpen);

                if (!isOpen) {
                    window.requestAnimationFrame(() => {
                        megaMenu.querySelector('a:not(.is-muted)')?.focus();
                    });
                }

                return;
            }

            gsapInstance.killTweensOf([megaMenu, ...menuItems]);

            if (!isOpen) {
                setMenuState(true);

                gsapInstance.fromTo(
                    megaMenu,
                    { autoAlpha: 0, y: -12, scaleY: 0.985 },
                    { autoAlpha: 1, y: 0, scaleY: 1, duration: 0.32, ease: 'power2.out', clearProps: 'transform,opacity,visibility' },
                );
                gsapInstance.fromTo(
                    menuItems,
                    { autoAlpha: 0, y: -6 },
                    { autoAlpha: 1, y: 0, duration: 0.24, stagger: 0.018, delay: 0.06, ease: 'power1.out', clearProps: 'transform,opacity,visibility' },
                );
                return;
            }

            openBtn.setAttribute('aria-expanded', 'false');
            gsapInstance.to(megaMenu, {
                autoAlpha: 0,
                y: -10,
                scaleY: 0.985,
                duration: 0.22,
                ease: 'power2.in',
                onComplete: () => {
                    setMenuState(false);
                    gsapInstance.set([megaMenu, ...menuItems], { clearProps: 'transform,opacity,visibility' });
                },
            });
        });

        document.addEventListener('click', (event) => {
            if (
                !header.classList.contains('header--menu-open')
                || header.contains(event.target)
            ) {
                return;
            }

            openBtn.click();
        });

        document.addEventListener('keydown', (event) => {
            if (!header.classList.contains('header--menu-open')) {
                return;
            }

            if (event.key === 'Tab' && mobileMenuMedia.matches) {
                const focusableItems = [...header.querySelectorAll(
                    'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
                )].filter((item) => (
                    item.getClientRects().length > 0
                    && !item.closest('[aria-hidden="true"]')
                ));
                const firstItem = focusableItems[0];
                const lastItem = focusableItems.at(-1);

                if (event.shiftKey && document.activeElement === firstItem) {
                    event.preventDefault();
                    lastItem?.focus();
                } else if (!event.shiftKey && document.activeElement === lastItem) {
                    event.preventDefault();
                    firstItem?.focus();
                }

                return;
            }

            if (event.key !== 'Escape') {
                return;
            }

            if (mobileMenuMedia.matches && megaMenu.classList.contains('mega-menu--submenu-open')) {
                const activeTrigger = submenuLinks.find(
                    (link) => link.getAttribute('aria-expanded') === 'true',
                );

                resetSubmenu();
                activeTrigger?.focus();
                return;
            }

            setMenuState(false);
            openBtn.focus();
        });

        mobileMenuMedia.addEventListener('change', () => {
            resetSubmenu();

            if (!mobileMenuMedia.matches && initialTrigger && initialPanel) {
                openSubmenu(initialTrigger, initialPanel);
                megaMenu.classList.remove('mega-menu--submenu-open');
            }

            setMobileScrollLock(header.classList.contains('header--menu-open'));
        });
    }
})();
