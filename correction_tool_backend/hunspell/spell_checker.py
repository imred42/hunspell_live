import hunspell
import os
from django.conf import settings
from spellchecker import SpellChecker

class PySpellChecker:
    SUPPORTED_LANGUAGES = {'en', 'es', 'fr', 'de', 'pt', 'it'}  # Add languages you want to support

    def __init__(self, language='en'):
        try:
            # Validate language code
            if language not in self.SUPPORTED_LANGUAGES:
                print(f"Warning: Language '{language}' not supported. Falling back to English.")
                language = 'en'
            
            # Initialize SpellChecker with specified language
            self.spell = SpellChecker(language=language)
            
            if not self.spell:
                raise ValueError(f"Failed to initialize SpellChecker for language: {language}")
                
        except Exception as e:
            print(f"Error initializing SpellChecker: {str(e)}")
            # Fallback to English if there's an error
            self.spell = SpellChecker(language='en')

    def check_text(self, text):
        try:
            # Returns True if the word is spelled correctly, False otherwise
            return text.lower() in self.spell
        except Exception as e:
            print(f"Error checking text: {str(e)}")
            return False

    def get_suggestions(self, word):
        try:
            # Returns a list of suggested corrections for the given word
            suggestions = list(self.spell.candidates(word))
            return suggestions if suggestions else []
        except Exception as e:
            print(f"Error getting suggestions: {str(e)}")
            return []
