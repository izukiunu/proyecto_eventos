# core/models.py
from django.db import models

class Servicio(models.Model): # Asegúrate de que tu modelo Servicio esté definido aquí arriba
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField()
    imagen = models.ImageField(upload_to='servicios/', blank=True, null=True, help_text="Imagen opcional del servicio")

    def __str__(self):
        return self.nombre

class SolicitudCotizacion(models.Model):
    nombre_cliente = models.CharField(max_length=150)
    email_cliente = models.EmailField()
    telefono_cliente = models.CharField(max_length=20, blank=True, null=True)

    # --- MODIFICACIÓN AQUÍ ---
    # Añadimos una relación directa con el modelo Servicio
    servicio_interesado = models.ForeignKey(
        Servicio,
        on_delete=models.SET_NULL, # Si se borra el servicio, no se borra la solicitud, solo se pone este campo a NULL
        null=True,                 # Permite que este campo sea nulo en la BD
        blank=True                 # Permite que este campo esté vacío en los formularios (si no se preselecciona)
    )
    # -------------------------

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