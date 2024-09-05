import React, { useState, useRef, useEffect } from 'react';
import { useEditor } from '@tldraw/tldraw';

async function query(data: { question: string }) {
  const response = await fetch(
    "https://newmatic-flowise.onrender.com/api/v1/prediction/fb30b796-85c6-432f-804e-c3126f211fe6",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    }
  );
  const result = await response.json();
  return result;
}

export function MultimodalChatPanel() {
  const editor = useEditor();
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ type: 'user' | 'ai', content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    setChatHistory(prev => [...prev, { type: 'user', content: input }]);
    setInput('');

    try {
      const response = await query({ question: input });
      setChatHistory(prev => [...prev, { type: 'ai', content: response.text }]);
    } catch (error) {
      console.error('Error fetching response:', error);
      setChatHistory(prev => [...prev, { type: 'ai', content: 'An error occurred while processing your request.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaste = (content: string) => {
    editor.createShapes([
      {
        type: 'text',
        props: { text: content },
      },
    ]);
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return (
    <div className="multimodal-chat-panel">
      <div className="chat-history" ref={chatContainerRef}>
        {chatHistory.map((message, index) => (
          <div key={index} className={`message ${message.type}`}>
            <p>{message.content}</p>
            {message.type === 'ai' && (
              <button onClick={() => handlePaste(message.content)}>Paste to Canvas</button>
            )}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter your prompt..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Generate'}
        </button>
      </form>
    </div>
  );
}
