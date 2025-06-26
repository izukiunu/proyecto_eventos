// js/admin/ui.js

/**
 * Muestra un mensaje de éxito o error en la pantalla.
 * @param {string} type - 'success' o 'error'.
 * @param {string} text - El mensaje a mostrar.
 * @param {number} [duration=5000] - Cuánto tiempo se muestra el mensaje en ms. 0 para indefinido.
 */
function showMessage(type, text, duration = 5000) {
    // Se busca el elemento del DOM aquí adentro para asegurar que exista cuando se llame la función.
    const messageArea = $('#messageArea'); 
    
    const messageDiv = $('<div>').addClass(type === 'success' ? 'success-message' : 'error-message').html(text);
    messageArea.empty().append(messageDiv).removeClass('hidden');
    
    if (duration > 0) {
        setTimeout(() => { 
            messageDiv.fadeOut(500, function() { 
                $(this).remove(); 
            }); 
        }, duration);
    }
}

/**
 * Muestra u oculta el spinner de carga.
 * @param {boolean} show - true para mostrar, false para ocultar.
 */
function showLoading(show) {
    // Se busca el elemento del DOM aquí adentro.
    const loadingSpinner = $('#loadingSpinner'); 
    loadingSpinner.toggleClass('hidden', !show);
}