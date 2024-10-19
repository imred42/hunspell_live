import React, { useState } from 'react';
import CustomDropdown from './CustomDropdown';
import { apiRequest } from '../utils/config';

const HomePage = () => {
  const [selectedOption, setSelectedOption] = useState({ label: 'English', value: 'en' });
  const [text, setText] = useState('');
  const [spellingResults, setSpellingResults] = useState([]);

  const options = [
    { label: 'English', value: 'en' },
    { label: 'Spanish', value: 'es' },
    { label: 'French', value: 'fr' },
    { label: 'German', value: 'de' },
    { label: 'Italian', value: 'it' },
    { label: 'Portuguese', value: 'pt' },
    { label: 'Russian', value: 'ru' },
    { label: 'Chinese', value: 'zh' },
    { label: 'Japanese', value: 'ja' },
    { label: 'Korean', value: 'ko' },
  ];

  const handleSelectChange = (option) => {
    setSelectedOption(option);
  };

  const handleTextChange = (event) => {
    setText(event.target.value);
    setSpellingResults([]); // Clear spelling results when text changes
  };

  const handleCheckSpelling = async () => {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const results = [];

    try {
      for (let i = 0; i < words.length; i++) {
        const response = await apiRequest('/api/check-spelling/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ word: words[i] }),
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
    } catch (error) {
      console.error('Error checking spelling:', error);
      // You might want to show an error message to the user here
    }
  };

  const renderTextWithUnderlines = () => {
    if (spellingResults.length === 0) return text;

    let result = [];
    let lastIndex = 0;

    spellingResults.forEach((misspelling) => {
      result.push(text.slice(lastIndex, misspelling.index));
      result.push(
        <span key={misspelling.index} style={{ textDecoration: 'underline', textDecorationColor: 'red' }}>
          {text.slice(misspelling.index, misspelling.index + misspelling.word.length)}
        </span>
      );
      lastIndex = misspelling.index + misspelling.word.length;
    });

    result.push(text.slice(lastIndex));
    return result;
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
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder="Enter or paste your text here to check spelling"
            style={{ 
              width: '100%', 
              height: '300px', 
              padding: '8px',
              marginTop: '16px',
              marginBottom: '16px',
              border: '1px solid #008fee',
              borderRadius: '4px',
              resize: 'vertical',
              fontSize: '24px'
            }}
          />
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
          {spellingResults.length > 0 && (
            <div
              style={{ 
                width: '100%', 
                marginTop: '16px',
                padding: '8px',
                border: '1px solid #008fee',
                borderRadius: '4px',
                fontSize: '24px',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
              }}
            >
              {renderTextWithUnderlines()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
