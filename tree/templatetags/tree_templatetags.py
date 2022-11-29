from django import template


register = template.Library()


@register.filter
def convert_time_to_second(value):
	return int(value.total_seconds())
