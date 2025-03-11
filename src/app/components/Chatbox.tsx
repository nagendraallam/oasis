"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Message } from '@/lib/types';

interface ChatboxProps {
  messages: Message[];
  sendMessage: (content: string) => void;
  username: string;
}

const Chatbox: React.FC<ChatboxProps> = ({ messages, sendMessage, username }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
      setInput('');
    }
  };
  
  // Format timestamp (simplified for display)
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="h-64 bg-gray-900 bg-opacity-80 rounded-lg flex flex-col overflow-hidden">
      {/* Messages area */}
      <div className="flex-1 p-3 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-gray-500 text-sm text-center mt-4">
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`mb-2 ${message.sender === username ? 'text-right' : ''}`}
            >
              <div 
                className={`inline-block px-3 py-2 rounded-lg max-w-xs text-sm ${
                  message.sender === username 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-gray-700 text-white rounded-bl-none'
                }`}
              >
                {message.sender !== username && (
                  <div className="font-bold text-xs text-blue-300 mb-1">
                    {message.sender}
                  </div>
                )}
                <p>{message.content}</p>
                <div className="text-xs opacity-75 mt-1 text-right">
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message input */}
      <form onSubmit={handleSubmit} className="p-2 border-t border-gray-800">
        <div className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-800 rounded-l px-3 py-2 text-white"
            autoComplete="off"
          />
          <button 
            type="submit" 
            className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chatbox; 