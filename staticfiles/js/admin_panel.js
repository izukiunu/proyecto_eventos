// core/static/core/js/admin_panel.js
$(document).ready(function() {
    // Selectores comunes
    const formContainer = $('#formServicioContainer');
    const servicioForm = $('#servicioForm');
    const formTitulo = $('#formTitulo');
    const btnSubmitForm = $('#btnSubmitForm');
    const currentServicioIdInput = $('#currentServicioIdInput');
    const listaServiciosBody = $('#listaServiciosBody');
    const noServiciosMensaje = $('#noServiciosMensaje');
    const messageArea = $('#messageArea');
    const loadingSpinner = $('#loadingSpinner');
    let editMode = false;

    const configForm = $('#configForm');
    const emailNotificacionesAdminInput = $('#emailNotificacionesAdminInput');

    function showMessage(type, text, duration = 5000) {
        const messageDiv = $('<div>').addClass(type === 'success' ? 'success-message' : 'error-message').html(text);
        messageArea.empty().append(messageDiv).removeClass('hidden');
        if (duration > 0) {
            setTimeout(() => {
                messageDiv.fadeOut(500, function() { $(this).remove(); });
                if (messageArea.children().length === 1 && messageArea.children().is(messageDiv)) {
                    messageArea.addClass('hidden');
                }
            }, duration);
        }
    }

    function showLoading(show) {
        loadingSpinner.toggleClass('hidden', !show);
    }
    
    function resetServicioForm() {
        servicioForm[0].reset(); 
        currentServicioIdInput.val(''); 
        formTitulo.text('Agregar Nuevo Servicio');
        btnSubmitForm.text('Guardar');
        editMode = false;
        
        var imagenField = servicioForm.find('input[type="file"][name="imagen"]');
        if (imagenField.length) {
            var parentP = imagenField.closest('p'); 
            if (parentP.length) {
                parentP.find('a').remove(); 
                parentP.find('br').remove();
                var clearCheckbox = parentP.find('input[type="checkbox"][name$="-clear"]');
                if (clearCheckbox.length) clearCheckbox.prop('checked', false);
            }
        }
    }

    $('#btnMostrarFormularioCrear').click(function() {
        resetServicioForm();
        formContainer.slideDown();
    });

    $('#btnCancelarForm').click(function() {
        formContainer.slideUp(function() {
            resetServicioForm();
        });
    });

    // --- SUBMIT DEL FORMULARIO DE SERVICIOS (Crear/Actualizar) ---
    servicioForm.submit(function(event) {
        event.preventDefault();
        showLoading(true);
        messageArea.addClass('hidden').empty();
        const formData = new FormData(this);
        let url;
        const servicioId = currentServicioIdInput.val();
        
        if (editMode && servicioId) {
            let updateUrlTemplate = $(this).data('update-url-template');
            url = updateUrlTemplate.replace('0', servicioId);
        } else {
            url = $(this).data('create-url');
        }

        $.ajax({
            url: url,
            type: 'POST',
            data: formData,
            processData: false, 
            contentType: false, 
            headers: {'X-CSRFToken': $('input[name="csrfmiddlewaretoken"]', this).val()},
            success: function(response) {
                if (response.status === 'success') {
                    showMessage('success', response.message);
                    formContainer.slideUp();
                    resetServicioForm();
                    if (editMode) updateServicioEnLista(response.servicio);
                    else addServicioALista(response.servicio);
                    if(listaServiciosBody.find('tr').length > 0) noServiciosMensaje.addClass('hidden');
                } else if (response.errors) {
                    let errorText = 'Por favor corrige los siguientes errores:<br><ul>';
                    for (const field in response.errors) {
                        errorText += `<li>${field}: ${response.errors[field].join(', ')}</li>`;
                    }
                    errorText += '</ul>';
                    showMessage('error', errorText, 0);
                    // MENSAJE DE CONSOLA AÑADIDO
                    console.error('Error de validación del formulario:', response.errors);
                } else { 
                    showMessage('error', response.message || 'Ocurrió un error desconocido.');
                    // MENSAJE DE CONSOLA AÑADIDO
                    console.error('Error reportado por el servidor (pero con status 200 OK):', response);
                }
            },
            error: function(xhr, textStatus, errorThrown) {
                // MENSAJE DE CONSOLA AÑADIDO
                console.error('Error en AJAX al crear/actualizar servicio:', {
                    xhr: xhr,
                    status: textStatus,
                    error: errorThrown,
                    responseJSON: xhr.responseJSON
                });
                
                let errorMsg = 'Error de conexión o del servidor.';
                if (xhr.responseJSON) {
                    if (xhr.responseJSON.message) errorMsg = xhr.responseJSON.message;
                    else if (xhr.responseJSON.errors) {
                        let errs = xhr.responseJSON.errors; errorMsg = 'Por favor corrige:<br><ul>';
                        for (const f in errs) errorMsg += `<li>${f}: ${errs[f].join(', ')}</li>`;
                        errorMsg += '</ul>';
                    } else errorMsg = `Error ${xhr.status}: ${xhr.statusText}`;
                } else errorMsg = `Error: ${xhr.status} ${xhr.statusText}`;
                showMessage('error', errorMsg, 0);
            },
            complete: function() { showLoading(false); }
        });
    });

    // --- SUBMIT DEL FORMULARIO DE CONFIGURACIÓN DE EMAIL ---
    configForm.submit(function(event) {
        event.preventDefault();
        showLoading(true);
        messageArea.addClass('hidden').empty();
        const nuevoEmail = emailNotificacionesAdminInput.val();
        const url = $(this).data('url');

        $.ajax({
            url: url,
            type: 'POST',
            data: {
                'email_notificaciones_admin': nuevoEmail,
                'csrfmiddlewaretoken': $('input[name="csrfmiddlewaretoken"]', this).val()
            },
            success: function(response) {
                if (response.status === 'success') {
                    showMessage('success', response.message);
                    emailNotificacionesAdminInput.val(response.nuevo_email);
                } else { 
                    showMessage('error', response.message || 'No se pudo actualizar el email.');
                    // MENSAJE DE CONSOLA AÑADIDO
                    console.error('Error al actualizar email (reportado por el servidor):', response);
                }
            },
            error: function(xhr, textStatus, errorThrown) {
                // MENSAJE DE CONSOLA AÑADIDO
                console.error('Error en AJAX al actualizar email de notificación:', {
                    xhr: xhr,
                    status: textStatus,
                    error: errorThrown,
                    responseJSON: xhr.responseJSON
                });

                let errorMsg = 'Error de conexión.';
                if (xhr.responseJSON && xhr.responseJSON.message) errorMsg = xhr.responseJSON.message;
                else errorMsg = `Error ${xhr.status}: ${xhr.statusText}`;
                showMessage('error', errorMsg, 0);
            },
            complete: function() { showLoading(false); }
        });
    });

    // --- Cargar datos para Editar Servicio ---
    listaServiciosBody.on('click', '.btnEditar', function() {
        const servicioId = $(this).data('id');
        const detailUrlTemplate = $(this).data('detail-url-template');
        const url = detailUrlTemplate.replace('0', servicioId);

        showLoading(true);
        messageArea.addClass('hidden').empty();
        resetServicioForm(); 

        $.ajax({
            url: url,
            type: 'GET',
            success: function(response) {
                if (response.status === 'success') {
                    const servicio = response.servicio;
                    formTitulo.text('Editar Servicio: ' + servicio.nombre);
                    btnSubmitForm.text('Actualizar');
                    currentServicioIdInput.val(servicio.id);
                    servicioForm.find('input[name="nombre"]').val(servicio.nombre);
                    servicioForm.find('textarea[name="descripcion"]').val(servicio.descripcion);
                    editMode = true;
                    formContainer.slideDown();
                } else { 
                    showMessage('error', response.message || 'No se pudieron cargar los datos del servicio.');
                    // MENSAJE DE CONSOLA AÑADIDO
                    console.error('Error al cargar datos del servicio (reportado por el servidor):', response);
                }
            },
            error: function(xhr, textStatus, errorThrown) {
                // MENSAJE DE CONSOLA AÑADIDO
                console.error('Error en AJAX al cargar datos para editar:', {
                    servicioId: servicioId,
                    xhr: xhr,
                    status: textStatus,
                    error: errorThrown,
                    responseJSON: xhr.responseJSON
                });
                showMessage('error', 'Error al cargar datos para editar: ' + xhr.statusText); 
            },
            complete: function() { showLoading(false); }
        });
    });

    // --- Eliminar Servicio ---
    listaServiciosBody.on('click', '.btnEliminar', function() {
        const servicioId = $(this).data('id');
        const deleteUrlTemplate = $(this).data('delete-url-template');
        const url = deleteUrlTemplate.replace('0', servicioId);
        const servicioRow = $(this).closest('tr');
        const servicioNombre = servicioRow.find('td.nombre').text();
        
        if (confirm(`¿Estás seguro de que quieres eliminar el servicio "${servicioNombre}"?`)) {
            showLoading(true);
            messageArea.addClass('hidden').empty();
            $.ajax({
                url: url,
                type: 'POST',
                headers: {'X-CSRFToken': $('#servicioForm input[name="csrfmiddlewaretoken"]').val()},
                success: function(response) {
                    if (response.status === 'success') {
                        showMessage('success', response.message);
                        servicioRow.fadeOut(function() { 
                            $(this).remove();
                            if (listaServiciosBody.find('tr').length === 0) {
                                noServiciosMensaje.removeClass('hidden');
                            }
                        });
                    } else { 
                        showMessage('error', response.message || 'No se pudo eliminar el servicio.');
                        // MENSAJE DE CONSOLA AÑADIDO
                        console.error('Error al eliminar servicio (reportado por el servidor):', response);
                    }
                },
                error: function(xhr, textStatus, errorThrown) {
                    // MENSAJE DE CONSOLA AÑADIDO
                    console.error('Error en AJAX al eliminar servicio:', {
                        servicioId: servicioId,
                        xhr: xhr,
                        status: textStatus,
                        error: errorThrown,
                        responseJSON: xhr.responseJSON
                    });
                    showMessage('error', 'Error al eliminar: ' + xhr.statusText); 
                },
                complete: function() { showLoading(false); }
            });
        }
    });

    // Funciones para actualizar la lista de servicios en el HTML
    function addServicioALista(servicio) {
        let imagenHtml = 'Sin imagen';
        if (servicio.imagen_url) {
            imagenHtml = `<img src="${servicio.imagen_url}" alt="${$('<div/>').text(servicio.nombre).html()}" style="width: 100px; height: 70px; object-fit: cover; border-radius: 4px;">`;
        }
        const nombreEscapado = $('<div/>').text(servicio.nombre).html();
        const descripcionEscapada = $('<div/>').text(servicio.descripcion_corta).html();
        
        // Obtenemos las plantillas de URL de un botón existente para pasárselo al nuevo
        const detailUrlTemplate = listaServiciosBody.find('.btnEditar:first').data('detail-url-template') || '/ajax/servicios/0/detalle/';
        const deleteUrlTemplate = listaServiciosBody.find('.btnEliminar:first').data('delete-url-template') || '/ajax/servicios/0/eliminar/';
        
        const newRowHtml = `
            <tr data-id="${servicio.id}">
                <td class="nombre">${nombreEscapado}</td>
                <td class="descripcion">${descripcionEscapada}</td>
                <td class="imagen">${imagenHtml}</td>
                <td class="actions">
                    <button class="btn btn-sm btn-warning btnEditar" data-id="${servicio.id}" data-detail-url-template="${detailUrlTemplate}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-danger btnEliminar" data-id="${servicio.id}" data-delete-url-template="${deleteUrlTemplate}">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </td>
            </tr>`;
        listaServiciosBody.prepend(newRowHtml);
        noServiciosMensaje.addClass('hidden');
    }

    function updateServicioEnLista(servicio) {
        const row = listaServiciosBody.find(`tr[data-id="${servicio.id}"]`);
        if (row.length) {
            const nombreEscapado = $('<div/>').text(servicio.nombre).html();
            const descripcionEscapada = $('<div/>').text(servicio.descripcion_corta).html();
            row.find('.nombre').html(nombreEscapado);
            row.find('.descripcion').html(descripcionEscapada);
            let imagenHtml = 'Sin imagen';
            if (servicio.imagen_url) {
                imagenHtml = `<img src="${servicio.imagen_url}" alt="${nombreEscapado}" style="width: 100px; height: 70px; object-fit: cover; border-radius: 4px;">`;
            }
            row.find('.imagen').html(imagenHtml);
        }
    }
});