from .models import Dialog, DynamicField

from django.views import generic
from django.urls import reverse_lazy


class DefaultDialog(generic.RedirectView):
	default_dialog_slug = 'samsung'
	url = reverse_lazy('dialog_detail', kwargs={'slug': default_dialog_slug})


class DialogView(generic.DetailView):
	model = Dialog
	template_name = 'tree/dialog_detail.html'

	def get_context_data(self, **kwargs):
		ctx = super().get_context_data(**kwargs)
		phrases = self.object.get_dialog_data()

		dialog = [
			{
				'phrase': phrase,
				'reactions': [
					{'reaction': reaction, 'to_phrase': reaction.to_phrase} for reaction in phrase.from_phrase_set.all()
				]
			}
			for phrase in phrases
		]

		ctx['dynamic_fields'] = DynamicField.objects.all().order_by('position')
		ctx['dialog'] = dialog
		return ctx
