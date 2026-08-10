(() => {
    const mainScript = document.currentScript;
    const componentsUrl = new URL("./components/", mainScript?.src || window.location.href);

    const loadScript = (fileName, globalName) => {
        if (globalName && window[globalName]) {
            return Promise.resolve(window[globalName]);
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement("script");

            script.src = new URL(fileName, componentsUrl).href;
            script.onload = () => resolve(globalName ? window[globalName] : undefined);
            script.onerror = () => reject(new Error(`Не удалось загрузить ${fileName}`));

            document.head.append(script);
        });
    };

    const initSwiper = () => {
        /* Инициализация слайдеров */
        document.querySelectorAll(".js-init-first-slider").forEach((slider) => {
            if (slider.swiper || !slider.classList.contains("swiper")) {
                return;
            }

            new Swiper(slider, {
                loop: false,
                slidesPerView: 1,
                spaceBetween: 24,
                navigation: {
                    prevEl: slider.querySelector(".swiper-button-prev"),
                    nextEl: slider.querySelector(".swiper-button-next"),
                },
                pagination: {
                    el: slider.querySelector(".swiper-pagination"),
                    clickable: true,
                },
            });
        });

        /* Слайдеры с фракцией */
        document.querySelectorAll('.js-init-banner-slider.banner-slider-1').forEach( (slider) => {
            if (slider.swiper || !slider.classList.contains("swiper")) {
                return;
            }

            new Swiper(slider, {
                loop: false,
                slidesPerView: 1,
                spaceBetween: 24,
                navigation: {
                    prevEl: slider.querySelector(".swiper-button-prev"),
                    nextEl: slider.querySelector(".swiper-button-next"),
                },
                pagination: {
                    el: slider.querySelector(".swiper-pagination"),
                    type: 'fraction',
                    clickable: true,
                },
            });
        });

        document.querySelectorAll('.js-init-banner-slider.banner-slider-2').forEach( (slider) => {
            if (slider.swiper || !slider.classList.contains("swiper")) {
                return;
            }

            new Swiper(slider, {
                loop: false,
                slidesPerView: 2,
                slidesPerGroup: 2,
                spaceBetween: 24,
                navigation: {
                    prevEl: slider.querySelector(".swiper-button-prev"),
                    nextEl: slider.querySelector(".swiper-button-next"),
                },
                pagination: {
                    el: slider.querySelector(".swiper-pagination"),
                    type: 'fraction',
                    clickable: true,
                },
            });
        });
    };

    /* Здесь инициализируем библиотеки */
    const initLibraries = async () => {
        await Promise.all([
            loadScript("bootstrap.min.js", "bootstrap"),
            loadScript("swiper-bundle.min.js", "Swiper"),
            loadScript('gsap.min.js', "gsap"),
            loadScript("tabs.js", "Tabs"),
            loadScript("header.js", "Header"),
            loadScript("dropdown.js", "Dropdown"),
            loadScript("filter-panel.js", "FilterPanel")
        ]);

        initSwiper();
    };

    const start = () => {
        initLibraries().catch((error) => {
            console.error("Ошибка инициализации библиотек:", error);
        });
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
        start();
    }
})();
