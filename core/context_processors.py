# core/context_processors.py

from .models import ChatbotQA

def chatbot_suggestions_processor(request):
    """
    Este procesador de contexto hace que la lista de sugerencias del chatbot
    esté disponible en todas las plantillas que heredan de base.html.
    """
    # Obtenemos la primera palabra clave de las 5 primeras P/R para usar como sugerencia
    # Puedes ajustar la lógica como quieras (ej. las más populares, aleatorias, etc.)
    try:
        suggestions = [qa.keywords.split(',')[0].strip().capitalize() for qa in ChatbotQA.objects.all()[:5]]
    except:
        suggestions = [] # Si hay un error o la BD no está lista, devuelve una lista vacía

    return {'chatbot_sugerencias': suggestions}