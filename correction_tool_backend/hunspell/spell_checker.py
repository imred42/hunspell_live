import hunspell
import os
from django.conf import settings
from spellchecker import SpellChecker

class HunspellChecker:
    def __init__(self):
        # Path to the dicts folder
        data_dir = os.path.join(settings.BASE_DIR, 'hunspell', 'dicts', 'en_US')
        
        # Paths to the .aff and .dic files
        aff_path = os.path.join(data_dir, 'en_US.aff')
        dic_path = os.path.join(data_dir, 'en_US.dic')
        
        self.speller = hunspell.HunSpell(dic_path, aff_path)

    def check_text(self, text):
        return self.speller.spell(text)

class PySpellChecker:
    def __init__(self):
        self.spell = SpellChecker()

    def check_text(self, text):
        # Returns True if the word is spelled correctly, False otherwise
        return text.lower() in self.spell

    def get_suggestions(self, word):
        # Returns a list of suggested corrections for the given word
        return list(self.spell.candidates(word))
