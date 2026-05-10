# Transparent Match frontend with real email verification

This is a Vite + React + Firebase Authentication frontend for:
- landing page
- sign up
- sign in
- real email verification
- logout
- dashboard placeholder handoff route

## 1) Install Node.js
Use the current LTS release.

Check it:

```bash
node -v
npm -v
```

## 2) Open the project folder
```bash
cd firebase-auth-landing
```

## 3) Install dependencies
```bash
npm install
```

## 4) Create your environment file
Copy `.env.example` to `.env`.

macOS/Linux:
```bash
cp .env.example .env
```

Windows PowerShell:
```powershell
Copy-Item .env.example .env
```

Then open `.env` and paste your Firebase web app config values.

## 5) Create Firebase project
1. Go to Firebase console.
2. Create a project.
3. Add a Web app.
4. In Authentication > Sign-in method, enable **Email/Password**.
5. In Authentication > Templates, keep the email verification template enabled.
6. In Authentication > Settings > Authorized domains, add `localhost` if needed.

## 6) Run the app
```bash
npm run dev
```

Open the local URL shown in the terminal, usually:

```text
http://localhost:5173
```

## 7) Test the flow
1. Open `/sign-up`
2. Create an account with a real email address you can access
3. Firebase sends the verification email
4. Click the link in your inbox
5. Return to `/sign-in`
6. Sign in
7. After login, the app sends you to `/app`, which is a placeholder page reserved for your teammate's dashboard

## Important note
This project handles authentication with Firebase, so the verification email is real. The dashboard route is intentionally just a placeholder to avoid conflicting with your teammate's work.
