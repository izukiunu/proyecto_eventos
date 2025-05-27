# core/models.py
from django.db import models

class Servicio(models.Model):
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField()
    imagen = models.ImageField(upload_to='servicios/', blank=True, null=True, help_text="Imagen opcional del servicio")

    def __str__(self):
        return self.nombre

class SolicitudCotizacion(models.Model):
    nombre_cliente = models.CharField(max_length=150)
    email_cliente = models.EmailField()
    telefono_cliente = models.CharField(max_length=20, blank=True, null=True)
    servicio_interesado = models.ForeignKey(
        Servicio,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    descripcion_evento = models.TextField(
        help_text="Describe brevemente el servicio o evento que te interesa (si no seleccionaste uno específico arriba)"
    )
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    atendida = models.BooleanField(default=False)

    def __str__(self):
        if self.servicio_interesado:
            return f"Solicitud de {self.nombre_cliente} para '{self.servicio_interesado.nombre}' - {self.fecha_solicitud.strftime('%Y-%m-%d')}"
        return f"Solicitud de {self.nombre_cliente} (general) - {self.fecha_solicitud.strftime('%Y-%m-%d')}"

    class Meta:
        verbose_name = "Solicitud de Cotización"
        verbose_name_plural = "Solicitudes de Cotización"
        ordering = ['-fecha_solicitud']

# --- MODELO AÑADIDO/CORREGIDO ---
class MensajeContacto(models.Model):
    nombre_remitente = models.CharField(max_length=150)
    email_remitente = models.EmailField()
    asunto = models.CharField(max_length=200, blank=True, null=True) # Asunto puede ser opcional
    mensaje = models.TextField()
    fecha_envio = models.DateTimeField(auto_now_add=True)
    leido = models.BooleanField(default=False)

    def __str__(self):
        return f"Mensaje de {self.nombre_remitente} ({self.email_remitente}) - {self.fecha_envio.strftime('%Y-%m-%d')}"

    class Meta:
        verbose_name = "Mensaje de Contacto"
        verbose_name_plural = "Mensajes de Contacto"
        ordering = ['-fecha_envio']