import React, { useState, useEffect } from 'react';
import { Editor, EditorState, CompositeDecorator, ContentState } from 'draft-js';
import 'draft-js/dist/Draft.css';
import CustomDropdown from './CustomDropdown';
import { apiRequest } from '../utils/config';

// Add this polyfill at the top of the file
if (typeof global === 'undefined') {
  (window as any).global = window;
}

const HomePage = () => {
  const [selectedOption, setSelectedOption] = useState({ label: 'English', value: 'en' });
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [spellingResults, setSpellingResults] = useState([]);

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
        component: ({ children }) => (
          <span style={{ textDecoration: 'underline', textDecorationColor: 'red' }}>
            {children}
          </span>
        ),
      },
    ]);

    const newEditorState = EditorState.set(editorState, { decorator });
    setEditorState(newEditorState);
  };

  return (
    <div style={{ minHeight: '100vh', width: '900px', padding: '48px 0' }}>
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
    </div>
  );
};

export default HomePage;
