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

    // const resizeObserver = new ResizeObserver(() => {
    //     document.documentElement.style.setProperty(
    //         '--header-height',
    //         `${headerWrapper.getBoundingClientRect().height}px`,
    //     );
    //     requestPositionUpdate();
    // });

    // resizeObserver.observe(headerWrapper);
    window.addEventListener('scroll', requestPositionUpdate, { passive: true });
    window.addEventListener('resize', requestPositionUpdate);
    updateHeaderPosition();

    window.Header = {
        update: updateHeaderPosition,
    };
})();
