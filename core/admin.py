# core/admin.py
from django.contrib import admin
from .models import Servicio, SolicitudCotizacion 

# Registro único para Servicio
admin.site.register(Servicio) 

# Para SolicitudCotizacion, que sí personalizamos:
class SolicitudCotizacionAdmin(admin.ModelAdmin):
    list_display = ('nombre_cliente', 'servicio_interesado', 'email_cliente', 'fecha_solicitud', 'atendida') # Añadido servicio_interesado
    list_filter = ('atendida', 'fecha_solicitud', 'servicio_interesado') # Añadido servicio_interesado
    search_fields = ('nombre_cliente', 'email_cliente', 'descripcion_evento', 'servicio_interesado__nombre') # Búsqueda por nombre de servicio
    readonly_fields = ('fecha_solicitud',)

admin.site.register(SolicitudCotizacion, SolicitudCotizacionAdmin)