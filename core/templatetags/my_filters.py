from django import template

register = template.Library()

@register.filter
def replace(value, arg):
    """
    Replaces all occurrences of a substring with another string.
    Usage: {{ value|replace:"old_string,new_string" }}
    """
    if not isinstance(value, str):
        return value

    try:
        old, new = arg.split(',')
    except ValueError:
        # Puedes manejar este error de forma más robusta si lo deseas
        # Por ahora, si el argumento es malformado, devuelve el valor original.
        return value 

    return value.replace(old, new)