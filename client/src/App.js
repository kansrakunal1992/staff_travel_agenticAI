import React, { useState } from 'react';
import './styles.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sessionId] = useState(Date.now().toString());
  const [loading, setLoading] = useState(false);
  const [mockMode, setMockMode] = useState(true);
  const [flightOptions, setFlightOptions] = useState([]);

  const sendMessage = async (query) => {
    setMessages(prev => [...prev, { sender: 'user', text: query }]);
    setInput('');
    setLoading(true);

    if (mockMode) {
      setTimeout(() => {
        if (query.toLowerCase().includes('book')) {
          const options = [
            { id: 1, airline: 'IndiGo', flight: '6E123', time: '07:00 AM' },
            { id: 2, airline: 'Air India', flight: 'AI456', time: '09:30 AM' },
            { id: 3, airline: 'Vistara', flight: 'UK789', time: '06:00 PM' }
          ];
          setFlightOptions(options);
          setMessages(prev => [...prev, { sender: 'ai', text: 'Here are your flight options:' }]);
        } else if (query.toLowerCase().includes('option')) {
          setMessages(prev => [...prev, { sender: 'ai', text: 'Booking confirmed! PNR: MOCK123' }]);
          setFlightOptions([]);
        } else {
          setMessages(prev => [...prev, { sender: 'ai', text: 'Do you prefer morning or evening flights?' }]);
        }
        setLoading(false);
      }, 1000);
    } else {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, sessionId })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { sender: 'ai', text: data.message }]);
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <h1>Agentic AI Staff Travel</h1>
      <div className="mock-toggle">
        <label>
          <input type="checkbox" checked={mockMode} onChange={() => setMockMode(!mockMode)} />
          Mock Mode
        </label>
      </div>
      <div className="chat-window">
        {messages.map((msg, idx) => (
          <div key={idx} className={`bubble ${msg.sender}`}>{msg.text}</div>
        ))}
        {loading && <div className="bubble ai">Typing...</div>}
      </div>
      {messages.some(m => m.text.includes('morning or evening')) && (
        <div className="quick-replies">
          <button onClick={() => sendMessage('Morning')}>Morning ☀️</button>
          <button onClick={() => sendMessage('Evening')}>Evening 🌙</button>
          <button onClick={() => sendMessage('Any Time')}>Any Time ⏰</button>
        </div>
      )}
      {flightOptions.length > 0 && (
        <div className="flight-options">
          {flightOptions.map(opt => (
            <div key={opt.id} className="flight-card">
              <h3>{opt.airline}</h3>
              <p>{opt.flight} - {opt.time}</p>
              <button onClick={() => sendMessage(`Option ${opt.id}`)}>Select Option {opt.id}</button>
            </div>
          ))}
        </div>
      )}
      <div className="input-area">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type your request..." />
        <button onClick={() => sendMessage(input)}>Send</button>
      </div>
    </div>
  );
}

export default App;
