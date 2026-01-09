# ChatBot Integration Guide

## Overview

Aapki marketplace website mein ab ek secure, intelligent chatbot integrate ho gaya hai jo backend API se connect hota hai aur hard-coded data use nahi karta. Ye chatbot buyer aur seller dono ke liye helpful hai aur strict security rules follow karta hai.

## Security Features Implemented

### 1. **Sensitive Data Protection**
- Password, OTP, CVV, card numbers kabhi share nahi hote
- Wallet balance sirf backend se aata hai
- Personal identification data protected hai
- Other users ka data accessible nahi hai

### 2. **Malicious Query Detection**
- XSS, SQL injection attempts detect hote hain
- Script injection blocked hai
- Hacking/cracking queries reject hote hain
- API keys aur secrets expose nahi hote

### 3. **Role-Based Access Control**
- Buyer sirf buyer data dekh sakta hai
- Seller sirf seller data dekh sakta hai
- User authentication required hai
- Session-based security implemented hai

## Backend Implementation

### Files Created:

#### 1. **Model: `/backend/models/ChatBot.js`**
- Chat sessions store karta hai
- Messages aur conversation history save hoti hai
- Auto-expire after 2 hours (configurable)
- User-specific sessions

#### 2. **Controller: `/backend/controllers/chatBotController.js`**
- `getOrCreateChatSession` - Session load/create karta hai
- `getUserContextData` - User ka real data fetch karta hai
- `sendMessage` - Messages process karta hai
- `setUserType` - Seller/Customer mode set karta hai
- `updateLanguage` - English/Urdu switch karta hai
- `clearChatSession` - Chat reset karta hai

**Security Features:**
- `isSecureQuery()` - Malicious patterns detect karta hai
- `fetchUserContext()` - Role-based data fetch karta hai
- `analyzeQuery()` - Intent detection karta hai
- `generateResponse()` - Context-aware responses generate karta hai

#### 3. **Routes: `/backend/routes/chatBotRoutes.js`**
```javascript
GET  /api/chatbot/session      - Get or create chat session
GET  /api/chatbot/context      - Get user context data
POST /api/chatbot/message      - Send a message
POST /api/chatbot/user-type    - Set user type (seller/customer)
POST /api/chatbot/language     - Update language
POST /api/chatbot/clear        - Clear chat session
```

**All routes protected with authentication middleware**

## Frontend Implementation

### Files Created:

#### 1. **Redux Slice: `/frontend/src/redux/slices/chatBotSlice.js`**
Redux actions:
- `getChatSession` - Session load karta hai
- `getUserContext` - Context data fetch karta hai
- `sendChatMessage` - Message send karta hai
- `setChatUserType` - User type set karta hai
- `updateChatLanguage` - Language change karta hai
- `clearChat` - Chat clear karta hai

Redux state:
```javascript
{
  sessionId: null,
  messages: [],
  userType: null,
  language: 'english',
  contextData: null,
  isOpen: false,
  loading: false,
  error: null,
  sendingMessage: false
}
```

#### 2. **Component: `/frontend/src/components/chatbot/SmartChatBotAPI.jsx`**
- Redux se connect hai
- API calls through Redux actions
- Real-time message updates
- Loading states aur error handling
- Typing indicator
- Language toggle (English/Urdu)
- User type selection

## How to Use

### 1. **Replace Old Chatbot**

Purani chatbot file (`SmartChatBot.jsx`) ko replace karein:

**Option A - Direct Replacement:**
```javascript
// App.js ya main component mein
import SmartChatBotAPI from './components/chatbot/SmartChatBotAPI';

// Purani import ko replace karein
// import SmartChatBot from './components/chatbot/SmartChatBot';
```

**Option B - Keep Both (Testing):**
```javascript
// Testing ke liye dono rakh sakte hain
import SmartChatBot from './components/chatbot/SmartChatBot'; // Old
import SmartChatBotAPI from './components/chatbot/SmartChatBotAPI'; // New

// Conditionally render
{process.env.REACT_APP_USE_NEW_CHATBOT === 'true' 
  ? <SmartChatBotAPI /> 
  : <SmartChatBot />
}
```

### 2. **Environment Variables**

`.env` file mein add karein:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

Production ke liye:
```env
REACT_APP_API_URL=https://your-domain.com/api
```

### 3. **Start the Application**

Backend:
```bash
cd backend
npm install
npm start
```

Frontend:
```bash
cd frontend
npm install
npm start
```

## Data Flow

### User Message Flow:
1. User types message → Frontend
2. Redux action dispatch → `sendChatMessage`
3. API call → `/api/chatbot/message`
4. Backend controller → `sendMessage()`
5. Context fetch → Database (User, Products, Orders, etc.)
6. Query analysis → Intent detection
7. Response generation → Context-aware response
8. Save to database → ChatBot model
9. Return response → Frontend
10. Redux state update → UI update

