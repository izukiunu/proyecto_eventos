// js/components/carrito.js

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

    window.agregarAlCarrito = (itemData) => {
        const itemExistente = carrito.find(item => item.id === itemData.id);
        
        if (itemExistente && itemData.permite_cantidad) {
            itemExistente.cantidad += parseInt(itemData.cantidad) || 1;
        } else if (itemExistente) {
            alert('Este servicio ya fue agregado a tu cotización.');
            abrirPanelCarrito();
            return;
        } else {
            const precio = parseFloat(itemData.precioNumerico);
            carrito.push({
                id: itemData.id,
                nombre: itemData.nombre,
                imagenUrl: itemData.imagenUrl,
                precioNumerico: isNaN(precio) ? 0 : precio,
                cantidad: parseInt(itemData.cantidad) || 1,
                permite_cantidad: itemData.permite_cantidad,
                parentId: itemData.parentId || null,
                fechaInicio: null
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

        const footerViejo = document.getElementById('panel-carrito-footer');
        if (footerViejo) footerViejo.remove();

        const footerHTML = generarFooterHTML();
        if (footerHTML) {
            panelItemsContainer.insertAdjacentHTML('afterend', footerHTML);
        }
    };
    
    const generarItemsHTML = () => {
        if (carrito.length === 0) {
            return `<div class="carrito-vacio"><i class="bi bi-cart-x"></i><p>Tu carrito está vacío.</p><span>Agrega servicios para cotizar.</span></div>`;
        }
        
        let html = '';
        carrito.filter(item => item.parentId === null).forEach(principal => {
            html += crearItemHTML(principal);
            carrito.filter(item => item.parentId === principal.id).forEach(adicional => {
                html += crearItemHTML(adicional);
            });
        });
        return html;
    };

    const crearItemHTML = (item) => {
        const esAditivo = item.parentId !== null;
        const claseAditivo = esAditivo ? 'item-aditivo' : '';
        const precioTotalItem = (item.precioNumerico || 0) * (item.cantidad || 1);
        const controlesCantidadHTML = item.permite_cantidad ?
            `<div class="cantidad-controles"><button class="btn-cantidad" data-accion="restar" data-id="${item.id}">-</button><input type="number" class="cantidad-input" value="${item.cantidad}" min="1" data-id="${item.id}"><button class="btn-cantidad" data-accion="sumar" data-id="${item.id}">+</button></div>` :
            `<span class="cantidad-fija">x ${item.cantidad}</span>`;

        return `
            <div class="item-carrito ${claseAditivo}" data-id="${item.id}">
                <img src="${item.imagenUrl}" alt="${item.nombre}" class="item-imagen">
                <div class="item-info">
                    <p class="item-nombre">${item.nombre}</p>
                    <p class="item-precio">$ ${precioTotalItem.toLocaleString('es-CL')}</p>
                    ${!esAditivo ? `<div class="item-fecha-selector mt-2"><input type="date" class="form-control form-control-sm fecha-inicio" value="${item.fechaInicio || ''}" min="${hoy}" title="Seleccionar fecha"></div>` : ''}
                </div>
                <div class="item-controles">${controlesCantidadHTML}<button class="btn-eliminar" data-id="${item.id}" title="Eliminar">&times;</button></div>
            </div>`;
    };

    const generarFooterHTML = () => {
        if (carrito.length === 0) return ''; 

        const totalServiciosPrincipales = carrito.filter(item => item.parentId === null).reduce((sum, item) => sum + ((item.precioNumerico || 0) * (item.cantidad || 1)), 0);
        const totalAdicionales = carrito.filter(item => item.parentId !== null).reduce((sum, item) => sum + ((item.precioNumerico || 0) * (item.cantidad || 1)), 0);
        const totalGeneral = totalServiciosPrincipales + totalAdicionales;
        
        return `
            <div class="panel-carrito-footer" id="panel-carrito-footer">
                <div class="calculo-fila"><span>Subtotal Servicios:</span><span class="fw-bold">$ ${totalServiciosPrincipales.toLocaleString('es-CL')}</span></div>
                ${totalAdicionales > 0 ? `<div class="calculo-fila"><span>Subtotal Adicionales:</span><span class="fw-bold">$ ${totalAdicionales.toLocaleString('es-CL')}</span></div>` : ''}
                <hr class="my-2">
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

    // --- MANEJO DE EVENTOS ---
    const manejarEventosPanel = (e) => {
        const itemContainer = e.target.closest('.item-carrito');
        if (!itemContainer) return;
        
        const itemId = itemContainer.dataset.id;
        const item = carrito.find(i => i.id === itemId);
        if (!item) return;

        if (e.target.matches('.btn-cantidad')) {
            const accion = e.target.dataset.accion;
            if (accion === 'sumar') item.cantidad++;
            else if (accion === 'restar' && item.cantidad > 1) item.cantidad--;
            guardarYRenderizarTodo();
        } else if (e.target.matches('.btn-eliminar')) {
            if (item.parentId === null) {
                carrito = carrito.filter(i => i.id !== itemId && i.parentId !== itemId);
            } else {
                carrito = carrito.filter(i => i.id !== itemId);
            }
            guardarYRenderizarTodo();
        } else if (e.type === 'change' && e.target.matches('.cantidad-input')) {
            const nuevaCantidad = parseInt(e.target.value);
            item.cantidad = isNaN(nuevaCantidad) || nuevaCantidad < 1 ? 1 : nuevaCantidad;
            guardarYRenderizarTodo();
        } else if (e.type === 'change' && e.target.matches('.fecha-inicio')) {
            item.fechaInicio = e.target.value;
            guardarYRenderizarTodo();
        }
    };

    panelCarrito?.addEventListener('click', manejarEventosPanel);
    panelCarrito?.addEventListener('change', manejarEventosPanel);

    // --- LISTENERS GENERALES ---
    iconoCarrito?.addEventListener('click', (e) => {
        e.stopPropagation(); // Evita que el clic en el ícono se propague al documento
        abrirPanelCarrito();
    });

    cerrarPanelBtn?.addEventListener('click', cerrarPanelCarrito);

    // --- NUEVA FUNCIONALIDAD: CERRAR AL HACER CLIC FUERA ---
    document.addEventListener('click', (e) => {
        if (!panelCarrito || !iconoCarrito) return;
        
        // Comprueba si el panel está visible y si el clic NO fue dentro del panel
        const isClickInsidePanel = panelCarrito.contains(e.target);
        
        if (panelCarrito.classList.contains('panel-visible') && !isClickInsidePanel) {
            cerrarPanelCarrito();
        }
    });
    
    // --- INICIALIZACIÓN ---
    guardarYRenderizarTodo();
});