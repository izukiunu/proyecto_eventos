# core/admin.py
from django.contrib import admin
# Asegúrate de importar todos los modelos que vas a registrar
from .models import Servicio, SolicitudCotizacion, MensajeContacto, ConfiguracionSitio

# Registro para Servicio (simple, sin clase Admin personalizada por ahora)
admin.site.register(Servicio)

# Admin para SolicitudCotizacion
class SolicitudCotizacionAdmin(admin.ModelAdmin):
    list_display = ('id_como_ticket', 'nombre_cliente', 'servicio_interesado', 'email_cliente', 'fecha_solicitud', 'atendida')
    list_filter = ('atendida', 'fecha_solicitud', 'servicio_interesado')
    search_fields = ('id', 'nombre_cliente', 'email_cliente', 'descripcion_evento', 'servicio_interesado__nombre')
    # 'id' es de solo lectura por defecto y no necesita estar en readonly_fields.
    # El campo 'ticket_id' (UUID) ya no existe si seguimos el plan de usar solo 'id'.
    readonly_fields = ('fecha_solicitud',) # 'id' ya es readonly

    def id_como_ticket(self, obj):
        return f"#{obj.id}" # Usamos el id directamente
    id_como_ticket.short_description = 'Ticket #' # Nombre de la columna
    id_como_ticket.admin_order_field = 'id' # Permite ordenar por esta columna (que es el ID)
admin.site.register(SolicitudCotizacion, SolicitudCotizacionAdmin)

# Admin para MensajeContacto
class MensajeContactoAdmin(admin.ModelAdmin):
    list_display = ('id_como_mensaje', 'nombre_remitente', 'email_remitente', 'asunto', 'fecha_envio', 'leido')
    list_filter = ('leido', 'fecha_envio')
    search_fields = ('id', 'nombre_remitente', 'email_remitente', 'asunto', 'mensaje')
    readonly_fields = ('fecha_envio', 'nombre_remitente', 'email_remitente', 'asunto', 'mensaje')

    def id_como_mensaje(self, obj):
        return f"Msg #{obj.id}"
    id_como_mensaje.short_description = 'Mensaje #'
    id_como_mensaje.admin_order_field = 'id'

    def mark_as_leido(self, request, queryset):
        queryset.update(leido=True)
    mark_as_leido.short_description = "Marcar seleccionados como leídos"

    def mark_as_no_leido(self, request, queryset):
        queryset.update(leido=False)
    mark_as_no_leido.short_description = "Marcar seleccionados como no leídos"

    actions = [mark_as_leido, mark_as_no_leido]
admin.site.register(MensajeContacto, MensajeContactoAdmin)

# Admin para ConfiguracionSitio
@admin.register(ConfiguracionSitio) # Usando el decorador para registrar
class ConfiguracionSitioAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'email_notificaciones_admin')

    def has_add_permission(self, request):
        # Permite añadir una configuración solo si no existe ninguna todavía.
        return not ConfiguracionSitio.objects.exists()

    def has_delete_permission(self, request, obj=None):
        # No permitir borrar la configuración para asegurar que siempre exista una.
        return False