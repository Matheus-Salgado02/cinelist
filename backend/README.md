# Backend (tcc-mamahalls)

Este diretório contém o back-end em Node.js com Express e MongoDB (Mongoose).

## Requisitos
- Node.js 18+ e npm
- MongoDB local ou cluster MongoDB Atlas

## Configuração
1. Copie `.env.example` para `.env` e preencha `MONGO_URI` e `PORT`:

```
MONGO_URI=mongodb+srv://<user>:<password>@tcc-mamahalls.i4jvfrl.mongodb.net/tcc-mamahalls?retryWrites=true&w=majority&appName=tcc-mamahalls
PORT=3333
```

- Remova os sinais `<` e `>` e substitua pelos valores reais.
- Se a senha tiver caracteres especiais, faça URL-encoding.
- No Atlas, adicione seu IP em Network Access.

### Helper para criar `.env`
Há um helper que cria um `.env` interativo para você:

```powershell
node scripts/create-env.js
```

Ele perguntará pela URI (ou pelos componentes) e criará o arquivo `.env` automaticamente.

## Como rodar

No PowerShell:

```powershell
cd d:\Programacao\HTML\Projetos\tcc-mamahalls\project\backend
npm install
npm run start
```

Endpoints úteis:
- GET /health — retorna status do servidor e se o DB está conectado
- GET /users — lista usuários (requer DB conectado)
- POST /users — cria usuário JSON { username, password } (requer DB conectado)

## Próximos passos sugeridos
- Implementar autenticação (login + JWT)
- Validar dados de entrada com Joi/Zod
- Separar rotas/controllers e adicionar testes

*** End Patch