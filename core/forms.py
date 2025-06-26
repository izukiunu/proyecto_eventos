# core/forms.py
from django import forms
from .models import SolicitudCotizacion, Servicio, MensajeContacto, ChatbotQA, Proyecto # Asegúrate de importar Proyecto aquí
import re

class SolicitudCotizacionForm(forms.ModelForm):
    # Cambiamos el nombre a cotizacion_detallada_json para que coincida con el modelo.
    # El widget HiddenInput y required=False ya están correctos para el frontend.
    cotizacion_detallada_json = forms.CharField( 
        widget=forms.HiddenInput(), 
        required=False
    )

    class Meta:
        model = SolicitudCotizacion
        # Añade 'cotizacion_detallada_json' a los fields de Meta para que el ModelForm lo maneje.
        fields = ['nombre_cliente', 'email_cliente', 'telefono_cliente', 'descripcion_evento', 'cotizacion_detallada_json']
        widgets = {
            'nombre_cliente': forms.TextInput(attrs={'placeholder': 'Tu nombre completo', 'class': 'form-control'}),
            'email_cliente': forms.EmailInput(attrs={'placeholder': 'tu_correo@ejemplo.com', 'class': 'form-control'}),
            'telefono_cliente': forms.TextInput(attrs={'placeholder': '+56912345678', 'class': 'form-control'}),
            'descripcion_evento': forms.Textarea(attrs={'rows': 4, 'placeholder': 'Detalles adicionales de tu evento...', 'class': 'form-control'}),
        }
        labels = {
            'nombre_cliente': 'Nombre Completo',
            'email_cliente': 'Correo Electrónico',
            'telefono_cliente': 'Teléfono de Contacto',
            'descripcion_evento': 'Describe tu Evento o Solicitud Adicional',
        }

    # Validación para el nombre
    def clean_nombre_cliente(self):
        nombre = self.cleaned_data.get('nombre_cliente')
        # Esta expresión regular permite letras (incluyendo acentos y ñ) y espacios.
        if not re.match(r'^[a-zA-Z\sÁÉÍÓÚáéíóúÑñ]+$', nombre):
            raise forms.ValidationError("El nombre solo puede contener letras y espacios.")
        return nombre

    # Validación para el teléfono
    def clean_telefono_cliente(self):
        telefono = self.cleaned_data.get('telefono_cliente')
        # Esta expresión regular permite un signo '+' opcional al inicio, seguido de números y espacios.
        if not re.match(r'^\+?[0-9\s]+$', telefono):
            raise forms.ValidationError("El teléfono solo puede contener números, espacios y el signo '+' al inicio.")
        return telefono

    # No se necesita un clean() extra para mapear si el nombre del campo del formulario y del modelo coinciden.
    # ModelForm ya hace ese mapeo automáticamente.

class ProyectoForm(forms.ModelForm):
    class Meta:
        model = Proyecto
        fields = '__all__'

class ServicioForm(forms.ModelForm): # Para el panel de admin personalizado
    class Meta:
        model = Servicio
        fields = ['nombre', 'descripcion', 'destacado','precio']
        widgets = {
            'nombre': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Nombre del servicio'}),
            'descripcion': forms.Textarea(attrs={'class': 'form-control', 'rows': 5, 'placeholder': 'Descripción detallada del servicio'}),
            # 'imagen' ya no es un campo directo de Servicio, se maneja con ServicioMedia
            # 'imagen': forms.ClearableFileInput(attrs={'class': 'form-control-file'}), 
            'destacado': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'precio': forms.NumberInput(attrs={'class': 'form-control', 'placeholder': 'Ej: 250000.00'}),
        }
        labels = {
            'nombre': 'Nombre del Servicio',
            'descripcion': 'Descripción',
            # 'imagen': 'Imagen del Servicio', # Ya no es un campo directo aquí
            'destacado': 'Marcar como Servicio Destacado',
        }

class MensajeContactoForm(forms.ModelForm):
    class Meta:
        model = MensajeContacto
        fields = ['nombre_remitente', 'email_remitente', 'asunto', 'mensaje']
        widgets = {
            'nombre_remitente': forms.TextInput(attrs={'placeholder': 'Tu nombre', 'class': 'form-control'}),
            'email_remitente': forms.EmailInput(attrs={'placeholder': 'tu_correo@ejemplo.com', 'class': 'form-control'}),
            'asunto': forms.TextInput(attrs={'placeholder': 'Asunto del mensaje (Opcional)', 'class': 'form-control'}), # Asunto puede ser opcional
            'mensaje': forms.Textarea(attrs={'rows': 5, 'placeholder': 'Escribe tu mensaje aquí...', 'class': 'form-control'}),
        }
        labels = {
            'nombre_remitente': 'Tu Nombre',
            'email_remitente': 'Tu Correo Electrónico',
            'asunto': 'Asunto',
            'mensaje': 'Mensaje',
        }

class ChatbotQAForm(forms.ModelForm):
    class Meta:
        model = ChatbotQA
        fields = ['keywords', 'respuesta']
        widgets = {
            'keywords': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Ej: horario, atencion, abierto'}),
            'respuesta': forms.Textarea(attrs={'class': 'form-control', 'rows': 4, 'placeholder': 'Escribe aquí la respuesta del bot...'}),
        }
        labels = {
            'keywords': "Palabras Clave (separadas por comas)",
            'respuesta': "Respuesta del Bot",
        }