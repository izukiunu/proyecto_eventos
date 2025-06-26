// js/admin/crud_chatbot_qa.js
$(document).ready(function() {

    // --- Selectores para la sección de CHATBOT Q&A ---
    const qaFormContainer = $('#formQAContainer');
    const qaForm = $('#qaForm');
    const qaFormTitulo = $('#formQATitulo');
    const currentQAIdInput = $('#currentQAIdInput');
    const listaQABody = $('#listaQABody');
    const noQAMensaje = $('#noQAMensaje');
    let editModeQA = false;

    // Selectores para otros formularios, para poder ocultarlos
    const servicioFormContainer = $('#formServicioContainer');

    // =======================================================
    // --- FUNCIONES DE AYUDA PARA LA TABLA DE Q&A ---
    // =======================================================

    /**
     * Genera el HTML para una nueva fila de la tabla de Preguntas y Respuestas.
     * @param {object} qa - El objeto de la pregunta/respuesta.
     * @returns {string} - El string HTML con el contenido de la fila.
     */
    function generarHtmlFilaQA(qa) {
        // Obtenemos las plantillas de URL de un botón existente para que los nuevos también funcionen
        const editUrlTemplate = $('#tablaQA .btnEditarQA:first').data('detail-url-template');
        const deleteUrlTemplate = $('#tablaQA .btnEliminarQA:first').data('delete-url-template');

        return `
            <td class="keywords">${qa.keywords}</td>
            <td>${qa.respuesta.substring(0, 100)}...</td>
            <td class="actions">
                <button class="btn btn-sm btn-info btnEditarQA" data-id="${qa.id}" data-detail-url-template="${editUrlTemplate}" title="Editar">
                    <i class="fas fa-pencil-alt"></i>
                </button>
                <button class="btn btn-sm btn-danger btnEliminarQA" data-id="${qa.id}" data-delete-url-template="${deleteUrlTemplate}" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
    }
    
    /**
     * Añade una nueva fila a la tabla de Q&A.
     * @param {object} qa - El objeto de la nueva pregunta/respuesta.
     */
    function addQAToList(qa) {
        if (noQAMensaje.length) {
            noQAMensaje.parent().hide();
        }
        const nuevaFilaHtml = `<tr id="qa-${qa.id}">${generarHtmlFilaQA(qa)}</tr>`;
        listaQABody.prepend(nuevaFilaHtml);
    }

    /**
     * Actualiza una fila existente en la tabla de Q&A.
     * @param {object} qa - El objeto de la pregunta/respuesta con sus datos actualizados.
     */
    function updateQAInList(qa) {
        const filaExistente = $(`#qa-${qa.id}`);
        if (filaExistente.length) {
            filaExistente.html(generarHtmlFilaQA(qa));
        }
    }


    // =======================================================
    // --- LÓGICA PARA EL CRUD DEL CHATBOT Q&A ---
    // =======================================================
    
    $('#btnMostrarFormularioQA').click(function() {
        console.log("🖱️ Botón 'Agregar P/R' clickeado.");
        qaForm[0].reset();
        currentQAIdInput.val('');
        qaFormTitulo.text('Agregar Nueva Pregunta/Respuesta');
        editModeQA = false;
        
        // Oculta otros paneles antes de mostrar este
        servicioFormContainer.removeClass('form-visible');
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
        console.log(`🖱️ Botón 'Editar P/R' clickeado para ID: ${qaId}. URL: ${url}`);
        showLoading(true);

        $.ajax({
            url: url,
            type: 'GET',
            success: function(response) {
                console.log('✅ Respuesta AJAX para detalle de P/R recibida:', response);
                if (response.status === 'success') {
                    const qa = response.qa;
                    
                    // Limpia el formulario, establece el modo de edición y rellena los campos.
                    qaForm[0].reset();
                    qaFormTitulo.text('Editar Pregunta/Respuesta');
                    currentQAIdInput.val(qa.id);
                    qaForm.find('input[name="keywords"]').val(qa.keywords);
                    qaForm.find('textarea[name="respuesta"]').val(qa.respuesta);
                    editModeQA = true;
                    
                    console.log('📝 Formulario de P/R rellenado para editar.');

                    // Oculta otros paneles y muestra el de P/R
                    servicioFormContainer.removeClass('form-visible'); 
                    qaFormContainer.addClass('form-visible');
                    console.log('👁️ Panel de P/R visible.');

                    // Scroll para asegurar que el formulario sea visible
                    $('html, body').animate({
                        scrollTop: qaFormContainer.offset().top - 20
                    }, 500);

                } else {
                    showMessage('error', response.message);
                }
            },
            error: function(xhr) {
                showMessage('error', 'Error al cargar los datos de la Pregunta/Respuesta.');
                console.error('❌ Error AJAX en detalle de P/R:', xhr);
            },
            complete: function() {
                showLoading(false);
            }
        });
    });

    listaQABody.on('click', '.btnEliminarQA', function() {
        const qaId = $(this).data('id');
        const url = $(this).data('delete-url-template').replace('0', qaId);
        console.log(`🖱️ Botón 'Eliminar P/R' clickeado para ID: ${qaId}. URL: ${url}`);
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
                error: (xhr) => { showMessage('error', 'Error al eliminar.'); console.error('❌ Error AJAX eliminando P/R:', xhr); },
                complete: () => { showLoading(false); }
            });
        }
    });

}); // Fin de $(document).ready()