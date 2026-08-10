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
        document.documentElement.style.setProperty(
            '--header-height',
            `${headerWrapper.getBoundingClientRect().height + 30}px`,
        );
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

    if (openBtn && megaMenu) {
        const menuItems = megaMenu.querySelectorAll(
            '.mega-menu__primary > li, .mega-menu__section, .mega-menu__additional > li',
        );

        openBtn.setAttribute(
            'aria-expanded',
            String(header.classList.contains('header--menu-open')),
        );

        openBtn.addEventListener('click', () => {
            const isOpen = header.classList.contains('header--menu-open');
            const gsapInstance = window.gsap;

            if (!gsapInstance || prefersReducedMotion.matches) {
                header.classList.toggle('header--menu-open', !isOpen);
                openBtn.setAttribute('aria-expanded', String(!isOpen));
                return;
            }

            gsapInstance.killTweensOf([megaMenu, ...menuItems]);

            if (!isOpen) {
                header.classList.add('header--menu-open');
                openBtn.setAttribute('aria-expanded', 'true');

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
                    header.classList.remove('header--menu-open');
                    gsapInstance.set([megaMenu, ...menuItems], { clearProps: 'transform,opacity,visibility' });
                },
            });
        });
    }
})();
