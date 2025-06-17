from datetime import timedelta
from django.conf import settings
from django.db.models import Q
from django.http import HttpRequest

from axes.models import AccessAttempt
from axes.helpers import get_lockout_parameters

def get_cooloff_time(request: HttpRequest) -> timedelta:
    """
    Calcula un tiempo de bloqueo progresivo construyendo la consulta
    de forma dinámica con Q Objects.
    """
    params_list = get_lockout_parameters(request)
    query = Q()

    for params in params_list:
        if isinstance(params, dict):  # Solo agrega si es un diccionario
            query |= Q(**params)

    attempt = AccessAttempt.objects.filter(query).first() if query else None
    failure_count = attempt.failures_since_start if attempt else 0

    failure_limit = getattr(settings, "AXES_FAILURE_LIMIT", 5)
    base_cooloff = timedelta(minutes=5)
    max_cooloff = timedelta(minutes=30)

    lockout_multiplier = max(1, (failure_count // failure_limit if failure_count > 0 else 0))
    calculated_cooloff = base_cooloff * lockout_multiplier

    return min(calculated_cooloff, max_cooloff)