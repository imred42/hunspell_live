import React, { useState } from 'react';
import axios from 'axios';

interface LoginProps {
  onClose: () => void;
}

const Login: React.FC<LoginProps> = ({ onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/auth/login/', { username, password });
      console.log('Login successful', response.data);
      // Handle successful login (e.g., store token, update app state)
      onClose();
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Login</button>
        </form>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default Login;
