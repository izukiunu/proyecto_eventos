# core/urls.py
from django.urls import path
from .views import ListaServiciosView, solicitar_cotizacion_view

app_name = 'core' # Esto define el namespace 'core'

urlpatterns = [
    path('servicios/', ListaServiciosView.as_view(), name='lista_servicios'),
    # URL para cuando se solicita cotización para un servicio específico
    path('solicitar-cotizacion/<int:servicio_id>/', solicitar_cotizacion_view, name='solicitar_cotizacion_especifica'),
    # URL para una solicitud de cotización general (sin servicio preseleccionado)
    path('solicitar-cotizacion/', solicitar_cotizacion_view, name='solicitar_cotizacion_general'), # <--- ESTA ES LA LÍNEA IMPORTANTE
]