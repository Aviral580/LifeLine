# 🛡️ LifeLine: AI-Powered Search & Analytics Platform

LifeLine is a robust **full-stack MERN application** designed for **high-speed information retrieval** with a focus on **emergency response and public safety**. It features a **custom-built N-gram NLP engine** for real-time search suggestions and a comprehensive **Analytics Dashboard** to monitor user behavior and search trends.

---

## 🚀 Key Features

### 🧠 Smart NLP Suggestions
- **Custom N-gram Model**: Uses a **Trie-based data structure** to provide instant search completions.
- **Self-Learning Loop**: Automatically learns new search terms from users, increasing their frequency and ranking over time.
- **Hybrid Search**: Combines **in-memory Trie matching** with **MongoDB regex fallbacks** to always return **exactly 5 professional suggestions**.

### 🚨 Emergency Mode
- **Context-Aware UI**: Toggle between **General** and **Emergency** modes.
- **Priority Results**: In Emergency mode, the NLP engine prioritizes **safety protocols, medical assistance, and evacuation routes**.

### 📊 Analytics Dashboard
- **Search Volume Tracking**: Monitor total queries and categorize them by mode.
- **Click-Through Rate (CTR)**: Visualize which search suggestions are most effective.
- **Real-time Insights**: Aggregated MongoDB data provides a live view of user search behavior.

---

## 🛠️ Technical Stack

| Layer       | Technology |
|------------|------------|
| Frontend   | React, Tailwind CSS, Lucide React |
| Backend    | Node.js, Express.js |
| Database   | MongoDB (Mongoose ODM) |
| NLP Engine | Natural (Node.js), Custom Trie Implementation |
| DevOps     | Nodemon, Dotenv, FS-Extra |

---

## 📁 Project Structure

```plaintext
/Lifeline
├── /backend
│   ├── /data            # Persistent NLP model (JSON)
│   ├── /src
│   │   ├── /config      # Database connection
│   │   ├── /controllers # Search & Analytics logic
│   │   ├── /models      # Mongoose schemas (Logs & Corpus)
│   │   ├── /routes      # API endpoints
│   │   ├── /services   # NLP N-gram & Trie logic
│   │   └── /utils      # Seeding & validation scripts
└── /frontend
    ├── /src
    │   ├── /features   # Search & Dashboard components
    │   ├── /context    # Emergency / General mode state
    │   └── /utils      # Axios API configuration
```

---

## 🚦 Getting Started

### 1️⃣ Prerequisites
- Node.js **v18+**
- MongoDB (Local or Atlas)

### 2️⃣ Environment Setup
Create a `.env` file inside the **backend** directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
```

### 3️⃣ Installation & Seeding

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Seed the database with 190+ initial phrases
cd ../backend
node src/utils/super_seed.js
```

### 4️⃣ Running the App

```bash
# Start backend (from /backend)
npm run dev

# Start frontend (from /frontend)
npm run dev
```

---

## 🔧 Core NLP Logic

The platform uses a **Trie (Prefix Tree)** to store phrases. When a user types a prefix (e.g., `ear`), the system performs:

1. **Prefix Match** – Finds valid suffixes (e.g., `thquake`, `ly warning`)
2. **Reconstruction** – Combines prefix + suffix to return full phrases
3. **Frequency Filtering** – Ranks suggestions based on real user search frequency

This ensures **fast, relevant, and adaptive suggestions** even under emergency conditions.

---

## 👥 Contributors (Till Now)

- **Abhay Agrahari** – Full Stack Development & NLP Architecture

---

## 📌 License

This project is currently under development and intended for **educational, hackathon, and research purposes**.
