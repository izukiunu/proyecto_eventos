// js/admin/crud_proyectos.js
$(document).ready(function() {

    // --- SELECTORES PARA PROYECTOS ---
    const proyectoFormContainer = $('#formProyectoContainer');
    const proyectoForm = $('#proyectoForm');
    const proyectoFormTitulo = $('#formProyectoTitulo');
    const currentProyectoIdInput = $('#currentProyectoIdInput');
    const listaProyectosBody = $('#listaProyectosBody');
    let editModeProyecto = false;

    // --- FUNCIONES DE AYUDA PARA LA TABLA DE PROYECTOS ---
    function generarHtmlFilaProyecto(proyecto) {
        const editUrlTemplate = listaProyectosBody.find('.btnEditarProyecto:first').data('detail-url-template');
        const deleteUrlTemplate = listaProyectosBody.find('.btnEliminarProyecto:first').data('delete-url-template');
        
        // Corta la descripción para que no sea muy larga en la tabla
        const descripcionCorta = proyecto.descripcion.length > 100 ? proyecto.descripcion.substring(0, 100) + '...' : proyecto.descripcion;

        return `
            <td class="nombre">${proyecto.nombre}</td>
            <td>${descripcionCorta}</td>
            <td><a href="${proyecto.url}" target="_blank">${proyecto.url}</a></td>
            <td>
                <button class="btn btn-sm btn-info btnEditarProyecto" data-id="${proyecto.id}" data-detail-url-template="${editUrlTemplate}" title="Editar">
                    <i class="fas fa-pencil-alt"></i>
                </button>
                <button class="btn btn-sm btn-danger btnEliminarProyecto" data-id="${proyecto.id}" data-delete-url-template="${deleteUrlTemplate}" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
    }

    function addProyectoToList(proyecto) {
        const nuevaFilaHtml = `<tr id="proyecto-${proyecto.id}">${generarHtmlFilaProyecto(proyecto)}</tr>`;
        listaProyectosBody.prepend(nuevaFilaHtml);
    }

    function updateProyectoInList(proyecto) {
        const filaExistente = $(`#proyecto-${proyecto.id}`);
        if (filaExistente.length) {
            filaExistente.html(generarHtmlFilaProyecto(proyecto));
        }
    }

    function resetProyectoForm() {
        proyectoForm[0].reset();
        currentProyectoIdInput.val('');
        proyectoFormTitulo.text('Agregar Nuevo Proyecto');
        editModeProyecto = false;
    }

    // --- EVENTOS PARA MOSTRAR/OCULTAR Y ENVIAR EL FORMULARIO ---
    $('#btnMostrarFormProyecto').click(() => {
        resetProyectoForm();
        proyectoFormContainer.toggleClass('hidden');
    });

    $('#btnCancelarProyecto').click(() => proyectoFormContainer.addClass('hidden'));

    proyectoForm.submit(function(e) {
        e.preventDefault();
        showLoading(true);
        const formData = new FormData(this);
        const url = editModeProyecto 
            ? $(this).data('update-url-template').replace('0', currentProyectoIdInput.val())
            : $(this).data('create-url');

        $.ajax({
            url: url, type: 'POST', data: formData, processData: false, contentType: false,
            headers: {'X-CSRFToken': formData.get('csrfmiddlewaretoken')},
            success: function(response) {
                if (response.success) {
                    showMessage('success', response.message);
                    proyectoFormContainer.addClass('hidden');
                    if(editModeProyecto) {
                        updateProyectoInList(response.proyecto);
                    } else {
                        addProyectoToList(response.proyecto);
                    }
                } else {
                    showMessage('error', JSON.stringify(response.errors));
                }
            },
            error: (xhr) => showMessage('error', 'Error de conexión.'),
            complete: () => showLoading(false)
        });
    });

    // --- EVENTOS PARA EDITAR Y ELIMINAR DESDE LA TABLA ---
    listaProyectosBody.on('click', '.btnEditarProyecto', function() {
        const proyectoId = $(this).data('id');
        const url = $(this).data('detail-url-template').replace('0', proyectoId);
        showLoading(true);

        $.get(url, function(proyecto) {
            // Rellenar el formulario con los datos del proyecto
            resetProyectoForm();
            proyectoFormTitulo.text('Editar Proyecto');
            currentProyectoIdInput.val(proyecto.id);
            proyectoForm.find('input[name="nombre"]').val(proyecto.nombre);
            proyectoForm.find('textarea[name="descripcion"]').val(proyecto.descripcion);
            proyectoForm.find('input[name="url"]').val(proyecto.url);
            // Si tienes un campo para la imagen, tendrías que manejarlo (no se puede setear un input file)
            
            editModeProyecto = true;
            proyectoFormContainer.removeClass('hidden');
        }).always(() => showLoading(false));
    });

    listaProyectosBody.on('click', '.btnEliminarProyecto', function() {
        const proyectoId = $(this).data('id');
        const url = $(this).data('delete-url-template').replace('0', proyectoId);
        
        if (confirm('¿Estás seguro de eliminar este proyecto?')) {
            showLoading(true);
            $.ajax({
                url: url,
                type: 'POST',
                headers: { 'X-CSRFToken': $('input[name="csrfmiddlewaretoken"]').val() },
                success: function(response) {
                    if (response.success) {
                        showMessage('success', response.message);
                        $(`tr[id="proyecto-${proyectoId}"]`).fadeOut(400, function() { $(this).remove(); });
                    } else {
                        showMessage('error', 'No se pudo eliminar el proyecto.');
                    }
                },
                error: () => showMessage('error', 'Error de conexión.'),
                complete: () => showLoading(false)
            });
        }
    });

});