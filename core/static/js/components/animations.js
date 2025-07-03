// static/js/components/animations.js

document.addEventListener('DOMContentLoaded', () => {

    // Seleccionamos todos los elementos que queremos animar
    const revealItems = document.querySelectorAll('.project-reveal-item');

    // Opciones para el observador:
    // La animación se disparará cuando el 15% del elemento sea visible
    const options = {
        root: null, // El viewport del navegador
        rootMargin: '0px',
        threshold: 0.15 
    };

    // Creamos el observador
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            // Si el elemento está en la pantalla...
            if (entry.isIntersecting) {
                // ...le añadimos la clase para hacerlo visible...
                entry.target.classList.add('is-visible');
                // ...y dejamos de observarlo para mejorar el rendimiento.
                observer.unobserve(entry.target);
            }
        });
    }, options);

    // Le decimos al observador qué elementos debe vigilar
    revealItems.forEach(item => {
        observer.observe(item);
    });
    // --- NUEVO CÓDIGO: LÓGICA PARA EL ROTADOR DE PROYECTOS ---
    const rotatorContainer = document.getElementById('proyectos-rotator-container');

    if (rotatorContainer) {
        const projects = rotatorContainer.querySelectorAll('.proyecto-rotator-item');
        let currentIndex = 0;

        if (projects.length > 1) {
            setInterval(() => {
                // 1. Oculta el proyecto actual
                projects[currentIndex].classList.remove('is-active');

                // 2. Calcula cuál es el siguiente proyecto
                currentIndex = (currentIndex + 1) % projects.length; // Esto hace que vuelva al principio

                // 3. Muestra el siguiente proyecto
                projects[currentIndex].classList.add('is-active');

            }, 5000); // Cambia de proyecto cada 5 segundos (5000 milisegundos)
        }
    }

});