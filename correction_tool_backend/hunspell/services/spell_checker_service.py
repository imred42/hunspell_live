from ..spell_checker import PySpellChecker

class SpellCheckerService:
    def __init__(self):
        self.spell_checker = PySpellChecker()

    def check_spelling(self, word):
        return self.spell_checker.check_text(word)

    def get_suggestions(self, word):
        return self.spell_checker.get_suggestions(word)

spell_checker_service = SpellCheckerService()

