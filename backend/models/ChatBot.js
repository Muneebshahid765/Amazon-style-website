import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    maxlength: 2000
  },
  sender: {
    type: String,
    enum: ['user', 'bot'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  intent: String,
  topic: String
});

const chatBotSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userType: {
    type: String,
    enum: ['seller', 'customer', null],
    default: null
  },
  language: {
    type: String,
    enum: ['english', 'urdu'],
    default: 'english'
  },
  messages: [chatMessageSchema],
  conversationHistory: [{
    query: String,
    intent: String,
    topic: String,
    response: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  lastActivity: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

chatBotSchema.index({ user: 1, lastActivity: -1 });
chatBotSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 3600 });

chatBotSchema.methods.addMessage = function(text, sender, intent = null, topic = null) {
  this.messages.push({
    text,
    sender,
    timestamp: new Date(),
    intent,
    topic
  });
  
  if (this.messages.length > 50) {
    this.messages = this.messages.slice(-50);
  }
  
  this.lastActivity = new Date();
  return this.save();
};

chatBotSchema.methods.addToHistory = function(query, intent, topic, response) {
  this.conversationHistory.push({
    query,
    intent,
    topic,
    response,
    timestamp: new Date()
  });
  
  if (this.conversationHistory.length > 10) {
    this.conversationHistory = this.conversationHistory.slice(-10);
  }
  
  return this.save();
};

const ChatBot = mongoose.model('ChatBot', chatBotSchema);

export default ChatBot;
