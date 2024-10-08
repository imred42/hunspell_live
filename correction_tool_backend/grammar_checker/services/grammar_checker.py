# core/services/grammar_checker.py
from transformers import pipeline

class GrammarChecker:
    def __init__(self):
        self.pipe = pipeline("text2text-generation", model="vennify/t5-base-grammar-correction")

    def check_grammar(self, text):
        corrected_text = self.pipe(text, max_length=len(text) + 50)[0]['generated_text']
        is_correct = corrected_text.lower() == text.lower()
        return {
            'is_correct': is_correct,
            'original_text': text,
            'corrected_text': corrected_text
        }

grammar_checker = GrammarChecker()