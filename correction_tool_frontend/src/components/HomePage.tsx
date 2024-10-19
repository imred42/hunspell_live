import React, { useState } from 'react';

const HomePage: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState('');
  const [text, setText] = useState('');

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedOption(event.target.value);
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
  };

  return (
    <div>
      <div style={{ maxWidth: '1200px', width: '800px', height: '800px', margin: '0 auto', padding: '48px 0' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '32px' }}>Correction Tool</h1>
        <select
          value={selectedOption}
          onChange={handleSelectChange}
          style={{ width: '100%', marginBottom: '16px', padding: '8px' }}
        >
          <option value="">Select an option</option>
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
          <option value="option3">Option 3</option>
        </select>
        <textarea
          value={text}
          onChange={handleTextChange}
          placeholder="Enter your text here..."
          style={{ 
            width: '100%', 
            height: '40%',
            minHeight: '300px', 
            padding: '8px',
            border: '1px solid #21a1f6',
            borderRadius: '5px',
            display: 'block',
            margin: '0 auto',
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap'
          }}
        />
      </div>
    </div>
  );
};

export default HomePage;
