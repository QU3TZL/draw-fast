import React, { useState, useRef, useEffect } from 'react';
import { useEditor } from '@tldraw/tldraw';

// Define AI agent types
type AIAgent = {
  id: string;
  name: string;
  icon: string;
  description: string;
};

const aiAgents: AIAgent[] = [
  { id: 'new', name: 'New', icon: '🆕', description: 'General-purpose AI assistant' },
  { id: 'code', name: 'Code', icon: '💻', description: 'Specialized in coding tasks' },
  { id: 'creative', name: 'Creative', icon: '🎨', description: 'For creative writing and brainstorming' },
  // Add more agents as needed
];

async function query(data: { question: string, agentId: string }) {
  // Modify the query function to include the selected agent
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
  const [chatHistory, setChatHistory] = useState<Array<{ type: 'user' | 'ai', content: string, isImage?: boolean }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState<'left' | 'right' | 'top' | 'bottom'>('right');
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleAgentSelect = (agent: AIAgent) => {
    setSelectedAgent(agent);
    setChatHistory([{ type: 'ai', content: `Hello! I'm ${agent.name}. How can I assist you today?` }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedAgent) return;

    setIsLoading(true);
    setChatHistory(prev => [...prev, { type: 'user', content: input }]);
    setInput('');

    try {
      const response = await query({ question: input, agentId: selectedAgent.id });
      setChatHistory(prev => [...prev, { 
        type: 'ai', 
        content: response.text,
        isImage: response.text.startsWith('http') && (response.text.endsWith('.png') || response.text.endsWith('.jpg') || response.text.endsWith('.jpeg'))
      }]);
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

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', '');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    
    if (clientX < innerWidth / 3) setPosition('left');
    else if (clientX > (2 * innerWidth) / 3) setPosition('right');
    else if (clientY < innerHeight / 2) setPosition('top');
    else setPosition('bottom');
  };

  const handleInputResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  };

  return (
    <div 
      className={`multimodal-chat-panel ${position}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {!selectedAgent ? (
        <div className="agent-selection">
          <h2>Select an AI Agent</h2>
          <div className="agent-grid">
            {aiAgents.map(agent => (
              <div key={agent.id} className="agent-card" onClick={() => handleAgentSelect(agent)}>
                <div className="agent-icon">{agent.icon}</div>
                <h3>{agent.name}</h3>
                <p>{agent.description}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="chat-header">
            <h2>{selectedAgent.name}</h2>
            <button onClick={() => setSelectedAgent(null)}>Change Agent</button>
          </div>
          <div className="chat-history" ref={chatContainerRef}>
            {chatHistory.map((message, index) => (
              <div key={index} className={`message ${message.type}`}>
                {message.isImage ? (
                  <img src={message.content} alt="AI generated" className="generated-image" />
                ) : (
                  <p>{message.content}</p>
                )}
                {message.type === 'ai' && (
                  <button onClick={() => handlePaste(message.content)}>Paste to Canvas</button>
                )}
              </div>
            ))}
          </div>
          <form onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                handleInputResize(e);
              }}
              placeholder="Enter your prompt..."
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Generating...' : 'Generate'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
