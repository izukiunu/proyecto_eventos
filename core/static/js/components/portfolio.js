// static/js/components/portfolio.js (Versión 3.1: Overlay + Rotación Automática + Carousel Fix)
document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURACIÓN ---
    const ROTATION_INTERVAL_MS = 6000; // Rotar proyectos cada 6 segundos

    // --- ELEMENTOS DEL DOM ---
    const collageContainer = document.getElementById('project-collage-container');
    const projectModalElement = document.getElementById('projectModal');
    const modalCarouselInner = document.getElementById('modal-carousel-inner');

    if (!collageContainer || !projectModalElement) {
        console.error("Error: No se encontraron los contenedores de la galería o del modal.");
        return;
    }

    const projectModal = new bootstrap.Modal(projectModalElement);

    // --- DATOS Y ESTADO ---
    let allProjects = [];
    let currentIndex = 0;
    let rotationInterval;

    // --- FUNCIONES ---

    function renderGrid() {
        if (allProjects.length === 0) return;

        console.log(`Renderizando grid desde el índice: ${currentIndex}`);

        Array.from(collageContainer.children).forEach(child => child.style.opacity = 0);

        setTimeout(() => {
            collageContainer.innerHTML = '';

            const projectsToShow = [];
            for (let i = 0; i < 5; i++) {
                if (allProjects.length <= 5 && i >= allProjects.length) break;
                const projectIndex = (currentIndex + i) % allProjects.length;
                projectsToShow.push(allProjects[projectIndex]);
            }

            projectsToShow.forEach((project, i) => {
                const cell = document.createElement('div');
                cell.className = `collage-item pos-${i + 1}`;
                cell.style.opacity = 0;

                cell.innerHTML = `
                    <img src="${project.images[0] || ''}" alt="Imagen de ${project.title}">
                    <div class="overlay">
                        <h5 class="title">${project.title}</h5>
                        <p class="date">${project.date || ''}</p>
                    </div>
                `;

                cell.addEventListener('click', () => openProjectModal(project));

                collageContainer.appendChild(cell);
                void cell.offsetWidth;
                cell.style.opacity = 1;
            });
        }, 500);
    }

    function openProjectModal(project) {
        stopRotation();
        modalCarouselInner.innerHTML = '';

        project.images.forEach((imageUrl, imgIndex) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = `carousel-item ${imgIndex === 0 ? 'active' : ''}`;

            itemDiv.innerHTML = `
                <img src="${imageUrl}" class="d-block w-100" alt="Imagen de ${project.title}">
                <div class="carousel-caption d-none d-md-block">
                    <h5>${project.title}</h5>
                    <p>${project.description || ''}</p>
                    <small>${project.date || ''}</small>
                </div>
            `;
            modalCarouselInner.appendChild(itemDiv);
        });

        // ⭐ Activa el carrusel después de crear los slides
        const carouselElement = document.querySelector('#projectModalCarousel');
        bootstrap.Carousel.getInstance(carouselElement)?.dispose(); // Limpia el carrusel anterior si existe
        new bootstrap.Carousel(carouselElement, {
            interval: false,
            ride: false,
            pause: true,
            wrap: true
        });

        projectModal.show();
    }

    function startRotation() {
        if (allProjects.length > 5) {
            clearInterval(rotationInterval);
            rotationInterval = setInterval(() => {
                currentIndex = (currentIndex + 1) % allProjects.length;
                renderGrid();
            }, ROTATION_INTERVAL_MS);
        }
    }

    function stopRotation() {
        clearInterval(rotationInterval);
    }

    // --- INICIALIZACIÓN ---
    try {
        const projectsDataElement = document.getElementById('projects-data');
        allProjects = JSON.parse(projectsDataElement.textContent);

        if (allProjects.length > 0) {
            renderGrid();
            startRotation();
            projectModalElement.addEventListener('hidden.bs.modal', startRotation);
            document.activeElement.blur();
        } else {
            collageContainer.innerHTML = "<p>No hay proyectos para mostrar.</p>";
        }
    } catch (e) {
        console.error("Error fatal al inicializar la galería.", e);
    }
});
