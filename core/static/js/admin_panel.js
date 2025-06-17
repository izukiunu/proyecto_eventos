// core/static/core/js/admin_panel.js (Versión Completa con Gestión de Servicios y Chatbot)
$(document).ready(function() {
    console.log("✅ admin_panel.js cargado y listo. jQuery funciona.");

    // --- Selectores y Variables Globales ---
    const messageArea = $('#messageArea');
    const loadingSpinner = $('#loadingSpinner');

    // Selectores para la sección de SERVICIOS
    const formContainer = $('#formServicioContainer');
    const servicioForm = $('#servicioForm');
    const formTitulo = $('#formTitulo');
    const currentServicioIdInput = $('#currentServicioIdInput');
    const listaServiciosBody = $('#listaServiciosBody');
    const noServiciosMensaje = $('#noServiciosMensaje');
    let editMode = false;

    // Selectores para la sección de CONFIGURACIÓN
    const configForm = $('#configForm');
    const emailNotificacionesAdminInput = $('#emailNotificacionesAdminInput');

    // Selectores para la sección de CHATBOT Q&A
    const qaFormContainer = $('#formQAContainer');
    const qaForm = $('#qaForm');
    const qaFormTitulo = $('#formQATitulo');
    const currentQAIdInput = $('#currentQAIdInput');
    const listaQABody = $('#listaQABody');
    const noQAMensaje = $('#noQAMensaje');
    let editModeQA = false;

    // --- Funciones de Utilidad ---
    function showMessage(type, text, duration = 5000) {
        const messageDiv = $('<div>').addClass(type === 'success' ? 'success-message' : 'error-message').html(text);
        messageArea.empty().append(messageDiv).removeClass('hidden');
        if (duration > 0) {
            setTimeout(() => { messageDiv.fadeOut(500, function() { $(this).remove(); }); }, duration);
        }
    }

    function showLoading(show) {
        loadingSpinner.toggleClass('hidden', !show);
    }
    
    // ==========================================================
    // LÓGICA PARA EL MENÚ DEL DASHBOARD (Sidebar)
    // ==========================================================
    $('.sidebar-btn').on('click', function() {
        console.log("🖱️ Botón del menú lateral clickeado.");
        $('.sidebar-btn').removeClass('active');
        $(this).addClass('active');
        $('.content-panel').addClass('hidden');
        const targetPanelId = $(this).data('target');
        $(targetPanelId).removeClass('hidden');
    });

    // ===============================================
    // LÓGICA PARA GESTIÓN DE SERVICIOS
    // ===============================================
    function resetServicioForm() {
        console.log("🔄 Limpiando formulario de servicio.");
        servicioForm[0].reset(); 
        currentServicioIdInput.val(''); 
        formTitulo.text('Agregar Nuevo Servicio');
        editMode = false;
    }

    $('#btnMostrarFormularioCrear').click(() => { console.log("🖱️ Botón 'Agregar Servicio' clickeado."); resetServicioForm(); qaFormContainer.removeClass('form-visible'); formContainer.toggleClass('form-visible'); });
    $('#btnCancelarForm').click(() => { console.log("🖱️ Botón 'Cancelar Servicio' clickeado."); formContainer.removeClass('form-visible'); });

    servicioForm.submit(function(event) {
        event.preventDefault(); console.log("📤 Formulario de Servicio Enviado.");
        showLoading(true);
        const formData = new FormData(this);
        let url = editMode ? $(this).data('update-url-template').replace('0', currentServicioIdInput.val()) : $(this).data('create-url');
        $.ajax({
            url: url, type: 'POST', data: formData, processData: false, contentType: false, 
            headers: {'X-CSRFToken': $('input[name="csrfmiddlewaretoken"]', this).val()},
            success: function(response) {
                console.log("✅ Respuesta de Guardar/Actualizar Servicio:", response);
                if (response.status === 'success') {
                    showMessage('success', response.message);
                    formContainer.removeClass('form-visible');
                    if (editMode) updateServicioEnLista(response.servicio); else addServicioALista(response.servicio);
                } else { let errs = response.errors; let msg = 'Por favor corrige:<ul>' + Object.values(errs).map(e => `<li>${e[0]}</li>`).join('') + '</ul>'; showMessage('error', msg, 0); }
            },
            error: (xhr) => { showMessage('error', 'Error de conexión.'); console.error("❌ Error AJAX Servicios:", xhr); },
            complete: () => { showLoading(false); }
        });
    });

    // ============================================================
// --- CÓDIGO PARA ACTIVAR BOTONES DE EDITAR Y ELIMINAR SERVICIOS ---
// ============================================================

listaServiciosBody.on('click', '.btnEditar', function() {
    const servicioId = $(this).data('id');
    const url = $(this).data('detail-url-template').replace('0', servicioId);
    console.log(`🖱️ Botón 'Editar Servicio' clickeado para ID: ${servicioId}.`);
    showLoading(true);
    
    $.ajax({
        url: url,
        type: 'GET',
        success: function(response) {
            if (response.status === 'success') {
                const servicio = response.servicio;
                formTitulo.text('Editar Servicio');
                currentServicioIdInput.val(servicio.id);
                servicioForm.find('input[name="nombre"]').val(servicio.nombre);
                servicioForm.find('textarea[name="descripcion"]').val(servicio.descripcion);
                $('#id_destacado').prop('checked', servicio.destacado);
                
                editMode = true;
                qaFormContainer.removeClass('form-visible'); // Oculta el otro form
                formContainer.addClass('form-visible');    // Muestra el form de servicios
            } else {
                showMessage('error', response.message);
            }
        },
        error: function(xhr) {
            showMessage('error', 'Error al cargar datos del servicio.');
            console.error(xhr);
        },
        complete: function() {
            showLoading(false);
        }
    });
});

listaServiciosBody.on('click', '.btnEliminar', function() {
    const servicioId = $(this).data('id');
    const url = $(this).data('delete-url-template').replace('0', servicioId);
    const servicioRow = $(this).closest('tr');
    const servicioNombre = servicioRow.find('td.nombre').text();
    console.log(`🖱️ Botón 'Eliminar Servicio' clickeado para ID: ${servicioId}.`);

    if (confirm(`¿Estás seguro de que quieres eliminar el servicio "${servicioNombre}"?`)) {
        showLoading(true);
        $.ajax({
            url: url,
            type: 'POST',
            headers: {'X-CSRFToken': servicioForm.find('input[name="csrfmiddlewaretoken"]').val()},
            success: function(response) {
                if (response.status === 'success') {
                    showMessage('success', response.message);
                    servicioRow.fadeOut(500, function() { $(this).remove(); });
                } else {
                    showMessage('error', response.message);
                }
            },
            error: function(xhr) {
                showMessage('error', 'Error al eliminar el servicio.');
                console.error(xhr);
            },
            complete: function() {
                showLoading(false);
            }
        });
    }
});

    // ==========================================================
    // LÓGICA PARA GESTIÓN DE CONFIGURACIÓN
    // ==========================================================
    configForm.submit(function(event) {
        event.preventDefault(); console.log("📤 Formulario de Configuración Enviado.");
        showLoading(true);
        $.ajax({
            url: $(this).data('url'), type: 'POST',
            data: { 'email_notificaciones_admin': emailNotificacionesAdminInput.val(), 'csrfmiddlewaretoken': $('input[name="csrfmiddlewaretoken"]', this).val() },
            success: function(response) {
                if (response.status === 'success') { showMessage('success', response.message); emailNotificacionesAdminInput.val(response.nuevo_email); } 
                else { showMessage('error', response.message); }
            },
            error: (xhr) => { showMessage('error', 'Error al guardar email.'); console.error(xhr); },
            complete: () => { showLoading(false); }
        });
    });

    // =======================================================
    // --- NUEVO: LÓGICA PARA EL CRUD DEL CHATBOT Q&A ---
    // =======================================================
    
    $('#btnMostrarFormularioQA').click(function() {
        console.log("🖱️ Botón 'Agregar P/R' clickeado.");
        qaForm[0].reset();
        currentQAIdInput.val('');
        qaFormTitulo.text('Agregar Nueva Pregunta/Respuesta');
        editModeQA = false;
        formContainer.removeClass('form-visible'); // Oculta el otro form si está abierto
        qaFormContainer.toggleClass('form-visible');
    });

    $('#btnCancelarFormQA').click(function() {
        console.log("🖱️ Botón 'Cancelar P/R' clickeado.");
        qaFormContainer.removeClass('form-visible');
    });

    qaForm.submit(function(event) {
        event.preventDefault();
        console.log("📤 Formulario de P/R Enviado.");
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
            url: url, type: 'POST', data: formData,
            success: function(response) {
                if (response.status === 'success') {
                    showMessage('success', response.message);
                    qaFormContainer.removeClass('form-visible');
                    if (editModeQA) updateQAInList(response.qa);
                    else addQAToList(response.qa);
                } else { showMessage('error', response.errors ? JSON.stringify(response.errors) : response.message, 0); }
            },
            error: (xhr) => { showMessage('error', 'Error al guardar P/R.'); console.error(xhr); },
            complete: () => { showLoading(false); }
        });
    });

    listaQABody.on('click', '.btnEditarQA', function() {
    const qaId = $(this).data('id');
    const url = $(this).data('detail-url-template').replace('0', qaId);
    console.log(`🖱️ Botón 'Editar P/R' clickeado para ID: ${qaId}.`);
    showLoading(true);

    $.ajax({
        url: url,
        type: 'GET',
        success: function(response) {
            if (response.status === 'success') {
                const qa = response.qa;
                
                // 1. Preparamos el formulario con los datos recibidos
                qaFormTitulo.text('Editar Pregunta/Respuesta');
                currentQAIdInput.val(qa.id);
                qaForm.find('input[name="keywords"]').val(qa.keywords);
                qaForm.find('textarea[name="respuesta"]').val(qa.respuesta);
                
                editModeQA = true;
                
                // 2. Mostramos el formulario (y ocultamos el de servicios si estaba abierto)
                formContainer.removeClass('form-visible'); 
                qaFormContainer.addClass('form-visible');

                // 3. Opcional: Desplazarse hacia el formulario para mejor experiencia de usuario
                $('html, body').animate({
                    scrollTop: qaFormContainer.offset().top - 20
                }, 500);

            } else {
                showMessage('error', response.message);
            }
        },
        error: function(xhr) {
            showMessage('error', 'Error al cargar los datos de la Pregunta/Respuesta.');
            console.error(xhr);
        },
        complete: function() {
            showLoading(false);
        }
    });
});

    listaQABody.on('click', '.btnEliminarQA', function() {
        const qaId = $(this).data('id');
        console.log(`🖱️ Botón 'Eliminar P/R' clickeado para ID: ${qaId}.`);
        const url = $(this).data('delete-url-template').replace('0', qaId);
        const qaRow = $(this).closest('tr');
        const qaKeywords = qaRow.find('td.keywords').text();

        if (confirm(`¿Estás seguro de que quieres eliminar la P/R para "${qaKeywords}"?`)) {
            showLoading(true);
            $.ajax({
                url: url, type: 'POST',
                headers: {'X-CSRFToken': qaForm.find('input[name="csrfmiddlewaretoken"]').val()},
                success: function(response) {
                    if (response.status === 'success') {
                        showMessage('success', response.message);
                        qaRow.fadeOut(() => { qaRow.remove(); });
                    } else { showMessage('error', response.message); }
                },
                error: (xhr) => { showMessage('error', 'Error al eliminar.'); console.error(xhr); },
                complete: () => { showLoading(false); }
            });
        }
    });

    // --- Funciones de ayuda para actualizar las tablas ---
    function addServicioALista(servicio) { /* Tu función existente */ }
    function updateServicioEnLista(servicio) { /* Tu función existente */ }
    function addQAToList(qa) {
        noQAMensaje.parent().is('tr') ? noQAMensaje.parent().hide() : noQAMensaje.hide();
        const detailUrlTemplate = $('#tablaQA .btnEditarQA:first').data('detail-url-template') || '/ajax/chatbot-qa/0/detalle/';
        const deleteUrlTemplate = $('#tablaQA .btnEliminarQA:first').data('delete-url-template') || '/ajax/chatbot-qa/0/eliminar/';
        const keywordsEscapado = $('<div/>').text(qa.keywords).html();
        const respuestaEscapada = $('<div/>').text(qa.respuesta).html();
        const newRowHtml = `<tr data-id="${qa.id}"><td class="keywords">${keywordsEscapado}</td><td class="respuesta">${respuestaEscapada.substring(0, 50)}...</td><td class="actions"><button class="btn btn-sm btn-warning btnEditarQA" data-id="${qa.id}" data-detail-url-template="${detailUrlTemplate}"><i class="fas fa-edit"></i> Editar</button> <button class="btn btn-sm btn-danger btnEliminarQA" data-id="${qa.id}" data-delete-url-template="${deleteUrlTemplate}"><i class="fas fa-trash"></i> Eliminar</button></td></tr>`;
        listaQABody.prepend(newRowHtml);
    }
    function updateQAInList(qa) {
        const row = listaQABody.find(`tr[data-id="${qa.id}"]`);
        if (row.length) { row.find('.keywords').text(qa.keywords); row.find('.respuesta').text(qa.respuesta.substring(0, 50) + '...'); }
    }
});