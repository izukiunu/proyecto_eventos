# core/urls.py
from django.urls import path
from .views import (
    ListaServiciosView,
    solicitar_cotizacion_view,
    # contacto_view, # Si la tienes
    AdminServicioListView,
    # Vistas AJAX para servicios
    servicio_create_ajax,
    servicio_update_ajax,
    servicio_delete_ajax,
    servicio_detail_json,
)

app_name = 'core'

urlpatterns = [
    # URLs Públicas
    path('servicios/', ListaServiciosView.as_view(), name='lista_servicios'),
    path('solicitar-cotizacion/<int:servicio_id>/', solicitar_cotizacion_view, name='solicitar_cotizacion_especifica'),
    path('solicitar-cotizacion/', solicitar_cotizacion_view, name='solicitar_cotizacion_general'),
    # path('contacto/', contacto_view, name='contacto'), # Si la tienes

    # URLs para el Panel de Administración Personalizado de Servicios
    path('admin-panel/servicios/', AdminServicioListView.as_view(), name='admin_servicio_list'), # Carga la página SPA

    # Endpoints AJAX para la gestión de servicios
    path('ajax/servicios/crear/', servicio_create_ajax, name='ajax_servicio_create'),
    path('ajax/servicios/<int:servicio_id>/actualizar/', servicio_update_ajax, name='ajax_servicio_update'),
    path('ajax/servicios/<int:servicio_id>/eliminar/', servicio_delete_ajax, name='ajax_servicio_delete'),
    path('ajax/servicios/<int:servicio_id>/detalle/', servicio_detail_json, name='ajax_servicio_detail'),
]