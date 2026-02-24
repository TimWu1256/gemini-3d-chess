<div align="center">
  <img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Gemini 3D Chess

A real-time 3D chess game powered by **Google Gemini AI**. Built with **React**, **Three.js**, and **Vite**, supporting AI battles, local play, and peer-to-peer online multiplayer.

## Features

- **3D Environment**: Interactive 3D chessboard with orbit controls and dynamic camera positioning.
- **Game Modes**:
    - **vs AI**: Play against Gemini 2.5 Flash model.
    - **Local**: Two players on the same device.
    - **Online**: P2P multiplayer via PeerJS (no account required).
- **UI**: Responsive interface with game status, move validation, and history.

## Tech Stack

- **Framework**: React 19, TypeScript, Vite
- **3D**: Three.js, React Three Fiber
- **AI**: Google GenAI SDK (Gemini 2.5 Flash)
- **Networking**: PeerJS
- **Styling**: Tailwind CSS

## ⚙️ Getting Started

Follow these steps to set up the project locally.

### Prerequisites

- Node.js (v18 or higher recommended)
- A Google Gemini API Key (Get one from [Google AI Studio](https://aistudio.google.com/))

### Installation

1. **Clone the repository**

    ```bash
    git clone https://github.com/TimWu1256/gemini-3d-chess.git
    cd gemini-3d-chess
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Configure Environment Variables**
   Create a `.env.local` file in the root directory and add your API Key:

    ```env
    GEMINI_API_KEY=your_actual_api_key_here
    ```

4. **Running the Application**

    **For Development:**
    This starts the dev server with Hot Module Replacement (HMR).

    ```bash
    npm run dev
    ```

    Open `http://localhost:3000`.

    **For Production Use:**
    Build the project for optimal performance and smaller bundle size.

    ```bash
    npm run build
    npm run preview
    ```

    This will serve the production build locally at `http://localhost:4173`.

## 🎮 How to Play

### VS AI Mode

1. Select **AI** from the mode switcher in the top panel.
2. You play as **White** by default (camera fixed behind White pieces).
3. Make your move by clicking a piece and then a valid square.
4. Gemini AI will think and respond automatically.
5. Use the "Ask AI" button for a hit if you're stuck!

### Online Mode

1. Select **Online** mode.
2. **To Host**: Copy your "My ID" and send it to a friend. Wait for them to connect.
3. **To Join**: Paste your friend's ID into the "Friend's ID" box and click the **Play** button.
4. Once connected, the game starts.
    - Host plays **White**.
    - Guest plays **Black**.

## 📂 Project Structure

```
gemini-3d-chess/
├── components/        # React components (3D Board, Pieces)
│   ├── ChessBoard3D.tsx
│   └── Pieces.tsx
├── services/          # API services
│   └── geminiService.ts  # Interface with Google GenAI
├── App.tsx            # Main application logic & UI layout
├── types.ts           # TypeScript interfaces & types
├── constants.ts       # Game constants (Colors, Board size)
└── vite.config.ts     # Vite configuration
```

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
