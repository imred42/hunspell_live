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
import { apiRequest } from "../utils/config";
import VisualKeyboard from "./VisualKeyboard";

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

const HomePage: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<LanguageOption>({
    label: "English",
    value: "en",
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

  const options: LanguageOption[] = [
    { label: "English", value: "en" },
    { label: "Español", value: "es" },
    { label: "Français", value: "fr" },
    { label: "Deutsch", value: "de" },
    { label: "Italiano", value: "it" },
    { label: "Português", value: "pt" },
  ];

  const handleSelectChange = (option: LanguageOption) => {
    setSelectedOption(option);
    setSpellingResults([]);
    setEditorState(EditorState.createEmpty());
  };

  const handleTextChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState);
    setSpellingResults([]);
  };

  const handleCheckSpelling = async () => {
    const contentState = editorState.getCurrentContent();
    const text = contentState.getPlainText();
    const wordRegex = /\b\w+\b/g;
    let match;
    const wordsWithIndices: { word: string; index: number }[] = [];

    while ((match = wordRegex.exec(text)) !== null) {
      wordsWithIndices.push({ word: match[0], index: match.index });
    }

    const uniqueWords = Array.from(
      new Set(wordsWithIndices.map((item) => item.word.toLowerCase()))
    );

    try {
      const response = await apiRequest("/api/check-spelling/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          words: uniqueWords,
          language: selectedOption.value,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to check spelling");
      }

      const result = await response.json();
      const incorrectWords = result.results
        .filter((res: { word: string; is_correct: boolean }) => !res.is_correct)
        .map((res: { word: string; is_correct: boolean }) => res.word.toLowerCase());

      const newSpellingResults: SpellingResult[] = [];

      wordsWithIndices.forEach(({ word, index }) => {
        if (incorrectWords.includes(word.toLowerCase())) {
          newSpellingResults.push({
            index,
            word,
            length: word.length,
          });
        }
      });

      setSpellingResults(newSpellingResults);
      updateEditorWithSpellingResults(newSpellingResults);
    } catch (error) {
      console.error("Error checking spelling:", error);
    }
  };

  const handleWordClick = async (
    word: string,
    start: number,
    end: number,
    event: React.MouseEvent
  ) => {
    // Calculate position based on mouse cursor
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    setSelectedWordInfo({ word, start, end });
    setWindowPosition({ 
      x: mouseX, 
      y: mouseY 
    });
    setIsWindowOpen(true);
    setCurrentSuggestions(null);

    try {
      const response = await apiRequest("/api/suggest-corrections/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          words: [word],
          language: selectedOption.value,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get suggestions");
      }

      const result = await response.json();
      console.log('API Response:', result); // Debug log

      const suggestions = result.suggestions[word] || [];
      console.log('Processed suggestions:', suggestions); // Debug log

      setCurrentSuggestions({
        suggestions: suggestions,
        language: result.language
      });
    } catch (error) {
      console.error("Error getting suggestions:", error);
      setCurrentSuggestions({
        suggestions: [],
        language: selectedOption.value
      });
    }
  };

  const replaceWord = (replacement: string) => {
    if (!selectedWordInfo) return;

    const { start, end } = selectedWordInfo;
    const contentState = editorState.getCurrentContent();
    const blockMap = contentState.getBlockMap();

    let targetBlock: ContentBlock | null = null;
    let blockStart = 0;

    blockMap.forEach((block) => {
      if (!block) return;
      const length = block.getLength();
      if (blockStart <= start && start < blockStart + length) {
        targetBlock = block;
      }
      blockStart += length + 1;
    });

    if (!targetBlock) return;

    const blockKey = targetBlock.getKey();
    const selection = SelectionState.createEmpty(blockKey).merge({
      anchorOffset: start,
      focusOffset: end,
      hasFocus: true,
    });

    const newContentState = Modifier.replaceText(
      contentState,
      selection,
      replacement
    );

    const newEditorState = EditorState.push(
      editorState,
      newContentState,
      "replace-text"
    );

    setEditorState(newEditorState);
    setIsWindowOpen(false);

    // Remove the replaced word from spelling results
    const updatedResults = spellingResults.filter(
      (result) =>
        !(result.index === start && result.word === selectedWordInfo.word)
    );
    setSpellingResults(updatedResults);
    updateEditorWithSpellingResults(updatedResults);
  };

  const updateEditorWithSpellingResults = (
    results: SpellingResult[],
    selection?: SelectionState
  ) => {
    // Preserve the current selection
    const currentSelection = editorState.getSelection();

    const decorator = new CompositeDecorator([
      {
        strategy: (contentBlock, callback) => {
          const text = contentBlock.getText();
          results.forEach((result) => {
            let start = 0;
            while (
              (start = text.toLowerCase().indexOf(result.word.toLowerCase(), start)) !==
              -1
            ) {
              callback(start, start + result.length);
              start += result.length;
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
              textDecoration: "underline",
              textDecorationColor: "red",
              cursor: "pointer",
            }}
            onClick={(e) => handleWordClick(decoratedText, start, end, e)}
          >
            {children}
          </span>
        ),
      },
    ]);

    // Set the new decorator while preserving the selection
    let newEditorState = EditorState.set(editorState, { decorator });

    // Restore the original selection
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
          <VisualKeyboard
            onCharacterClick={handleCharacterInsert}
            characters={currentSpecialCharacters}
          />
          <div
            style={{
              border: "1px solid #008fee",
              borderRadius: "4px",
              marginTop: "16px",
              marginBottom: "16px",
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
                onWordClick={replaceWord}
              />
            ) : (
              <p style={{ textAlign: "center", color: "white", fontSize: "14px" }}>
                No suggestions available
              </p>
            )}
          </div>
        }
      />
    </div>
  );
};

export default HomePage;
