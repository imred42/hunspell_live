import React, { useState, useRef, useEffect } from "react";
import CustomDropdown from "./CustomDropdown";
import VisualKeyboard from "./VisualKeyboard";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { FaTrashAlt } from 'react-icons/fa';
import { useSpellChecker } from '../hooks/useSpellChecker';
import { styles } from '../styles/HomePage.styles';
import * as HoverCard from "@radix-ui/react-hover-card";
import { LanguageOption, SpellingResult } from '../types/spelling';

const HomePage: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<LanguageOption>(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage) {
      return JSON.parse(savedLanguage);
    }
    return {
      label: "English",
      value: "en",
    };
  });
  
  const [text, setText] = useState('');
  const [spellingResults, setSpellingResults] = useState<SpellingResult[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const { 
    checkSpelling,
    getSuggestions,
  } = useSpellChecker(selectedOption.value);

  const options: LanguageOption[] = [
    { label: "English", value: "en" },
    { label: "Español", value: "es" },
    { label: "Français", value: "fr" },
    { label: "Deutsch", value: "de" },
    { label: "Italiano", value: "it" },
    { label: "Português", value: "pt" },
  ];

  const handleSelectChange = (option: LanguageOption) => {
    localStorage.setItem('selectedLanguage', JSON.stringify(option));
    setSelectedOption(option);
    window.location.reload();
  };

  const handleClear = () => {
    const currentLanguage = localStorage.getItem('selectedLanguage');
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
      setText('');
      setSpellingResults([]);
    }
    if (currentLanguage) {
      localStorage.setItem('selectedLanguage', currentLanguage);
    }
  };

  const handleTextChange = (event: React.FormEvent<HTMLDivElement>) => {
    const newText = event.currentTarget.innerText;
    setText(newText);
    setSpellingResults([]);
    
    // Ensure cursor stays at the end of content
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const lastChild = event.currentTarget.lastChild;
      if (lastChild) {
        range.setStartAfter(lastChild);
        range.setEndAfter(lastChild);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  };

  const handleCheckSpelling = async () => {
    if (!text.trim()) {
      toast.warning('Please enter some text to check spelling');
      return;
    }
    
    const newResults = await checkSpelling(text);
    if (newResults.length > 0) {
      highlightMisspelledWords(newResults);
      toast.error(`Found ${newResults.length} spelling error${newResults.length === 1 ? '' : 's'}`);
    } else {
      toast.success('No spelling errors found!');
    }
  };

  const highlightMisspelledWords = (results: SpellingResult[]) => {
    if (!editorRef.current) return;

    const textContent = editorRef.current.innerText;
    let html = '';
    let lastIndex = 0;

    results.forEach((result) => {
      const wordStart = result.index;
      const wordEnd = result.index + result.word.length;
      
      // Add text before the misspelled word
      html += textContent.slice(lastIndex, wordStart);
      
      // Add the misspelled word with highlighting
      const misspelledWord = textContent.slice(wordStart, wordEnd);
      html += `<span 
        class="misspelled" 
        data-word="${misspelledWord}"
        data-start="${wordStart}"
        style="text-decoration: underline dashed red; color: red; cursor: pointer;"
      >${misspelledWord}</span>`;
      
      lastIndex = wordEnd;
    });

    // Add any remaining text
    html += textContent.slice(lastIndex);
    editorRef.current.innerHTML = html;
    setSpellingResults(results);

    // Add click handlers to misspelled words
    const misspelledElements = editorRef.current.getElementsByClassName('misspelled');
    Array.from(misspelledElements).forEach(element => {
      element.addEventListener('click', handleMisspelledWordClick);
    });
  };

  const handleMisspelledWordClick = async (event: Event) => {
    const element = event.target as HTMLSpanElement;
    const word = element.dataset.word;
    const startPosition = parseInt(element.dataset.start || '0', 10);
    
    if (!word) return;

    const suggestions = await getSuggestions(word);
    
    // Create and show suggestions popup
    const popup = document.createElement('div');
    popup.style.position = 'absolute';
    popup.style.left = `${element.offsetLeft}px`;
    popup.style.top = `${element.offsetTop + element.offsetHeight}px`;
    popup.style.backgroundColor = 'white';
    popup.style.border = '1px solid #ccc';
    popup.style.borderRadius = '4px';
    popup.style.padding = '8px';
    popup.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    popup.style.zIndex = '1000';

    suggestions.suggestions.forEach(suggestion => {
      const suggestionElement = document.createElement('div');
      suggestionElement.textContent = suggestion;
      suggestionElement.style.padding = '4px 8px';
      suggestionElement.style.cursor = 'pointer';
      suggestionElement.addEventListener('mouseover', () => {
        suggestionElement.style.backgroundColor = '#f0f0f0';
      });
      suggestionElement.addEventListener('mouseout', () => {
        suggestionElement.style.backgroundColor = 'transparent';
      });
      suggestionElement.addEventListener('click', () => {
        handleSuggestionClick(suggestion, word, startPosition);
        document.body.removeChild(popup);
      });
      popup.appendChild(suggestionElement);
    });

    document.body.appendChild(popup);

    // Remove popup when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      if (!popup.contains(e.target as Node) && document.body.contains(popup)) {
        document.body.removeChild(popup);
        document.removeEventListener('click', handleClickOutside);
      }
    };
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
  };

  const handleSuggestionClick = (suggestion: string, originalWord: string, startPosition: number) => {
    if (!editorRef.current) return;

    const content = editorRef.current.innerHTML;
    const regex = new RegExp(`<span[^>]*data-word="${originalWord}"[^>]*>${originalWord}</span>`);
    const newContent = content.replace(regex, suggestion);
    editorRef.current.innerHTML = newContent;
    
    // Update text state
    setText(editorRef.current.innerText);
    
    // Remove the replaced word from spelling results
    setSpellingResults(prev => 
      prev.filter(result => !(result.word === originalWord && result.index === startPosition))
    );
  };

  const handleCharacterInsert = (character: string) => {
    if (!editorRef.current) return;
    
    // Get the current selection
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const textNode = document.createTextNode(character);
    range.insertNode(textNode);
    
    // Move cursor after inserted character
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Update text state
    setText(editorRef.current.innerText);
  };

  // Disable scrolling on the entire page
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const focusEditor = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const currentSpecialCharacters = options.find(
    option => option.value === selectedOption.value
  )?.specialCharacters || [];

  return (
    <div
      ref={containerRef}
      style={styles.container}
      onClick={focusEditor}
    >
      <div style={styles.content}>
        <h1 style={styles.title}>
          Spell Checking Tool
        </h1>

        <div style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
        }}>
          <CustomDropdown
            options={options}
            value={selectedOption}
            onChange={handleSelectChange}
          />
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-start',
            marginTop: '16px',
            marginBottom: '16px'
          }}>
            <button
              onClick={handleClear}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#dc3545";
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "white";
                e.currentTarget.style.color = "#dc3545";
              }}
              style={styles.clearButton}
            >
              <FaTrashAlt size={12} />
            </button>
          </div>
          <VisualKeyboard
            onCharacterClick={handleCharacterInsert}
            characters={currentSpecialCharacters}
          />
          <div
            ref={editorRef}
            contentEditable
            onInput={handleTextChange}
            style={{
              ...styles.editor,
              textAlign: 'left',
              caretColor: 'auto',
            }}
            placeholder="Enter or paste your text here to check spelling"
          />
          <button
            onClick={handleCheckSpelling}
            style={styles.checkButton}
          >
            Check Spelling
          </button>
        </div>
      </div>
      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default HomePage;