import React, { useState, useRef, useEffect } from 'react';
import { useEditor } from '@tldraw/tldraw';
import { Mic, Upload, ThumbsUp, ThumbsDown, Copy, Send } from 'lucide-react';
import Image from 'next/image';

// Define AI agent types
type AIAgent = {
  id: string;
  name: string;
  icon: string;
  description: string;
};

const aiAgents: AIAgent[] = [
  { id: 'new', name: 'New Matic', icon: '🔧', description: 'General-purpose AI assistant' },
  { id: 'dusty', name: 'Dusty matic', icon: '💡', description: 'Specialized in creative tasks' },
  { id: 'driven', name: 'Driven-o-Matic', icon: '⚙️', description: 'Focused on productivity' },
  { id: 'pack', name: 'Pack-o-matic', icon: '📦', description: 'Packaging and logistics expert' },
  { id: 'artistic', name: 'Artistic-o-Matic', icon: '❤️', description: 'For artistic endeavors' },
  { id: 'stable', name: 'Stable matic', icon: '🐎', description: 'Stability and reliability focused' },
  { id: 'robo', name: 'Robo Matic', icon: '🍄', description: 'Robotics and automation specialist' },
  { id: 'scholar', name: 'Scholar matic', icon: '📚', description: 'Academic and research assistant' },
  { id: 'media', name: 'Media matic', icon: '🎥', description: 'Media and entertainment expert' },
  { id: 'ai', name: 'AI matic', icon: '🧠', description: 'AI and machine learning specialist' },
  { id: 'xcore', name: 'xCore-o-Matic', icon: '💡', description: 'Core systems and infrastructure expert' },
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
  const [chatHistory, setChatHistory] = useState<Array<{ type: 'user' | 'ai', content: string, replicateImage?: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // New state variables for dragging and positioning
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

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
      const replicateImageMatch = response.text.match(/!\[.*?\]\((https:\/\/replicate\.delivery\/[^\s)]+)\)/);
      
      if (replicateImageMatch) {
        setChatHistory(prev => [...prev, { 
          type: 'ai', 
          content: 'Here\'s the image you requested:',
          replicateImage: replicateImageMatch[1]
        }]);
      } else {
        setChatHistory(prev => [...prev, { type: 'ai', content: response.text }]);
      }
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

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    const fileNames = files.map(file => file.name).join(', ');
    setChatHistory(prev => [...prev, { type: 'user', content: `Uploaded files: ${fileNames}` }]);
    // Implement file upload logic here
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDraggingPanel(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDraggingPanel) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Check for edge snapping
      const snapDistance = 20; // pixels
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const panelWidth = chatContainerRef.current?.offsetWidth || 0;
      const panelHeight = chatContainerRef.current?.offsetHeight || 0;

      let snappedX = newX;
      let snappedY = newY;

      if (newX < snapDistance) snappedX = 0;
      if (newY < snapDistance) snappedY = 0;
      if (newX + panelWidth > windowWidth - snapDistance) snappedX = windowWidth - panelWidth;
      if (newY + panelHeight > windowHeight - snapDistance) snappedY = windowHeight - panelHeight;

      setPosition({ x: snappedX, y: snappedY });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingPanel(false);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPanel, dragOffset]);

  return (
    <div 
      ref={chatContainerRef}
      className="multimodal-chat-panel"
      style={{
        position: 'fixed',
        top: `${position.y}px`,
        left: `${position.x}px`,
        zIndex: 1000,
        width: '300px',
        backgroundColor: 'black',
        border: '1px solid #333',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        resize: 'both',
        minWidth: '200px',
        minHeight: '300px',
        maxWidth: '80vw',
        maxHeight: '80vh',
        boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
      }}
      onMouseDown={handleMouseDown}
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
                {message.replicateImage ? (
                  <Image
                    src={message.replicateImage}
                    alt="AI generated image"
                    width={300}
                    height={300}
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                ) : (
                  <p>{message.content}</p>
                )}
                {message.type === 'ai' && (
                  <div className="message-actions">
                    <button onClick={() => handlePaste(message.content)}><Copy size={16} /></button>
                    <button><ThumbsUp size={16} /></button>
                    <button><ThumbsDown size={16} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div 
            className={`input-area ${isDragging ? 'dragging' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                handleInputResize(e);
              }}
              placeholder="Ask a question or drag and drop files here"
              disabled={isLoading}
            />
            <div className="input-actions">
              <div>
                <button onClick={() => {/* Implement voice input */}}><Mic size={20} /></button>
                <button onClick={handleUploadClick}><Upload size={20} /></button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileInputChange}
                  multiple
                />
              </div>
              <button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? 'Generating...' : <Send size={20} />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
