// js/components/sliders.js
document.addEventListener('DOMContentLoaded', function() {

    /**
     * Función de ayuda para inicializar sliders con efecto 'fade'.
     * @param {string} selector - El selector CSS del contenedor del slider.
     * @param {number} delay - El tiempo de espera para el autoplay en milisegundos.
     */
    function initFadeSlider(selector, delay) {
        const sliderElement = document.querySelector(selector);
        if (sliderElement) { // Solo inicializa si el elemento existe en la página
            new Swiper(sliderElement, {
                loop: true,
                effect: 'fade',
                autoplay: {
                    delay: delay,
                },
                allowTouchMove: false, // El usuario no puede arrastrar las imágenes
            });
        }
    }

    /**
     * Función de ayuda para inicializar sliders tipo carrusel.
     * @param {string} selector - El selector CSS del contenedor del slider.
     * @param {object} options - Un objeto con la configuración de Swiper.
     */
    function initCarouselSlider(selector, options) {
        const sliderElement = document.querySelector(selector);
        if (sliderElement) { // Solo inicializa si el elemento existe
            new Swiper(sliderElement, options);
        }
    }

    // --- INICIALIZACIÓN DE TODOS LOS SLIDERS DEL SITIO ---

    // 1. Slider de Servicios (con lógica condicional)
    const serviciosSliderElement = document.querySelector('.servicios-slider');
    if (serviciosSliderElement) {
        const swiperWrapper = serviciosSliderElement.querySelector('.swiper-wrapper');
        const totalSlides = swiperWrapper ? swiperWrapper.children.length : 0;
        let swiperOptions;

        if (totalSlides <= 3) {
            swiperOptions = {
                slidesPerView: 'auto',
                spaceBetween: 30,
                centeredSlides: true,
                loop: false,
                autoplay: false,
            };
            // Ocultamos la navegación si hay pocos slides
            const navNext = document.querySelector('.slider-contenedor .swiper-button-next');
            const navPrev = document.querySelector('.slider-contenedor .swiper-button-prev');
            const pagination = document.querySelector('.slider-contenedor .swiper-pagination');
            if(navNext) navNext.style.display = 'none';
            if(navPrev) navPrev.style.display = 'none';
            if(pagination) pagination.style.display = 'none';
        } else {
            swiperOptions = {
                loop: true,
                slidesPerView: 1,
                spaceBetween: 30,
                autoplay: { delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true },
                pagination: { el: '.swiper-pagination', clickable: true },
                navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
                breakpoints: {
                    768: { slidesPerView: 2 },
                    992: { slidesPerView: 3 }
                }
            };
        }
        new Swiper(serviciosSliderElement, swiperOptions);
    }

    // 2. Sliders con efecto 'fade'
    initFadeSlider('.sobre-nosotros-slider', 4000);
    
    const imagenesTestimonioSliders = document.querySelectorAll('.imagenes-testimonio-slider');
    imagenesTestimonioSliders.forEach(slider => {
        // Inicializamos cada slider de imagen de testimonio individualmente
        new Swiper(slider, {
            loop: true, effect: 'fade', autoplay: { delay: 2500 }, allowTouchMove: false
        });
    });

    const imagenesProyectoSliders = document.querySelectorAll('.imagenes-proyecto-slider');
    imagenesProyectoSliders.forEach(slider => {
        new Swiper(slider, {
            loop: true, effect: 'fade', autoplay: { delay: 2000 }, allowTouchMove: false
        });
    });

    // 3. Carrusel de Proyectos
    initCarouselSlider('.proyectos-slider', {
        loop: true,
        spaceBetween: 30,
        autoplay: { delay: 10000, disableOnInteraction: false },
        navigation: { nextEl: '.proyectos-nav-next', prevEl: '.proyectos-nav-prev' },
        slidesPerView: 1,
        breakpoints: {
            768: { slidesPerView: 2 },
            992: { slidesPerView: 3 }
        }
    });

    // 4. Carrusel de Testimonios
    initCarouselSlider('.testimonios-slider', {
        loop: true,
        spaceBetween: 30,
        centeredSlides: true,
        autoplay: { delay: 5000, disableOnInteraction: false },
        slidesPerView: 1,
        breakpoints: {
            768: { slidesPerView: 2 },
            1200: { slidesPerView: 3 }
        }
    });

});