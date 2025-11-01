import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/login_page.css';

// Função para validar formato de email
const validateEmailFormat = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Função para validar se o domínio do email existe
const validateEmailDomain = async (email) => {
  if (!validateEmailFormat(email)) {
    return false;
  }
  
  const domain = email.split('@')[1];
  
  // Lista de domínios comuns que sabemos que existem
  const commonDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
    'icloud.com', 'live.com', 'msn.com', 'aol.com',
    'protonmail.com', 'mail.com', 'zoho.com'
  ];
  
  // Se for um domínio comum, aceitamos
  if (commonDomains.includes(domain.toLowerCase())) {
    return true;
  }
  
  // Para outros domínios, fazemos uma validação básica
  // Verificamos se tem pelo menos um ponto no domínio
  const domainParts = domain.split('.');
  if (domainParts.length < 2 || domainParts.some(part => part.length === 0)) {
    return false;
  }
  
  return true;
};

export default function LoginPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    isLogin: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validar formato do email
    if (!validateEmailFormat(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    // Validar domínio do email (apenas no registro)
    if (!formData.isLogin) {
      const isValidDomain = await validateEmailDomain(formData.email);
      if (!isValidDomain) {
        setError('Please enter a valid email address with an existing domain');
        setLoading(false);
        return;
      }
    }

    try {
      if (formData.isLogin) {
        await login(formData.email, formData.password);
      } else {
        // include name when registering
        await register(formData.email, formData.password, formData.name);
      }
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setFormData(prev => ({
      ...prev,
      isLogin: !prev.isLogin
    }));
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>CineList</h1>
          <h2>{formData.isLogin ? 'Sign In' : 'Create Account'}</h2>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="you@email.com"
            />
          </div>

          {!formData.isLogin && (
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Your full name"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="Your password"
              minLength="6"
            />
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Loading...' : (formData.isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="login-footer">
          <p>
            {formData.isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button 
              type="button" 
              className="toggle-mode-button"
              onClick={toggleMode}
            >
              {formData.isLogin ? 'Create account' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}