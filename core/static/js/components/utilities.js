// js/components/utilities.js

/**
 * Recoge los datos de un formulario simple y abre una ventana de WhatsApp
 * con un mensaje pre-llenado.
 */
function enviarAWhatsApp() {
  const nombre = document.getElementById("userName").value.trim();
  const mensaje = document.getElementById("userMsg").value.trim();
  
  if (!nombre || !mensaje) {
    alert("Completa tu nombre y mensaje.");
    return;
  }
  
  const texto = encodeURIComponent(`Hola, soy ${nombre}. ${mensaje}`);
  const numero = "56952046511"; // Número de destino de WhatsApp
  
  window.open(`https://wa.me/${numero}?text=${texto}`, "_blank");
}