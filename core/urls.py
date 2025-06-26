# core/urls.py

# --- Importaciones de Django ---
from django.urls import path
from django.contrib.auth.views import LoginView, LogoutView
from django.views.generic import TemplateView # Asegúrate de que TemplateView esté importado

# --- Importaciones de Vistas de la App 'core' ---
from .views import (
    # Vistas públicas principales
    home_carousel_view,
    ListaServiciosView,
    ServicioDetailView,
    solicitar_cotizacion_view,
    contacto_view,
    # solicitud_cotizacion_success, # ELIMINAR: Ya no se importa desde views, se usa TemplateView directamente

    # Vistas del panel de administración personalizado
    AdminServicioListView,

    # Endpoints AJAX para la gestión de servicios
    servicio_create_ajax,
    servicio_update_ajax,
    servicio_delete_ajax,
    servicio_detail_json,

    # Endpoints AJAX para configuración y chatbot
    configuracion_sitio_update_ajax,
    chatbot_query_ajax,
    chatbot_qa_create_ajax,
    chatbot_qa_update_ajax,
    chatbot_qa_delete_ajax,
    chatbot_qa_detail_json,
)

app_name = 'core'

urlpatterns = [
    # ==============================================================================
    # --- VISTAS PÚBLICAS ---
    # ==============================================================================
    path('', home_carousel_view, name='index'),
    path('servicios/', ListaServiciosView.as_view(), name='lista_servicios'),
    path('servicio/<int:pk>/', ServicioDetailView.as_view(), name='servicio_detail'),
    path('contacto/', contacto_view, name='contacto'),

    # Rutas para la cotización
    path('solicitar-cotizacion/', solicitar_cotizacion_view, name='solicitar_cotizacion_general'),
    # Esta URL específica con servicio_id ya no es estrictamente necesaria
    # si toda la lógica de añadir servicios al carrito se maneja en JS y el formulario envía el JSON completo.
    # Si no la usas para pre-cargar un servicio específico en el carrito al llegar a la página, puedes eliminarla.
    # path('solicitar-cotizacion/<int:servicio_id>/', solicitar_cotizacion_view, name='solicitar_cotizacion_especifica'),


    # ==============================================================================
    # --- AUTENTICACIÓN Y PÁGINAS DE ESTADO ---
    # ==============================================================================
    path('login/', LoginView.as_view(template_name='core/login.html'), name='login'),
    path('logout/', LogoutView.as_view(next_page='core:index'), name='logout'), # Redirige al inicio tras salir
    
    # URL para la página de éxito de la solicitud de cotización
    # Ahora usa TemplateView directamente, ya que la lógica de procesamiento está en la vista AJAX.
    path('solicitud-cotizacion/exito/<int:solicitud_id>/', TemplateView.as_view(template_name='core/solicitud_cotizacion_success.html'), name='solicitud_cotizacion_success'),
    
    # Si 'solicitud_enviada_exito' es una página de éxito genérica antigua, puedes mantenerla o eliminarla.
    path('solicitud-enviada/', TemplateView.as_view(template_name='core/solicitud_enviada_exito.html'), name='solicitud_enviada_exito'),


    # ==============================================================================
    # --- PANEL DE ADMINISTRACIÓN PERSONALIZADO ---
    # ==============================================================================
    path('admin-panel/servicios/', AdminServicioListView.as_view(), name='admin_servicio_list'),


    # ==============================================================================
    # --- ENDPOINTS AJAX (API INTERNA) ---
    # ==============================================================================

    # --- Endpoints para Servicios ---
    path('ajax/servicios/crear/', servicio_create_ajax, name='ajax_servicio_create'),
    path('ajax/servicios/<int:servicio_id>/actualizar/', servicio_update_ajax, name='ajax_servicio_update'),
    path('ajax/servicios/<int:servicio_id>/eliminar/', servicio_delete_ajax, name='ajax_servicio_delete'),
    path('ajax/servicios/<int:servicio_id>/detalle/', servicio_detail_json, name='ajax_servicio_detail'),

    # --- Endpoints para Configuración y Chatbot ---
    path('ajax/configuracion/actualizar-email/', configuracion_sitio_update_ajax, name='ajax_configuracion_update_email'),
    path('ajax/chatbot/query/', chatbot_query_ajax, name='ajax_chatbot_query'),
    path('ajax/chatbot-qa/crear/', chatbot_qa_create_ajax, name='ajax_chatbot_qa_create'),
    path('ajax/chatbot-qa/<int:qa_id>/actualizar/', chatbot_qa_update_ajax, name='ajax_chatbot_qa_update'),
    path('ajax/chatbot-qa/<int:qa_id>/eliminar/', chatbot_qa_delete_ajax, name='ajax_chatbot_qa_delete'),
    path('ajax/chatbot-qa/<int:qa_id>/detalle/', chatbot_qa_detail_json, name='ajax_chatbot_qa_detail'),
]