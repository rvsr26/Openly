# 🌐 Openly: A Professional Social Ecosystem

Openly is a modern, feature-rich social networking platform designed for professional interaction, knowledge sharing, and networking. Built with performance, security, and AI enhancement at its core, Openly provides a seamless experience for users to connect, share insights, and build their professional identity.

---

## ✨ Key Features

### 🤝 Social & Professional Networking
- **Interactive Feed**: Engage with professional content using reactions (likes, upvotes, downvotes), comments, and bookmarks.
- **Messaging**: Real-time messaging with WebSocket support for fluid conversations.
- **Communities & Hubs**: Join specialized hubs based on interests (Career, Startup, Academic, Relationship, etc.).
- **Profiles**: Comprehensive professional profiles with experience, education, and skills endorsements.
- **Alias System**: Create professional aliases for specialized networking contexts.

### 🤖 AI-Powered Intelligence
- **Content Enhancement**: AI-driven refinement of post titles and content for maximum impact.
- **Automatic Tagging**: Intelligent keyword extraction and tag suggestion for better discoverability.
- **Sentiment Analysis**: Automated sentiment detection for content moderation and insights.
- **Toxicity Detection**: Advanced AI-powered toxicity filtering to maintain a healthy professional environment.

### 🔐 Security & Reliability
- **Multi-Factor Authentication (2FA)**: Secure logins with TOTP (Time-based One-Time Password) support.
- **Robust Auth Flow**: Includes email verification, password reset, and OAuth (Google, GitHub, LinkedIn) support.
- **Rate Limiting & CSRF Protection**: High-level security middleware protecting against common web vulnerabilities.
- **Asset Integrity**: Integrated with Cloudinary for secure and reliable media uploads.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router, React 19)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [MUI](https://mui.com/), [Framer Motion](https://www.framer.com/motion/)
- **State Management**: [TanStack Query (React Query)](https://tanstack.com/query/latest)
- **Icons**: [Lucide React](https://lucide.dev/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/) (inspired), [Sonner](https://sonner.emilkowal.ski/)

### Backend
- **Core Platform**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **Database**: [MongoDB](https://www.mongodb.com/) (Motor/Async Driver)
- **Caching**: [Redis](https://redis.io/)
- **AI Engine**: Google Gemini Pro (via `google-generativeai`)
- **Authentication**: JWT, PyJWT, passlib (bcrypt)
- **Real-time**: WebSockets

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- MongoDB & Redis instances
- Cloudinary Account (for media)
- Gemini API Key (for AI features)

### 📦 Backend Setup
1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```
2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
3. **Configure environment**:
   Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. **Run the server**:
   ```bash
   uvicorn main:app --reload
   ```
   API Docs available at: `http://localhost:8000/docs`

### 💻 Frontend Setup
1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure environment**:
   Create a `.env.local` file.
4. **Run the development server**:
   ```bash
   npm run dev
   ```
   Access the app at: `http://localhost:3000`

---

## 📁 Project Structure

```text
Openly/
├── backend/            # FastAPI Backend
│   ├── main.py         # Entry point & routes
│   ├── auth.py         # JWT & Auth logic
│   ├── ai_utils.py     # Gemini integrations
│   ├── database.py     # MongoDB connections
│   └── ...             # Feature-specific modules (communities, messaging, etc.)
├── frontend/           # Next.js Frontend
│   ├── app/            # Next.js App Router
│   ├── components/     # Reusable UI components
│   ├── context/        # React Context providers
│   ├── hooks/          # Custom React hooks
│   └── ...
├── render.yaml         # Backend deployment config
└── vercel.json         # Frontend deployment config
```

---

## 🌐 Deployment

- **Backend**: Configured for [Render](https://render.com) using `render.yaml`.
- **Frontend**: Optimized for [Vercel](https://vercel.com).

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
