import React, { useState, useRef, useEffect } from "react";
import {
  Editor,
  EditorState,
  CompositeDecorator,
  Modifier,
  SelectionState,
  ContentBlock,
  ContentState,
} from "draft-js";
import "draft-js/dist/Draft.css";
import CustomDropdown from "./CustomDropdown";
import DraggableWindow from "./DraggableWindow";
import WordCards from "./WordCards";
import VisualKeyboard from "./VisualKeyboard";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { FaTrashAlt } from 'react-icons/fa';
import { useSpellChecker } from '../hooks/useSpellChecker';

// Types for the main component
interface SpellingSuggestion {
  suggestions: string[];  // Array of suggested corrections
  language: string;      // Language code (e.g., 'en', 'es')
}

interface SpellingResult {
  index: number;
  word: string;
  length: number;
}

interface LanguageOption {
  label: string;
  value: string;
}

// Add this mapping at the top of the file, after the interfaces
const LANGUAGE_CODE_MAP: { [key: string]: string } = {
  'en': 'en_US',
  'es': 'es_ES',
  'fr': 'fr_FR',
  'de': 'de_DE',
  'it': 'it_IT',
  'pt': 'pt_PT'
};

const clearButtonStyle = {
  backgroundColor: "white",
  color: "#dc3545",
  padding: "6px 10px",
  fontSize: "6px",
  fontWeight: "500",
  border: "#dc3545 solid 2px",
  borderRadius: "4px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  transition: "all 0.2s ease",
} as const;

