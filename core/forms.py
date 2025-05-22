# core/forms.py
from django import forms
from .models import SolicitudCotizacion, Servicio # Asegúrate de importar Servicio

class SolicitudCotizacionForm(forms.ModelForm):
    class Meta:
        model = SolicitudCotizacion
        # --- MODIFICACIÓN AQUÍ ---
        # Añadimos 'servicio_interesado' a la lista de campos
        fields = ['nombre_cliente', 'email_cliente', 'telefono_cliente', 'servicio_interesado', 'descripcion_evento']
        # -------------------------

        widgets = {
            'nombre_cliente': forms.TextInput(attrs={'placeholder': 'Tu nombre completo'}),
            'email_cliente': forms.EmailInput(attrs={'placeholder': 'tu_correo@ejemplo.com'}),
            'telefono_cliente': forms.TextInput(attrs={'placeholder': 'Tu número de teléfono (Opcional)'}),
            # Queremos que 'servicio_interesado' sea un desplegable (lo será por defecto al ser ForeignKey)
            # Si quisiéramos ocultarlo cuando se preselecciona, podríamos usar forms.HiddenInput() aquí
            # y manejarlo en la vista, pero por ahora dejémoslo visible.
            'descripcion_evento': forms.Textarea(attrs={'rows': 4, 'placeholder': 'Detalles adicionales de tu solicitud...'}),
        }
        labels = {
            'nombre_cliente': 'Nombre Completo',
            'email_cliente': 'Correo Electrónico',
            'telefono_cliente': 'Teléfono de Contacto',
            'servicio_interesado': 'Servicio de Interés', # Nueva etiqueta
            'descripcion_evento': 'Describe tu Solicitud',
        }
        help_texts = {
            'email_cliente': 'Nos pondremos en contacto contigo a través de este correo.',
        }

    # (Opcional) Para llenar el desplegable de servicios con los nombres correctos
    # y quizás un "Seleccione un servicio" como opción por defecto si es blank=True.
    # Por ahora, Django lo manejará automáticamente.