// js/admin/crud_hero_slides.js
$(document).ready(function() {

    // --- SELECTORES PARA HERO SLIDERS ---
    const heroSlideFormContainer = $('#formHeroSlideContainer');
    const heroSlideForm = $('#heroSlideForm');
    const heroSlideFormTitulo = $('#formHeroSlideTitulo');
    const currentHeroSlideIdInput = $('#currentHeroSlideIdInput');
    const listaHeroSlidesBody = $('#listaHeroSlidesBody');
    let editModeHeroSlide = false;

    // --- FUNCIONES DE AYUDA PARA LA TABLA ---
    function resetHeroSlideForm() {
        heroSlideForm[0].reset();
        currentHeroSlideIdInput.val('');
        heroSlideFormTitulo.text('Agregar Nuevo Slide');
        editModeHeroSlide = false;
    }

    function addHeroSlideToList(slide) {
        // Obtenemos las plantillas de URL de un botón existente para que los nuevos también funcionen
        const editUrlTemplate = listaHeroSlidesBody.find('.btnEditarHeroSlide:first').data('detail-url-template');
        const deleteUrlTemplate = listaHeroSlidesBody.find('.btnEliminarHeroSlide:first').data('delete-url-template');

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
                            data-detail-url-template="${editUrlTemplate}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-danger btnEliminarHeroSlide" 
                            data-id="${slide.id}"
                            data-delete-url-template="${deleteUrlTemplate}">
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

    // --- EVENTOS PARA MOSTRAR/OCULTAR Y ENVIAR EL FORMULARIO ---
    $('#btnMostrarFormHeroSlide').click(function() {
        resetHeroSlideForm();
        heroSlideFormContainer.toggleClass('hidden');
    });

    $('#btnCancelarHeroSlide').click(function() {
        heroSlideFormContainer.addClass('hidden');
    });

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

    // --- EVENTOS PARA EDITAR Y ELIMINAR DESDE LA TABLA ---
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
                    // Llenar el formulario
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

}); // Fin de $(document).ready()