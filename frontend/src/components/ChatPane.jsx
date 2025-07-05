// src/components/ChatPane.jsx
import React from "react";
import { SourceList } from "./SourceList"; // If it's in the same folder


function ChatPane({ question, answer, onQuestionChange, onSend, sources }) {
  return (
    <div style={{ flex: 1, padding: "1rem" }}>
      <h1>Softia Chat</h1>
      <input
        type="text"
        value={question}
        onChange={onQuestionChange}
        style={{ width: "100%", padding: "0.5rem" }}
      />
      <button onClick={onSend} style={{ marginTop: "0.5rem" }}>
        Ask
      </button>
      <p style={{ marginTop: "1rem" }}>{answer}</p>

      {sources && sources.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <ul>
            {sources && sources.length > 0 && (
            <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Sources</h3>
            <SourceList sources={sources} />
            </div>
      )}

          </ul>
        </div>
      )}
    </div>
  );
}

export default ChatPane;
