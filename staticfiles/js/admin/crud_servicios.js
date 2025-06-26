// js/admin/crud_servicios.js
$(document).ready(function() {
    
    // --- SELECTORES PARA LA SECCIÓN DE SERVICIOS ---
    const formContainer = $('#formServicioContainer');
    const servicioForm = $('#servicioForm');
    const formTitulo = $('#formTitulo');
    const currentServicioIdInput = $('#currentServicioIdInput');
    const listaServiciosBody = $('#listaServiciosBody');
    const noServiciosMensaje = $('#noServiciosMensaje');
    let editMode = false;

    // --- FUNCIONES DE AYUDA PARA ACTUALIZAR LA TABLA ---

    /**
     * Genera el contenido HTML (todos los <td>) para una fila de la tabla.
     * @param {object} servicio - El objeto del servicio con sus datos.
     * @returns {string} - El string HTML con el contenido de la fila.
     */
    function generarHtmlFilaServicio(servicio) {
        let precioHtml = '-';
        if (servicio.precio && !isNaN(parseFloat(servicio.precio))) {
            let precioFormateado = parseFloat(servicio.precio).toLocaleString('es-CL');
            precioHtml = `$ ${precioFormateado}`;
        }

        const imagenHtml = servicio.imagen_url ?
            `<img src="${servicio.imagen_url}" alt="${servicio.nombre}" width="80" class="img-thumbnail">` :
            `<span class="text-muted">Sin imagen</span>`;

        const destacadoHtml = servicio.destacado ?
            `<i class="fas fa-check-circle text-success"></i> Sí` :
            `<i class="fas fa-times-circle text-danger"></i> No`;
        
        const editUrlTemplate = $('#tablaServicios .btnEditar:first').data('detail-url-template');
        const deleteUrlTemplate = $('#tablaServicios .btnEliminar:first').data('delete-url-template');

        return `
            <td class="nombre">${servicio.nombre}</td>
            <td>${servicio.descripcion.substring(0, 100)}...</td>
            <td>${imagenHtml}</td>
            <td class="precio-servicio fw-bold">${precioHtml}</td>
            <td>${destacadoHtml}</td>
            <td class="actions">
                <button class="btn btn-sm btn-warning btnEditar" data-id="${servicio.id}" data-detail-url-template="${editUrlTemplate}" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger btnEliminar" data-id="${servicio.id}" data-delete-url-template="${deleteUrlTemplate}" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
    }

    /**
     * Añade una nueva fila a la tabla de servicios.
     * @param {object} servicio - El objeto del nuevo servicio.
     */
    function addServicioALista(servicio) {
        if (noServiciosMensaje.length) {
            noServiciosMensaje.parent().hide();
        }
        const nuevaFilaHtml = `<tr id="servicio-${servicio.id}">${generarHtmlFilaServicio(servicio)}</tr>`;
        listaServiciosBody.prepend(nuevaFilaHtml);
    }

    /**
     * Actualiza una fila existente en la tabla de servicios.
     * @param {object} servicio - El objeto del servicio con sus datos actualizados.
     */
    function updateServicioEnLista(servicio) {
        const filaExistente = $(`#servicio-${servicio.id}`);
        if (filaExistente.length) {
            filaExistente.html(generarHtmlFilaServicio(servicio));
        }
    }

    // --- LÓGICA DE EVENTOS PARA GESTIÓN DE SERVICIOS ---

    function resetServicioForm() {
        console.log("🔄 Limpiando formulario de servicio para CREAR.");
        servicioForm[0].reset(); 
        currentServicioIdInput.val(''); 
        formTitulo.text('Agregar Nuevo Servicio');
        editMode = false;
    }

    $('#btnMostrarFormularioCrear').click(() => { 
        console.log("🖱️ Botón 'Agregar Servicio' clickeado."); 
        resetServicioForm(); 
        // Oculta otros formularios que puedan estar abiertos
        $('#formQAContainer').removeClass('form-visible');
        formContainer.toggleClass('form-visible'); 
    });

    $('#btnCancelarForm').click(() => { 
        console.log("🖱️ Botón 'Cancelar Servicio' clickeado."); 
        formContainer.removeClass('form-visible'); 
    });

    servicioForm.submit(function(event) {
        event.preventDefault(); 
        console.log("📤 Formulario de Servicio Enviado.");
        showLoading(true); 
        
        const formData = new FormData(this);
        let url = editMode ? $(this).data('update-url-template').replace('0', currentServicioIdInput.val()) : $(this).data('create-url');
        
        $.ajax({
            url: url, type: 'POST', data: formData, processData: false, contentType: false, 
            headers: {'X-CSRFToken': $('input[name="csrfmiddlewaretoken"]', this).val()},
            success: function(response) {
                if (response.status === 'success') {
                    showMessage('success', response.message);
                    formContainer.removeClass('form-visible');
                    if (editMode) {
                        updateServicioEnLista(response.servicio);
                    } else {
                        addServicioALista(response.servicio);
                    }
                } else { 
                    let errs = response.errors; 
                    let msg = 'Por favor corrige:<ul>' + Object.values(errs).map(e => `<li>${e[0]}</li>`).join('') + '</ul>'; 
                    showMessage('error', msg, 0); 
                }
            },
            error: (xhr) => { showMessage('error', 'Error de conexión.'); console.error("❌ Error AJAX Servicios:", xhr); },
            complete: () => { showLoading(false); }
        });
    });

    // --- BLOQUE DE EDICIÓN CORREGIDO ---
    listaServiciosBody.on('click', '.btnEditar', function() {
        const servicioId = $(this).data('id');
        const url = $(this).data('detail-url-template').replace('0', servicioId);
        console.log(`🖱️ Botón 'Editar Servicio' clickeado para ID: ${servicioId}. URL: ${url}`);
        showLoading(true);
        
        $.ajax({
            url: url, type: 'GET',
            success: function(response) {
                console.log('✅ Respuesta AJAX para detalle de Servicio recibida:', response);
                if (response.status === 'success') {
                    const servicio = response.servicio;
                    
                    // [CORRECCIÓN CLAVE]
                    // En lugar de llamar a resetServicioForm() que reinicia todo,
                    // solo limpiamos los campos del formulario.
                    servicioForm[0].reset();
                    
                    formTitulo.text('Editar Servicio');
                    currentServicioIdInput.val(servicio.id);
                    servicioForm.find('input[name="nombre"]').val(servicio.nombre);
                    servicioForm.find('textarea[name="descripcion"]').val(servicio.descripcion);
                    $('#id_destacado').prop('checked', servicio.destacado);
                    $('#id_precio').val(servicio.precio || '');
                    
                    // Se establece el modo edición DESPUÉS de rellenar el formulario.
                    editMode = true;
                    
                    console.log('📝 Formulario de Servicio rellenado para editar.');

                    // Se ocultan otros paneles y se muestra este
                    $('#formQAContainer').removeClass('form-visible');
                    formContainer.addClass('form-visible');
                    console.log('👁️ Panel de Servicio visible.');
                    
                } else {
                    showMessage('error', response.message);
                }
            },
            error: (xhr) => { showMessage('error', 'Error al cargar datos del servicio.'); console.error('❌ Error AJAX en detalle de Servicio:', xhr); },
            complete: () => { showLoading(false); }
        });
    });

    // --- BLOQUE DE ELIMINACIÓN CORREGIDO Y CONSISTENTE ---
    listaServiciosBody.on('click', '.btnEliminar', function() {
        const servicioId = $(this).data('id');
        // Se lee el atributo "-template" para ser consistente
        const url = $(this).data('delete-url-template').replace('0', servicioId);
        
        const servicioRow = $(this).closest('tr');
        const servicioNombre = servicioRow.find('td.nombre').text();
        console.log(`🖱️ Botón 'Eliminar Servicio' clickeado para ID: ${servicioId}. URL: ${url}`);

        if (confirm(`¿Estás seguro de que quieres eliminar el servicio "${servicioNombre}"?`)) {
            showLoading(true);
            $.ajax({
                url: url, type: 'POST',
                headers: {'X-CSRFToken': servicioForm.find('input[name="csrfmiddlewaretoken"]').val()},
                success: function(response) {
                    if (response.status === 'success') {
                        showMessage('success', response.message);
                        servicioRow.fadeOut(500, function() { $(this).remove(); });
                    } else {
                        showMessage('error', response.message);
                    }
                },
                error: (xhr) => { showMessage('error', 'Error al eliminar el servicio.'); console.error('❌ Error AJAX eliminando Servicio:', xhr); },
                complete: () => { showLoading(false); }
            });
        }
    });

}); // Fin de $(document).ready()
