from django.urls import path
from .views import SpellCheckerView, SpellCorrectionView, PersonalStarlistView, PersonalDictionaryView, WordReplacementView, AllWordReplacementsView

urlpatterns = [
    path('api/check/', SpellCheckerView.as_view(), name='check_spelling'),
    path('api/get-list/', SpellCorrectionView.as_view(), name='suggest_corrections'),
    path('api/star-list/add/', PersonalStarlistView.as_view(), name='add_to_starlist'),
    path('api/star-list/remove/', PersonalStarlistView.as_view(), name='remove_from_starlist'),
    path('api/star-list/words/', PersonalStarlistView.as_view(), name='get_starlist_words'),
    path('api/star-list/languages/', PersonalStarlistView.as_view(), name='get_starlist_languages'),
    path('api/dictionary/add/', PersonalDictionaryView.as_view(), name='add_to_dictionary'),
    path('api/dictionary/remove/', PersonalDictionaryView.as_view(), name='remove_from_dictionary'),
    path('api/dictionary/words/', PersonalDictionaryView.as_view(), name='get_dictionary_words'),
    path('api/dictionary/languages/', PersonalDictionaryView.as_view(), name='get_dictionary_languages'),
    path('api/replacements/', WordReplacementView.as_view(), name='word-replacements'),
    path('data/replacements/', AllWordReplacementsView.as_view(), name='all-word-replacements'),
]

