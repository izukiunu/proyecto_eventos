// js/main.js
$(document).ready(function() {
    
    console.log("✅ main.js PÚBLICO cargado.");

    // --- CONFIGURACIÓN DE CSRF TOKEN PARA TODAS LAS LLAMADAS AJAX ---
    // Esto es necesario para que el chatbot y otras futuras funciones AJAX
    // que se ejecuten en el sitio público funcionen de forma segura.
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    $.ajaxSetup({
        beforeSend: function(xhr, settings) {
            if (!/^(GET|HEAD|OPTIONS|TRACE)$/.test(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
            }
        }
    });
    // --- FIN DE LA CONFIGURACIÓN CSRF ---

});