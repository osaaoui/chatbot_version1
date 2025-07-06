// src/components/ChatPane.jsx
import React, { useState, useEffect, useRef } from "react";
import { UserCircle, Bot, PanelLeft } from "lucide-react"; // Icons

function ChatPane({ question, answer, onQuestionChange, onSend, sources,toggleSidebar,setSelectedSource }) {
  const [chatHistory, setChatHistory] = useState([]);
  const [openSourceStates, setOpenSourceStates] = useState([]);



  const chatEndRef = useRef(null);

  // Auto-scroll on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Update source states when new sources arrive
  useEffect(() => {
    if (sources?.length) {
      setOpenSourceStates(Array(sources.length).fill(false));
    }
  }, [sources]);

  const handleSourceClick = (source) => {
  console.log("Clicked source:", source);

  setSelectedSource({
    filename: source.metadata?.source,
    page: source.metadata?.page,
    snippet: source.snippet || source.content || ""  // ✅ use the actual text, fallback if needed
  });
};



  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitQuestion();
    }
  };

  const submitQuestion = () => {
    const trimmed = question.trim();
    if (!trimmed) return;

    setChatHistory((prev) => [
      ...prev,
      { type: "user", text: trimmed, time: new Date() },
    ]);
    onQuestionChange({ target: { value: "" } });
    onSend();
  };

  // Add answer to chat history when it changes
  useEffect(() => {
    if (answer) {
      setChatHistory((prev) => [
        ...prev,
        { type: "bot", text: answer, time: new Date() },
      ]);
    }
  }, [answer]);

  const toggleSource = (idx) => {
    setOpenSourceStates((prev) =>
      prev.map((val, i) => (i === idx ? !val : val))
    );
  };

  return (
    <div className="flex flex-col flex-1 bg-white">

      {/* Sidebar Toggle Button (Top Left) */}
<div className="p-2 border-b">
  <button
    onClick={toggleSidebar}
    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-7 w-7"
    data-sidebar="trigger"
  >
    <PanelLeft />
    <span className="sr-only">Toggle Sidebar</span>
  </button>
</div>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {chatHistory.length === 0 ? (
          <p className="text-gray-400 italic">Ask a question to get started...</p>
        ) : (
          chatHistory.map((msg, idx) => {
  const isLastBot = msg.type === "bot" && idx === chatHistory.length - 1;
  return (
    <div key={idx} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
      {/* Avatar */}
      {msg.type === "bot" && (
        <div className="flex items-end mr-2">
          <Bot className="w-5 h-5 text-gray-400" />
        </div>
      )}

      {/* Message bubble */}
      <div
        className={`max-w-[80%] px-4 py-3 text-sm ${
          msg.type === "user"
            ? "bg-purple-600 text-white rounded-2xl rounded-br-none"
            : "bg-gray-100 text-gray-800 rounded-2xl rounded-bl-none"
        }`}
      >
        <div>
  {msg.text}
  {isLastBot && sources && sources.length > 0 && (
    <span className="ml-1">
      {sources.map((source, sidx) => (
        <button
          key={sidx}
          onClick={() => handleSourceClick(source)}
          className="text-purple-600 hover:text-purple-800 text-xs ml-1 underline"
        >
          [{sidx + 1}]
        </button>
      ))}
    </span>
  )}
</div>

        <div className="text-[10px] text-gray-400 text-right mt-1">
          {msg.time.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>

       

      </div>

      {/* User icon */}
      {msg.type === "user" && (
        <div className="flex items-end ml-2">
          <UserCircle className="w-5 h-5 text-purple-600" />
        </div>
      )}
    </div>
  );
})

        )}
        <div ref={chatEndRef} />
      </main>
      

      {/* Chat Input */}
      <footer className="border-t px-6 py-3 bg-white">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            submitQuestion();
          }}
        >
          <textarea
            rows={1}
            value={question}
            onChange={onQuestionChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your documents..."
            className="flex-1 resize-none rounded-full border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-purple-500 focus:outline-none"
          />
          <button
            type="submit"
            className="p-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 12h14M12 5l7 7-7 7"
              />
            </svg>
          </button>
        </form>
        <p className="text-[10px] text-gray-400 mt-1">
          Press Enter to send, Shift+Enter for a new line
        </p>
      </footer>
    </div>
  );
}

export default ChatPane;
