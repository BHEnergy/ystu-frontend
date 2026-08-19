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

        /* Слайдер на главной */
        document.querySelectorAll(".js-init-first-slider").forEach((slider) => {

            if (slider.swiper || !slider.classList.contains("swiper")) {
                return;
            }

            const swiper = new Swiper(slider, {
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

            let slides = slider.querySelectorAll('.slide__photo');
            if(window.innerWidth < 768) {
                slides.forEach((slide) => {
                    slide.src = slide.dataset.mobile || slide.src;
                });
            }
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
                slidesPerView: 1,
                slidesPerGroup: 1,
                spaceBetween: 16,
                navigation: {
                    prevEl: slider.querySelector(".swiper-button-prev"),
                    nextEl: slider.querySelector(".swiper-button-next"),
                },
                grid: {
                    rows: 2,
                    fill: 'column',
                },
                pagination: {
                    el: slider.querySelector(".swiper-pagination"),
                    type: 'fraction',
                    clickable: true,
                },
                breakpoints: {
                    769: {
                        slidesPerView: 1,
                        slidesPerGroup: 1,
                        spaceBetween: 24,
                        grid: {
                            rows: 2,
                            fill: 'row',
                        },
                    },
                },
            });
        });

        document.querySelectorAll('.js-init-banner-slider.banner-slider-3').forEach((slider) => {
            if (slider.swiper || !slider.classList.contains('swiper')) {
                return;
            }

            new Swiper(slider, {
                loop: false,
                slidesPerView: 1,
                slidesPerGroup: 1,
                spaceBetween: 16,
                grid: {
                    rows: 3,
                    fill: 'column',
                },
                navigation: {
                    prevEl: slider.querySelector('.swiper-button-prev'),
                    nextEl: slider.querySelector('.swiper-button-next'),
                },
                pagination: {
                    el: slider.querySelector('.swiper-pagination'),
                    type: 'fraction',
                    clickable: true,
                },
                breakpoints: {
                    769: {
                        slidesPerView: 1,
                        slidesPerGroup: 1,
                        spaceBetween: 24,
                        grid: {
                            rows: 3,
                            fill: 'row',
                        },
                    },
                },
            });
        });

        /* Слайдеры студенческая жизнь */
        document.querySelectorAll(".js-init-student-slider").forEach((slider) => {
            const prevButton = slider.querySelector('.swiper-button-prev:not(.big)');
            const nextButton = slider.querySelector('.swiper-button-next:not(.big)');
            const prevButtonBig = slider.querySelector('.swiper-button-prev.big');
            const nextButtonBig = slider.querySelector('.swiper-button-next.big');

            const updateNavigationState = (swiper, prevBig, nextBig) => {
                prevBig.classList.toggle('swiper-button-disabled', swiper.isBeginning);
                nextBig.classList.toggle('swiper-button-disabled', swiper.isEnd);

                prevBig.setAttribute('aria-disabled', String(swiper.isBeginning));
                nextBig.setAttribute('aria-disabled', String(swiper.isEnd));

                prevBig.tabIndex = swiper.isBeginning ? -1 : 0;
                nextBig.tabIndex = swiper.isEnd ? -1 : 0;
            };

            if (slider.swiper || !slider.classList.contains("swiper")) {
                return;
            }

            const swiper = new Swiper(slider, {
                loop: false,
                slidesPerView: 1,
                spaceBetween: 24,
                navigation: {
                    prevEl: prevButton,
                    nextEl: nextButton,
                },
                pagination: {
                    el: slider.querySelector(".swiper-pagination"),
                    clickable: true,
                },
                on: {
                    init(swiper) {
                        updateNavigationState(swiper, prevButtonBig, nextButtonBig);
                    },
                
                    slideChange(swiper) {
                        updateNavigationState(swiper, prevButtonBig, nextButtonBig);
                    },

                    lock(swiper) {
                        updateNavigationState(swiper, prevButtonBig, nextButtonBig);
                    },

                    unlock(swiper) {
                        updateNavigationState(swiper, prevButtonBig, nextButtonBig);
                    },
                },
            });

            prevButtonBig.addEventListener("click", () => swiper.slidePrev());
            nextButtonBig.addEventListener("click", () => swiper.slideNext());
        });

        document.querySelectorAll('.js-init-structure-gallery').forEach((slider) => {
            if (slider.swiper || !slider.classList.contains('swiper')) {
                return;
            }

            new Swiper(slider, {
                loop: false,
                slidesPerView: 1,
                spaceBetween: 24,
                navigation: {
                    prevEl: slider.querySelector('.swiper-button-prev'),
                    nextEl: slider.querySelector('.swiper-button-next'),
                },
                pagination: {
                    el: slider.querySelector('.swiper-pagination'),
                    clickable: true,
                },
                breakpoints: {
                    768: { slidesPerView: 2 },
                    1200: { slidesPerView: 4 },
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
            loadScript("filter-panel.js", "FilterPanel"),
            loadScript("campus-map.js", "CampusMap"),
            loadScript("modals.js", "Modals")
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
