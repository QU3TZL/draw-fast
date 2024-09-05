import React, { useState } from 'react';
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
  console.log('MultimodalChatPanel is rendering');
  const editor = useEditor();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await query({ question: input });
      setOutput(response.text);
    } catch (error) {
      console.error('Error fetching response:', error);
      setOutput('An error occurred while processing your request.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaste = () => {
    if (output) {
      editor.createShapes([
        {
          type: 'text',
          props: { text: output },
        },
      ]);
    }
  };

  return (
    <div className="multimodal-chat-panel">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter your prompt..."
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Generate'}
        </button>
      </form>
      {output && (
        <div className="output">
          <p>{output}</p>
          <button onClick={handlePaste}>Paste to Canvas</button>
        </div>
      )}
    </div>
  );
}
