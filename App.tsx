import { useState, useEffect, useRef } from "react";
import { 
  Send, 
  Compass, 
  Sliders, 
  Accessibility, 
  Activity, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Utensils, 
  UserCheck, 
  RefreshCw, 
  Languages,
  Shield,
  HelpCircle,
  Eye,
  Type
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StadiumData, ChatMessage, Gate, Restroom, FoodStall } from "./types.js";

export default function App() {
  // Application view states
  const [activeTab, setActiveTab] = useState<"fan" | "volunteer">("fan");
  const [stadiumData, setStadiumData] = useState<StadiumData | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-msg",
      sender: "bot",
      text: "👋 Welcome to MetLife Stadium for the **FIFA World Cup 2026**!\n\nI am your Multilingual Smart Assistant. Ask me anything about finding gates, restrooms, food options, first aid, or customized accessibility directions in any language!\n\n*Examples:*\n- *'How do I get to Section 112 in a wheelchair?'*\n- *'मुझे नजदीकी वॉशरूम कहाँ मिलेगा?'*\n- *'Nearest food stall with vegetarian options?'*",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [systemAlerts, setSystemAlerts] = useState<string[]>([
    "🏟️ Stadium operations: Gates open 3 hours before kickoff.",
    "⚠️ Alert: Gate 3 is temporarily closed. Please use Gate 4."
  ]);

  // Accessibility custom styling states
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg" | "xl">("base");

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load initial stadium knowledge base
  useEffect(() => {
    loadStadiumData();
  }, []);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping]);

  const loadStadiumData = async () => {
    try {
      const res = await fetch("/api/stadium-data");
      if (res.ok) {
        const data = await res.json();
        setStadiumData(data);
      }
    } catch (err) {
      console.error("Failed to load stadium data:", err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || chatInput).trim();
    if (!query) return;

    if (!textToSend) {
      setChatInput("");
    }

    // Add user message
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // Build brief local history
      const history = chatMessages.map((m) => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query, history })
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg: ChatMessage = {
          id: `msg-${Date.now()}-bot`,
          sender: "bot",
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error("Chat server error");
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        sender: "system",
        text: "⚠️ Connecting to operations network. Please check your internet or retry in a moment.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleUpdateEntity = async (type: "gates" | "restrooms" | "foodStalls", id: string, updates: any) => {
    try {
      const res = await fetch("/api/stadium-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id, updates })
      });

      if (res.ok) {
        const result = await res.json();
        setStadiumData(result.data);
        
        // Add log alert
        const formattedType = type === "gates" ? "Gate" : type === "restrooms" ? "Restroom" : "Food Stall";
        const detailStr = Object.entries(updates)
          .map(([k, v]) => `${k} to "${v}"`)
          .join(", ");
        
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setSystemAlerts((prev) => [
          `🔔 [${timestamp}] ${formattedType} ${id.replace(/^[a-z]+-/, "")} updated: ${detailStr}`,
          ...prev.slice(0, 4) // keep last 5 alerts
        ]);
      }
    } catch (err) {
      console.error("Failed to update entity status:", err);
    }
  };

  // Preset Questions
  const presetQuestions = [
    { label: "Where is Gate 5 from here?", text: "Where is Gate 5 from here?" },
    { label: "Hindi: नजदीकी वॉशरूम", text: "मुझे नजदीकी वॉशरूम कहाँ मिलेगा?" },
    { label: "Wheelchair: Path to Sec 112", text: "I'm in a wheelchair, how do I get to Section 112?" },
    { label: "Veg food options?", text: "Nearest food stall with vegetarian options?" },
    { label: "Transit: Shuttle bus wait?", text: "What is the wait time for the shuttle bus?" },
    { label: "Eco: Water refill station?", text: "Where can I find a water bottle refill station?" }
  ];

  // Map font sizing to CSS classes
  const fontClass = {
    sm: "text-xs",
    base: "text-sm",
    lg: "text-base",
    xl: "text-lg"
  }[fontSize];

  const headerFontClass = {
    sm: "text-base",
    base: "text-lg",
    lg: "text-xl",
    xl: "text-2xl"
  }[fontSize];

  return (
    <div 
      id="app-container"
      className={`min-h-screen flex flex-col transition-colors duration-200 p-4 md:p-6 font-sans ${
        isHighContrast 
          ? "bg-black text-white" 
          : "bg-slate-900 text-slate-100"
      }`}
    >
      {/* Visual Header */}
      <header 
        id="app-header"
        className={`mb-6 transition-colors rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 border ${
          isHighContrast 
            ? "border-white bg-black" 
            : "border-slate-800 bg-slate-800/40 backdrop-blur-md shadow-lg"
        }`}
      >
        {/* Logo Brand */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 font-bold rounded-lg flex items-center justify-center shadow-lg uppercase tracking-wider text-sm ${
            isHighContrast ? "bg-white text-black" : "bg-blue-600 text-white"
          }`}>
            26
          </div>
          <div>
            <h1 className={`font-display font-black tracking-tight uppercase text-white ${headerFontClass}`}>
              FIFA 2026 STADIUM PRO
            </h1>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-medium">
              MetLife Stadium • East Rutherford, NJ
            </p>
          </div>
        </div>

        {/* Live match status & tab switcher */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Match Status Ticker */}
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold ${
            isHighContrast ? "border-white text-white bg-black" : "bg-slate-800 border-slate-700 text-slate-200"
          }`}>
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span>LIVE: MATCHDAY OPERATIONS</span>
          </div>

          {/* View Tab Switcher */}
          <div className={`p-1 rounded-lg flex gap-1 ${
            isHighContrast ? "border border-white bg-zinc-950" : "bg-slate-950/60"
          }`}>
            <button
              id="btn-tab-fan"
              onClick={() => setActiveTab("fan")}
              className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                activeTab === "fan"
                  ? isHighContrast
                    ? "bg-white text-black font-semibold"
                    : "bg-blue-600 text-white shadow-md"
                  : isHighContrast
                    ? "text-zinc-400 hover:text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
              aria-label="Switch to Fan Chat Assistant"
            >
              <Compass className="w-3.5 h-3.5" />
              Fan AI Assistant
            </button>
            <button
              id="btn-tab-volunteer"
              onClick={() => setActiveTab("volunteer")}
              className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
                activeTab === "volunteer"
                  ? isHighContrast
                    ? "bg-white text-black font-semibold"
                    : "bg-blue-600 text-white shadow-md"
                  : isHighContrast
                    ? "text-zinc-400 hover:text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
              aria-label="Switch to Volunteer Dashboard"
            >
              <Sliders className="w-3.5 h-3.5" />
              Volunteer Console
            </button>
          </div>

          {/* Accessibility Controls */}
          <div className="flex items-center gap-2 border-l pl-4 border-slate-700">
            {/* High Contrast Toggle */}
            <button
              id="btn-toggle-contrast"
              onClick={() => setIsHighContrast(!isHighContrast)}
              className={`p-2 rounded-lg border transition-all hover:scale-105 flex items-center justify-center ${
                isHighContrast ? "border-white bg-white text-black" : "border-slate-700 bg-slate-800 text-slate-300"
              }`}
              title={isHighContrast ? "Disable High Contrast" : "Enable High Contrast Mode"}
              aria-label="Toggle High Contrast Mode"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Font Sizers */}
            <div className="flex items-center gap-1">
              {(["sm", "base", "lg", "xl"] as const).map((sz) => (
                <button
                  key={sz}
                  id={`btn-font-${sz}`}
                  onClick={() => setFontSize(sz)}
                  className={`w-7 h-7 text-[10px] font-semibold rounded-md border flex items-center justify-center uppercase transition-all ${
                    fontSize === sz
                      ? isHighContrast
                        ? "bg-white text-black border-white"
                        : "bg-blue-600 text-white border-blue-600"
                      : "border-slate-700 text-slate-400 bg-slate-800/40 hover:bg-slate-800"
                  }`}
                  aria-label={`Set font size to ${sz}`}
                >
                  {sz === "sm" ? "a-" : sz === "base" ? "a" : sz === "lg" ? "a+" : "a++"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container - Bento Grid Arrangement */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
        
        {/* Left Giant Bento Card: Active View (Chat Assistant or Volunteer Control Panel) */}
        <div className="lg:col-span-7 flex flex-col h-full">
          
          <AnimatePresence mode="wait">
            {activeTab === "fan" ? (
              /* FAN AI ASSISTANT PANEL */
              <motion.div
                key="fan-pane"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col flex-grow h-full"
              >
                {/* Chat Container */}
                <div className={`rounded-3xl border flex flex-col flex-grow h-full overflow-hidden shadow-2xl backdrop-blur-sm ${
                  isHighContrast ? "border-white bg-black" : "border-slate-700 bg-slate-800/40"
                }`}>
                  {/* Chat Header Info */}
                  <div className={`p-4 border-b flex items-center justify-between ${
                    isHighContrast ? "border-white bg-zinc-950" : "border-slate-700 bg-slate-800"
                  }`}>
                    <h2 className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                      <span className="text-blue-400">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"></path><path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"></path></svg>
                      </span>
                      AI CONCIERGE ASSISTANT
                    </h2>
                    <span className="text-[10px] bg-slate-700 px-2.5 py-0.5 rounded text-slate-300 font-mono">
                      STADIUM_MODEL_V2.0
                    </span>
                  </div>

                  {/* Message Window */}
                  <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[380px]">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          msg.sender === "user" ? "items-end" : "items-start"
                        }`}
                      >
                        {/* Sender Label */}
                        <span className="text-[9px] uppercase font-mono text-slate-400 mb-1 px-1 tracking-widest">
                          {msg.sender === "user" ? "Guest Fan" : msg.sender === "bot" ? "AI Concierge" : "Operations Center"}
                        </span>

                        {/* Speech Bubble */}
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 ${fontClass} leading-relaxed whitespace-pre-wrap ${
                            msg.sender === "user"
                              ? isHighContrast
                                ? "bg-white text-black border border-white"
                                : "bg-blue-600 text-white rounded-tr-none"
                              : msg.sender === "system"
                                ? "bg-amber-500 text-black font-semibold border border-amber-600"
                                : isHighContrast
                                  ? "bg-zinc-900 text-white border border-zinc-700"
                                  : "bg-slate-700/80 text-slate-100 border border-slate-600/50 rounded-tl-none"
                          }`}
                        >
                          {/* Parse bolding shorthand simple formatting */}
                          {msg.text.split("**").map((part, idx) => 
                            idx % 2 === 1 ? <strong key={idx} className="font-bold underline decoration-blue-400">{part}</strong> : part
                          )}
                        </div>

                        {/* Timestamp */}
                        <span className="text-[9px] text-slate-500 mt-1 px-1 font-mono">
                          {msg.timestamp}
                        </span>
                      </div>
                    ))}

                    {/* AI Thinking Indicator */}
                    {isTyping && (
                      <div className="flex flex-col items-start">
                        <span className="text-[9px] uppercase font-mono text-slate-400 mb-1 px-1">AI Concierge</span>
                        <div className={`rounded-2xl px-4 py-3 flex items-center gap-1.5 ${
                          isHighContrast ? "bg-zinc-900 text-white border" : "bg-slate-700/80 text-slate-300 border border-slate-600/50"
                        }`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]"></div>
                          <span className="text-xs font-mono ml-1 text-slate-400">Consulting live stadium schema...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Quick presets */}
                  <div className={`p-4 border-t flex flex-wrap gap-2 ${
                    isHighContrast ? "border-white bg-zinc-950" : "border-slate-700 bg-slate-800/80"
                  }`}>
                    <p className="text-[10px] w-full font-mono text-slate-400 flex items-center gap-1 uppercase">
                      <HelpCircle className="w-3.5 h-3.5" />
                      Quick stadium presets (Grounding Prompts):
                    </p>
                    {presetQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        id={`btn-preset-${idx}`}
                        onClick={() => handleSendMessage(q.text)}
                        className={`text-xs px-2.5 py-1 rounded-md border text-left transition-all hover:scale-102 ${
                          isHighContrast
                            ? "border-zinc-700 bg-zinc-850 hover:bg-white hover:text-black"
                            : "border-slate-700 bg-slate-900 text-slate-300 hover:border-blue-500 hover:bg-slate-800"
                        }`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>

                  {/* Input Form */}
                  <form
                    id="chat-input-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className={`p-4 border-t flex gap-2 items-center ${
                      isHighContrast ? "border-white bg-black" : "border-slate-700 bg-slate-800"
                    }`}
                  >
                    <input
                      id="input-chat"
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type your stadium question in any language..."
                      className={`flex-1 rounded-xl px-4 py-3 text-sm focus:outline-hidden transition-all ${
                        isHighContrast
                          ? "bg-zinc-900 text-white border border-white focus:ring-1 focus:ring-white"
                          : "bg-slate-900 text-white border border-slate-700 focus:ring-2 focus:ring-blue-500 focus:bg-slate-950 shadow-inner"
                      }`}
                      aria-label="Write a question to the AI Stadium Assistant"
                    />
                    <button
                      id="btn-send-chat"
                      type="submit"
                      disabled={!chatInput.trim() || isTyping}
                      className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                        chatInput.trim() && !isTyping
                          ? isHighContrast
                            ? "bg-white text-black hover:bg-zinc-200"
                            : "bg-blue-600 text-white hover:bg-blue-500 hover:scale-105"
                          : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                      }`}
                      aria-label="Send message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </motion.div>
            ) : (
              /* VOLUNTEER OPERATIVE CONSOLE PANEL */
              <motion.div
                key="volunteer-pane"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col flex-grow h-full"
              >
                <div className={`p-6 rounded-3xl border flex-grow space-y-6 ${
                  isHighContrast ? "border-white bg-black text-white" : "border-slate-700 bg-slate-800/60 text-slate-100"
                }`}>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b pb-4 border-slate-700">
                    <div>
                      <h2 className="text-sm font-bold tracking-widest uppercase flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-blue-500" />
                        Matchday Operations Overrides
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Manual overrides immediately update the grounding schema used by the AI Concierge.
                      </p>
                    </div>
                    <button
                      id="btn-force-refresh"
                      onClick={loadStadiumData}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                        isHighContrast ? "hover:bg-white hover:text-black border-white" : "border-slate-600 bg-slate-900 text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Sync Database
                    </button>
                  </div>

                  {!stadiumData ? (
                    <div className="text-center py-12">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-400 mb-2" />
                      <p className="text-sm font-mono text-slate-400">Awaiting secure operations tunnel...</p>
                    </div>
                  ) : (
                    <div className="space-y-6 overflow-y-auto max-h-[460px] pr-2">
                      
                      {/* GATES CONTROLLER */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Compass className="w-4 h-4 text-blue-400" />
                          Gate Control & Queues
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {stadiumData.gates.map((gate) => (
                            <div 
                              key={gate.id}
                              className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                                gate.status === "closed"
                                  ? "bg-red-950/20 border-red-900/50"
                                  : isHighContrast ? "border-white bg-black" : "bg-slate-900/60 border-slate-700"
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase ${
                                    gate.status === "open" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
                                  }`}>
                                    {gate.status}
                                  </span>
                                  <h4 className="font-bold text-sm mt-2 text-white">{gate.name}</h4>
                                  <p className="text-xs text-slate-400">{gate.location}</p>
                                </div>

                                <button
                                  id={`btn-gate-toggle-${gate.id}`}
                                  onClick={() => handleUpdateEntity("gates", gate.id, { status: gate.status === "open" ? "closed" : "open" })}
                                  className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all ${
                                    gate.status === "open"
                                      ? "bg-red-600 text-white hover:bg-red-500"
                                      : "bg-green-600 text-white hover:bg-green-500"
                                  }`}
                                >
                                  {gate.status === "open" ? "Close" : "Open"}
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-2 border-t pt-2 border-slate-800">
                                <div>
                                  <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">
                                    Crowd Density
                                  </label>
                                  <select
                                    id={`select-gate-density-${gate.id}`}
                                    value={gate.crowdDensity}
                                    onChange={(e) => handleUpdateEntity("gates", gate.id, { crowdDensity: e.target.value })}
                                    className={`text-xs rounded-md w-full px-2 py-1 ${
                                      isHighContrast ? "bg-black text-white border" : "bg-slate-850 text-slate-200 border border-slate-700"
                                    }`}
                                  >
                                    <option value="low">🟢 Low</option>
                                    <option value="medium">🟡 Medium</option>
                                    <option value="high">🔴 High</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-[9px] font-bold uppercase text-slate-400 mb-1">
                                    Queue Time (m)
                                  </label>
                                  <input
                                    id={`input-gate-queue-${gate.id}`}
                                    type="number"
                                    value={gate.averageQueueTimeMinutes === 999 ? 0 : gate.averageQueueTimeMinutes}
                                    onChange={(e) => handleUpdateEntity("gates", gate.id, { averageQueueTimeMinutes: parseInt(e.target.value) || 0 })}
                                    className={`text-xs rounded-md w-full px-2 py-1 ${
                                      isHighContrast ? "bg-black text-white border" : "bg-slate-850 text-slate-200 border border-slate-700"
                                    }`}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* RESTROOMS CONTROLLER */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-blue-400" />
                          Restroom Status & Queues
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {stadiumData.restrooms.map((restroom) => (
                            <div 
                              key={restroom.id}
                              className={`p-4 rounded-xl border space-y-2 ${
                                restroom.crowdDensity === "high"
                                  ? "bg-yellow-950/20 border-yellow-800/50"
                                  : isHighContrast ? "border-white bg-black" : "bg-slate-900/60 border-slate-700"
                              }`}
                            >
                              <div>
                                <h4 className="font-bold text-sm text-white">{restroom.name}</h4>
                                <p className="text-[9px] text-slate-400 font-mono">{restroom.gender} | {restroom.wheelchairAccessible ? "♿ Accessible" : "Stairs Only"}</p>
                              </div>

                              <div className="space-y-1.5 border-t pt-2 border-slate-800">
                                <div className="flex justify-between items-center gap-2">
                                  <span className="text-[9px] text-slate-400 uppercase font-bold">Crowd</span>
                                  <select
                                    id={`select-restroom-density-${restroom.id}`}
                                    value={restroom.crowdDensity}
                                    onChange={(e) => handleUpdateEntity("restrooms", restroom.id, { crowdDensity: e.target.value })}
                                    className={`text-xs rounded-md px-1 py-0.5 ${
                                      isHighContrast ? "bg-black text-white border" : "bg-slate-850 border border-slate-700 text-slate-200"
                                    }`}
                                  >
                                    <option value="low">🟢 Low</option>
                                    <option value="medium">🟡 Medium</option>
                                    <option value="high">🔴 High</option>
                                  </select>
                                </div>

                                <div className="flex justify-between items-center gap-2">
                                  <span className="text-[9px] text-slate-400 uppercase font-bold">Queue Time</span>
                                  <div className="flex items-center gap-1">
                                    <input
                                      id={`input-restroom-queue-${restroom.id}`}
                                      type="number"
                                      value={restroom.queueTimeMinutes}
                                      onChange={(e) => handleUpdateEntity("restrooms", restroom.id, { queueTimeMinutes: parseInt(e.target.value) || 0 })}
                                      className={`text-xs rounded-md w-12 text-center ${
                                        isHighContrast ? "bg-black text-white border" : "bg-slate-850 border border-slate-700 text-slate-200"
                                      }`}
                                    />
                                    <span className="text-[9px] text-slate-500 font-mono">min</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* FOOD STALLS CONTROLLER */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Utensils className="w-4 h-4 text-blue-400" />
                          Concessions & Dietary Outlets
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {stadiumData.foodStalls.map((stall) => (
                            <div 
                              key={stall.id}
                              className={`p-4 rounded-xl border space-y-2 ${
                                stall.status === "closed"
                                  ? "bg-red-950/20 border-red-900/50"
                                  : isHighContrast ? "border-white bg-black" : "bg-slate-900/60 border-slate-700"
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-bold text-sm text-white">{stall.name}</h4>
                                  <p className="text-[9px] text-slate-400">Dietary: {stall.dietaryFlags.join(", ")}</p>
                                </div>
                                <button
                                  id={`btn-stall-toggle-${stall.id}`}
                                  onClick={() => handleUpdateEntity("foodStalls", stall.id, { status: stall.status === "open" ? "closed" : "open" })}
                                  className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${
                                    stall.status === "open" 
                                      ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                                      : "bg-green-500/20 text-green-400 border border-green-500/30"
                                  }`}
                                >
                                  {stall.status === "open" ? "Close" : "Open"}
                                </button>
                              </div>

                              <div className="flex justify-between items-center border-t pt-2 border-slate-800">
                                <span className="text-[9px] text-slate-400 uppercase font-bold">Crowd</span>
                                <select
                                  id={`select-stall-density-${stall.id}`}
                                  value={stall.crowdDensity}
                                  onChange={(e) => handleUpdateEntity("foodStalls", stall.id, { crowdDensity: e.target.value })}
                                  className={`text-xs rounded-md px-1 py-0.5 ${
                                    isHighContrast ? "bg-black text-white border" : "bg-slate-850 border border-slate-700 text-slate-200"
                                  }`}
                                >
                                  <option value="low">🟢 Low</option>
                                  <option value="medium">🟡 Medium</option>
                                  <option value="high">🔴 High</option>
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Right Side: Bento Cards Grid (Heatmap & Operational Monitor) */}
        <div className="lg:col-span-5 grid grid-cols-1 gap-6 flex-col">
          
          {/* Bento Block 1: Stadium Heatmap / Density Indicator */}
          <div className={`p-5 rounded-3xl border shadow-xl backdrop-blur-sm ${
            isHighContrast ? "border-white bg-black text-white" : "border-slate-700 bg-slate-800/40"
          }`}>
            <div className="flex justify-between items-start mb-4">
              <h2 className="font-bold text-xs tracking-widest uppercase text-white">Stadium Heatmap</h2>
              <span className="text-[10px] text-slate-400 uppercase font-mono">Live Crowd Density</span>
            </div>

            {!stadiumData ? (
              <div className="text-center py-6">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-slate-500" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {stadiumData.gates.map((g) => {
                    const densityColors = {
                      low: "bg-green-500/10 border-green-500/40 text-green-400",
                      medium: "bg-yellow-500/10 border-yellow-500/40 text-yellow-400",
                      high: "bg-red-500/10 border-red-500/40 text-red-400",
                    }[g.crowdDensity];

                    return (
                      <div 
                        key={g.id} 
                        className={`border rounded-xl p-2 flex flex-col items-center justify-center text-center transition-all ${
                          g.status === "closed"
                            ? "bg-red-950/25 border-red-900 text-red-500 opacity-60"
                            : densityColors
                        }`}
                      >
                        <span className="text-[9px] font-black uppercase tracking-wider font-mono">
                          {g.name.split(" ")[0]} {g.name.split(" ")[1] || ""}
                        </span>
                        <span className="text-xs font-black mt-1 uppercase font-mono">
                          {g.status === "closed" ? "CLOSED" : g.crowdDensity}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-3 pt-1">
                  <div className="flex-1 bg-slate-900/40 border border-slate-700/50 p-2.5 rounded-xl">
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Nearest Medical Point</p>
                    <p className="text-xs font-bold text-white mt-0.5">Section 110 (A)</p>
                  </div>
                  <div className="flex-1 bg-slate-900/40 border border-slate-700/50 p-2.5 rounded-xl">
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Dietary Highlight</p>
                    <p className="text-xs font-bold text-blue-400 mt-0.5 underline decoration-blue-500">Verde Vegetarian (Sec 117)</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bento Block 2: Ground Truth Database Monitor */}
          <div className={`p-5 rounded-3xl border shadow-xl backdrop-blur-sm ${
            isHighContrast ? "border-white bg-black text-white" : "border-slate-700 bg-slate-800/40"
          }`}>
            <h3 className="font-bold text-xs uppercase tracking-widest text-white flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-blue-400" />
              Grounded Database Monitor
            </h3>

            {!stadiumData ? (
              <p className="text-xs text-slate-500">Loading live data schema...</p>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Wait Times list */}
                <div className="space-y-1.5">
                  <p className="font-mono text-[9px] text-slate-500 uppercase tracking-wider font-medium">Concourse Restroom Queues</p>
                  <div className="space-y-1">
                    {stadiumData.restrooms.map((r) => (
                      <div key={r.id} className="flex justify-between items-center py-1 border-b border-slate-800">
                        <span className="text-slate-300 font-mono">Section {r.id.replace("restroom-", "")} ({r.gender.split(" ")[0]})</span>
                        <span className="font-mono font-bold text-slate-200 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {r.queueTimeMinutes}m Wait
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Food Outlets status */}
                <div className="space-y-1.5">
                  <p className="font-mono text-[9px] text-slate-500 uppercase tracking-wider font-medium">Concession Outlet Indicators</p>
                  <div className="space-y-1">
                    {stadiumData.foodStalls.map((f) => (
                      <div key={f.id} className="flex justify-between items-center py-1 border-b border-slate-800">
                        <span className="text-slate-300">{f.name}</span>
                        <div className="flex gap-1">
                          {f.dietaryFlags.map((flag) => (
                            <span key={flag} className="bg-slate-700 text-slate-300 px-1 rounded text-[8px] uppercase font-bold font-mono">
                              {flag.slice(0, 3)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Transit Hubs */}
                {stadiumData.transitHubs && stadiumData.transitHubs.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="font-mono text-[9px] text-slate-500 uppercase tracking-wider font-medium">Transit Hub Connections</p>
                    <div className="space-y-1">
                      {stadiumData.transitHubs.map((t) => (
                        <div key={t.id} className="flex justify-between items-center py-1 border-b border-slate-800">
                          <span className="text-slate-300 font-medium">{t.name}</span>
                          <span className="font-mono font-bold text-slate-200 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {t.waitTimeMinutes}m Wait
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sustainability Eco Checkpoints */}
                {stadiumData.sustainabilityStops && stadiumData.sustainabilityStops.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="font-mono text-[9px] text-slate-500 uppercase tracking-wider font-medium">Sustainability Stops (Green Eco)</p>
                    <div className="space-y-1">
                      {stadiumData.sustainabilityStops.map((s) => (
                        <div key={s.id} className="flex justify-between items-center py-1 border-b border-slate-800">
                          <span className="text-slate-300">{s.name}</span>
                          <span className="text-[8px] bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 px-1.5 py-0.5 rounded font-black font-mono uppercase tracking-wide">
                            {s.crowdDensity} Crowd
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bento Block 3: Live Operational Intelligence Feed */}
          <div className={`p-5 rounded-3xl border shadow-xl backdrop-blur-sm ${
            isHighContrast ? "border-white bg-black text-white" : "border-slate-700 bg-slate-800/40"
          }`}>
            <h3 className="font-bold text-xs uppercase tracking-widest text-white flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
              Operational Intelligence Log
            </h3>
            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
              {systemAlerts.map((alert, index) => (
                <div 
                  key={index} 
                  className={`p-2 rounded-xl border text-xs leading-relaxed flex gap-2 items-start ${
                    alert.includes("closed") || alert.includes("density to \"high\"")
                      ? "bg-red-950/20 text-red-300 border-red-900/50"
                      : isHighContrast ? "border-white bg-black" : "bg-slate-900/40 text-slate-300 border-slate-700"
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
                  <p className="font-mono text-[10px]">{alert}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </main>

      {/* Visual Footer */}
      <footer className={`mt-6 flex flex-col sm:flex-row justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] border-t pt-4 ${
        isHighContrast ? "border-white text-zinc-400" : "border-slate-800 text-slate-400"
      }`}>
        <div className="flex flex-wrap gap-4 sm:gap-8 justify-center mb-2 sm:mb-0">
          <span>Grounding: Stadium-JSON-v2.0</span>
          <span>Latency: 124ms</span>
          <span>FIFA Authorized Hub</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          <span>Operational Control Node Active</span>
        </div>
      </footer>
    </div>
  );
}
