// core/static/core/js/admin_panel.js (Versión con Mejoras de Depuración)
$(document).ready(function() {
    // --- MENSAJE INICIAL DE DIAGNÓSTICO ---
    console.log("✅ admin_panel.js cargado y listo. jQuery funciona.");

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

    // --- Funciones de Utilidad ---
    function showMessage(type, text, duration = 5000) {
        console.log(`Mostrando mensaje al usuario: [${type}] ${text}`); // <-- MENSAJE DE DIAGNÓSTICO
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
    // --- LÓGICA PARA EL CRUD DEL CHATBOT Q&A ---
    
    // Selectores para el nuevo formulario
    const qaFormContainer = $('#formQAContainer');
    const qaForm = $('#qaForm');
    const qaFormTitulo = $('#formQATitulo');
    const currentQAIdInput = $('#currentQAIdInput');
    const listaQABody = $('#listaQABody');
    const noQAMensaje = $('#noQAMensaje');
    let editModeQA = false;

    // Mostrar el formulario de Q&A
    $('#btnMostrarFormularioQA').click(function() {
        qaForm[0].reset();
        currentQAIdInput.val('');
        qaFormTitulo.text('Agregar Nueva Pregunta/Respuesta');
        editModeQA = false;
        qaFormContainer.slideDown();
    });

    // Cancelar en el formulario de Q&A
    $('#btnCancelarFormQA').click(function() {
        qaFormContainer.slideUp();
    });

    // Enviar el formulario de Q&A (Crear o Actualizar)
    qaForm.submit(function(event) {
        event.preventDefault();
        showLoading(true);
        const formData = $(this).serialize();
        let url;
        const qaId = currentQAIdInput.val();

        if (editModeQA && qaId) {
            url = $(this).data('update-url-template').replace('0', qaId);
        } else {
            url = $(this).data('create-url');
        }

        $.ajax({
            url: url,
            type: 'POST',
            data: formData,
            success: function(response) {
                if (response.status === 'success') {
                    showMessage('success', response.message);
                    qaFormContainer.slideUp();
                    if (editModeQA) {
                        updateQAInList(response.qa);
                    } else {
                        addQAToList(response.qa);
                    }
                } else { showMessage('error', response.errors ? JSON.stringify(response.errors) : response.message, 0); }
            },
            error: function(xhr) { showMessage('error', 'Error al guardar P/R.'); console.error(xhr); },
            complete: function() { showLoading(false); }
        });
    });

    // Cargar datos para editar un Q&A
    listaQABody.on('click', '.btnEditarQA', function() {
        const qaId = $(this).data('id');
        const url = $(this).data('detail-url-template').replace('0', qaId);
        showLoading(true);

        $.ajax({
            url: url, type: 'GET',
            success: function(response) {
                if (response.status === 'success') {
                    const qa = response.qa;
                    qaFormTitulo.text('Editar Pregunta/Respuesta');
                    currentQAIdInput.val(qa.id);
                    qaForm.find('input[name="keywords"]').val(qa.keywords);
                    qaForm.find('textarea[name="respuesta"]').val(qa.respuesta);
                    editModeQA = true;
                    qaFormContainer.slideDown();
                } else { showMessage('error', response.message); }
            },
            error: function(xhr) { showMessage('error', 'Error al cargar datos.'); console.error(xhr); },
            complete: function() { showLoading(false); }
        });
    });

    // Eliminar un Q&A
    listaQABody.on('click', '.btnEliminarQA', function() {
        const qaId = $(this).data('id');
        const url = $(this).data('delete-url-template').replace('0', qaId);
        const qaRow = $(this).closest('tr');
        const qaKeywords = qaRow.find('td.keywords').text();

        if (confirm(`¿Estás seguro de que quieres eliminar la P/R para las palabras clave "${qaKeywords}"?`)) {
            showLoading(true);
            $.ajax({
                url: url, type: 'POST',
                headers: {'X-CSRFToken': qaForm.find('input[name="csrfmiddlewaretoken"]').val()},
                success: function(response) {
                    if (response.status === 'success') {
                        showMessage('success', response.message);
                        qaRow.fadeOut(function() { 
                            $(this).remove(); 
                            if (listaQABody.find('tr').length === 0) {
                                noQAMensaje.closest('tr').show();
                            }
                        });
                    } else { showMessage('error', response.message); }
                },
                error: function(xhr) { showMessage('error', 'Error al eliminar.'); console.error(xhr); },
                complete: function() { showLoading(false); }
            });
        }
    });

    // Funciones para actualizar la tabla de Q&A dinámicamente
    function addQAToList(qa) {
        noQAMensaje.closest('tr').hide();
        const detailUrlTemplate = $('#tablaQA .btnEditarQA:first').data('detail-url-template') || '/ajax/chatbot-qa/0/detalle/';
        const deleteUrlTemplate = $('#tablaQA .btnEliminarQA:first').data('delete-url-template') || '/ajax/chatbot-qa/0/eliminar/';
        
        const keywordsEscapado = $('<div/>').text(qa.keywords).html();
        const respuestaEscapada = $('<div/>').text(qa.respuesta).html();

        const newRowHtml = `
            <tr data-id="${qa.id}">
                <td class="keywords">${keywordsEscapado}</td>
                <td class="respuesta">${respuestaEscapada.substring(0, 50)}...</td>
                <td class="actions">
                    <button class="btn btn-sm btn-warning btnEditarQA" data-id="${qa.id}" data-detail-url-template="${detailUrlTemplate}"><i class="fas fa-edit"></i> Editar</button>
                    <button class="btn btn-sm btn-danger btnEliminarQA" data-id="${qa.id}" data-delete-url-template="${deleteUrlTemplate}"><i class="fas fa-trash"></i> Eliminar</button>
                </td>
            </tr>`;
        listaQABody.prepend(newRowHtml);
    }

    function updateQAInList(qa) {
        const row = listaQABody.find(`tr[data-id="${qa.id}"]`);
        if (row.length) {
            row.find('.keywords').text(qa.keywords);
            row.find('.respuesta').text(qa.respuesta.substring(0, 50) + '...');
        }
    }
    // --- FIN DE LA LÓGICA PARA EL CRUD DEL CHATBOT Q&A ---

    function showLoading(show) {
        loadingSpinner.toggleClass('hidden', !show);
    }
    
    function resetServicioForm() {
        console.log("🔄 Llamando a resetServicioForm(). Limpiando formulario de servicio."); // <-- MENSAJE DE DIAGNÓSTICO
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

    // --- MANEJADORES DE EVENTOS CON DIAGNÓSTICO ---

    $('#btnMostrarFormularioCrear').click(function() {
        console.log("🖱️ Botón 'Agregar Nuevo Servicio' (#btnMostrarFormularioCrear) CLICKEADO."); // <-- MENSAJE DE DIAGNÓSTICO
        if (formContainer.length === 0) {
            console.error("❌ ERROR: No se encontró el contenedor del formulario #formServicioContainer en el HTML.");
            return;
        }
        resetServicioForm();
        formContainer.slideDown();
    });

    $('#btnCancelarForm').click(function() {
        console.log("🖱️ Botón 'Cancelar' (#btnCancelarForm) CLICKEADO."); // <-- MENSAJE DE DIAGNÓSTICO
        formContainer.slideUp(function() {
            resetServicioForm();
        });
    });

    servicioForm.submit(function(event) {
        event.preventDefault();
        console.log("📤 Formulario de Servicio (#servicioForm) ENVIADO."); // <-- MENSAJE DE DIAGNÓSTICO
        showLoading(true);
        const formData = new FormData(this);
        let url;
        const servicioId = currentServicioIdInput.val();
        
        if (editMode && servicioId) {
            url = $(this).data('update-url-template').replace('0', servicioId);
            console.log(`Modo Edición. Enviando a: ${url}`);
        } else {
            url = $(this).data('create-url');
            console.log(`Modo Creación. Enviando a: ${url}`);
        }

        $.ajax({
            url: url, type: 'POST', data: formData, processData: false, contentType: false, 
            headers: {'X-CSRFToken': $('input[name="csrfmiddlewaretoken"]', this).val()},
            success: function(response) {
                console.log("✅ Respuesta del servidor (Guardar/Actualizar):", response); // <-- MENSAJE DE DIAGNÓSTICO
                if (response.status === 'success') {
                    showMessage('success', response.message);
                    formContainer.slideUp(); resetServicioForm();
                    if (editMode) updateServicioEnLista(response.servicio);
                    else addServicioALista(response.servicio);
                } else { showMessage('error', response.errors ? JSON.stringify(response.errors) : response.message, 0); }
            },
            error: function(xhr) { console.error("❌ Error en AJAX de Guardar/Actualizar:", xhr); showMessage('error', 'Error al conectar con el servidor.'); },
            complete: function() { showLoading(false); }
        });
    });

    configForm.submit(function(event) {
        event.preventDefault();
        console.log("📤 Formulario de Configuración (#configForm) ENVIADO."); // <-- MENSAJE DE DIAGNÓSTICO
        showLoading(true);
        const nuevoEmail = emailNotificacionesAdminInput.val();
        
        $.ajax({
            url: $(this).data('url'), type: 'POST',
            data: { 'email_notificaciones_admin': nuevoEmail, 'csrfmiddlewaretoken': $('input[name="csrfmiddlewaretoken"]', this).val() },
            success: function(response) {
                console.log("✅ Respuesta de 'Guardar Email':", response); // <-- MENSAJE DE DIAGNÓSTICO
                showMessage('success', response.message);
                emailNotificacionesAdminInput.val(response.nuevo_email);
            },
            error: function(xhr) { console.error("❌ Error en AJAX de 'Guardar Email':", xhr); showMessage('error', 'Error al guardar el email.'); },
            complete: function() { showLoading(false); }
        });
    });

    listaServiciosBody.on('click', '.btnEditar', function() {
        const servicioId = $(this).data('id');
        console.log(`🖱️ Botón 'Editar' (.btnEditar) CLICKEADO para el servicio ID: ${servicioId}.`); // <-- MENSAJE DE DIAGNÓSTICO
        const url = $(this).data('detail-url-template').replace('0', servicioId);
        showLoading(true);

        $.ajax({
            url: url, type: 'GET',
            success: function(response) {
                console.log("✅ Respuesta de 'Obtener Detalles para Editar':", response); // <-- MENSAJE DE DIAGNÓSTICO
                if (response.status === 'success') {
                    const servicio = response.servicio;
                    formTitulo.text('Editar Servicio: ' + servicio.nombre);
                    btnSubmitForm.text('Actualizar');
                    currentServicioIdInput.val(servicio.id);
                    $('#servicioForm').find('input[name="nombre"]').val(servicio.nombre);
                    $('#servicioForm').find('textarea[name="descripcion"]').val(servicio.descripcion);
                    editMode = true;
                    formContainer.slideDown();
                } else { showMessage('error', response.message); }
            },
            error: function(xhr) { console.error("❌ Error en AJAX de 'Editar':", xhr); showMessage('error', 'Error al cargar datos para editar.'); },
            complete: function() { showLoading(false); }
        });
    });
    
    listaServiciosBody.on('click', '.btnEliminar', function() {
        const servicioId = $(this).data('id');
        console.log(`🖱️ Botón 'Eliminar' (.btnEliminar) CLICKEADO para el servicio ID: ${servicioId}.`); // <-- MENSAJE DE DIAGNÓSTICO
        const url = $(this).data('delete-url-template').replace('0', servicioId);
        const servicioRow = $(this).closest('tr');
        const servicioNombre = servicioRow.find('td.nombre').text();
        
        if (confirm(`¿Estás seguro de que quieres eliminar el servicio "${servicioNombre}"?`)) {
            showLoading(true);
            $.ajax({
                url: url, type: 'POST',
                headers: {'X-CSRFToken': $('#servicioForm input[name="csrfmiddlewaretoken"]').val()},
                success: function(response) {
                    console.log("✅ Respuesta de 'Eliminar':", response); // <-- MENSAJE DE DIAGNÓSTICO
                    showMessage('success', response.message);
                    servicioRow.fadeOut(function() { $(this).remove(); });
                },
                error: function(xhr) { console.error("❌ Error AJAX eliminar:", xhr); showMessage('error', 'Error al eliminar.'); },
                complete: function() { showLoading(false); }
            });
        } else {
            console.log("Operación de eliminar cancelada por el usuario.");
        }
    });

    function addServicioALista(servicio) {
        let imagenHtml = 'Sin imagen';
        if (servicio.imagen_url) {
            imagenHtml = `<img src="${servicio.imagen_url}" alt="${$('<div/>').text(servicio.nombre).html()}" style="width: 100px; height: 70px; object-fit: cover; border-radius: 4px;">`;
        }
        const nombreEscapado = $('<div/>').text(servicio.nombre).html();
        const descripcionEscapada = $('<div/>').text(servicio.descripcion_corta).html();
        
        const detailUrlTemplate = listaServiciosBody.find('.btnEditar:first').data('detail-url-template') || '/ajax/servicios/0/detalle/';
        const deleteUrlTemplate = listaServiciosBody.find('.btnEliminar:first').data('delete-url-template') || '/ajax/servicios/0/eliminar/';
        
        const newRowHtml = `
            <tr data-id="${servicio.id}">
                <td class="nombre">${nombreEscapado}</td>
                <td class="descripcion">${descripcionEscapada}</td>
                <td class="imagen">${imagenHtml}</td>
                <td class="actions">
                    <button class="btn btn-sm btn-warning btnEditar" data-id="${servicio.id}" data-detail-url-template="${detailUrlTemplate}"><i class="fas fa-edit"></i> Editar</button>
                    <button class="btn btn-sm btn-danger btnEliminar" data-id="${servicio.id}" data-delete-url-template="${deleteUrlTemplate}"><i class="fas fa-trash"></i> Eliminar</button>
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