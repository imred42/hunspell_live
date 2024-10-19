import React, { useState } from 'react';
import CustomDropdown from './CustomDropdown';

const HomePage = () => {
  const [selectedOption, setSelectedOption] = useState({ label: 'English', value: 'en' });
  const [text, setText] = useState('');

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
              border: '1px solid #008fee',
              borderRadius: '4px',
              resize: 'vertical',
              fontSize: '24px'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
