import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, MessageSquare, Menu, ChevronRight } from 'lucide-react';

const ChatList = ({ currentChatId, setCurrentChatId, setMessages }) => {
  const [chats, setChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const loadChats = async () => {
    try {
      const response = await fetch('/api/chats');
      const data = await response.json();
      setChats(data);
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const createNewChat = async () => {
    try {
      const response = await fetch('/api/chat/new', { method: 'POST' });
      const data = await response.json();
      setCurrentChatId(data.chatId);
      setMessages([]);
      loadChats();
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const renameChat = async (chatId, newName) => {
    try {
      await fetch(`/api/chat/rename/${chatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName })
      });
      loadChats();
    } catch (error) {
      console.error('Error renaming chat:', error);
    }
  };

  const deleteChat = async (chatId) => {
    if (!window.confirm('Are you sure you want to delete this chat?')) return;
    
    try {
      await fetch(`/api/chat/delete/${chatId}`, { method: 'DELETE' });
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
      }
      loadChats();
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const loadMessages = async (chatId) => {
    try {
      const response = await fetch(`/api/messages/${chatId}`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  useEffect(() => {
    loadChats();
  }, []);

  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {isSidebarCollapsed ? (
        <div className="collapsed-sidebar">
          <button 
            className="expand-button"
            onClick={() => setIsSidebarCollapsed(false)}
          >
            <ChevronRight size={24} />
          </button>
        </div>
      ) : (
        <div className="chat-list">
          <div className="sidebar-header">
            <button 
              className="menu-button"
              onClick={() => setIsSidebarCollapsed(true)}
            >
              <Menu size={20} />
            </button>
            <button onClick={createNewChat} className="new-chat-btn">
              <Plus size={20} />
              <span>New Chat</span>
            </button>
          </div>
          
          <div className="search-container">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="chats">
            {filteredChats.map(chat => (
              <div 
                key={chat.id}
                className={`chat-item ${currentChatId === chat.id ? 'active' : ''}`}
                onClick={() => {
                  setCurrentChatId(chat.id);
                  loadMessages(chat.id);
                }}
              >
                <MessageSquare size={16} className="chat-icon" />
                <span className="chat-name">{chat.name}</span>
                <div className="chat-actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newName = prompt('Enter new name:', chat.name);
                      if (newName) renameChat(chat.id, newName);
                    }}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default ChatList;