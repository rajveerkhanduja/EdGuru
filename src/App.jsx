import { useState } from 'react';
import ChatList from './components/ChatList';
import ChatBox from './components/ChatBox';
import './App.css';
import './index.css';

const App = () => {
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);

  return (
    <div className="app-container">
      <ChatList 
        currentChatId={currentChatId}
        setCurrentChatId={setCurrentChatId}
        setMessages={setMessages}
      />
      <ChatBox 
        currentChatId={currentChatId}
        messages={messages}
        setMessages={setMessages}
      />
    </div>
  );
};

export default App;