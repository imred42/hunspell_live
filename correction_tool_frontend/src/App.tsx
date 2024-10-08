import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import Login from './components/Login';
import Register from './components/Register';

function App() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<null | {
    is_correct: boolean;
    original_text: string;
    corrected_text: string;
  }>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleCheck = async () => {
    try {
      const response = await axios.post('http://localhost:8000/api/check-grammar/', { text });
      setResult(response.data);
      setText(response.data.corrected_text);
    } catch (error) {
      console.error('Error checking grammar:', error);
    }
  };

  return (
    <div className="App">
      <div className="auth-buttons">
        <button onClick={() => setShowLogin(true)}>Login</button>
        <button onClick={() => setShowRegister(true)}>Register</button>
      </div>
      <h1>Grammar Checker</h1>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to check grammar..."
        rows={5}
        cols={50}
      />
      <br />
      <button onClick={handleCheck}>Check Grammar</button>
      {result && (
        <div className="result">
          <h2>Result:</h2>
          <p>Is Correct: {result.is_correct ? 'Yes' : 'No'}</p>
          <p>Original Text: {result.original_text}</p>
          <p>Corrected Text: {result.corrected_text}</p>
        </div>
      )}
      {showLogin && <Login onClose={() => setShowLogin(false)} />}
      {showRegister && <Register onClose={() => setShowRegister(false)} />}
    </div>
  );
}

export default App;
