# core/views.py
from django.shortcuts import render, redirect, get_object_or_404
from django.views.generic import ListView
from .models import Servicio, SolicitudCotizacion, MensajeContacto
from .forms import SolicitudCotizacionForm, MensajeContactoForm, ServicioForm # Importa todos tus formularios
from django.contrib import messages
from django.http import JsonResponse

# --- Vistas Públicas (Ejemplos) ---
class ListaServiciosView(ListView):
    model = Servicio
    template_name = 'core/lista_servicios.html'
    context_object_name = 'servicios'

def solicitar_cotizacion_view(request, servicio_id=None):
    initial_data = {}
    servicio_seleccionado = None
    if servicio_id:
        servicio_seleccionado = get_object_or_404(Servicio, id=servicio_id)
        initial_data['servicio_interesado'] = servicio_seleccionado
    if request.method == 'POST':
        # Si el campo servicio_interesado está en el form y se inicializó, su valor debería venir en request.POST
        # Si no, y confiamos en servicio_seleccionado de la URL, se puede omitir 'initial' aquí
        # o asegurarse de que el modelo se guarde con el servicio_seleccionado si el campo no está en el POST.
        form = SolicitudCotizacionForm(request.POST, initial=initial_data if not servicio_id else None)
        if form.is_valid():
            solicitud = form.save(commit=False)
            # Asegurar que el servicio de la URL se use si el campo no estaba en el form o no se llenó
            if servicio_seleccionado and not form.cleaned_data.get('servicio_interesado'):
                 solicitud.servicio_interesado = servicio_seleccionado
            solicitud.save() # Guardar el objeto
            # form.save_m2m() # Si hubiera campos ManyToMany en SolicitudCotizacionForm

            messages.success(request, '¡Tu solicitud de cotización ha sido enviada con éxito!')
            return redirect('core:lista_servicios')
        else:
            messages.error(request, 'Hubo un error en el formulario. Por favor, revisa los campos.')
    else:
        form = SolicitudCotizacionForm(initial=initial_data)
    context = {
        'form': form,
        'servicio_seleccionado': servicio_seleccionado
    }
    return render(request, 'core/solicitud_cotizacion.html', context)

# (Aquí podría ir tu vista para MensajeContactoForm si la tienes)
# def contacto_view(request):
#     # ... lógica similar ...
#     pass

# --- Vistas para el Panel de Administración Personalizado de Servicios (SPA-like) ---

class AdminServicioListView(ListView): # Vista principal que carga la página del panel
    model = Servicio
    template_name = 'core/admin_panel/servicio_list.html'
    context_object_name = 'servicios' # Lista inicial de servicios

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['servicio_form'] = ServicioForm() # Formulario vacío para agregar/editar
        context['titulo_pagina_panel'] = 'Administrar Servicios (SPA)'
        return context

# --- VISTAS/ENDPOINTS AJAX para Servicios ---

def servicio_create_ajax(request):
    if request.method == 'POST':
        form = ServicioForm(request.POST, request.FILES)
        if form.is_valid():
            servicio = form.save()
            return JsonResponse({
                'status': 'success',
                'message': 'Servicio agregado exitosamente.',
                'servicio': {
                    'id': servicio.id,
                    'nombre': servicio.nombre,
                    'descripcion_corta': servicio.descripcion[:50] + "..." if len(servicio.descripcion) > 50 else servicio.descripcion,
                    'imagen_url': servicio.imagen.url if servicio.imagen else None
                }
            })
        else:
            return JsonResponse({'status': 'error', 'errors': form.errors}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Método no permitido'}, status=405)

def servicio_update_ajax(request, servicio_id):
    try:
        servicio = Servicio.objects.get(pk=servicio_id)
    except Servicio.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Servicio no encontrado'}, status=404)

    if request.method == 'POST': # Usamos POST para updates con FormData
        form = ServicioForm(request.POST, request.FILES, instance=servicio)
        if form.is_valid():
            updated_servicio = form.save()
            return JsonResponse({
                'status': 'success',
                'message': 'Servicio actualizado exitosamente.',
                'servicio': {
                    'id': updated_servicio.id,
                    'nombre': updated_servicio.nombre,
                    'descripcion_corta': updated_servicio.descripcion[:50] + "..." if len(updated_servicio.descripcion) > 50 else updated_servicio.descripcion,
                    'imagen_url': updated_servicio.imagen.url if updated_servicio.imagen else None
                }
            })
        else:
            return JsonResponse({'status': 'error', 'errors': form.errors}, status=400)
    return JsonResponse({'status': 'error', 'message': 'Método no permitido'}, status=405)

def servicio_delete_ajax(request, servicio_id):
    if request.method == 'POST': # Usamos POST para delete por simplicidad y CSRF
        try:
            servicio = Servicio.objects.get(pk=servicio_id)
            servicio.delete()
            return JsonResponse({'status': 'success', 'message': 'Servicio eliminado exitosamente.'})
        except Servicio.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Servicio no encontrado.'}, status=404)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
    return JsonResponse({'status': 'error', 'message': 'Método no permitido'}, status=405)

def servicio_detail_json(request, servicio_id): # Para obtener datos para el form de edición
    try:
        servicio = Servicio.objects.get(pk=servicio_id)
        # Para ClearableFileInput, el formulario maneja la imagen existente,
        # solo necesitamos los otros datos.
        return JsonResponse({
            'status': 'success',
            'servicio': {
                'id': servicio.id,
                'nombre': servicio.nombre,
                'descripcion': servicio.descripcion,
                # 'imagen_url': servicio.imagen.url if servicio.imagen else None # Opcional si quieres mostrar un preview
            }
        })
    except Servicio.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Servicio no encontrado'}, status=404)