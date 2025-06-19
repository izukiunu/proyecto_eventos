document.addEventListener('DOMContentLoaded', () => {

    // --- ESTADO Y CONSTANTES ---
    const body = document.body;
    const panelCarrito = document.getElementById('panel-carrito');
    const iconoCarrito = document.getElementById('icono-carrito-contenedor');
    const cerrarPanelBtn = document.getElementById('cerrar-panel');
    const contadorCarrito = document.getElementById('contador-carrito');
    const cotizacionForm = document.getElementById('form-solicitud-cotizacion');
    const emailInput = document.querySelector('#id_email_cliente');
    const emailValidationMessage = document.getElementById('email-validation-message');

    let carrito = JSON.parse(localStorage.getItem('carritoCotizaciones')) || [];
    const hoy = new Date().toISOString().split('T')[0];


    // --- FUNCIÓN CENTRAL DE RENDERIZADO ---
    const crearItemHTML = (item) => {
        const fechaInicio = item.fechaInicio || '';
        const fechaFin = item.fechaFin || '';
        
        const esMultiDia = item.multidiaActivo;
        const estaSincronizado = item.sincronizar;

        const finVisibleClass = esMultiDia ? '' : 'd-none';

        return `
            <div class="item-carrito" data-id="${item.id}">
                <img src="${item.imagenUrl}" alt="${item.nombre}">
                <div class="item-info">
                    <h4>${item.nombre}</h4>
                    <p class="precio-display">${item.precioDisplay}</p>

                    <div class="item-fechas">
                        <label><span>Fecha del Evento / Inicio:</span> <input type="date" class="fecha-inicio" value="${fechaInicio}" min="${hoy}"></label>

                        <label class="fecha-fin-wrapper mt-2 ${finVisibleClass}">
                            <span>Fecha de Término:</span> <input type="date" class="fecha-fin" value="${fechaFin}" min="${fechaInicio || hoy}">
                        </label>
                    </div>

                    <div class="item-controles">
                        <div class="control-individual">
                            <input type="checkbox" class="multidia-checkbox" id="multidia-check-${item.id}" ${esMultiDia ? 'checked' : ''}>
                            <label for="multidia-check-${item.id}">Más de un día</label>
                        </div>
                        <div class="control-individual">
                            <input type="checkbox" class="sync-fecha-checkbox" id="sync-check-${item.id}" ${estaSincronizado ? 'checked' : ''}>
                            <label for="sync-check-${item.id}">Sincronizar fecha</label>
                        </div>
                    </div>
                </div>
                <button class="btn-eliminar-item" title="Eliminar servicio">&times;</button>
            </div>
        `;
    };


    // --- FUNCIONES DE RENDERIZADO Y ESTADO ---
    const renderizarTodo = () => {
        const panelItemsContainer = document.getElementById('panel-carrito-items');
        if (panelItemsContainer) {
            const scrollPosition = panelItemsContainer.scrollTop;
            panelItemsContainer.innerHTML = '';
            if (carrito.length === 0) {
                const mensajeVacioHTML = `
                    <div class="text-center p-4">
                        <p class="text-muted mb-3">Tu carro de cotización está vacío.</p>
                        <a href="/servicios/" class="btn btn-outline-danger">
                            Ver Servicios Disponibles
                        </a>
                    </div>
                `;
                panelItemsContainer.innerHTML = mensajeVacioHTML;
            } else {
                carrito.forEach(item => panelItemsContainer.insertAdjacentHTML('beforeend', crearItemHTML(item)));
            }
            panelItemsContainer.scrollTop = scrollPosition;
        }

        const resumenFormContainer = document.getElementById('resumen-cotizacion');
        if (resumenFormContainer) {
            const submitButton = document.querySelector('form button[type="submit"]');
            const tituloHTML = '<h3 class="mb-3 border-bottom pb-2">Servicios a Cotizar</h3>';
            
            // Limpiamos solo el contenido dinámico, no el título.
            while (resumenFormContainer.firstChild) {
                resumenFormContainer.removeChild(resumenFormContainer.lastChild);
            }
            resumenFormContainer.insertAdjacentHTML('afterbegin', tituloHTML);
            
            if (carrito.length === 0) {
                resumenFormContainer.insertAdjacentHTML('beforeend', `
                    <div class="alert alert-warning">
                        No has seleccionado ningún servicio. 
                        <a href="/servicios/">Vuelve a la lista de servicios</a> para añadir.
                    </div>
                `);
                if(submitButton) submitButton.disabled = true;
            } else {
                let resumenTextoParaEmail = '';
                carrito.forEach((item) => {
                    resumenFormContainer.insertAdjacentHTML('beforeend', crearItemHTML(item));
                    
                    const fechaInicioTxt = item.fechaInicio ? new Date(item.fechaInicio + 'T00:00:00').toLocaleDateString('es-ES') : 'No especificada';
                    const fechaFinTxt = (item.multidiaActivo && item.fechaFin) ? new Date(item.fechaFin + 'T00:00:00').toLocaleDateString('es-ES') : 'No especificada';
                    let finDisplay = fechaFinTxt !== 'No especificada' ? `\n- Fin: ${fechaFinTxt}` : '';
                    
                    resumenTextoParaEmail += `Servicio: ${item.nombre}\n- Precio Ref: ${item.precioDisplay}\n- Inicio: ${fechaInicioTxt}${finDisplay}\n-------------------------------------\n`;
                });

                const hiddenInput = document.querySelector('[name="cotizacion_detallada"]');
                if (hiddenInput) hiddenInput.value = resumenTextoParaEmail;
                if(submitButton) submitButton.disabled = false;
            }
        }
    };
    
    const guardarYRenderizarTodo = () => {
        localStorage.setItem('carritoCotizaciones', JSON.stringify(carrito));
        renderizarTodo();
        actualizarContador();
    };

    const actualizarContador = () => {
        if (!contadorCarrito) return;
        contadorCarrito.textContent = carrito.length;
        contadorCarrito.classList.toggle('d-none', carrito.length === 0);
    };
    
    // --- MANEJO DE EVENTOS ---
    const agregarAlCarrito = (serviceData) => {
        const yaExiste = carrito.some(item => item.id === serviceData.id);
        if (yaExiste) {
            alert('Este servicio ya fue agregado a tu cotización.');
            return;
        }
        const nuevoItem = {
            id: serviceData.id,
            nombre: serviceData.nombre,
            imagenUrl: serviceData.imagenUrl,
            precioDisplay: serviceData.precioDisplay,
            fechaInicio: null,
            fechaFin: null,
            multidiaActivo: false,
            sincronizar: false,
        };
        carrito.push(nuevoItem);
        guardarYRenderizarTodo();
        abrirPanel();
    };

    const sincronizarFechas = (itemMaestro) => {
        const fechaInicioMaestro = itemMaestro.fechaInicio;
        const fechaFinMaestro = itemMaestro.fechaFin;
        const multidiaMaestro = itemMaestro.multidiaActivo;

        carrito.forEach(item => {
            if (item.sincronizar) {
                item.fechaInicio = fechaInicioMaestro;
                item.fechaFin = fechaFinMaestro;
                item.multidiaActivo = multidiaMaestro;
            }
        });
        guardarYRenderizarTodo();
    };

    // --- LISTENERS DE EVENTOS ---

    if (cotizacionForm) {
        cotizacionForm.addEventListener('submit', (event) => {
            for (const item of carrito) {
                if (!item.fechaInicio) {
                    event.preventDefault(); 
                    alert(`Por favor, establece una fecha de inicio para el servicio: "${item.nombre}".`);

                    const itemElement = document.querySelector(`.item-carrito[data-id="${item.id}"]`);
                    if (itemElement) {
                        itemElement.style.border = '2px solid #dc3545';
                        itemElement.style.borderRadius = '8px';
                        itemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    return; 
                }
            }
        });
    }
    
    const abrirPanel = () => panelCarrito?.classList.add('panel-visible');
    const cerrarPanel = () => panelCarrito?.classList.remove('panel-visible');

    body.addEventListener('click', (e) => {
        // Delegación de eventos para agregar al carrito
        if (e.target.matches('.btn-agregar-carrito')) {
            e.preventDefault();
            const boton = e.target;
            const serviceData = {
                id: boton.dataset.id,
                nombre: boton.dataset.nombre,
                imagenUrl: boton.dataset.imagenUrl,
                precioDisplay: boton.dataset.precioDisplay,
            };
            agregarAlCarrito(serviceData);
        }

        // Delegación para eliminar un item del carrito
        if (e.target.matches('.btn-eliminar-item')) {
            const itemContainer = e.target.closest('.item-carrito');
            if (itemContainer) {
                const itemId = itemContainer.dataset.id;
                carrito = carrito.filter(item => item.id !== itemId);
                guardarYRenderizarTodo();
            }
        }
    });

    body.addEventListener('change', (e) => {
        const itemContainer = e.target.closest('.item-carrito');
        if (!itemContainer) return;
        
        const itemId = itemContainer.dataset.id;
        const itemEnCarrito = carrito.find(item => item.id === itemId);
        if (!itemEnCarrito) return;

        if (e.target.matches('.multidia-checkbox')) {
            itemEnCarrito.multidiaActivo = e.target.checked;
            if (!itemEnCarrito.multidiaActivo) {
                itemEnCarrito.fechaFin = itemEnCarrito.fechaInicio;
            }
            if (itemEnCarrito.sincronizar) {
                sincronizarFechas(itemEnCarrito);
            } else {
                guardarYRenderizarTodo();
            }
        }
        
        else if (e.target.matches('.sync-fecha-checkbox')) {
            itemEnCarrito.sincronizar = e.target.checked;
            if (itemEnCarrito.sincronizar) {
                sincronizarFechas(itemEnCarrito);
            } else {
                guardarYRenderizarTodo();
            }
        }

        else if (e.target.matches('input[type="date"]')) {
            const fechaInicioInput = itemContainer.querySelector('.fecha-inicio');
            itemEnCarrito.fechaInicio = fechaInicioInput.value;

            if (itemEnCarrito.multidiaActivo) {
                const fechaFinInput = itemContainer.querySelector('.fecha-fin');
                itemEnCarrito.fechaFin = fechaFinInput.value;
            } else {
                itemEnCarrito.fechaFin = itemEnCarrito.fechaInicio;
            }
            
            if (itemEnCarrito.fechaInicio && itemEnCarrito.fechaFin && itemEnCarrito.fechaInicio > itemEnCarrito.fechaFin) {
                itemEnCarrito.fechaFin = itemEnCarrito.fechaInicio;
            }
            
            if (itemEnCarrito.sincronizar) {
                sincronizarFechas(itemEnCarrito);
            } else {
                guardarYRenderizarTodo();
            }
        }
    });
    
    iconoCarrito?.addEventListener('click', abrirPanel);
    cerrarPanelBtn?.addEventListener('click', cerrarPanel);
    
    // VALIDACIÓN DE EMAIL EN TIEMPO REAL
    if (emailInput && emailValidationMessage) {
        emailInput.addEventListener('input', () => {
            const email = emailInput.value;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (email.length === 0) {
                emailValidationMessage.textContent = '';
                emailInput.classList.remove('is-valid', 'is-invalid');
            } else if (emailRegex.test(email)) {
                emailValidationMessage.textContent = 'Formato de correo válido';
                emailValidationMessage.className = 'form-text text-success';
                emailInput.classList.remove('is-invalid');
                emailInput.classList.add('is-valid');
            } else {
                emailValidationMessage.textContent = 'Formato de correo inválido.';
                emailValidationMessage.className = 'form-text text-danger';
                emailInput.classList.remove('is-valid');
                emailInput.classList.add('is-invalid');
            }
        });
    }

    // --- INICIALIZACIÓN ---
    // Llamada inicial para renderizar el estado del carrito al cargar la página
    guardarYRenderizarTodo();

}); // <-- FIN DEL LISTENER DOMCONTENTLOADED