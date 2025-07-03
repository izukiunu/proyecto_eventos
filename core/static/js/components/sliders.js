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
    // --- INICIALIZACIÓN DEL SLIDER DE SERVICIOS DESTACADOS ---
    const serviciosSliderElement = document.querySelector('.servicios-slider');
    if (serviciosSliderElement) {
        const swiperWrapper = serviciosSliderElement.querySelector('.swiper-wrapper');
        const totalSlides = swiperWrapper ? swiperWrapper.children.length : 0;
        
        // Solo activa la navegación y el bucle si hay suficientes tarjetas para deslizar
        const loopIsActive = totalSlides > 3; 

        const serviciosSlider = new Swiper(serviciosSliderElement, {
            // Opciones del slider
            loop: loopIsActive,
            slidesPerView: 1,
            spaceBetween: 30,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            // Puntos de quiebre para diferentes tamaños de pantalla
            breakpoints: {
                768: {
                    slidesPerView: 2,
                    spaceBetween: 30
                },
                992: {
                    slidesPerView: 3,
                    spaceBetween: 30
                }
            }
        });

        // Oculta los botones de navegación si el bucle no está activo
        if (!loopIsActive) {
            const navContainer = serviciosSliderElement.closest('.slider-contenedor');
            if (navContainer) {
                const nextBtn = navContainer.querySelector('.swiper-button-next');
                const prevBtn = navContainer.querySelector('.swiper-button-prev');
                if(nextBtn) nextBtn.style.display = 'none';
                if(prevBtn) prevBtn.style.display = 'none';
            }
        }
    }

    // ==========================================================
    // NUEVO CÓDIGO PARA LA ANIMACIÓN DEL TEXTO DEL HERO CAROUSEL
    // ==========================================================
    const heroCarouselElement = document.getElementById('heroCarousel');

    if (heroCarouselElement) {
        
        // Función para actualizar la visibilidad del contenido
        const updateHeroContentVisibility = () => {
            // Busca el slide que está activo AHORA MISMO
            const activeSlide = heroCarouselElement.querySelector('.carousel-item.active');
            
            // Busca TODOS los contenedores de texto
            const allContentWrappers = heroCarouselElement.querySelectorAll('.hero-content-wrapper');

            // 1. Oculta el texto de TODOS los slides
            allContentWrappers.forEach(wrapper => {
                wrapper.classList.remove('content-visible');
            });

            // 2. Muestra SOLAMENTE el texto del slide que está activo
            if (activeSlide) {
                const activeContent = activeSlide.querySelector('.hero-content-wrapper');
                if (activeContent) {
                    // Le añade la clase para que el CSS lo haga visible con una transición suave
                    activeContent.classList.add('content-visible');
                }
            }
        };

        // Escucha el evento 'slid.bs.carousel'. 
        // Este evento se dispara DESPUÉS de que la transición del slide ha terminado.
        heroCarouselElement.addEventListener('slid.bs.carousel', function () {
            updateHeroContentVisibility();
        });

        // Llama a la función una vez al cargar la página para mostrar el texto del primer slide.
        updateHeroContentVisibility();
    }
    // --- FIN DEL NUEVO CÓDIGO ---

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
    // Oculta los botones de navegación si el bucle no está activo
        if (!loopIsActiveTestimonios) {
            // Find the buttons within this specific slider's context
            const nextBtn = testimoniosSliderElement.querySelector('.swiper-button-next');
            const prevBtn = testimoniosSliderElement.querySelector('.swiper-button-prev');
            if(nextBtn) nextBtn.style.display = 'none';
            if(prevBtn) prevBtn.style.display = 'none';
        }

});