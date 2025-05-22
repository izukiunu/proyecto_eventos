# core/views.py
from django.shortcuts import render, redirect
from django.views.generic import ListView
from .models import Servicio # Importamos nuestro modelo Servicio
from .forms import SolicitudCotizacionForm # Importamos nuestro nuevo formulario
from django.contrib import messages # Para mostrar mensajes de éxito/error

class ListaServiciosView(ListView):
    model = Servicio # Le decimos a la vista qué modelo usar
    template_name = 'core/lista_servicios.html' # Le decimos qué plantilla HTML usar
    context_object_name = 'servicios' # Nombre que usaremos en la plantilla para la lista

def solicitar_cotizacion_view(request):
    if request.method == 'POST':
        # Si el método es POST, el usuario está enviando el formulario
        form = SolicitudCotizacionForm(request.POST)
        if form.is_valid():
            form.save() # Guarda la solicitud en la base de datos
            # Puedes añadir aquí el envío de email al administrador
            messages.success(request, '¡Tu solicitud de cotización ha sido enviada con éxito! Nos pondremos en contacto contigo pronto.')
            return redirect('core:lista_servicios') # Redirige a la lista de servicios o a donde prefieras
        else:
            # Si el formulario no es válido, se mostrarán los errores en la plantilla
            messages.error(request, 'Hubo un error en el formulario. Por favor, revisa los campos marcados.')
    else:
        # Si el método es GET, es la primera vez que se carga la página o hubo un error y se recarga
        form = SolicitudCotizacionForm()

    context = {
        'form': form
    }
    return render(request, 'core/solicitud_cotizacion.html', context)
