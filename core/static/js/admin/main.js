// js/admin/main.js

$(document).ready(function() {
    console.log("✅ admin main.js cargado y listo.");

    // --- SELECTORES GLOBALES Y CONSTANTES ---
    const detailModalElement = document.getElementById('detailModal');
    let detailModal = detailModalElement ? new bootstrap.Modal(detailModalElement) : null;
    
    // Contenedor principal desde donde delegaremos todos los eventos de acciones.
    // Esto es más robusto porque este contenedor siempre existe.
    const dashboardContent = $('.dashboard-content');

    // ==========================================================
    // LÓGICA PARA EL MENÚ DEL DASHBOARD (Sidebar)
    // ==========================================================
    $('.sidebar-btn').on('click', function() {
        console.log("🖱️ Botón del menú lateral clickeado.");
        const targetPanelId = $(this).data('target');

        // Solo actuar si el botón presionado no es el que ya está activo.
        // Esto evita ocultar y mostrar innecesariamente el mismo panel.
        if (!$(this).hasClass('active')) {
            $('.sidebar-btn').removeClass('active');
            $(this).addClass('active');

            $('.content-panel').addClass('hidden');
            $(targetPanelId).removeClass('hidden');
        }
    });

    // ==========================================================
    // LÓGICA PARA GESTIÓN DE CONFIGURACIÓN
    // ==========================================================
    const configForm = $('#configForm');
    if (configForm.length) {
        configForm.submit(function(event) {
            event.preventDefault();
            console.log("📤 Formulario de Configuración Enviado.");
            showLoading(true);
            
            // Usar .serialize() es más simple y automáticamente maneja todos los campos del form.
            const formData = $(this).serialize();

            $.ajax({
                url: $(this).data('url'),
                type: 'POST',
                data: formData,
                success: function(response) {
                    if (response.status === 'success') {
                        showMessage('success', response.message);
                        $('#emailNotificacionesAdminInput').val(response.nuevo_email);
                    } else {
                        showMessage('error', response.message, 8000); // Más tiempo para errores
                    }
                },
                error: (xhr) => {
                    showMessage('error', 'Error de conexión. Por favor, intenta de nuevo.', 8000);
                    console.error("Error en AJAX de configuración:", xhr);
                },
                complete: () => {
                    showLoading(false);
                }
            });
        });
    }

    // =======================================================
    // --- DELEGACIÓN DE EVENTOS CENTRALIZADA ---
    // Escuchamos los clics desde el contenedor `.dashboard-content`.
    // Esto funciona para CUALQUIER botón dentro de CUALQUIER panel,
    // sin importar si el panel estaba visible al cargar la página.
    // =======================================================

    dashboardContent.on('click', function(e) {
        // Obtenemos el botón más cercano al lugar donde se hizo clic.
        // Esto funciona incluso si el clic es sobre un ícono (<i>) dentro del botón.
        const target = $(e.target).closest('button');

        // Si no se hizo clic sobre un botón, no hacemos nada.
        if (!target.length) {
            return;
        }

        // --- LÓGICA PARA VER DETALLES (MODAL) ---
        // Esta lógica se activa para cualquier botón con la clase .btnVerDetalle
        if (target.hasClass('btnVerDetalle')) {
            const itemId = target.data('id');
            const itemType = target.data('type'); // 'solicitud' o 'mensaje'
            const url = `/ajax/details/${itemType}/${itemId}/`;
            
            showLoading(true);
            $.get(url, function(response) {
                if (response.success && detailModal) {
                    $('#detailModalLabel').html(response.title);
                    $('#detailModalBody').html(response.body);
                    detailModal.show();
                } else if (!detailModal) {
                    console.error("El elemento del modal con ID 'detailModal' no fue encontrado en la página.");
                    showMessage('error', 'Error de UI: No se puede mostrar el modal.');
                } else {
                    showMessage('error', 'No se pudieron cargar los detalles.');
                }
            }).fail(() => {
                showMessage('error', 'Error de conexión al cargar detalles.');
            }).always(() => {
                showLoading(false);
            });
        }

        // --- LÓGICA PARA CAMBIAR ESTADO (ATENDIDA/LEÍDO) ---
        // Se combina la lógica para ambos botones ya que es muy similar.
        if (target.hasClass('btnMarcarAtendida') || target.hasClass('btnMarcarLeido')) {
            const button = target;
            const itemId = button.data('id');
            const itemType = button.hasClass('btnMarcarAtendida') ? 'solicitud' : 'mensaje';
            const url = `/ajax/toggle_status/${itemType}/${itemId}/`;
            const statusCellClass = itemType === 'solicitud' ? '.atendida' : '.leido';

            showLoading(true);
            // Usamos el token CSRF del formulario de configuración, que siempre está presente.
            const csrfToken = $('#configForm input[name="csrfmiddlewaretoken"]').val();

            $.post(url, {'csrfmiddlewaretoken': csrfToken}, function(response) {
                if (response.success) {
                    showMessage('success', response.message);
                    button.closest('tr').find(statusCellClass).html(response.new_status ? '✅' : '❌');
                } else {
                    showMessage('error', 'No se pudo actualizar el estado.');
                }
            }).fail(() => {
                showMessage('error', 'Error de conexión al cambiar estado.');
            }).always(() => {
                showLoading(false);
            });
        }
    });

}); // Fin de $(document).ready()