# FIFA World Cup 2026: Multilingual AI Stadium Assistant for Fans 🏟️🤖

A next-generation, multilingual smart stadium concierge designed for the **FIFA World Cup 2026** at MetLife Stadium. This application assists fans with real-time navigation, dietary needs, accessibility paths, and crowd status, integrated with an administrative operations console for live matchday intelligence.

---

## 🌟 Chosen Vertical & Purpose
*   **Vertical**: Multilingual AI Stadium Assistant for Fans & Tournament Operations.
*   **The "Why"**: Major global tournaments like the FIFA World Cup bring together millions of fans speaking dozens of different languages. Navigating massive, crowded host venues can be daunting, particularly for families, elderly guests, or fans with physical challenges. By unifying a multilingual smart concierge with real-time operational database overrides, stadium volunteers can steer crowd flows, mark gates as closed, and guide fans dynamically and safely.

---

## 🛠️ Key Architectural Approaches

### 1. Zero-Exposure Full-Stack Security
All Google Gemini API calls are made exclusively on the server side via our Express.js backend (`/server.ts`). The frontend clients never import the `@google/genai` SDK or interact with the `GEMINI_API_KEY`, completely protecting credentials.

### 2. Dual-Role Grounded AI Flow
*   **Ground Truth Injection**: Every chat request gathers the latest operational status directly from our live JSON database (`stadium-data.json`) and injects it into the Gemini system instructions. 
*   **Zero-Hallucination Guardrails**: Gemini is directed to answer questions using **ONLY** the provided ground-truth JSON schema. If fans ask for instructions or entities outside of the database, the AI politely declines, preventing false directions.
*   **Automatic Language Alignment**: The system automatically detects the user's spoken or written language (e.g. English, Hindi, Spanish, German) and responds in the exact same language automatically.
*   **Accessibility Prioritization**: The assistant is configured to prioritize ramp and elevator routes over standard stairs whenever keywords signaling disability, stroller, or elderly guests are matched.

### 3. Real-Time Operational Override
The integrated **Volunteer Console** empowers stadium staff to toggle gates, update crowd density levels (Low, Medium, High), and log queue wait times. The underlying JSON data is immediately rewritten on the server, causing subsequent fan inquiries to dynamically update their directions.

### 4. Accessibility (A11y) Front-and-Center
Built directly into the React interface is an assistive control deck:
*   **High Contrast Toggle**: Converts colors into high-contrast black-and-white mode with bold structural boundaries.
*   **Physical Text Resizer**: Offers text sizes from Normal (`sm` / `base`) up to Extra Large (`lg` / `xl`).
*   **Screen-Reader Labels**: Every custom toggle and interactive preset maintains descriptive labels.

---

## 🚀 Running the Project Locally

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18+)

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file at the root of your project:
```env
# Google Gemini API Key from Google AI Studio Secrets
GEMINI_API_KEY="YOUR_ACTUAL_GEMINI_API_KEY"

# Self-referential URL where this applet is hosted
APP_URL="http://localhost:3000"
```

### 3. Run Automated Tests
Execute the unit and integration tests verifying schema formats and simulation status updates:
```bash
npm run test
```

### 4. Start the Development Server
```bash
npm run dev
```
Open your browser to `http://localhost:3000` to interact with the application.

### 5. Compile & Build for Production
```bash
npm run build
npm run start
```

---

## 🧠 Core Assumptions & Guardrails
*   **Mock Sensor Integrations**: Real-time crowd densities and queue wait times are simulated via the `stadium-data.json` database. In a production environment, these variables would bind directly to stadium optical crowd-tracking cameras, RFID wristbands, or ticketing turnstiles.
*   **Offline-Ready Simulation**: If a `GEMINI_API_KEY` is not present, the system runs in **Operational Simulation Mode**, displaying simulated, grounded responses to allow developers and operators to test workflows seamlessly.
