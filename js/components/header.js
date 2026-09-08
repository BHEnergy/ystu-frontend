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
    const mobileMenuMedia = window.matchMedia('(max-width: 1100px)');

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
        const hoverSubmenuEnabled = megaMenu.hasAttribute('data-hover-submenu');
        let primaryMenuScrollTop = 0;
        const mobileMenuEntries = [];
        let mobileAnchorTimer = 0;

        const getTextRect = (link) => {
            const range = document.createRange();

            range.selectNodeContents(link);
            const textRect = range.getBoundingClientRect();
            range.detach();

            return textRect;
        };

        const updateTextHighlight = (link) => {
            const textRect = getTextRect(link);

            if (!textRect.width) {
                return;
            }

            const linkStyles = window.getComputedStyle(link);
            const horizontalPadding = parseFloat(linkStyles.paddingLeft)
                + parseFloat(linkStyles.paddingRight);
            const textWidth = Math.ceil(textRect.width + horizontalPadding) + 2;

            link.style.setProperty('--mega-menu-text-width', `${textWidth}px`);
        };

        const refreshSelectedHighlight = () => {
            const selectedLink = submenuLinks.find((link) => link.classList.contains('is-selected'));

            if (selectedLink) {
                updateTextHighlight(selectedLink);
            }
        };

        const isTextClick = (link, event) => {
            const textRect = getTextRect(link);

            return event.clientX >= textRect.left
                && event.clientX <= textRect.right
                && event.clientY >= textRect.top
                && event.clientY <= textRect.bottom;
        };

        const resetSubmenu = () => {
            window.clearTimeout(mobileAnchorTimer);
            if (mobileMenuMedia.matches) {
                mobileMenuEntries.forEach(({ trigger, panel }) => {
                    trigger.setAttribute('href', `#${panel.id}`);
                });
            }
            megaMenu.classList.remove('mega-menu--submenu-open');
            submenuLinks.forEach((link) => link.setAttribute('aria-expanded', 'false'));
            submenuPanels.forEach((panel) => {
                panel.classList.remove('is-open');
                panel.setAttribute('aria-hidden', String(mobileMenuMedia.matches));
                if (mobileMenuMedia.matches) panel.inert = true;
            });
        };

        const openSubmenu = (trigger, panel) => {
            resetSubmenu();

            if (mobileMenuMedia.matches) {
                primaryMenuScrollTop = megaMenu.scrollTop;
            }

            if (trigger.classList.contains('is-selected')) {
                updateTextHighlight(trigger);
            }

            trigger.setAttribute('aria-expanded', 'true');
            panel.classList.add('is-open');
            panel.setAttribute('aria-hidden', 'false');
            panel.inert = false;
            panel.scrollTop = 0;

            if (mobileMenuMedia.matches) {
                megaMenu.classList.add('mega-menu--submenu-open');
                const entry = mobileMenuEntries.find((item) => item.trigger === trigger);
                if (entry) trigger.setAttribute('href', entry.href);
            }
        };

        submenuPanels.forEach((panel, index) => {
            const sectionName = panel.dataset.menuPanel;
            const trigger = submenuLinks.find(
                (link) => link.dataset.menuSection === sectionName,
            );

            panel.id ||= `mega-menu-panel-${sectionName || index}`;
            panel.setAttribute('aria-hidden', String(mobileMenuMedia.matches));

            if (!trigger) {
                return;
            }

            trigger.classList.add('has-submenu');
            trigger.setAttribute('aria-controls', panel.id);
            trigger.setAttribute('aria-expanded', 'false');

            // Сохраняем исходные позиции и URL для возвращения к десктопному меню.
            const placeholder = document.createComment(`menu-panel-${sectionName}`);
            panel.before(placeholder);
            const content = document.createElement('div');
            content.className = 'mega-menu__accordion-content';
            while (panel.firstChild) content.append(panel.firstChild);
            panel.append(content);
            mobileMenuEntries.push({ trigger, panel, placeholder, href: trigger.getAttribute('href') });

            trigger.addEventListener('click', (event) => {
                if (mobileMenuMedia.matches) {
                    // У раскрытого раздела уже восстановлен URL страницы.
                    if (panel.classList.contains('is-open')) return;
                    event.preventDefault();
                    openSubmenu(trigger, panel);
                    // Якорь прокручивает только меню: позиция страницы сохраняется.
                    mobileAnchorTimer = window.setTimeout(() => {
                        megaMenu.scrollTo({
                            top: megaMenu.scrollTop + trigger.getBoundingClientRect().top
                                - megaMenu.getBoundingClientRect().top - 16,
                            behavior: prefersReducedMotion.matches ? 'instant' : 'smooth',
                        });
                    }, prefersReducedMotion.matches ? 0 : 250);
                    return;
                }

                if (trigger.classList.contains('is-muted') || isTextClick(trigger, event)) {
                    return;
                }

                event.preventDefault();
                openSubmenu(trigger, panel);
            });

            if (hoverSubmenuEnabled) {
                const openDesktopSubmenu = () => {
                    if (!mobileMenuMedia.matches) {
                        openSubmenu(trigger, panel);
                        megaMenu.classList.remove('mega-menu--submenu-open');
                    }
                };

                trigger.addEventListener('mouseenter', openDesktopSubmenu);
                trigger.addEventListener('focus', openDesktopSubmenu);
            }
        });

        const syncMobileAccordion = () => {
            megaMenu.classList.toggle('mega-menu--accordion', mobileMenuMedia.matches);
            mobileMenuEntries.forEach(({ trigger, panel, placeholder, href }) => {
                if (mobileMenuMedia.matches) {
                    trigger.after(panel);
                    trigger.setAttribute('href', `#${panel.id}`);
                    panel.inert = !panel.classList.contains('is-open');
                } else {
                    placeholder.after(panel);
                    trigger.setAttribute('href', href);
                    panel.inert = false;
                }
            });
        };

        syncMobileAccordion();

        const selectedTrigger = submenuLinks.find((link) => link.classList.contains('is-selected'))
            || submenuLinks.find((link) => !link.classList.contains('is-muted'));
        const selectedPanel = selectedTrigger && submenuPanels.find(
            (panel) => panel.dataset.menuPanel === selectedTrigger.dataset.menuSection,
        );

        if (!mobileMenuMedia.matches && selectedTrigger && selectedPanel) {
            updateTextHighlight(selectedTrigger);
            openSubmenu(selectedTrigger, selectedPanel);
            megaMenu.classList.remove('mega-menu--submenu-open');
        }

        document.fonts?.ready.then(refreshSelectedHighlight);
        window.addEventListener('resize', refreshSelectedHighlight);

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

            if (isOpen) {
                refreshSelectedHighlight();
            }

            if (!isOpen) {
                resetSubmenu();
            } else if (!mobileMenuMedia.matches && selectedTrigger && selectedPanel) {
                openSubmenu(selectedTrigger, selectedPanel);
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
                megaMenu.scrollTop = primaryMenuScrollTop;
                activeTrigger?.focus({ preventScroll: true });
                return;
            }

            setMenuState(false);
            openBtn.focus();
        });

        mobileMenuMedia.addEventListener('change', () => {
            syncMobileAccordion();
            resetSubmenu();

            if (!mobileMenuMedia.matches && selectedTrigger && selectedPanel) {
                openSubmenu(selectedTrigger, selectedPanel);
                megaMenu.classList.remove('mega-menu--submenu-open');
            }

            setMobileScrollLock(header.classList.contains('header--menu-open'));
        });
    }
})();
