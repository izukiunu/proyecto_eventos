// js/components/carrito_cotizacion_mejorado.js
// VERSIÓN FINAL Y COMPLETA

document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DEL DOM ---
    const cartContainer = document.getElementById('resumen-cotizacion');
    const formSolicitud = document.getElementById('form-solicitud-cotizacion');
    const jsonInput = document.querySelector('input[name="cotizacion_detallada_json"]');
    const hoy = new Date().toISOString().split('T')[0];

    // --- FUNCIONES DE MANEJO DEL CARRITO (LOCALSTORAGE) ---
    const getCartData = () => JSON.parse(localStorage.getItem('carritoCotizaciones')) || [];
    const saveCartData = (cart) => {
        localStorage.setItem('carritoCotizaciones', JSON.stringify(cart));
        updateJsonInput(cart); // Actualiza el campo oculto del formulario cada vez que se guarda
    };

    // --- FUNCIONES DE ACTUALIZACIÓN DEL DOM (CLAVE PARA EL RENDIMIENTO) ---

    // Actualiza solo el precio total general del carrito
    const updateGrandTotal = () => {
        const cart = getCartData();
        const total = cart.reduce((sum, item) => sum + (item.precioNumerico || 0) * (item.cantidad || 1), 0);
        const totalElement = document.getElementById('grand-total-price');
        if (totalElement) {
            totalElement.textContent = `$${total.toLocaleString('es-CL')}`;
        }
    };

    // Actualiza la cantidad y precio de un solo ítem sin redibujar todo el carrito
    const updateItemInDOM = (id, newQuantity) => {
        const itemRow = cartContainer.querySelector(`.cart-item[data-id="${id}"]`);
        if (!itemRow) return;

        const cart = getCartData();
        const itemData = cart.find(i => i.id === id);
        if (!itemData) return;
        
        itemData.cantidad = newQuantity;

        // Actualizar el valor del input numérico
        const quantityInput = itemRow.querySelector('.quantity-input');
        if (quantityInput) quantityInput.value = newQuantity;

        // Actualizar el precio total de ese ítem específico
        const itemPriceElement = itemRow.querySelector('.item-total-price');
        const itemTotalPrice = (itemData.precioNumerico || 0) * newQuantity;
        if (itemPriceElement) {
            itemPriceElement.textContent = `$${itemTotalPrice.toLocaleString('es-CL')}`;
        }

        saveCartData(cart);
        updateGrandTotal(); // Finalmente, recalcula el total general
    };
    
    // Actualiza el campo <input type="hidden"> que se envía al backend
    const updateJsonInput = (cart) => {
        if (jsonInput) {
            jsonInput.value = JSON.stringify(cart);
        }
    };
    
    // --- FUNCIÓN PRINCIPAL DE RENDERIZADO (Se usa solo al inicio o al eliminar ítems) ---
    const renderCart = () => {
        const cart = getCartData();
        
        if (!cart.length) {
            cartContainer.innerHTML = `
                <div class="alert alert-warning text-center p-4">
                    <i class="bi bi-cart-x fs-1"></i>
                    <h4 class="mt-2">Tu lista de cotización está vacía.</h4>
                    <a href="/servicios/" class="btn btn-primary mt-2">
                        <i class="bi bi-plus-circle me-2"></i>Ver servicios
                    </a>
                </div>
            `;
            updateJsonInput([]);
            return;
        }

        // Ordenar: servicios principales primero, luego sus adicionales agrupados.
        const sortedCart = [];
        const principales = cart.filter(item => item.parentId === null);
        principales.forEach(p => {
            sortedCart.push(p);
            const adicionales = cart.filter(ad => ad.parentId === p.id);
            sortedCart.push(...adicionales);
        });

        let totalGeneral = 0;
        const itemsHTML = sortedCart.map(item => {
            const itemTotalPrice = (item.precioNumerico || 0) * (item.cantidad || 1);
            totalGeneral += itemTotalPrice;

            const isAdicional = item.parentId !== null;
            let precioUnitarioHTML;

            if (item.precioOferta && item.precioOferta > 0 && item.precioOferta < item.precioBaseOriginal) {
                precioUnitarioHTML = `
                    <del class="text-muted small">$${(item.precioBaseOriginal || 0).toLocaleString('es-CL')}</del> 
                    <strong class="text-danger ms-1">$${(item.precioOferta || 0).toLocaleString('es-CL')}</strong>
                `;
            } else {
                precioUnitarioHTML = `<strong>$${(item.precioNumerico || 0).toLocaleString('es-CL')}</strong>`;
            }

            const controlesCantidadHTML = item.permite_cantidad ?
                `<div class="cantidad-controles d-flex align-items-center mt-2">
                    <button class="btn btn-sm btn-outline-secondary btn-cantidad" data-accion="restar" data-id="${item.id}">-</button>
                    <input type="number" class="form-control form-control-sm quantity-input text-center" value="${item.cantidad}" min="1" data-id="${item.id}" style="width: 60px;">
                    <button class="btn btn-sm btn-outline-secondary btn-cantidad" data-accion="sumar" data-id="${item.id}">+</button>
                </div>` :
                `<span class="quantity-fixed mt-2 text-muted">Cantidad: ${item.cantidad}</span>`;

            // Añade la clase 'item-adicional' para aplicar estilos CSS de anidación
            const clasesAdicionales = isAdicional ? 'item-adicional' : '';

            return `
                <div class="cart-item d-flex align-items-center p-3 border-bottom ${clasesAdicionales}" data-id="${item.id}">
                    ${item.imagenUrl ? `<img src="${item.imagenUrl}" alt="${item.nombre}" class="item-imagen me-3">` : ''}
                    <div class="item-info flex-grow-1">
                        <h5 class="mb-1 d-flex align-items-center">${item.nombre}</h5>
                        ${item.descripcion ? `<p class="text-muted small mb-1">${item.descripcion}</p>` : ''}
                        <div class="item-details-row d-flex flex-wrap align-items-center mb-1">
                            <span class="text-muted small me-3">${precioUnitarioHTML} (c/u)</span>
                        </div>
                        ${item.descripcionOferta ? `<p class="text-success small mb-1 mt-1">${item.descripcionOferta}</p>` : ''}
                        ${!isAdicional ? `
                            <div class="item-fecha-selector mt-2">
                                <label class="form-label mb-0 small">Fecha Preferente:</label>
                                <input type="date" class="form-control form-control-sm date-input" value="${item.fechaInicio || ''}" min="${hoy}" data-id="${item.id}">
                            </div>
                        ` : ''}
                    </div>
                    <div class="item-controls d-flex flex-column justify-content-between align-items-end ms-3">
                        <button class="btn btn-sm btn-outline-danger btn-remove" data-id="${item.id}" title="Eliminar servicio"><i class="bi bi-trash"></i></button>
                        <div>
                            <div class="fw-bold text-nowrap item-total-price">$${itemTotalPrice.toLocaleString('es-CL')}</div>
                            ${controlesCantidadHTML}
                            ${isAdicional ? '<span class="badge bg-primary mt-1">Adicional</span>' : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        cartContainer.innerHTML = `
            <div class="cart-header bg-light p-3 rounded-top">
                <h4 class="m-0">
                    <i class="bi bi-cart-check me-2"></i>Resumen de Cotización
                    <span class="badge bg-primary float-end">${cart.length} items</span>
                </h4>
            </div>
            <div class="cart-body">${itemsHTML}</div>
            <div class="cart-footer bg-light p-3 rounded-bottom border-top">
                <div class="d-flex justify-content-between align-items-center">
                    <span class="fw-bold fs-5">Total Estimado:</span>
                    <span id="grand-total-price" class="fw-bold fs-4 text-danger">$${totalGeneral.toLocaleString('es-CL')}</span>
                </div>
                <small class="text-muted d-block mt-1"><i class="bi bi-info-circle"></i> No incluye traslados ni impuestos.</span>
            </div>
        `;
        
        updateJsonInput(cart);
        attachEventListeners();
    };

    // --- MANEJO DE EVENTOS DE LOS BOTONES DEL CARRITO ---
    const attachEventListeners = () => {
        cartContainer.addEventListener('click', e => {
            const target = e.target;
            const btnCantidad = target.closest('.btn-cantidad');
            const btnRemove = target.closest('.btn-remove');

            if (btnCantidad) {
                const itemId = btnCantidad.dataset.id;
                const accion = btnCantidad.dataset.accion;
                const input = cartContainer.querySelector(`.quantity-input[data-id="${itemId}"]`);
                if (!input) return;

                let currentQuantity = parseInt(input.value);
                let newQuantity = currentQuantity;

                if (accion === 'sumar') {
                    newQuantity++;
                } else if (accion === 'restar' && currentQuantity > 1) {
                    newQuantity--;
                }
                
                if (newQuantity !== currentQuantity) {
                    updateItemInDOM(itemId, newQuantity);
                }
            }

            if (btnRemove) {
                const itemId = btnRemove.dataset.id;
                let cart = getCartData();
                const itemToRemove = cart.find(i => i.id === itemId);

                if (itemToRemove) {
                    // Si es un item principal, eliminarlo junto con sus adicionales
                    if (itemToRemove.parentId === null) {
                        cart = cart.filter(i => i.id !== itemId && i.parentId !== itemId);
                    } else { // Si es un adicional, solo eliminar ese item
                        cart = cart.filter(i => i.id !== itemId);
                    }
                    saveCartData(cart);
                    renderCart(); // Re-renderizar todo, ya que la estructura del DOM cambió
                }
            }
        });

        cartContainer.addEventListener('change', e => {
            const target = e.target;

            if (target.matches('.quantity-input')) {
                const itemId = target.dataset.id;
                let newQuantity = parseInt(target.value);
                if (isNaN(newQuantity) || newQuantity < 1) {
                    newQuantity = 1;
                    target.value = 1;
                }
                updateItemInDOM(itemId, newQuantity);
            }

            if (target.matches('.date-input')) {
                const itemId = target.dataset.id;
                const newDate = target.value;
                let cart = getCartData();
                const item = cart.find(i => i.id === itemId);
                if (item) {
                    item.fechaInicio = newDate;
                    saveCartData(cart);
                }
            }
        });
    };
    
    // --- LÓGICA DE ENVÍO DE FORMULARIO (AJAX) ---
    if (formSolicitud) {
        formSolicitud.addEventListener('submit', async e => {
            e.preventDefault();
            if (getCartData().length === 0) {
                displayMessage('Tu carrito está vacío. Agrega servicios para poder cotizar.', 'warning');
                return;
            }

            const btnEnviar = document.getElementById('btn-enviar-solicitud');
            const btnText = document.getElementById('btn-text');
            const btnLoading = document.getElementById('btn-loading');

            // Mostrar spinner y deshabilitar botón
            btnText.classList.add('d-none');
            btnLoading.classList.remove('d-none');
            btnEnviar.disabled = true;

            // Limpiar errores de validación previos
            document.querySelectorAll('.form-field-error').forEach(el => el.textContent = '');
            document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

            try {
                const response = await fetch(formSolicitud.action, {
                    method: 'POST',
                    body: new FormData(formSolicitud),
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest' // Importante para que Django reconozca AJAX
                    }
                });
                const data = await response.json();

                if (response.ok && data.success) {
                    // Muestra el mensaje de éxito que viene del backend
                    displayMessage(data.message, 'success'); 
                    // Limpia el carrito del navegador
                    localStorage.removeItem('carritoCotizaciones');
                    // Vuelve a dibujar el carrito, que ahora se mostrará vacío
                    renderCart();
                    // Si el servidor envió una URL de WhatsApp, la abre en una nueva pestaña
                    if (data.whatsapp_url) {
                        window.open(data.whatsapp_url, '_blank');
                    }
                    // Espera 1.5 segundos y luego redirige a la página de éxito
                    setTimeout(() => {
                        window.location.href = data.redirect_url;
                    }, 1500);

                } else if (data.errors) {
                    // Si el backend devuelve errores de formulario, los muestra en la página
                    for (const field in data.errors) {
                        const errorEl = document.querySelector(`.form-field-error[data-for="${field}"]`);
                        const inputEl = document.querySelector(`[name="${field}"]`);
                        if (errorEl) errorEl.textContent = data.errors[field][0];
                        if (inputEl) inputEl.classList.add('is-invalid');
                    }
                    displayMessage('Por favor, corrige los errores en el formulario.', 'danger');
                } else {
                    // Muestra cualquier otro mensaje de error del servidor
                    displayMessage(data.message || 'Ocurrió un error inesperado.', 'danger');
                }

            } catch (error) {
                displayMessage('Error de conexión. Por favor, inténtalo de nuevo.', 'danger');
            } finally {
                // Vuelve a habilitar el botón de envío y oculta el spinner
                btnText.classList.remove('d-none');
                btnLoading.classList.add('d-none');
                btnEnviar.disabled = false;
            }
        });
    }

    // --- FUNCIÓN AUXILIAR PARA MOSTRAR MENSAJES DINÁMICOS ---
    const displayMessage = (message, type) => {
        const container = document.getElementById('dynamic-message-container');
        if (!container) return;
        const alert = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        container.innerHTML = alert;
    };
    
    // --- INICIALIZACIÓN ---
    // Dibuja el carrito en la página tan pronto como el DOM esté listo
    renderCart();
});