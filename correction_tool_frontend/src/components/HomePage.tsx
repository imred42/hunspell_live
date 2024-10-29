import React, { useState, useEffect, useRef } from 'react';
import { Editor, EditorState, CompositeDecorator, ContentState } from 'draft-js';
import 'draft-js/dist/Draft.css';
import CustomDropdown from './CustomDropdown';
import { apiRequest } from '../utils/config';
import DraggableWindow from './DraggableWindow';

// Add this polyfill at the top of the file
if (typeof global === 'undefined') {
  (window as any).global = window;
}

const HomePage = () => {
  const [selectedOption, setSelectedOption] = useState({ label: 'English', value: 'en' });
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [spellingResults, setSpellingResults] = useState([]);
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const [windowPosition, setWindowPosition] = useState({ x: 0, y: 0 });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedWord, setSelectedWord] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const options = [
    { label: 'English', value: 'en' },
    { label: 'Español', value: 'es' },
    { label: 'Français', value: 'fr' },
    { label: 'Deutsch', value: 'de' },
    { label: 'Italiano', value: 'it' },
    { label: 'Português', value: 'pt' },
  ];

  const handleSelectChange = (option) => {
    setSelectedOption(option);
  };

  const handleTextChange = (newEditorState) => {
    setEditorState(newEditorState);
    setSpellingResults([]); // Clear spelling results when text changes
  };

  const handleCheckSpelling = async () => {
    const text = editorState.getCurrentContent().getPlainText();
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const results = [];

    try {
      for (let i = 0; i < words.length; i++) {
        const response = await apiRequest('/api/check-spelling/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            word: words[i],
            language: selectedOption.value 
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to check spelling');
        }

        const result = await response.json();
        if (!result.is_correct) {
          results.push({
            index: text.indexOf(words[i]),
            word: words[i],
          });
        }
      }

      setSpellingResults(results);
      updateEditorWithSpellingResults(results);
    } catch (error) {
      console.error('Error checking spelling:', error);
    }
  };

  const handleWordClick = async (word: string, event: React.MouseEvent) => {
    setSelectedWord(word);
    setWindowPosition({ x: event.clientX, y: event.clientY });
    setIsWindowOpen(true);

    try {
      const response = await apiRequest('/api/suggest-corrections/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          word: word,
          language: selectedOption.value 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get suggestions');
      }

      const result = await response.json();
      setSuggestions(result.suggestions || []);
    } catch (error) {
      console.error('Error getting suggestions:', error);
    }
  };

  const updateEditorWithSpellingResults = (results) => {
    const decorator = new CompositeDecorator([
      {
        strategy: (contentBlock, callback) => {
          results.forEach(result => {
            const start = result.index;
            const end = start + result.word.length;
            callback(start, end);
          });
        },
        component: ({ children, decoratedText }) => (
          <span 
            style={{ textDecoration: 'underline', textDecorationColor: 'red', cursor: 'text' }}
            onClick={(e) => handleWordClick(decoratedText, e)}
          >
            {children}
          </span>
        ),
      },
    ]);

    const newEditorState = EditorState.set(editorState, { decorator });
    setEditorState(newEditorState);
  };

  return (
    <div ref={containerRef} style={{ minHeight: '100vh', width: '900px', padding: '48px 0' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 16px' }}>
        <h1 style={{ fontSize: '38px', fontWeight: 'bold', textAlign: 'center', marginBottom: '32px' }}>Spell Checker Tool</h1>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px'}}>
          <CustomDropdown
            options={options}
            value={selectedOption}
            onChange={handleSelectChange}
          />
          <div
            style={{ 
              border: '1px solid #008fee',
              borderRadius: '4px',
              marginTop: '16px',
              marginBottom: '16px',
              padding: '8px',
              fontSize: '24px',
              minHeight: '300px',
            }}
          >
            <Editor
              editorState={editorState}
              onChange={handleTextChange}
              placeholder="Enter or paste your text here to check spelling"
            />
          </div>
          <button
            onClick={handleCheckSpelling}
            style={{
              backgroundColor: '#008fee',
              color: 'white',
              padding: '12px 24px',
              fontSize: '18px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
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
            {suggestions.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {suggestions.map((suggestion, index) => (
                  <li 
                    key={index}
                    style={{ 
                      padding: '2px',
                      cursor: 'pointer',
                      ':hover': { backgroundColor: '#ffffff' }
                    }}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Loading suggestions...</p>
            )}
          </div>
        }
      />
    </div>
  );
};

export default HomePage;
