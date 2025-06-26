// js/admin/crud_testimonios.js
$(document).ready(function() {

    // --- SELECTORES PARA TESTIMONIOS ---
    const testimonioFormContainer = $('#formTestimonioContainer');
    const testimonioForm = $('#testimonioForm');
    const testimonioFormTitulo = $('#formTestimonioTitulo');
    const currentTestimonioIdInput = $('#currentTestimonioIdInput');
    const listaTestimoniosBody = $('#listaTestimoniosBody');
    let editModeTestimonio = false;

    // --- FUNCIONES DE AYUDA PARA LA TABLA ---
    
    function resetTestimonioForm() {
        testimonioForm[0].reset();
        currentTestimonioIdInput.val('');
        testimonioFormTitulo.text('Agregar Nuevo Testimonio');
        editModeTestimonio = false;
    }

    /**
     * Genera el HTML para los botones de acción (Editar, Eliminar).
     * @param {object} testimonio - El objeto del testimonio.
     * @returns {string} - El string HTML con los botones.
     */
    function generarBotonesDeAccion(testimonio) {
        const editUrlTemplate = listaTestimoniosBody.find('.btnEditarTestimonio:first').data('detail-url-template');
        const deleteUrlTemplate = listaTestimoniosBody.find('.btnEliminarTestimonio:first').data('delete-url-template');

        return `
            <button class="btn btn-sm btn-warning btnEditarTestimonio" 
                    data-id="${testimonio.id}"
                    data-detail-url-template="${editUrlTemplate}">
                <i class="fas fa-edit"></i> Editar
            </button>
            <button class="btn btn-sm btn-danger btnEliminarTestimonio" 
                    data-id="${testimonio.id}"
                    data-delete-url-template="${deleteUrlTemplate}">
                <i class="fas fa-trash"></i> Eliminar
            </button>
        `;
    }

    /**
     * Añade una nueva fila a la tabla de testimonios.
     * @param {object} testimonio - El objeto del nuevo testimonio.
     */
    function addTestimonioToList(testimonio) {
        const newRow = `
            <tr data-id="${testimonio.id}">
                <td class="autor">${testimonio.autor}</td>
                <td class="cita">${testimonio.cita.substring(0, 50)}...</td>
                <td class="descripcion">${testimonio.descripcion_autor || 'N/A'}</td>
                <td class="activo">${testimonio.activo ? '✅' : '❌'}</td>
                <td class="orden">${testimonio.orden}</td>
                <td class="actions">
                    ${generarBotonesDeAccion(testimonio)}
                </td>
            </tr>
        `;
        listaTestimoniosBody.append(newRow);
    }

    /**
     * Actualiza una fila existente en la tabla de testimonios.
     * @param {object} testimonio - El objeto del testimonio con sus datos actualizados.
     */
    function updateTestimonioInList(testimonio) {
        const row = $(`tr[data-id="${testimonio.id}"]`);
        row.find('.autor').text(testimonio.autor);
        row.find('.cita').text(testimonio.cita.substring(0, 50) + '...');
        row.find('.descripcion').text(testimonio.descripcion_autor || 'N/A');
        row.find('.activo').html(testimonio.activo ? '✅' : '❌');
        row.find('.orden').text(testimonio.orden);
    }

    // --- EVENTOS PARA MOSTRAR/OCULTAR Y ENVIAR EL FORMULARIO ---
    $('#btnMostrarFormTestimonio').click(function() {
        resetTestimonioForm();
        testimonioFormContainer.toggleClass('hidden');
    });

    $('#btnCancelarTestimonio').click(function() {
        testimonioFormContainer.addClass('hidden');
    });

    testimonioForm.submit(function(e) {
        e.preventDefault();
        showLoading(true);
        
        const formData = new FormData(this);
        const url = editModeTestimonio 
            ? $(this).data('update-url-template').replace('0', currentTestimonioIdInput.val())
            : $(this).data('create-url');

        $.ajax({
            url: url, type: 'POST', data: formData, processData: false, contentType: false,
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
            error: function(xhr) { showMessage('error', 'Error de conexión. Intenta nuevamente.'); console.error(xhr); },
            complete: function() { showLoading(false); }
        });
    });

    // --- EVENTOS PARA EDITAR Y ELIMINAR DESDE LA TABLA ---
    listaTestimoniosBody.on('click', '.btnEditarTestimonio', function() {
        const testimonioId = $(this).data('id');
        const url = $(this).data('detail-url-template').replace('0', testimonioId);
        showLoading(true);

        $.ajax({
            url: url, type: 'GET',
            success: function(response) {
                if (response.success) {
                    resetTestimonioForm();
                    testimonioFormTitulo.text('Editar Testimonio');
                    currentTestimonioIdInput.val(response.testimonio.id);
                    // Llenar el formulario
                    $('#id_cita').val(response.testimonio.cita);
                    $('#id_autor').val(response.testimonio.autor);
                    $('#id_descripcion_autor').val(response.testimonio.descripcion_autor);
                    $('#id_activo').prop('checked', response.testimonio.activo);
                    $('#id_orden').val(response.testimonio.orden);
                    
                    editModeTestimonio = true;
                    testimonioFormContainer.removeClass('hidden');
                }
            },
            complete: function() { showLoading(false); }
        });
    });

    listaTestimoniosBody.on('click', '.btnEliminarTestimonio', function() {
        const testimonioId = $(this).data('id');
        const url = $(this).data('delete-url-template').replace('0', testimonioId);
        
        if (confirm('¿Eliminar este testimonio?')) {
            showLoading(true);
            $.ajax({
                url: url, type: 'POST',
                headers: { 'X-CSRFToken': $('input[name="csrfmiddlewaretoken"]').val() },
                success: function(response) {
                    if (response.success) {
                        $(`tr[data-id="${testimonioId}"]`).fadeOut(400, function() {
                            $(this).remove();
                        });
                        showMessage('success', response.message);
                    }
                },
                complete: function() { showLoading(false); }
            });
        }
    });

});