// js/components/carrito.js

document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENTOS DEL DOM ---
    const panelCarrito = document.getElementById('panel-carrito'); //
    const iconoCarrito = document.getElementById('icono-carrito-contenedor'); //
    const cerrarPanelBtn = document.getElementById('cerrar-panel'); //
    const contadorCarrito = document.getElementById('contador-carrito'); //
    const hoy = new Date().toISOString().split('T')[0]; //

    // --- ESTADO DEL CARRITO ---
    let carrito = JSON.parse(localStorage.getItem('carritoCotizaciones')) || []; //

    // --- FUNCIONES GLOBALES ---
    window.abrirPanelCarrito = () => panelCarrito?.classList.add('panel-visible'); //
    window.cerrarPanelCarrito = () => panelCarrito?.classList.remove('panel-visible'); //

    window.agregarAlCarrito = (itemData) => { //
        const itemExistente = carrito.find(item => item.id === itemData.id); //
        
        if (itemExistente && itemData.permite_cantidad) { //
            // Si el ítem ya existe y permite cantidad, solo actualiza la cantidad
            itemExistente.cantidad += parseInt(itemData.cantidad) || 1; //
        } else if (itemExistente) { //
            // Si el ítem ya existe y NO permite cantidad (o ya es un servicio principal), alerta
            alert('Este servicio ya fue agregado a tu cotización.'); //
            abrirPanelCarrito(); //
            return; //
        } else {
            // Añadir el nuevo ítem con todos sus datos
            const precio = parseFloat(itemData.precioNumerico); //
            if (!itemData.id || !itemData.nombre) { //
                console.warn('Intento de agregar un item incompleto al carrito:', itemData); //
                return; //
            }
            carrito.push({ //
                id: itemData.id, //
                nombre: itemData.nombre, //
                imagenUrl: itemData.imagenUrl, //
                precioNumerico: isNaN(precio) ? 0 : precio, // Precio efectivo (base o de oferta)
                precioBaseOriginal: itemData.precioBaseOriginal || 0, // Precio base original
                precioOferta: itemData.precioOferta || 0, // Precio de oferta (0 si no aplica)
                cantidad: parseInt(itemData.cantidad) || 1, //
                permite_cantidad: itemData.permite_cantidad, //
                parentId: itemData.parentId || null, //
                fechaInicio: itemData.fechaInicio || null, // Permitir que la fecha se pase si viene
                // Nuevos campos del modelo Servicio
                descripcion: itemData.descripcion || '', //
                tipo_servicio: itemData.tipo_servicio || 'INDEPENDIENTE', //
                destacado: itemData.destacado || false, //
                has_tiered_pricing: itemData.has_tiered_pricing || false, //
                max_guests: itemData.max_guests || null, //
                duration_hours: itemData.duration_hours || null, //
                descripcionOferta: itemData.descripcionOferta || '' // Descripción de la oferta
            });
        }
        guardarYRenderizarTodo(); //
    };

    // --- LÓGICA DE RENDERIZADO ---
    const renderizarPanelCompleto = () => { //
        if (!panelCarrito) return; //
        const panelItemsContainer = panelCarrito.querySelector('#panel-carrito-items'); //
        if (!panelItemsContainer) return; //

        panelItemsContainer.innerHTML = generarItemsHTML(); //

        // Si el footer ya existe, no lo elimines para evitar parpadeos si se actualiza a menudo
        // En su lugar, actualiza su contenido o recréalo si no existe
        let footer = document.getElementById('panel-carrito-footer'); //
        if (footer) { //
            footer.remove(); // Remueve el viejo para asegurar que se adjunte el nuevo
        }
        const footerHTML = generarFooterHTML(); //
        if (footerHTML) { //
            panelItemsContainer.insertAdjacentHTML('afterend', footerHTML); //
            // Re-adjuntar eventos a los botones del footer si los hubiera
        }
    };
    
    const generarItemsHTML = () => { //
        if (carrito.length === 0) { //
            return `<div class="carrito-vacio"><i class="bi bi-cart-x"></i><p>Tu carrito está vacío.</p><span>Agrega servicios para cotizar.</span></div>`; //
        }
        
        let html = ''; //
        // Ordenar ítems: principales primero, luego adicionales, y adicionales agrupados por su principal
        const serviciosPrincipales = carrito.filter(item => item.parentId === null); //
        const adicionales = carrito.filter(item => item.parentId !== null); //

        serviciosPrincipales.forEach(principal => { //
            html += crearItemHTML(principal); //
            adicionales.filter(ad => ad.parentId === principal.id).forEach(ad => { //
                html += crearItemHTML(ad); //
            });
        });
        return html; //
    };

    const crearItemHTML = (item) => { //
        const esAditivo = item.parentId !== null; //
        const claseAditivo = esAditivo ? 'item-aditivo ps-3 border-start border-2 ms-2' : ''; // Clase para indentar adicionales
        
        // Calcular precio total del ítem (precio efectivo * cantidad)
        const precioTotalItem = (item.precioNumerico || 0) * (item.cantidad || 1); //

        // HTML del precio unitario (con o sin oferta)
        let precioUnitarioHTML; //
        if (item.precioOferta && item.precioOferta > 0 && item.precioOferta < item.precioBaseOriginal) { //
            precioUnitarioHTML = `
                <del class="text-muted small">$${(item.precioBaseOriginal || 0).toLocaleString('es-CL')}</del>
                <strong class="text-danger ms-1">$${(item.precioOferta || 0).toLocaleString('es-CL')}</strong>
            `; //
        } else {
            precioUnitarioHTML = `<strong>$${(item.precioNumerico || 0).toLocaleString('es-CL')}</strong>`; //
        }

        const controlesCantidadHTML = item.permite_cantidad ? //
            `<div class="cantidad-controles d-flex align-items-center mt-2">
                <button class="btn btn-sm btn-outline-secondary btn-cantidad me-1" data-accion="restar" data-id="${item.id}">-</button>
                <input type="number" class="form-control form-control-sm cantidad-input text-center" value="${item.cantidad}" min="1" data-id="${item.id}" style="width: 50px;">
                <button class="btn btn-sm btn-outline-secondary btn-cantidad ms-1" data-accion="sumar" data-id="${item.id}">+</button>
            </div>` :
            `<span class="cantidad-fija mt-2">x ${item.cantidad}</span>`; //

        return `
            <div class="item-carrito d-flex align-items-start mb-3 pb-3 border-bottom ${claseAditivo}" data-id="${item.id}">
                ${item.imagenUrl ? `<img src="${item.imagenUrl}" alt="${item.nombre}" class="item-imagen me-3 rounded">` : ''}
                <div class="item-info flex-grow-1">
                    <p class="item-nombre fw-bold mb-1">${item.nombre}</p>
                    <div class="text-muted small">
                        ${precioUnitarioHTML}
                        ${item.has_tiered_pricing ? '<span class="badge bg-secondary ms-1">Nivel</span>' : ''}
                    </div>
                    ${item.descripcionOferta ? `<p class="text-success small mb-1 mt-1">${item.descripcionOferta}</p>` : ''}
                    ${item.tipo_servicio && item.tipo_servicio !== 'INDEPENDIENTE' ? `<span class="badge bg-info mt-1">${item.tipo_servicio.replace('_', ' ')}</span>` : ''}
                    ${item.destacado ? '<span class="badge bg-warning text-dark ms-1" title="Servicio Destacado"><i class="bi bi-star-fill"></i></span>' : ''}
                    
                    ${item.fechaInicio && !esAditivo ? `
                        <div class="item-fecha-selector mt-2">
                            <label class="form-label mb-0 small">Fecha:</label>
                            <input type="date" class="form-control form-control-sm fecha-inicio" value="${item.fechaInicio || ''}" min="${hoy}" data-id="${item.id}" title="Seleccionar fecha">
                        </div>` : ''}

                    ${(item.max_guests || item.duration_hours) && item.tipo_servicio === 'PACK' ? `
                        <div class="pack-details mt-2 small text-muted">
                            ${item.max_guests ? `<span class="me-2"><i class="bi bi-people-fill me-1"></i>Max. ${item.max_guests}</span>` : ''}
                            ${item.duration_hours ? `<span><i class="bi bi-clock-fill me-1"></i>${item.duration_hours} Hrs</span>` : ''}
                        </div>` : ''}
                </div>
                <div class="item-controles text-end d-flex flex-column justify-content-between align-items-end"> <button class="btn btn-sm btn-outline-danger btn-eliminar" data-id="${item.id}" title="Eliminar">&times;</button> <div> <div class="fw-bold text-nowrap fs-5">$${precioTotalItem.toLocaleString('es-CL')}</div>
                        ${controlesCantidadHTML}
                        ${item.parentId ? '<span class="badge bg-secondary mt-1">Adicional</span>' : ''}
                    </div>
                </div>
            </div>`; //
    };

    const generarFooterHTML = () => { //
        if (carrito.length === 0) return ''; //

        const totalServiciosPrincipales = carrito.filter(item => item.parentId === null).reduce((sum, item) => sum + ((item.precioNumerico || 0) * (item.cantidad || 1)), 0); //
        const totalAdicionales = carrito.filter(item => item.parentId !== null).reduce((sum, item) => sum + ((item.precioNumerico || 0) * (item.cantidad || 1)), 0); //
        const totalGeneral = totalServiciosPrincipales + totalAdicionales; //
        
        return `
            <div class="panel-carrito-footer" id="panel-carrito-footer">
                <div class="calculo-fila"><span>Subtotal Servicios:</span><span class="fw-bold">$ ${totalServiciosPrincipales.toLocaleString('es-CL')}</span></div>
                ${totalAdicionales > 0 ? `<div class="calculo-fila"><span>Subtotal Adicionales:</span><span class="fw-bold">$ ${totalAdicionales.toLocaleString('es-CL')}</span></div>` : ''}
                <hr class="my-2">
                <div class="calculo-fila total-final"><span>Total Estimado:</span><span class="total-monto">$ ${totalGeneral.toLocaleString('es-CL')}</span></div>
                <div class="nota-adicional"><i class="bi bi-truck"></i><span>+ Costo de Traslado (a definir)</span></div>
                <div class="nota-adicional"><i class="bi bi-receipt"></i><span>+ IVA 19% (si requiere factura)</span></div>
                <a href="/solicitar-cotizacion/" class="btn btn-danger w-100 mt-3"><i class="bi bi-send-fill"></i> Ir a Cotizar</a>
            </div>`; //
    };

    const actualizarContadorIcono = () => { //
        if (!contadorCarrito) return; //
        contadorCarrito.textContent = carrito.length; //
        contadorCarrito.style.display = carrito.length > 0 ? 'flex' : 'none'; //
    };

    const guardarYRenderizarTodo = () => { //
        localStorage.setItem('carritoCotizaciones', JSON.stringify(carrito)); //
        renderizarPanelCompleto(); //
        actualizarContadorIcono(); //
    };

    // --- MANEJO DE EVENTOS ---
    const manejarEventosPanel = (e) => { //
        const itemContainer = e.target.closest('.item-carrito'); //
        // No salimos si no hay itemContainer para permitir clics en el footer, etc.
        
        // Manejo de botones de cantidad
        if (e.target.matches('.btn-cantidad')) { //
            e.stopPropagation(); // Evitar que el clic se propague al documento
            const accion = e.target.dataset.accion; //
            const itemId = e.target.dataset.id; //
            const item = carrito.find(i => i.id === itemId); //
            if (item) { //
                if (accion === 'sumar') item.cantidad++; //
                else if (accion === 'restar' && item.cantidad > 1) item.cantidad--; //
                guardarYRenderizarTodo(); //
            }
        } 
        // Manejo de eliminar ítem
        else if (e.target.matches('.btn-eliminar')) { //
            e.stopPropagation(); // Evitar que el clic se propague al documento
            const deleteBtn = e.target.closest('.btn-eliminar'); //
            const itemId = deleteBtn.dataset.id; //
            const item = carrito.find(i => i.id === itemId); //
            
            if (item) { //
                if (item.parentId === null) { //
                    // Si es un servicio principal, elimina también sus adicionales
                    carrito = carrito.filter(i => i.id !== itemId && i.parentId !== itemId); //
                } else {
                    // Si es un adicional, solo elimina ese
                    carrito = carrito.filter(i => i.id !== itemId); //
                }
                guardarYRenderizarTodo(); //
                // **NO CERRAR EL PANEL AQUÍ**
            }
        } 
        // Manejo de cambio en input de cantidad
        else if (e.type === 'change' && e.target.matches('.cantidad-input')) { //
            e.stopPropagation(); //
            const itemId = e.target.dataset.id; //
            const nuevaCantidad = parseInt(e.target.value); //
            const item = carrito.find(i => i.id === itemId); //
            if (item) { //
                item.cantidad = isNaN(nuevaCantidad) || nuevaCantidad < 1 ? 1 : nuevaCantidad; //
                guardarYRenderizarTodo(); //
            }
        } 
        // Manejo de cambio en input de fecha
        else if (e.type === 'change' && e.target.matches('.fecha-inicio')) { //
            e.stopPropagation(); //
            const itemId = e.target.dataset.id; //
            const nuevaFecha = e.target.value; //
            const item = carrito.find(i => i.id === itemId); //
            if (item) { //
                item.fechaInicio = nuevaFecha; //
                guardarYRenderizarTodo(); //
            }
        }
    };

    panelCarrito?.addEventListener('click', manejarEventosPanel); //
    panelCarrito?.addEventListener('change', manejarEventosPanel); //

    // --- LISTENERS GENERALES ---
    iconoCarrito?.addEventListener('click', (e) => { //
        e.stopPropagation(); // Evita que el clic en el ícono se propague al documento
        abrirPanelCarrito(); //
    });

    cerrarPanelBtn?.addEventListener('click', cerrarPanelCarrito); //

    // --- FUNCIONALIDAD: CERRAR AL HACER CLIC FUERA ---
    // NO MODIFICAR ESTO PARA EVITAR CERRAR AL ELIMINAR.
    // La eliminación ya usa e.stopPropagation() para evitar que el evento llegue aquí.
    document.addEventListener('click', (e) => { //
        if (!panelCarrito || !iconoCarrito) return; //
        
        // Comprueba si el panel está visible y si el clic NO fue dentro del panel
        const isClickInsidePanel = panelCarrito.contains(e.target); //
        const isClickOnCartIcon = iconoCarrito.contains(e.target); //
        
        // Cierra el panel si está visible y el clic fue FUERA del panel Y FUERA del ícono
        if (panelCarrito.classList.contains('panel-visible') && !isClickInsidePanel && !isClickOnCartIcon) { //
            cerrarPanelCarrito(); //
        }
    });
    
    // --- INICIALIZACIÓN ---
    guardarYRenderizarTodo(); //
});