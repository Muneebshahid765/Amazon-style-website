import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  getChatSession,
  getUserContext,
  sendChatMessage,
  setChatUserType,
  updateChatLanguage,
  clearChat,
  toggleChatBot,
  closeChatBot,
  openChatBot,
  addLocalMessage,
  clearError
} from '../../redux/slices/chatBotSlice';
import './ChatBot.css';

const SmartChatBotAPI = () => {
  const dispatch = useDispatch();
  const messagesEndRef = useRef(null);
  const [inputMessage, setInputMessage] = useState('');

  const {
    sessionId,
    messages,
    userType,
    language,
    contextData,
    isOpen,
    loading,
    error,
    sendingMessage
  } = useSelector((state) => state.chatBot);

  const authUser = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (authUser && isOpen && !sessionId) {
      dispatch(getChatSession());
      dispatch(getUserContext());
    }
  }, [authUser, isOpen, sessionId, dispatch]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || sendingMessage) return;

    const userMessage = {
      text: inputMessage,
      sender: 'user'
    };

    dispatch(addLocalMessage(userMessage));

    const messageToSend = inputMessage;
    setInputMessage('');

    try {
      await dispatch(sendChatMessage({ 
        message: messageToSend, 
        sessionId 
      })).unwrap();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleUserTypeSelect = async (type) => {
    try {
      await dispatch(setChatUserType({ 
        userType: type, 
        sessionId 
      })).unwrap();
    } catch (err) {
      console.error('Failed to set user type:', err);
    }
  };

  const handleLanguageToggle = async () => {
    const newLang = language === 'english' ? 'urdu' : 'english';
    try {
      await dispatch(updateChatLanguage({ 
        language: newLang, 
        sessionId 
      })).unwrap();
    } catch (err) {
      console.error('Failed to update language:', err);
    }
  };

  const handleRefresh = async () => {
    try {
      await dispatch(clearChat({ sessionId })).unwrap();
    } catch (err) {
      console.error('Failed to clear chat:', err);
    }
  };

  if (!authUser) {
    return null;
  }

  return (
    <>
      {!isOpen && (
        <button 
          className="chatbot-toggle" 
          onClick={() => dispatch(openChatBot())}
          aria-label="Open chat"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 13.54 2.38 14.99 3.06 16.27L2 22L7.73 20.94C9.01 21.62 10.46 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="currentColor"/>
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <div className="chatbot-header-left">
              <div className="chatbot-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 13.54 2.38 14.99 3.06 16.27L2 22L7.73 20.94C9.01 21.62 10.46 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"/>
                </svg>
              </div>
              <h3>Smart AI Assistant</h3>
            </div>
            <div className="chatbot-header-actions">
              <button 
                onClick={handleLanguageToggle}
                disabled={loading || sendingMessage}
                title={language === 'english' ? 'Switch to Urdu' : 'Switch to English'}
              >
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                  {language === 'english' ? 'اردو' : 'EN'}
                </span>
              </button>
              <button 
                onClick={handleRefresh}
                disabled={loading || sendingMessage}
                title="Refresh"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/>
                </svg>
              </button>
              <button 
                onClick={() => dispatch(closeChatBot())} 
                title="Minimize"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M19 12H5"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="chatbot-messages">
            {loading && messages.length === 0 ? (
              <div className="chatbot-loading">
                <p>{language === 'urdu' ? 'Load ho raha hai...' : 'Loading...'}</p>
              </div>
            ) : (
              <>
                {messages.map((msg, index) => (
                  <div
                    key={msg.id || msg._id || `${msg.timestamp || 'msg'}-${index}`}
                    className={`message ${msg.sender}`}
                  >
                    {msg.sender === 'bot' && (
                      <div className="message-avatar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                          <path d="M12 2C6.48 2 2 6.48 2 12C2 13.54 2.38 14.99 3.06 16.27L2 22L7.73 20.94C9.01 21.62 10.46 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"/>
                        </svg>
                      </div>
                    )}
                    <div className="message-content">
                      <p style={{ whiteSpace: 'pre-line' }}>{msg.text}</p>
                    </div>
                  </div>
                ))}

                {sendingMessage && (
                  <div className="message bot">
                    <div className="message-avatar">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2C6.48 2 2 6.48 2 12C2 13.54 2.38 14.99 3.06 16.27L2 22L7.73 20.94C9.01 21.62 10.46 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"/>
                      </svg>
                    </div>
                    <div className="message-content">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}

                {!userType && messages.length > 0 && !loading && (
                  <div className="user-type-options">
                    <button 
                      onClick={() => handleUserTypeSelect('seller')} 
                      className="option-btn"
                      disabled={sendingMessage}
                    >
                      {language === 'urdu' ? 'Main seller hoon' : 'I am a seller'}
                    </button>
                    <button 
                      onClick={() => handleUserTypeSelect('customer')} 
                      className="option-btn"
                      disabled={sendingMessage}
                    >
                      {language === 'urdu' ? 'Main customer hoon' : 'I am a customer'}
                    </button>
                  </div>
                )}

                {error && (
                  <div className="chatbot-error">
                    <p>{error}</p>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <div className="chatbot-input">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                loading 
                  ? (language === 'urdu' ? 'Load ho raha hai...' : 'Loading...') 
                  : (language === 'urdu' ? 'Apna sawal likhein...' : 'Type your message...')
              }
              disabled={loading || sendingMessage}
            />
            <button 
              onClick={handleSendMessage} 
              disabled={!inputMessage.trim() || loading || sendingMessage}
              className="send-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
            </button>
          </div>

          <div className="chatbot-footer">
            <span>{language === 'urdu' ? 'Smart AI se powered' : 'Powered by Smart AI'}</span>
          </div>
        </div>
      )}
    </>
  );
};

export default SmartChatBotAPI;
