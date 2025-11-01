# CineList - Sistema de Autenticação

Este projeto implementa um sistema completo de autenticação com páginas de login e conta de usuário para o CineList.

## 🚀 Funcionalidades Implementadas

### 1. **Página de Login** (`/login`)
- **Login e Registro**: Formulário único que alterna entre modo login e registro
- **Validação**: Validação de email e senha (mínimo 6 caracteres)
- **Feedback Visual**: Mensagens de erro e estados de carregamento
<!-- English README for auth feature -->
# CineList - Authentication

This project implements a basic authentication system with login and account pages for CineList.

# CineList - Authentication

This project implements a basic authentication system with login and account pages for CineList.

## 🚀 Implemented features

### 1. Login Page (`/login`)
- Single form that toggles between sign-in and register
- Validation: email and password (min 6 characters)
- Visual feedback: error messages and loading states
- Demo credentials included for testing

### 2. Account Page (`/account`)
- User profile: view and edit personal information
- Favorite genres: multi-select

### 3. Authentication system
- Context API for global auth state
- Protected routes that redirect to sign-in when required
- Persistence using localStorage

### 4. Navigation
- Header shows different actions for signed-in users
- Routing with React Router

## 🧪 Demo data

### Test users
1. **Demo User**
   - Email: `demo@cinelist.com`
   - Password: `123456`

2. **Example User**
   - Email: `user@example.com`
   - Password: `password123`

## How to run

1. Start dev server:

```powershell
npm run dev
```

2. Open in browser:
- Home: http://localhost:5173/
- Login: http://localhost:5173/login
- Account: http://localhost:5173/account (requires login)

## Next steps

- Replace mocks with real backend calls
- Add stronger validation
- Add password recovery flow

---

Developed for the TCC MamaHalls project 🎬