const HomePage: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<LanguageOption>(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage) {
      const parsed = JSON.parse(savedLanguage);
      return parsed;
    }
    return {
      label: "English",
      value: "en",
    };
  });
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [spellingResults, setSpellingResults] = useState<SpellingResult[]>([]);
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const [windowPosition, setWindowPosition] = useState({ x: 0, y: 0 });
  const [currentSuggestions, setCurrentSuggestions] =
    useState<SpellingSuggestion | null>(null);
  const [selectedWordInfo, setSelectedWordInfo] = useState<{
    word: string;
    start: number;
    end: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor>(null);

  const { 
    spellingResults: spellResults, 
    currentSuggestions: spellSuggestions, 
    checkSpelling, 
    getSuggestions 
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
    window.location.reload();
    if (currentLanguage) {
      localStorage.setItem('selectedLanguage', currentLanguage);
    }
  };

  const handleTextChange = (newEditorState: EditorState) => {
    const oldContent = editorState.getCurrentContent();
    const newContent = newEditorState.getCurrentContent();

    // Check if the content has actually changed
    if (oldContent !== newContent) {
      setIsWindowOpen(false);
      setSpellingResults([]);
    }

    setEditorState(newEditorState);
  };

  const handleCheckSpelling = async () => {
    const contentState = editorState.getCurrentContent();
    const text = contentState.getPlainText();
    
    const newResults = await checkSpelling(text);
    if (newResults.length > 0) {
      updateEditorWithSpellingResults(newResults);
      toast.error(`Found ${newResults.length} spelling error${newResults.length === 1 ? '' : 's'}`);
    } else {
      toast.success('No spelling errors found!');
    }
  };

  const handleWordClick = async (
    word: string,
    start: number,
    end: number,
    event: React.MouseEvent
  ) => {
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    setSelectedWordInfo({ word, start, end });
    setWindowPosition({ x: mouseX, y: mouseY });
    setIsWindowOpen(true);
    setCurrentSuggestions(null);

    await getSuggestions(word);
  };

  const updateEditorWithSpellingResults = (
    results: SpellingResult[],
    selection?: SelectionState
  ) => {
    const currentSelection = editorState.getSelection();

    const decorator = new CompositeDecorator([
      {
        strategy: (contentBlock, callback) => {
          const text = contentBlock.getText();
          results.forEach((result) => {
            let start = 0;
            const searchWord = result.word;
            
            while (true) {
              // Find the next occurrence of the word
              const index = text.slice(start).indexOf(searchWord);
              if (index === -1) break;
              
              // Calculate the absolute position
              const absoluteStart = start + index;
              const absoluteEnd = absoluteStart + searchWord.length;
              
              // Verify this is a whole word match
              const beforeChar = absoluteStart > 0 ? text[absoluteStart - 1] : ' ';
              const afterChar = absoluteEnd < text.length ? text[absoluteEnd] : ' ';
              
              if (!/\p{L}/u.test(beforeChar) && !/\p{L}/u.test(afterChar)) {
                callback(absoluteStart, absoluteEnd);
              }
              
              start = absoluteStart + 1;
            }
          });
        },
        component: ({
          children,
          decoratedText,
          contentState,
          entityKey,
          blockKey,
          start,
          end,
        }) => (
          <span
            style={{
              textDecoration: "underline dashed",
              textDecorationColor: "red",
              cursor: "text",
              fontStyle: "italic",
              color:"red"
            }}
            onClick={(e) => handleWordClick(decoratedText, start, end, e)}
          >
            {children}
          </span>
        ),
      },
    ]);

    let newEditorState = EditorState.set(editorState, { decorator });
    newEditorState = EditorState.forceSelection(newEditorState, currentSelection);
    setEditorState(newEditorState);
  };

  const handleCharacterInsert = (character: string) => {
    const contentState = editorState.getCurrentContent();
    const selectionState = editorState.getSelection();
    const newContentState = Modifier.insertText(
      contentState,
      selectionState,
      character
    );
    const newEditorState = EditorState.push(
      editorState,
      newContentState,
      "insert-characters"
    );
    setEditorState(newEditorState);
    setIsWindowOpen(false);
  };

  // Disable scrolling on the entire page
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto"; // Re-enable scrolling when component unmounts
    };
  }, []);

  const focusEditor = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const languageSpecialCharacters: { [key: string]: string[] } = {
    en: [], // English has no special characters
    es: ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü'],
    fr: ['à', 'â', 'ç', 'é', 'è', 'ê', 'ë', 'î', 'ï', 'ô', 'ù', 'û', 'ü', 'ÿ'],
    de: ['ä', 'ö', 'ü', 'ß'],
    it: ['à', 'è', 'é', 'ì', 'î', 'ò', 'ù'],
    pt: ['á', 'â', 'ã', 'ç', 'é', 'ê', 'í', 'ó', 'ô', 'õ', 'ú'],
    // Add more languages and their special characters as needed
  };

  const currentSpecialCharacters =
    languageSpecialCharacters[selectedOption.value] || [];

  return (
    <div
      ref={containerRef}
      style={{
        height: "100vh",
        minHeight: "100vh",
        width: "900px",
        padding: "48px 0",
        position: "relative", // Ensure the container is positioned relative for absolute children
      }}
      onClick={focusEditor}
    >
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 16px" }}>
        <h1
          style={{
            fontSize: "38px",
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: "32px",
          }}
        >
          Spell Checking Tool
        </h1>

        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "24px",
          }}
        >
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
                const target = e.currentTarget;
                target.style.backgroundColor = "#dc3545";
                target.style.color = "white";
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget;
                target.style.backgroundColor = "white";
                target.style.color = "#dc3545";
              }}
              style={clearButtonStyle}
            >
              <FaTrashAlt size={12} />
            </button>
          </div>
          <VisualKeyboard
            onCharacterClick={handleCharacterInsert}
            characters={currentSpecialCharacters}
          />
          <div
            style={{
              border: "1px solid #008fee",
              borderRadius: "4px",
              marginTop: "16px",
              marginBottom: "10px",
              padding: "8px",
              fontSize: "24px",
              minHeight: "300px",
            }}
          >
            <Editor
              ref={editorRef}
              editorState={editorState}
              onChange={handleTextChange}
              placeholder="Enter or paste your text here to check spelling"
            />
          </div>
          <button
            onClick={handleCheckSpelling}
            style={{
              backgroundColor: "#008fee",
              color: "white",
              padding: "12px 24px",
              fontSize: "18px",
              fontWeight: "bold",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Check Spelling
          </button>
        </div>
      </div>
      <DraggableWindow
        isOpen={isWindowOpen}
        onClose={() => setIsWindowOpen(false)}
        initialPosition={windowPosition}
        parentRef={containerRef}
        content={
          <div>
            {currentSuggestions === null ? (
              <p style={{ textAlign: "center", color: "white", fontSize: "14px" }}>
                Loading suggestions...
              </p>
            ) : currentSuggestions.suggestions.length > 0 ? (
              <WordCards
                suggestions={currentSuggestions.suggestions}
                language={currentSuggestions.language}
              />
            ) : (
              <p style={{ textAlign: "center", color: "white", fontSize: "14px" }}>
                No suggestions available
              </p>
            )}
          </div>
        }
      />
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