### Context Data Flow:
1. User opens chatbot → `getChatSession`
2. Fetch user context → `getUserContext`
3. Backend checks role → Seller or Customer
4. Fetch relevant data:
   - **Seller:** Products, Orders, Revenue, Store info
   - **Customer:** Cart items, Order history
5. Return sanitized data → No sensitive info
6. Store in Redux → Available for queries

## Security Rules Enforced

### ✅ What Chatbot CAN Do:
- Product count batana
- Order status batana (user ke apne orders)
- Revenue information (seller ke liye)
- Cart items count
- Category information
- Help with navigation
- Password change process guide karna
- Profile update guide karna
- Vacation mode explain karna

### ❌ What Chatbot CANNOT Do:
- Passwords share karna
- Payment details show karna
- Other users ka data dikhana
- API keys expose karna
- Database structure batana
- Admin credentials share karna
- Wallet balance guess karna (sirf backend se aata hai)

## Response Examples

### Seller Query:
```
User: "How many products do I have?"
Bot: "Aapke inventory mein total 25 products hain.

Aap Dashboard > Products section mein jaakar:
• Products ki list dekh sakte hain
• Prices update kar sakte hain
• Stock levels manage kar sakte hain
• Naye products add kar sakte hain"
```

### Customer Query:
```
User: "What's in my cart?"
Bot: "Aapki cart mein 3 items hain.

Aap ye kar sakte hain:
• Cart page par jaakar items dekh sakte hain
• Quantity update kar sakte hain
• Items remove kar sakte hain
• Checkout proceed kar sakte hain"
```

### Security Query:
```
User: "What's my password?"
Bot: "For security reasons, I can't access or share that information."
```

## Testing

### Test Cases:

1. **Authentication Test:**
   - Logged out user → Chatbot hidden
   - Logged in user → Chatbot visible

2. **Seller Mode Test:**
   - Select "I am a seller"
   - Ask "How many products?"
   - Verify real product count from database

3. **Customer Mode Test:**
   - Select "I am a customer"
   - Ask "What's in my cart?"
   - Verify real cart items

4. **Language Test:**
   - Click language toggle
   - Verify Urdu/English responses

5. **Security Test:**
   - Ask "What's my password?"
   - Verify security message
   - Try malicious queries
   - Verify rejection

6. **Session Test:**
   - Send messages
   - Refresh page
   - Verify session persists (2 hours)

## Troubleshooting

### Issue: Chatbot not loading
**Solution:**
- Check if user is authenticated
- Verify API_URL in .env
- Check backend is running
- Check browser console for errors

### Issue: Messages not sending
**Solution:**
- Check network tab for API errors
- Verify authentication token
- Check backend logs
- Verify database connection

### Issue: Wrong data showing
**Solution:**
- Clear chat session
- Logout and login again
- Check user role in database
- Verify backend context fetching

### Issue: Language not switching
**Solution:**
- Check Redux state
- Verify API call success
- Check backend language update

## Future Enhancements

### Planned Features:
1. **AI Integration:**
   - OpenAI/GPT integration for smarter responses
   - Natural language understanding
   - Context-aware conversations

2. **Advanced Features:**
   - Voice input/output
   - Image sharing
   - File attachments
   - Quick actions (Add product, View order)

3. **Analytics:**
   - Popular queries tracking
   - User satisfaction ratings
   - Response time monitoring

4. **Multi-language:**
   - More languages support
   - Auto-detect user language

## API Documentation

### POST /api/chatbot/message
**Request:**
```json
{
  "message": "How many products do I have?",
  "sessionId": "64f5a1b2c3d4e5f6g7h8i9j0"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "You have 25 products in your inventory...",
    "userType": "seller",
    "language": "english"
  }
}
```

### GET /api/chatbot/context
**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "name": "John Doe",
      "role": "seller"
    },
    "seller": {
      "hasStore": true,
      "productCount": 25,
      "categories": ["Electronics", "Clothing"],
      "stats": {
        "totalOrders": 150,
        "totalRevenue": 50000
      }
    }
  }
}
```

## Maintenance

### Regular Tasks:
1. Monitor chat sessions in database
2. Check for malicious query attempts
3. Update response templates
4. Review user feedback
5. Optimize query analysis

### Database Cleanup:
- Chat sessions auto-expire after 2 hours
- Old messages automatically deleted
- No manual cleanup needed

## Support

Issues ya questions ke liye:
1. Check logs: Backend console aur browser console
2. Review this documentation
3. Check Redux DevTools for state
4. Test API endpoints directly
5. Contact development team

---

**Note:** Ye implementation production-ready hai with proper security measures. Hard-coded data completely remove ho gaya hai aur sab kuch backend se dynamically fetch hota hai.
