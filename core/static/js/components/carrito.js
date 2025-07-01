// js/components/carrito.js (Versión Final Actualizada)

document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENTOS DEL DOM ---
    const panelCarrito = document.getElementById('panel-carrito');
    const iconoCarrito = document.getElementById('icono-carrito-contenedor');
    const cerrarPanelBtn = document.getElementById('cerrar-panel');
    const contadorCarrito = document.getElementById('contador-carrito');
    const hoy = new Date().toISOString().split('T')[0];

    // --- ESTADO DEL CARRITO ---
    let carrito = JSON.parse(localStorage.getItem('carritoCotizaciones')) || [];

    // --- FUNCIONES GLOBALES ---
    window.abrirPanelCarrito = () => panelCarrito?.classList.add('panel-visible');
    window.cerrarPanelCarrito = () => panelCarrito?.classList.remove('panel-visible');

    // --- CAMBIADO: Lógica de 'agregarAlCarrito' mejorada para manejar límites y tiers ---
    window.agregarAlCarrito = (itemData) => {
        const itemExistente = carrito.find(item => item.id === itemData.id);
        
        if (itemExistente && itemExistente.permite_cantidad) {
            const max = itemExistente.max_cantidad;
            const cantidadPropuesta = itemExistente.cantidad + (parseInt(itemData.cantidad) || 1);

            // Verifica si se excede el límite
            if (max && cantidadPropuesta > max) {
                alert(`Lo sentimos, solo puedes agregar un máximo de ${max} unidades de este servicio.`);
                abrirPanelCarrito();
                return; // Detiene la ejecución si se excede el límite
            }
            itemExistente.cantidad = cantidadPropuesta;

        } else if (itemExistente) {
            alert('Este servicio u opción ya fue agregado a tu cotización.');
            abrirPanelCarrito();
            return;

        } else {
            // Añade el nuevo ítem
            const precio = parseFloat(itemData.precioNumerico);
            if (!itemData.id || !itemData.nombre) {
                console.warn('Intento de agregar un ítem incompleto al carrito:', itemData);
                return;
            }
            carrito.push({
                id: itemData.id,
                nombre: itemData.nombre,
                imagenUrl: itemData.imagenUrl,
                precioNumerico: isNaN(precio) ? 0 : precio,
                precioBaseOriginal: itemData.precioBaseOriginal || 0,
                precioOferta: itemData.precioOferta || 0,
                cantidad: parseInt(itemData.cantidad) || 1,
                // --- NUEVOS CAMPOS AÑADIDOS ---
                permite_cantidad: itemData.permite_cantidad || false,
                max_cantidad: itemData.max_cantidad || null,
                // ---
                parentId: itemData.parentId || null,
                fechaInicio: itemData.fechaInicio || null,
                descripcion: itemData.descripcion || '',
                tipo_servicio: itemData.tipo_servicio || 'INDEPENDIENTE',
                descripcionOferta: itemData.descripcionOferta || ''
            });
        }
        guardarYRenderizarTodo();
    };

    // --- LÓGICA DE RENDERIZADO ---
    const renderizarPanelCompleto = () => {
        if (!panelCarrito) return;
        const panelItemsContainer = panelCarrito.querySelector('#panel-carrito-items');
        if (!panelItemsContainer) return;

        panelItemsContainer.innerHTML = generarItemsHTML();

        let footer = document.getElementById('panel-carrito-footer');
        if (footer) {
            footer.remove();
        }
        const footerHTML = generarFooterHTML();
        if (footerHTML) {
            panelItemsContainer.insertAdjacentHTML('afterend', footerHTML);
        }
    };
    
    const generarItemsHTML = () => {
        if (carrito.length === 0) {
            return `<div class="carrito-vacio"><i class="bi bi-cart-x"></i><p>Tu carrito está vacío.</p><span>Agrega servicios para cotizar.</span></div>`;
        }
        return carrito.map(item => crearItemHTML(item)).join('');
    };

    // --- CAMBIADO: 'crearItemHTML' mejorado para reflejar el nombre del tier y los límites de cantidad ---
    const crearItemHTML = (item) => {
        const precioTotalItem = (item.precioNumerico || 0) * (item.cantidad || 1);
        let precioUnitarioHTML;

        // Muestra precio tachado si hay oferta (solo para servicios de precio único)
        if (item.precioOferta && item.precioOferta > 0 && item.precioOferta < item.precioBaseOriginal) {
             precioUnitarioHTML = `<del class="text-muted small">$${(item.precioBaseOriginal).toLocaleString('es-CL')}</del> <strong class="text-danger ms-1">$${(item.precioOferta).toLocaleString('es-CL')}</strong>`;
        } else {
            precioUnitarioHTML = `<strong>$${(item.precioNumerico || 0).toLocaleString('es-CL')}</strong>`;
        }

        // Lógica de Controles de Cantidad Mejorada
        let controlesCantidadHTML = '';
        if (item.permite_cantidad) {
            const maxAttr = item.max_cantidad ? `max="${item.max_cantidad}"` : '';
            controlesCantidadHTML = `
            <div class="cantidad-controles d-flex align-items-center mt-2">
                <button class="btn btn-sm btn-outline-secondary btn-cantidad" data-accion="restar" data-id="${item.id}">-</button>
                <input type="number" class="form-control form-control-sm cantidad-input text-center mx-1" value="${item.cantidad}" min="1" ${maxAttr} data-id="${item.id}" style="width: 60px;">
                <button class="btn btn-sm btn-outline-secondary btn-cantidad" data-accion="sumar" data-id="${item.id}">+</button>
            </div>`;
        } else {
            controlesCantidadHTML = `<span class="cantidad-fija mt-2">x ${item.cantidad}</span>`;
        }
        
        const esAditivo = item.parentId !== null;
        const claseAditivo = esAditivo ? 'item-aditivo ps-3 border-start border-2 ms-2' : '';

        return `
            <div class="item-carrito d-flex align-items-start mb-3 pb-3 border-bottom ${claseAditivo}" data-id="${item.id}">
                ${item.imagenUrl ? `<img src="${item.imagenUrl}" alt="${item.nombre}" class="item-imagen me-3 rounded">` : ''}
                <div class="item-info flex-grow-1">
                    <p class="item-nombre fw-bold mb-1">${item.nombre}</p>
                    <div class="text-muted small"> ${precioUnitarioHTML} </div>
                    ${item.descripcionOferta ? `<p class="text-success small mb-1 mt-1">${item.descripcionOferta}</p>` : ''}
                    ${esAditivo ? '<span class="badge bg-info mt-1">Adicional</span>' : ''}
                </div>
                <div class="item-controles text-end d-flex flex-column justify-content-between align-items-end" style="min-height: 70px;">
                    <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${item.id}" title="Eliminar">&times;</button>
                    <div>
                        <div class="fw-bold text-nowrap fs-5">$${precioTotalItem.toLocaleString('es-CL')}</div>
                        ${controlesCantidadHTML}
                    </div>
                </div>
            </div>`;
    };

    const generarFooterHTML = () => {
        if (carrito.length === 0) return '';
        const totalGeneral = carrito.reduce((sum, item) => sum + ((item.precioNumerico || 0) * (item.cantidad || 1)), 0);
        
        return `
            <div class="panel-carrito-footer" id="panel-carrito-footer">
                <div class="calculo-fila total-final"><span>Total Estimado:</span><span class="total-monto">$ ${totalGeneral.toLocaleString('es-CL')}</span></div>
                <div class="nota-adicional"><i class="bi bi-truck"></i><span>+ Costo de Traslado (a definir)</span></div>
                <div class="nota-adicional"><i class="bi bi-receipt"></i><span>+ IVA 19% (si requiere factura)</span></div>
                <a href="/solicitar-cotizacion/" class="btn btn-danger w-100 mt-3"><i class="bi bi-send-fill"></i> Ir a Cotizar</a>
            </div>`;
    };

    const actualizarContadorIcono = () => {
        if (!contadorCarrito) return;
        contadorCarrito.textContent = carrito.length;
        contadorCarrito.style.display = carrito.length > 0 ? 'flex' : 'none';
    };

    const guardarYRenderizarTodo = () => {
        localStorage.setItem('carritoCotizaciones', JSON.stringify(carrito));
        renderizarPanelCompleto();
        actualizarContadorIcono();
    };

    // --- CAMBIADO: 'manejarEventosPanel' mejorado para respetar los límites de cantidad ---
    const manejarEventosPanel = (e) => {
        const target = e.target;
        const itemContainer = target.closest('.item-carrito');
        if (!itemContainer) return;

        const itemId = itemContainer.dataset.id;
        const item = carrito.find(i => i.id === itemId);
        if (!item) return;

        // Botones +/-
        if (target.matches('.btn-cantidad')) {
            e.stopPropagation();
            const accion = target.dataset.accion;
            const max = item.max_cantidad;
            if (accion === 'sumar' && (!max || item.cantidad < max)) {
                item.cantidad++;
            } else if (accion === 'restar' && item.cantidad > 1) {
                item.cantidad--;
            }
            guardarYRenderizarTodo();
        }
        // Input de cantidad directo
        else if (target.matches('.cantidad-input') && e.type === 'change') {
            e.stopPropagation();
            let nuevaCantidad = parseInt(target.value);
            const max = item.max_cantidad;

            if (isNaN(nuevaCantidad) || nuevaCantidad < 1) {
                nuevaCantidad = 1;
            } else if (max && nuevaCantidad > max) {
                alert(`Solo puedes seleccionar un máximo de ${max} unidades.`);
                nuevaCantidad = max;
            }
            item.cantidad = nuevaCantidad;
            guardarYRenderizarTodo();
        }
        // Eliminar ítem
        else if (target.matches('.btn-eliminar')) {
            e.stopPropagation();
            // Si el item es un servicio principal, elimina también sus adicionales
            if(item.parentId === null) {
                carrito = carrito.filter(i => i.id !== itemId && i.parentId !== itemId);
            } else {
                carrito = carrito.filter(i => i.id !== itemId);
            }
            guardarYRenderizarTodo();
        }
    };

    panelCarrito?.addEventListener('click', manejarEventosPanel);
    panelCarrito?.addEventListener('change', manejarEventosPanel);

    // --- LISTENERS GENERALES ---
    iconoCarrito?.addEventListener('click', (e) => {
        e.stopPropagation();
        abrirPanelCarrito();
    });

    cerrarPanelBtn?.addEventListener('click', cerrarPanelCarrito);

    document.addEventListener('click', (e) => {
        if (!panelCarrito || !iconoCarrito) return;
        const isClickInsidePanel = panelCarrito.contains(e.target);
        const isClickOnCartIcon = iconoCarrito.contains(e.target);
        
        if (panelCarrito.classList.contains('panel-visible') && !isClickInsidePanel && !isClickOnCartIcon) {
            cerrarPanelCarrito();
        }
    });
    
    // --- INICIALIZACIÓN ---
    guardarYRenderizarTodo();
});