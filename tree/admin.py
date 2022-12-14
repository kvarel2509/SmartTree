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


class PhraseInline(admin.StackedInline):
	model = Phrase
	verbose_name = 'Фраза'
	verbose_name_plural = 'Фразы'
	formset = SingleInitialPhraseInlineFormSet
	fields = ('title', 'text', 'timer', 'initial', 'shortcut')


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
	fields = ('title', 'text', 'timer', 'initial', 'dialog', 'shortcut')
	list_display = ('title', 'timer', 'initial', 'dialog', 'shortcut')
	inlines = (ReactionInline, )


@admin.register(DynamicField)
class DynamicFieldAdmin(admin.ModelAdmin):
	list_display = ('name', 'label', 'default_value', 'changeable', 'position')
	list_editable = ('label', 'default_value', 'changeable', 'position')
	search_fields = ('name',)
