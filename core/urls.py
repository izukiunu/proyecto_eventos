# core/urls.py
from django.urls import path
# from . import views  # Ya no necesitamos esta línea si importamos explícitamente
from django.contrib.auth.views import LoginView, LogoutView
from .views import (
    index_view,
    ListaServiciosView,
    solicitar_cotizacion_view,
    AdminServicioListView,
    servicio_create_ajax,
    servicio_update_ajax,
    servicio_delete_ajax,
    servicio_detail_json,
    configuracion_sitio_update_ajax,
    chatbot_query_ajax,
    chatbot_qa_create_ajax,
    chatbot_qa_update_ajax,
    chatbot_qa_delete_ajax,
    chatbot_qa_detail_json

)

app_name = 'core'

urlpatterns = [
    # --- index ---
    path('', index_view, name='index'), # <-- CAMBIADO: de 'views.index' a 'index_view'

    # URLs Públicas
    path('servicios/', ListaServiciosView.as_view(), name='lista_servicios'),
    path('solicitar-cotizacion/<int:servicio_id>/', solicitar_cotizacion_view, name='solicitar_cotizacion_especifica'),
    path('solicitar-cotizacion/', solicitar_cotizacion_view, name='solicitar_cotizacion_general'),
    # path('contacto/', contacto_view, name='contacto'), # Descomenta si la tienes
    path('login/', LoginView.as_view(template_name='core/login.html'), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),

    # URLs para el Panel de Administración Personalizado de Servicios
    path('admin-panel/servicios/', AdminServicioListView.as_view(), name='admin_servicio_list'), # Carga la página SPA

    # Endpoints AJAX para la gestión de servicios
    path('ajax/servicios/crear/', servicio_create_ajax, name='ajax_servicio_create'),
    path('ajax/servicios/<int:servicio_id>/actualizar/', servicio_update_ajax, name='ajax_servicio_update'),
    path('ajax/servicios/<int:servicio_id>/eliminar/', servicio_delete_ajax, name='ajax_servicio_delete'),
    path('ajax/servicios/<int:servicio_id>/detalle/', servicio_detail_json, name='ajax_servicio_detail'),

    # --- NUEVA URL PARA ACTUALIZAR CONFIGURACIÓN DEL EMAIL DEL ADMIN ---
    path('ajax/configuracion/actualizar-email/', configuracion_sitio_update_ajax, name='ajax_configuracion_update_email'),
    path('ajax/chatbot/query/', chatbot_query_ajax, name='ajax_chatbot_query'),
    path('ajax/chatbot-qa/crear/', chatbot_qa_create_ajax, name='ajax_chatbot_qa_create'),
    path('ajax/chatbot-qa/<int:qa_id>/actualizar/', chatbot_qa_update_ajax, name='ajax_chatbot_qa_update'),
    path('ajax/chatbot-qa/<int:qa_id>/eliminar/', chatbot_qa_delete_ajax, name='ajax_chatbot_qa_delete'),
    path('ajax/chatbot-qa/<int:qa_id>/detalle/', chatbot_qa_detail_json, name='ajax_chatbot_qa_detail'),

]