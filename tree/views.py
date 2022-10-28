from django.views import generic
from django.urls import reverse_lazy
from .models import Dialog, Reaction, DynamicField


class DefaultDialog(generic.RedirectView):
	default_dialog_slug = 'samsung'
	url = reverse_lazy('dialog_detail', kwargs={'slug': default_dialog_slug})


class DialogView(generic.TemplateView):
	model = Dialog
	template_name = 'tree/dialog_detail.html'

	def get_context_data(self, **kwargs):
		ctx = super().get_context_data(**kwargs)
		reactions = Reaction.objects.filter(
			from_phrase__dialog__slug=self.kwargs.get('slug')
		).select_related('from_phrase', 'to_phrase')
		dialog_data = {}

		for reaction in reactions:
			dialog_data.setdefault(reaction.from_phrase, list()).append(
				{'reaction': reaction, 'to_phrase': reaction.to_phrase}
			)
			dialog_data.setdefault(reaction.to_phrase, list())

		dialog = [
			{'phrase': phrase, 'reactions': reactions, 'requests_fill': phrase.requests_fill.all()}
			# TODO запрос перестает быть оптимальным в этом месте
			for phrase, reactions in dialog_data.items()
		]

		ctx['dynamic_fields'] = DynamicField.objects.all()
		ctx['dialog'] = dialog
		return ctx
