import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, HelpCircle, Loader2, RefreshCw } from "lucide-react";
import { ChatMessage } from "../types";

interface ChatbotTabProps {
  secureFetch?: (url: string, options?: RequestInit) => Promise<Response>;
}

export default function ChatbotTab({ secureFetch }: ChatbotTabProps = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-init-1",
      sender: "assistant",
      text: "Hello! I am AIHawk Copilot — your intelligent career automation assistant. I can help optimize your resume skills metrics, review Selenium bypass parameters, prepare you for FastAPI/GraphQL questions, or brainstorm customized email outreach strategies. What are you focused on today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollTargetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollTargetRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: "user-" + Date.now(),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsSending(true);

    try {
      const payloadMessages = [...messages, userMsg].map(m => ({
        sender: m.sender,
        text: m.text
      }));

      // Supports integrated secure session cookies
      const fetchToUse = secureFetch || fetch;
      const response = await fetchToUse("/api/chatbot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payloadMessages })
      });

      if (response.ok) {
        const data = await response.json();
        const incomingMsg: ChatMessage = {
          id: "assistant-" + Date.now(),
          sender: "assistant",
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, incomingMsg]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSuggest = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const clearChat = () => {
    setMessages([
      {
        id: "msg-init-1",
        sender: "assistant",
        text: "Conversation refreshed. Ask me anything regarding ATS matching logic or career automation.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const suggestions = [
    "How does the browser automatic Easy-Apply bypass captchas?",
    "What missing keywords should I include for a remote Next.js role?",
    "Pre-empt interview responses based on TechCorp experience",
    "Compare Selenium crawling strategies against standard API fetches"
  ];

  return (
    <div id="chatbot-tab-container" className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      {/* Suggestions and info grid (1 col) */}
      <div className="lg:col-span-1 space-y-4">
        
        {/* Helper info cards */}
        <div className="bg-white rounded-xl border border-gray-150 p-5 shadow-2xs space-y-3">
          <div className="flex items-center space-x-2 text-indigo-600">
            <Sparkles className="h-4 w-4" />
            <span className="font-bold text-xs font-sans text-gray-800">Copilot Parameters</span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            AIHawk Copilot can retrieve elements from your profile, query crawler configuration rules, and formulate complex replies.
          </p>
          <div className="text-[10px] bg-slate-50 text-slate-700 font-mono p-2 rounded border border-slate-100 flex flex-col space-y-1">
            <span>Model: <span className="font-semibold text-indigo-600">Gemini 3.5 Flash</span></span>
            <span>Temperature: <span className="font-semibold text-gray-800">0.7</span></span>
            <span>State Synchronized: <span className="font-semibold text-emerald-600">Active</span></span>
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="bg-white rounded-xl border border-gray-150 p-5 shadow-2xs space-y-3">
          <span className="text-xs font-bold text-gray-400 font-mono tracking-wider uppercase block">Prompt Suggestions</span>
          <div className="flex flex-col gap-2">
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSuggest(sug)}
                className="w-full text-left font-sans text-xs bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-100 hover:border-indigo-100 p-2.5 rounded-lg transition duration-150 cursor-pointer"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Main chat messaging terminal (3 cols) */}
      <div className="lg:col-span-3 flex flex-col bg-white rounded-xl border border-gray-150 overflow-hidden shadow-2xs h-[520px]">
        
        {/* Chat Header controls */}
        <div className="bg-gray-50 border-b border-gray-150 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="font-semibold font-sans text-sm text-gray-800">Interactive Career Guidance Feed</span>
          </div>

          <button
            onClick={clearChat}
            className="text-[10px] font-mono hover:text-indigo-600 flex items-center space-x-1 outline-none text-gray-400 cursor-pointer transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Clear Thread</span>
          </button>
        </div>

        {/* Message Bubble container */}
        <div id="chatbot-messages" className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((m) => {
            const isMe = m.sender === "user";
            return (
              <div
                key={m.id}
                className={`flex max-w-[85%] ${isMe ? "ml-auto flex-row-reverse space-x-reverse" : "mr-auto space-x-3"} items-start`}
              >
                {/* Avatar representation */}
                <div className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 ${isMe ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                  {isMe ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5 text-indigo-500" />}
                </div>

                {/* Bubble contents */}
                <div className="space-y-1">
                  <div className={`p-3.5 rounded-2xl text-xs md:text-sm leading-relaxed ${isMe ? 'bg-indigo-600 text-white font-medium rounded-tr-none' : 'bg-slate-105 text-gray-800 border border-gray-150 rounded-tl-none'}`}>
                    <span className="whitespace-pre-line select-text">{m.text}</span>
                  </div>
                  <p className={`text-[9px] text-gray-400 font-mono ${isMe ? 'text-right' : 'text-left'}`}>
                    {m.timestamp}
                  </p>
                </div>
              </div>
            );
          })}
          
          {isSending && (
            <div className="flex items-center space-x-2 text-gray-400 text-xs ml-3 bg-gray-50 border border-gray-100 p-2.5 rounded-lg w-max shrink-0">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-500" />
              <span>AIHawk is auditing your system prompts...</span>
            </div>
          )}

          <div ref={scrollTargetRef} />
        </div>

        {/* Input panel block */}
        <div className="p-4 border-t border-gray-150 bg-slate-50/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }}
            className="flex space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything regarding automated scrapers, interview tweaks, or credentials override..."
              className="flex-1 text-xs border border-gray-200 rounded-lg p-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
              disabled={isSending}
              required
            />
            <button
              id="send-chat-btn"
              type="submit"
              disabled={isSending || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 active:scale-[0.98] transition-all text-white p-3 rounded-lg flex items-center justify-center cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
