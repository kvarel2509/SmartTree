from django.contrib import admin
from .models import Phrase, Dialog, Reaction, DynamicField
from django.forms import BaseInlineFormSet
from django.core.exceptions import ValidationError


class SingleInitialPhraseInlineFormSet(BaseInlineFormSet):
	def clean(self):
		super().clean()
		count = 0

		for form in self.forms:
			if form.cleaned_data.get('initial'):
				count += 1

				if count > 1:
					raise ValidationError('Диалог может содержать тольку одну начальную фразу')

		if not count:
			raise ValidationError('Диалог должен содержать начальную фразу')


class PhraseInline(admin.TabularInline):
	model = Phrase
	verbose_name = 'Фраза'
	verbose_name_plural = 'Фразы'
	formset = SingleInitialPhraseInlineFormSet
	fields = ('title', 'text', 'requests_fill', 'initial')
	autocomplete_fields = ('requests_fill', )


class ReactionInline(admin.TabularInline):
	model = Reaction
	verbose_name = 'Реакция'
	verbose_name_plural = 'Реакции'
	fk_name = 'from_phrase'


@admin.register(Dialog)
class DialogAdmin(admin.ModelAdmin):
	list_display = ('title', 'description',)
	prepopulated_fields = {'slug': ('title',)}
	inlines = (PhraseInline, )


@admin.register(Phrase)
class PhraseAdmin(admin.ModelAdmin):
	fields = ('title', 'text', 'requests_fill', 'initial', 'dialog')
	list_display = ('title', 'initial', 'dialog')
	inlines = (ReactionInline, )
	autocomplete_fields = ('requests_fill',)


@admin.register(DynamicField)
class DynamicFieldAdmin(admin.ModelAdmin):
	list_display = ('name', 'label')
	search_fields = ('name',)
