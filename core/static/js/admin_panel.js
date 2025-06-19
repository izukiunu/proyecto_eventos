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
                $('#id_precio').val(servicio.precio || '');
                
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

   // ==========================================================
// --- FUNCIONES DE AYUDA PARA ACTUALIZAR LA TABLA DE SERVICIOS ---
// ==========================================================

/**
 * Genera el contenido HTML (todos los <td>) para una fila de la tabla.
 * @param {object} servicio - El objeto del servicio con sus datos.
 * @returns {string} - El string HTML con el contenido de la fila.
 */
function generarHtmlFilaServicio(servicio) {
    // --- AQUÍ ESTÁ LA LÓGICA DE FORMATO DE PRECIO ---
    let precioHtml = '-';
    // Comprobamos si el precio existe y es un número
    if (servicio.precio && !isNaN(parseFloat(servicio.precio))) {
        // Usamos toLocaleString para añadir separadores de miles para CLP
        let precioFormateado = parseFloat(servicio.precio).toLocaleString('es-CL');
        precioHtml = `$ ${precioFormateado}`;
    }

    // Lógica para la imagen
    const imagenHtml = servicio.imagen_url ?
        `<img src="${servicio.imagen_url}" alt="${servicio.nombre}" width="80" class="img-thumbnail">` :
        `<span class="text-muted">Sin imagen</span>`;

    // Lógica para el estado "Destacado"
    const destacadoHtml = servicio.destacado ?
        `<i class="fas fa-check-circle text-success"></i> Sí` :
        `<i class="fas fa-times-circle text-danger"></i> No`;
    
    // Obtenemos las plantillas de URL de un botón existente para que los nuevos también funcionen
    const editUrlTemplate = $('#listaServiciosBody .btnEditar:first').data('detail-url-template');
    const deleteUrlTemplate = $('#listaServiciosBody .btnEliminar:first').data('delete-url-template');

    // Retornamos todo el contenido HTML para la fila
    return `
        <td class="nombre">${servicio.nombre}</td>
        <td>${servicio.descripcion.substring(0, 100)}...</td>
        <td>${imagenHtml}</td>
        <td class="precio-servicio fw-bold">${precioHtml}</td>
        <td>${destacadoHtml}</td>
        <td>
            <button class="btn btn-sm btn-info btnEditar" data-id="${servicio.id}" data-detail-url-template="${editUrlTemplate}" title="Editar">
                <i class="fas fa-pencil-alt"></i>
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
    // Si la tabla mostraba el mensaje "No hay servicios", lo ocultamos
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
}});

// =======================================================
// --- SELECTORES PARA HERO SLIDERS (Agrégalos al inicio con los otros selectores) ---
// =======================================================
const heroSlideFormContainer = $('#formHeroSlideContainer');
const heroSlideForm = $('#heroSlideForm');
const heroSlideFormTitulo = $('#formHeroSlideTitulo');
const currentHeroSlideIdInput = $('#currentHeroSlideIdInput');
const listaHeroSlidesBody = $('#listaHeroSlidesBody');
let editModeHeroSlide = false;

// =======================================================
// --- EVENTOS PARA HERO SLIDERS ---
// =======================================================
$('#btnMostrarFormHeroSlide').click(function() {
    resetHeroSlideForm();
    heroSlideFormContainer.toggleClass('hidden');
});

$('#btnCancelarHeroSlide').click(function() {
    heroSlideFormContainer.addClass('hidden');
});

// =======================================================
// --- FUNCIONES PARA HERO SLIDERS ---
// =======================================================
function resetHeroSlideForm() {
    heroSlideForm[0].reset();
    currentHeroSlideIdInput.val('');
    heroSlideFormTitulo.text('Agregar Nuevo Slide');
    editModeHeroSlide = false;
}

heroSlideForm.submit(function(e) {
    e.preventDefault();
    showLoading(true);
    
    const formData = new FormData(this);
    const url = editModeHeroSlide 
        ? $(this).data('update-url-template').replace('0', currentHeroSlideIdInput.val())
        : $(this).data('create-url');

    $.ajax({
        url: url,
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        headers: { 'X-CSRFToken': $('input[name="csrfmiddlewaretoken"]', this).val() },
        success: function(response) {
            if (response.success) {
                showMessage('success', response.message);
                heroSlideFormContainer.addClass('hidden');
                if (editModeHeroSlide) {
                    updateHeroSlideInList(response.slide);
                } else {
                    addHeroSlideToList(response.slide);
                }
            } else {
                showMessage('error', response.message);
            }
        },
        error: function(xhr) {
            showMessage('error', 'Error de conexión. Intenta nuevamente.');
            console.error(xhr);
        },
        complete: function() {
            showLoading(false);
        }
    });
});

function addHeroSlideToList(slide) {
    const newRow = `
        <tr data-id="${slide.id}">
            <td class="title">${slide.title}</td>
            <td class="image">
                <img src="${slide.image_url}" width="100" style="border-radius:4px;">
            </td>
            <td class="order">${slide.order}</td>
            <td class="is_active">${slide.is_active ? '✅' : '❌'}</td>
            <td class="actions">
                <button class="btn btn-sm btn-warning btnEditarHeroSlide" 
                        data-id="${slide.id}"
                        data-detail-url-template="{% url 'core:ajax_hero_slide_detail' slide_id=0 %}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-sm btn-danger btnEliminarHeroSlide" 
                        data-id="${slide.id}"
                        data-delete-url-template="{% url 'core:ajax_hero_slide_delete' slide_id=0 %}">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </td>
        </tr>
    `;
    listaHeroSlidesBody.append(newRow);
}

function updateHeroSlideInList(slide) {
    const row = $(`tr[data-id="${slide.id}"]`);
    row.find('.title').text(slide.title);
    row.find('.image').html(`<img src="${slide.image_url}" width="100" style="border-radius:4px;">`);
    row.find('.order').text(slide.order);
    row.find('.is_active').html(slide.is_active ? '✅' : '❌');
}

// =======================================================
// --- EVENTOS PARA EDITAR/ELIMINAR HERO SLIDES ---
// =======================================================
listaHeroSlidesBody.on('click', '.btnEditarHeroSlide', function() {
    const slideId = $(this).data('id');
    const url = $(this).data('detail-url-template').replace('0', slideId);
    showLoading(true);

    $.ajax({
        url: url,
        type: 'GET',
        success: function(response) {
            if (response.success) {
                heroSlideFormTitulo.text('Editar Slide');
                currentHeroSlideIdInput.val(response.slide.id);
                // Llena el formulario con los datos
                $('#id_title').val(response.slide.title);
                $('#id_subtitle').val(response.slide.subtitle);
                $('#id_button_text').val(response.slide.button_text);
                $('#id_button_link').val(response.slide.button_link);
                $('#id_order').val(response.slide.order);
                $('#id_is_active').prop('checked', response.slide.is_active);
                
                editModeHeroSlide = true;
                heroSlideFormContainer.removeClass('hidden');
            }
        },
        complete: function() {
            showLoading(false);
        }
    });
});
// =======================================================
// --- SELECTORES PARA TESTIMONIOS (Agrégalos al inicio con los otros selectores) ---
// =======================================================
const testimonioFormContainer = $('#formTestimonioContainer');
const testimonioForm = $('#testimonioForm');
const testimonioFormTitulo = $('#formTestimonioTitulo');
const currentTestimonioIdInput = $('#currentTestimonioIdInput');
const listaTestimoniosBody = $('#listaTestimoniosBody');
let editModeTestimonio = false;

// =======================================================
// --- EVENTOS PARA TESTIMONIOS ---
// =======================================================
$('#btnMostrarFormTestimonio').click(function() {
    resetTestimonioForm();
    testimonioFormContainer.toggleClass('hidden');
});

$('#btnCancelarTestimonio').click(function() {
    testimonioFormContainer.addClass('hidden');
});

// =======================================================
// --- FUNCIONES PARA TESTIMONIOS ---
// =======================================================
function resetTestimonioForm() {
    testimonioForm[0].reset();
    currentTestimonioIdInput.val('');
    testimonioFormTitulo.text('Agregar Nuevo Testimonio');
    editModeTestimonio = false;
}

testimonioForm.submit(function(e) {
    e.preventDefault();
    showLoading(true);
    
    const formData = new FormData(this);
    const url = editModeTestimonio 
        ? $(this).data('update-url-template').replace('0', currentTestimonioIdInput.val())
        : $(this).data('create-url');

    $.ajax({
        url: url,
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        headers: { 'X-CSRFToken': $('input[name="csrfmiddlewaretoken"]', this).val() },
        success: function(response) {
            if (response.success) {
                showMessage('success', response.message);
                testimonioFormContainer.addClass('hidden');
                if (editModeTestimonio) {
                    updateTestimonioInList(response.testimonio);
                } else {
                    addTestimonioToList(response.testimonio);
                }
            } else {
                showMessage('error', response.message);
            }
        },
        error: function(xhr) {
            showMessage('error', 'Error de conexión. Intenta nuevamente.');
            console.error(xhr);
        },
        complete: function() {
            showLoading(false);
        }
    });
});

function addTestimonioToList(testimonio) {
    const newRow = `
        <tr data-id="${testimonio.id}">
            <td class="autor">${testimonio.autor}</td>
            <td class="cita">${testimonio.cita.substring(0, 50)}...</td>
            <td class="descripcion">${testimonio.descripcion_autor || 'N/A'}</td>
            <td class="activo">${testimonio.activo ? '✅' : '❌'}</td>
            <td class="orden">${testimonio.orden}</td>
            <td class="actions">
                <button class="btn btn-sm btn-warning btnEditarTestimonio" 
                        data-id="${testimonio.id}"
                        data-detail-url-template="{% url 'core:ajax_testimonio_detail' testimonio_id=0 %}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-sm btn-danger btnEliminarTestimonio" 
                        data-id="${testimonio.id}"
                        data-delete-url-template="{% url 'core:ajax_testimonio_delete' testimonio_id=0 %}">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </td>
        </tr>
    `;
    listaTestimoniosBody.append(newRow);
}

function updateTestimonioInList(testimonio) {
    const row = $(`tr[data-id="${testimonio.id}"]`);
    row.find('.autor').text(testimonio.autor);
    row.find('.cita').text(testimonio.cita.substring(0, 50) + '...');
    row.find('.descripcion').text(testimonio.descripcion_autor || 'N/A');
    row.find('.activo').html(testimonio.activo ? '✅' : '❌');
    row.find('.orden').text(testimonio.orden);
}

// =======================================================
// --- EVENTOS PARA EDITAR/ELIMINAR TESTIMONIOS ---
// =======================================================
listaTestimoniosBody.on('click', '.btnEditarTestimonio', function() {
    const testimonioId = $(this).data('id');
    const url = $(this).data('detail-url-template').replace('0', testimonioId);
    showLoading(true);

    $.ajax({
        url: url,
        type: 'GET',
        success: function(response) {
            if (response.success) {
                testimonioFormTitulo.text('Editar Testimonio');
                currentTestimonioIdInput.val(response.testimonio.id);
                // Llena el formulario con los datos
                $('#id_cita').val(response.testimonio.cita);
                $('#id_autor').val(response.testimonio.autor);
                $('#id_descripcion_autor').val(response.testimonio.descripcion_autor);
                $('#id_activo').prop('checked', response.testimonio.activo);
                $('#id_orden').val(response.testimonio.orden);
                
                editModeTestimonio = true;
                testimonioFormContainer.removeClass('hidden');
            }
        },
        complete: function() {
            showLoading(false);
        }
    });
});

listaTestimoniosBody.on('click', '.btnEliminarTestimonio', function() {
    const testimonioId = $(this).data('id');
    const url = $(this).data('delete-url-template').replace('0', testimonioId);
    
    if (confirm('¿Eliminar este testimonio?')) {
        showLoading(true);
        $.ajax({
            url: url,
            type: 'POST',
            headers: { 'X-CSRFToken': $('input[name="csrfmiddlewaretoken"]').val() },
            success: function(response) {
                if (response.success) {
                    $(`tr[data-id="${testimonioId}"]`).fadeOut(400, function() {
                        $(this).remove();
                    });
                    showMessage('success', response.message);
                }
            },
            complete: function() {
                showLoading(false);
            }
        });
    }
});
listaHeroSlidesBody.on('click', '.btnEliminarHeroSlide', function() {
    const slideId = $(this).data('id');
    const url = $(this).data('delete-url-template').replace('0', slideId);
    
    if (confirm('¿Eliminar este slide?')) {
        showLoading(true);
        $.ajax({
            url: url,
            type: 'POST',
            headers: { 'X-CSRFToken': $('input[name="csrfmiddlewaretoken"]').val() },
            success: function(response) {
                if (response.success) {
                    $(`tr[data-id="${slideId}"]`).fadeOut(400, function() {
                        $(this).remove();
                    });
                    showMessage('success', response.message);
                }
            },
            complete: function() {
                showLoading(false);
            }
        });
    }
});
const proyectoFormContainer = $('#formProyectoContainer');
    const proyectoForm = $('#proyectoForm');
    const proyectoFormTitulo = $('#formProyectoTitulo');
    const currentProyectoIdInput = $('#currentProyectoIdInput');
    const listaProyectosBody = $('#listaProyectosBody');
    let editModeProyecto = false;

    function resetProyectoForm() {
        proyectoForm[0].reset();
        currentProyectoIdInput.val('');
        proyectoFormTitulo.text('Agregar Nuevo Proyecto');
        editModeProyecto = false;
        // Definir la URL de creación en el formulario
        proyectoForm.attr('action', "{% url 'core:ajax_proyecto_create_or_update' %}");
    }

    $('#btnMostrarFormProyecto').click(() => {
        resetProyectoForm();
        proyectoFormContainer.toggleClass('hidden');
    });

    $('#btnCancelarProyecto').click(() => proyectoFormContainer.addClass('hidden'));

    proyectoForm.submit(function(e) {
        e.preventDefault();
        showLoading(true);
        const url = $(this).attr('action');
        const formData = new FormData(this);

        $.ajax({
            url: url, type: 'POST', data: formData, processData: false, contentType: false,
            headers: {'X-CSRFToken': formData.get('csrfmiddlewaretoken')},
            success: function(response) {
                if (response.success) {
                    showMessage('success', response.message);
                    setTimeout(() => location.reload(), 1500); // Recarga para ver cambios
                } else {
                    showMessage('error', JSON.stringify(response.errors));
                }
            },
            error: (xhr) => showMessage('error', 'Error de conexión.'),
            complete: () => showLoading(false)
        });
    });

    listaProyectosBody.on('click', '.btnEditarProyecto', function() {
        const proyectoId = $(this).data('id');
        // Usamos la vista de detalle del admin de Django para obtener los datos
        // Nota: Esta es una forma simple. Lo ideal sería un endpoint JSON de detalle.
        // Por ahora, asumimos que recargarás el formulario.
        alert(`Editar proyecto ID: ${proyectoId}. La edición requiere cargar los datos en el formulario.`);
        // Aquí iría el código para rellenar el formulario
    });

    listaProyectosBody.on('click', '.btnEliminarProyecto', function() {
        const proyectoId = $(this).data('id');
        const url = `/admin/core/proyecto/${proyectoId}/delete/`; // URL de eliminación genérica
        if (confirm('¿Estás seguro de eliminar este proyecto?')) {
            // Lógica AJAX para eliminar...
            // $.post(url, ...);
            alert("Funcionalidad de eliminación pendiente de conectar a su URL AJAX.");
        }
    });

    // =======================================================
    // --- LÓGICA PARA DETALLES Y CAMBIO DE ESTADO ---
    // =======================================================
    const detailModal = new bootstrap.Modal(document.getElementById('detailModal'));
    
    // Botón genérico para ver detalles
    $('.content-panel').on('click', '.btnVerDetalle', function() {
        const itemId = $(this).data('id');
        const itemType = $(this).data('type'); // 'solicitud' o 'mensaje'
        const url = `/ajax/details/${itemType}/${itemId}/`; // URL de detalle genérica
        
        showLoading(true);
        $.get(url, function(response) {
            if (response.success) {
                $('#detailModalLabel').html(response.title);
                $('#detailModalBody').html(response.body);
                detailModal.show();
            } else {
                showMessage('error', 'No se pudieron cargar los detalles.');
            }
        }).always(() => showLoading(false));
    });

    // Botón para marcar solicitudes como atendidas
    $('#panel-solicitudes').on('click', '.btnMarcarAtendida', function() {
        const button = $(this);
        const itemId = button.data('id');
        const url = `/ajax/toggle_status/solicitud/${itemId}/`;

        showLoading(true);
        $.post(url, {'csrfmiddlewaretoken': $('input[name="csrfmiddlewaretoken"]').val()}, function(response) {
            if(response.success) {
                showMessage('success', response.message);
                button.closest('tr').find('.atendida').html(response.new_status ? '✅' : '❌');
            }
        }).always(() => showLoading(false));
    });
    
    // Botón para marcar mensajes como leídos
    $('#panel-mensajes').on('click', '.btnMarcarLeido', function() {
        const button = $(this);
        const itemId = button.data('id');
        const url = `/ajax/toggle_status/mensaje/${itemId}/`;

        showLoading(true);
        $.post(url, {'csrfmiddlewaretoken': $('input[name="csrfmiddlewaretoken"]').val()}, function(response) {
            if(response.success) {
                showMessage('success', response.message);
                button.closest('tr').find('.leido').html(response.new_status ? '✅' : '❌');
            }
        }).always(() => showLoading(false));
    });

 // --- FIN DE $(document).ready ---

