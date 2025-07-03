// js/components/carrito.js (Versión Final Actualizada: FIX DEFINITIVO para abrir/cerrar panel + DEBUG logs)

document.addEventListener('DOMContentLoaded', () => {
    console.log('DEBUG: carrito.js - DOMContentLoaded event fired. (Versión con FIX de panel)');

    // --- ELEMENTOS DEL DOM ---
    // Estas definiciones deben estar dentro de DOMContentLoaded para asegurar que los elementos existen.
    const panelCarrito = document.getElementById('panel-carrito');
    const iconoCarrito = document.getElementById('icono-carrito-contenedor');
    const cerrarPanelBtn = document.getElementById('cerrar-panel');
    const contadorCarrito = document.getElementById('contador-carrito');
    const hoy = new Date().toISOString().split('T')[0];

    console.log('DEBUG: carrito.js - panelCarrito encontrado:', panelCarrito);
    console.log('DEBUG: carrito.js - iconoCarrito encontrado:', iconoCarrito);
    console.log('DEBUG: carrito.js - contadorCarrito encontrado:', contadorCarrito);

    // --- ESTADO DEL CARRITO ---
    let carrito = JSON.parse(localStorage.getItem('carritoCotizaciones')) || [];
    console.log('DEBUG: carrito.js - Carrito cargado de localStorage:', carrito);

    // --- FUNCIONES GLOBALES (DEFINIDAS AQUI, DESPUES DE QUE LOS ELEMENTOS DOM SE HAN OBTENIDO) ---
    window.abrirPanelCarrito = () => {
        console.log('DEBUG: carrito.js - Función window.abrirPanelCarrito() llamada.');
        if (panelCarrito) {
            panelCarrito.classList.add('panel-visible');
            console.log('DEBUG: carrito.js - Clase "panel-visible" añadida al panel.');
            // Opcional: Asegúrate de que el body no haga scroll cuando el panel esté abierto
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = 'var(--bs-gutter-x)'; // Para evitar salto de página
        } else {
            console.error("Error: carrito.js - El panel del carrito (panelCarrito) es null o no se encontró en el DOM para abrir.");
        }
    };
    window.cerrarPanelCarrito = () => {
        console.log('DEBUG: carrito.js - Función window.cerrarPanelCarrito() llamada.');
        if (panelCarrito) {
            panelCarrito.classList.remove('panel-visible');
            console.log('DEBUG: carrito.js - Clase "panel-visible" removida del panel.');
            // Opcional: Restaura el scroll del body
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }
    };

    // --- Lógica de 'agregarAlCarrito' mejorada ---
    window.agregarAlCarrito = (itemData) => {
        console.log('DEBUG: carrito.js - agregarAlCarrito() llamado para:', itemData.nombre);
        const itemExistente = carrito.find(item => item.id === itemData.id);
        let message = '';
        let itemSuccessfullyAddedOrUpdated = false;

        if (itemExistente) {
            console.log('DEBUG: carrito.js - Ítem existente:', itemData.nombre);
            if (itemExistente.permite_cantidad) {
                const max = itemExistente.max_cantidad;
                const cantidadPropuesta = itemExistente.cantidad + (parseInt(itemData.cantidad) || 1);

                if (max && cantidadPropuesta > max) {
                    message = `Lo sentimos, solo puedes agregar un máximo de ${max} unidades de este servicio: ${itemData.nombre}.`;
                } else {
                    itemExistente.cantidad = cantidadPropuesta;
                    itemSuccessfullyAddedOrUpdated = true;
                    message = `Cantidad de "${itemData.nombre}" actualizada.`;
                }
            } else {
                message = `"${itemData.nombre}" ya está en tu cotización.`;
            }
        } else {
            const precio = parseFloat(itemData.precioNumerico);
            if (!itemData.id || !itemData.nombre || isNaN(precio)) {
                console.warn('Intento de agregar un ítem incompleto o con precio no válido al carrito:', itemData);
                return { added: false, message: 'Datos de ítem no válidos.' };
            }
            carrito.push({
                id: itemData.id,
                nombre: itemData.nombre,
                imagenUrl: itemData.imagenUrl,
                precioNumerico: precio,
                precioBaseOriginal: itemData.precioBaseOriginal || 0,
                precioOferta: itemData.precioOferta || 0,
                cantidad: parseInt(itemData.cantidad) || 1,
                permite_cantidad: itemData.permite_cantidad || false,
                max_cantidad: itemData.max_cantidad || null,
                parentId: itemData.parentId || null,
                fechaInicio: itemData.fechaInicio || null,
                descripcion: itemData.descripcion || '',
                tipo_servicio: itemData.tipo_servicio || 'INDEPENDIENTE',
                descripcionOferta: itemData.descripcionOferta || ''
            });
            itemSuccessfullyAddedOrUpdated = true;
            message = `"${itemData.nombre}" añadido a tu cotización.`;
        }

        guardarYRenderizarTodo();
        
        return { added: itemSuccessfullyAddedOrUpdated, message: message };
    };

    // --- LÓGICA DE RENDERIZADO ---
    const renderizarPanelCompleto = () => {
        console.log('DEBUG: carrito.js - renderizarPanelCompleto() llamado.');
        if (!panelCarrito) { console.error("Error: panelCarrito es null en renderizarPanelCompleto."); return; }
        const panelItemsContainer = panelCarrito.querySelector('#panel-carrito-items');
        if (!panelItemsContainer) { console.error("Error: panel-carrito-items no encontrado en renderizarPanelCompleto."); return; }

        panelItemsContainer.innerHTML = generarItemsHTML();
        console.log('DEBUG: carrito.js - Ítems HTML generados y actualizados.');

        let footer = document.getElementById('panel-carrito-footer');
        if (footer) {
            footer.remove();
        }
        const footerHTML = generarFooterHTML();
        if (footerHTML) {
            panelItemsContainer.insertAdjacentHTML('afterend', footerHTML);
            console.log('DEBUG: carrito.js - Footer HTML generado y añadido.');
        }
    };
    
    // CAMBIADO: 'generarItemsHTML' para agrupar ítems principales y sus adicionales
    const generarItemsHTML = () => {
        if (carrito.length === 0) {
            return `<div class="carrito-vacio"><i class="bi bi-cart-x"></i><p>Tu carrito está vacío.</p><span>Agrega servicios para cotizar.</span></div>`;
        }

        let htmlContent = '';
        const mainServices = carrito.filter(item => item.parentId === null).sort((a, b) => {
            return a.id.localeCompare(b.id); 
        });

        mainServices.forEach(mainItem => {
            htmlContent += crearItemHTML(mainItem);

            const additionalItems = carrito.filter(item => item.parentId === mainItem.id)
                                          .sort((a, b) => a.id.localeCompare(b.id));
            additionalItems.forEach(adicional => {
                htmlContent += crearItemHTML(adicional, true); 
            });
        });

        return htmlContent;
    };

    // CAMBIADO: 'crearItemHTML' ahora acepta un parámetro para indicar si es un adicional
    const crearItemHTML = (item, isNestedAddon = false) => {
        const precioTotalItem = (item.precioNumerico || 0) * (item.cantidad || 1);
        let precioUnitarioHTML;

        if (item.precioOferta && item.precioOferta > 0 && item.precioOferta < item.precioBaseOriginal) {
             precioUnitarioHTML = `<del class="text-muted small">$${(item.precioBaseOriginal).toLocaleString('es-CL')}</del> <strong class="text-danger ms-1">$${(item.precioOferta).toLocaleString('es-CL')}</strong>`;
        } else {
            precioUnitarioHTML = `<strong>$${(item.precioNumerico || 0).toLocaleString('es-CL')}</strong>`;
        }

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
        
        const claseAditivoVisual = isNestedAddon ? 'item-aditivo-visual ps-3 border-start border-2 ms-2' : '';
        const badgeAdicional = item.parentId !== null ? '<span class="badge bg-info mt-1">Adicional</span>' : '';

        return `
            <div class="item-carrito d-flex align-items-start mb-3 pb-3 border-bottom ${claseAditivoVisual}" data-id="${item.id}">
                ${item.imagenUrl ? `<img src="${item.imagenUrl}" alt="${item.nombre}" class="item-imagen me-3 rounded">` : ''}
                <div class="item-info flex-grow-1">
                    <p class="item-nombre fw-bold mb-1">${item.nombre}</p>
                    <div class="text-muted small"> ${precioUnitarioHTML} </div>
                    ${item.descripcionOferta ? `<p class="text-success small mb-1 mt-1">${item.descripcionOferta}</p>` : ''}
                    ${badgeAdicional}
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
        const numItemsPrincipales = carrito.filter(item => item.parentId === null).length;
        contadorCarrito.textContent = numItemsPrincipales; 
        contadorCarrito.style.display = numItemsPrincipales > 0 ? 'flex' : 'none';
    };

    const guardarYRenderizarTodo = () => {
        localStorage.setItem('carritoCotizaciones', JSON.stringify(carrito));
        renderizarPanelCompleto();
        actualizarContadorIcono();
    };

    // --- Manejar eventos del panel ---
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
        console.log('DEBUG: carrito.js - Click en icono carrito.');
        e.stopPropagation();
        window.abrirPanelCarrito();
    });

    cerrarPanelBtn?.addEventListener('click', () => {
        console.log('DEBUG: carrito.js - Click en cerrar panel.');
        window.cerrarPanelCarrito();
    });

    document.addEventListener('click', (e) => {
        if (!panelCarrito || !iconoCarrito) return;
        const isClickInsidePanel = panelCarrito.contains(e.target);
        const isClickOnCartIcon = iconoCarrito.contains(e.target);
        
        if (panelCarrito.classList.contains('panel-visible') && !isClickInsidePanel && !isClickOnCartIcon) {
            console.log('DEBUG: carrito.js - Click fuera del panel, cerrando.');
            window.cerrarPanelCarrito();
        }
    });
    
    // --- INICIALIZACIÓN ---
    console.log('DEBUG: carrito.js - Iniciando script, llamando a guardarYRenderizarTodo().');
    guardarYRenderizarTodo();
});