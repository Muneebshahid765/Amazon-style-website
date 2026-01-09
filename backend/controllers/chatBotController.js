import ChatBot from '../models/ChatBot.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Store from '../models/Store.js';
import Cart from '../models/Cart.js';

const SENSITIVE_DATA_MESSAGE = {
  english: "For security reasons, I can't access or share that information.",
  urdu: "Security reasons ki wajah se, main ye information share nahi kar sakta."
};

const isSecureQuery = (query) => {
  const maliciousPatterns = [
    /script/i, /eval\(/i, /onclick/i, /onerror/i, /javascript:/i,
    /data:text\/html/i, /<iframe/i, /<embed/i, /<object/i,
    /document\.cookie/i, /localStorage/i, /sessionStorage/i,
    /\.innerHTML/i, /hack/i, /crack/i, /exploit/i, /vulnerability/i,
    /sql\s+injection/i, /xss/i, /csrf/i, /phishing/i, /malware/i,
    /virus/i, /steal\s+(password|credit|card|data)/i,
    /bypass\s+security/i, /admin\s+password/i, /database\s+credentials/i,
    /api\s+key/i, /secret\s+key/i, /private\s+key/i, /access\s+token/i,
    /how\s+to\s+(hack|crack|steal)/i, /illegal/i, /fraud/i, /scam/i,
    /fake\s+(product|review|rating)/i, /money\s+laundering/i,
    /counterfeit/i, /pirated/i, /stolen\s+(goods|items|products)/i,
    /\.env/i, /config\s+file/i, /source\s+code/i, /git\s+credentials/i,
    /password|otp|pin|cvv|card\s+number|bank\s+account/i
  ];
  return !maliciousPatterns.some(pattern => pattern.test(query));
};

const getDefaultUserType = (contextData) => {
  if (contextData?.seller) return 'seller';
  if (contextData?.customer) return 'customer';
  return 'customer';
};

const buildWelcomeMessage = (contextData, lang = 'english') => {
  const userName = contextData?.user?.name || 'User';
  const userType = getDefaultUserType(contextData);
  const sellerStats = contextData?.seller?.stats;
  const customerInfo = contextData?.customer;

  if (lang === 'urdu') {
    if (userType === 'seller' && sellerStats) {
      return `Khush aamdeed ${userName}! Aap ke paas total ${sellerStats.totalOrders} orders aur Rs. ${sellerStats.totalRevenue?.toLocaleString() || 0} ki revenue hai. Main aapki products, orders aur earnings manage karne mein madad karunga.`;
    }
    if (userType === 'customer' && customerInfo) {
      return `Khush aamdeed ${userName}! Aapki cart mein ${customerInfo.cartItems || 0} items hain aur recent orders ${customerInfo.orderCount || 0} hain. Shopping mein koi madad chahiye toh poochen.`;
    }
    return `Khush aamdeed ${userName}! Main aapki e-commerce platform par madad ke liye yahan hoon.`;
  }

  if (userType === 'seller' && sellerStats) {
    return `Welcome ${userName}! You currently have ${sellerStats.totalOrders} total orders and Rs. ${sellerStats.totalRevenue?.toLocaleString() || 0} in revenue. I can help you manage products, orders, and earnings.`;
  }
  if (userType === 'customer' && customerInfo) {
    return `Welcome ${userName}! You have ${customerInfo.cartItems || 0} items in your cart and ${customerInfo.orderCount || 0} recent orders. Ask me anything about your shopping.`;
  }
  return `Welcome ${userName}! I'm here to help you navigate the marketplace.`;
};

const buildContextSummary = (contextData, lang = 'english', userType) => {
  const sellerStats = contextData?.seller?.stats;
  const categories = contextData?.seller?.categoryCount;
  const productCount = contextData?.seller?.productCount;
  const customerInfo = contextData?.customer;

  if (lang === 'urdu') {
    if (userType === 'seller' && contextData?.seller) {
      return `آپ کے پاس اس وقت ${productCount || 0} پروڈکٹس، ${categories || 0} کیٹگریز اور ${sellerStats?.totalOrders || 0} آردرز ہیں۔ آپ کی کل کمائی Rs. ${sellerStats?.totalRevenue?.toLocaleString() || 0} ہے۔`;
    }
    if (userType === 'customer' && customerInfo) {
      return `آپ کی کارٹ میں ${customerInfo.cartItems || 0} آئٹمز ہیں اور حالیہ آرڈرز ${customerInfo.orderCount || 0} ہیں۔`;
    }
    return 'میں آپ کی دکان اور خریدار معلومات تک رسائی رکھتا ہوں تاکہ بہتر مدد دے سکوں۔';
  }

  if (userType === 'seller' && contextData?.seller) {
    return `You currently manage ${productCount || 0} products across ${categories || 0} categories with ${sellerStats?.totalOrders || 0} total orders and Rs. ${sellerStats?.totalRevenue?.toLocaleString() || 0} in revenue.`;
  }
  if (userType === 'customer' && customerInfo) {
    return `You have ${customerInfo.cartItems || 0} item(s) in cart and ${customerInfo.orderCount || 0} recent orders.`;
  }
  return 'I have secure access to your store and buyer context so I can answer data-backed questions.';
};

export const getOrCreateChatSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const contextData = await fetchUserContext(userId, req.user.role);
    const defaultUserType = getDefaultUserType(contextData);
    const welcomeMessageText = buildWelcomeMessage(contextData, 'english');

    let chatSession = await ChatBot.findOne({ 
      user: userId, 
      isActive: true 
    }).sort({ lastActivity: -1 });
    
    if (!chatSession) {
      chatSession = new ChatBot({
        user: userId,
        userType: defaultUserType,
        messages: [{
          text: welcomeMessageText,
          sender: 'bot',
          timestamp: new Date()
        }]
      });
      await chatSession.save();
    }
    
    const now = Date.now();
    const lastActivityTime = new Date(chatSession.lastActivity).getTime();
    const AUTO_DELETE_TIME = 60 * 60 * 1000;
    
    if (now - lastActivityTime >= AUTO_DELETE_TIME) {
      chatSession.messages = [{
        text: buildWelcomeMessage(contextData, chatSession.language || 'english'),
        sender: 'bot',
        timestamp: new Date()
      }];
      chatSession.userType = defaultUserType;
      chatSession.conversationHistory = [];
      await chatSession.save();
    }
    
    res.json({
      success: true,
      data: {
        sessionId: chatSession._id,
        messages: chatSession.messages,
        userType: chatSession.userType,
        language: chatSession.language
      }
    });
  } catch (error) {
    console.error('Get chat session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load chat session'
    });
  }
};

export const getUserContextData = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    
    const contextData = {
      user: {
        name: req.user.name || req.user.firstName || 'User',
        role: userRole
      }
    };
    
    if (userRole === 'seller') {
      const store = await Store.findOne({ owner: userId })
        .select('name description isActive vacationMode categories commission');
      
      const products = await Product.find({ seller: userId })
        .select('name price category stock isActive')
        .limit(100);
      
      const orders = await Order.find({ seller: userId })
        .select('status totalAmount createdAt');
      
      const totalOrders = orders.length;
      const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
      const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'completed').length;
      
      const totalRevenue = orders
        .filter(o => o.status === 'delivered' || o.status === 'completed')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = orders.filter(o => new Date(o.createdAt) >= today);
      const todayRevenue = todayOrders
        .filter(o => o.status === 'delivered' || o.status === 'completed')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      
      const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
      
      contextData.seller = {
        hasStore: !!store,
        storeActive: store?.isActive || false,
        vacationMode: store?.vacationMode || false,
        productCount: products.length,
        categories: categories,
        categoryCount: categories.length,
        stats: {
          totalOrders,
          pendingOrders,
          completedOrders,
          totalRevenue,
          todayOrders: todayOrders.length,
          todayRevenue
        }
      };
    } else {
      const cart = await Cart.findOne({ user: userId }).populate('items.product');
      const cartItemCount = cart?.items?.length || 0;
      
      const orders = await Order.find({ buyer: userId })
        .select('status totalAmount createdAt')
        .sort({ createdAt: -1 })
        .limit(10);
      
      contextData.customer = {
        cartItems: cartItemCount,
        orderCount: orders.length,
        recentOrders: orders.map(o => ({
          status: o.status,
          amount: o.totalAmount,
          date: o.createdAt
        }))
      };
    }
    
    res.json({
      success: true,
      data: contextData
    });
  } catch (error) {
    console.error('Get user context error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user context'
    });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const userId = req.user._id;
    
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }
    
    if (!isSecureQuery(message)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query detected'
      });
    }
    
    let chatSession = await ChatBot.findOne({ 
      _id: sessionId, 
      user: userId 
    });
    
    if (!chatSession) {
      chatSession = await ChatBot.findOne({ 
        user: userId, 
        isActive: true 
      }).sort({ lastActivity: -1 });
      
      if (!chatSession) {
        chatSession = new ChatBot({ user: userId });
        await chatSession.save();
      }
    }
    
    await chatSession.addMessage(message, 'user');
    
    const contextData = await fetchUserContext(userId, req.user.role);
    const analysis = analyzeQuery(message, contextData, chatSession.userType);
    const botResponse = await generateResponse(message, analysis, contextData, chatSession.language);
    
    if (analysis.intent === 'switch_mode') {
      chatSession.userType = null;
    }
    
    if (analysis.language) {
      chatSession.language = analysis.language;
    }
    
    await chatSession.addMessage(botResponse, 'bot', analysis.intent, analysis.topic);
    await chatSession.addToHistory(message, analysis.intent, analysis.topic, botResponse);
    
    res.json({
      success: true,
      data: {
        message: botResponse,
        userType: chatSession.userType,
        language: chatSession.language
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process message'
    });
  }
};

export const setUserType = async (req, res) => {
  try {
    const { userType, sessionId } = req.body;
    const userId = req.user._id;
    
    if (!['seller', 'customer'].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user type'
      });
    }
    
    const chatSession = await ChatBot.findOne({ 
      _id: sessionId, 
      user: userId 
    });
    
    if (!chatSession) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }
    
    chatSession.userType = userType;
    await chatSession.save();
    
    const contextData = await fetchUserContext(userId, req.user.role);
    const userName = contextData.user.name;
    
    const response = chatSession.language === 'urdu'
      ? `Khush aamdeed ${userName}! Main aapke ${userType === 'seller' ? 'business' : 'shopping'} mein madad karunga. Kuch bhi pooch sakte hain!`
      : `Welcome ${userName}! I'll help you with your ${userType === 'seller' ? 'business' : 'shopping'}. Ask me anything!`;
    
    await chatSession.addMessage(response, 'bot');
    
    res.json({
      success: true,
      data: {
        userType: chatSession.userType,
        message: response
      }
    });
  } catch (error) {
    console.error('Set user type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set user type'
    });
  }
};

export const updateLanguage = async (req, res) => {
  try {
    const { language, sessionId } = req.body;
    const userId = req.user._id;
    
    if (!['english', 'urdu'].includes(language)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid language'
      });
    }
    
    const chatSession = await ChatBot.findOne({ 
      _id: sessionId, 
      user: userId 
    });
    
    if (!chatSession) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }
    
    chatSession.language = language;
    await chatSession.save();
    
    const message = language === 'urdu'
      ? 'Main ab Urdu mein baat karunga. Aap mujhse kuch bhi pooch sakte hain!'
      : 'I will now respond in English. How can I help you?';
    
    await chatSession.addMessage(message, 'bot');
    
    res.json({
      success: true,
      data: {
        language: chatSession.language,
        message
      }
    });
  } catch (error) {
    console.error('Update language error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update language'
    });
  }
};

export const clearChatSession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user._id;
    
    const chatSession = await ChatBot.findOne({ 
      _id: sessionId, 
      user: userId 
    });
    
    if (!chatSession) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }
    
    chatSession.messages = [{
      text: "Hello! I'm your intelligent assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }];
    chatSession.userType = null;
    chatSession.conversationHistory = [];
    await chatSession.save();
    
    res.json({
      success: true,
      data: {
        messages: chatSession.messages
      }
    });
  } catch (error) {
    console.error('Clear chat session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear chat session'
    });
  }
};

async function fetchUserContext(userId, userRole) {
  const contextData = {
    user: {
      role: userRole
    }
  };
  
  const user = await User.findById(userId).select('name firstName email');
  contextData.user.name = user.name || user.firstName || 'User';
  contextData.user.email = user.email;
  
  if (userRole === 'seller') {
    const store = await Store.findOne({ owner: userId });
    const products = await Product.find({ seller: userId }).select('name price category stock');
    const orders = await Order.find({ seller: userId }).select('status totalAmount createdAt');
    
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
    const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'completed').length;
    
    const totalRevenue = orders
      .filter(o => o.status === 'delivered' || o.status === 'completed')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(o => new Date(o.createdAt) >= today);
    const todayRevenue = todayOrders
      .filter(o => o.status === 'delivered' || o.status === 'completed')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
    
    contextData.seller = {
      hasStore: !!store,
      storeActive: store?.isActive || false,
      vacationMode: store?.vacationMode || false,
      products: products,
      productCount: products.length,
      categories: categories,
      categoryCount: categories.length,
      stats: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue,
        todayOrders: todayOrders.length,
        todayRevenue
      },
      store: store ? {
        name: store.name,
        description: store.description,
        isActive: store.isActive
      } : null
    };
  } else {
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    const orders = await Order.find({ buyer: userId }).select('status totalAmount createdAt').sort({ createdAt: -1 }).limit(10);
    
    contextData.customer = {
      cartItems: cart?.items?.length || 0,
      orderCount: orders.length
    };
  }
  
  return contextData;
}

function analyzeQuery(query, systemData, currentUserType) {
  const lowerQuery = query.toLowerCase().trim();
  const canonicalQuery = lowerQuery
    .replace(/\bvaction\b/g, 'vacation')
    .replace(/\bvaciton\b/g, 'vacation')
    .replace(/\bvication\b/g, 'vacation')
    .replace(/\bordr\b/g, 'order');
  const matches = (pattern) => pattern.test(canonicalQuery);
  
  const analysis = {
    intent: null,
    entities: [],
    topic: null,
    needsData: false,
    dataPoints: [],
    language: matches(/urdu|اردو/) ? 'urdu' : 
               matches(/english/) ? 'english' : null
  };

  if (matches(/switch|change\s+mode/)) {
    analysis.intent = 'switch_mode';
    return analysis;
  }

  if (matches(/password|pass\s*word/)) {
    analysis.intent = 'password_help';
    analysis.topic = 'password_management';
    if (matches(/change|reset|update/)) {
      analysis.entities.push('change_password');
    } else if (matches(/forgot|bhool|yaad\s+nahi/)) {
      analysis.entities.push('forgot_password');
    }
    return analysis;
  }

  if (matches(/profile|personal\s+info|my\s+info/)) {
    analysis.intent = 'profile_help';
    analysis.topic = 'profile_management';
    if (matches(/update|change|edit/)) {
      analysis.entities.push('update_profile');
    }
    return analysis;
  }

  if (matches(/vacation|holiday|break|band\s+kar/)) {
    analysis.intent = 'vacation_mode';
    analysis.topic = 'seller_settings';
    analysis.entities.push('vacation_mode');
    return analysis;
  }

  if (matches(/setting|configuration|preferences/)) {
    analysis.intent = 'settings_help';
    analysis.topic = 'settings';
    if (matches(/vacation/)) {
      analysis.entities.push('vacation_mode');
    }
    return analysis;
  }

  if (matches(/how\s+many|kitne|kitni|count|total/)) {
    analysis.needsData = true;
    
    if (matches(/categor/)) {
      analysis.intent = 'count_query';
      analysis.topic = 'categories';
      analysis.dataPoints.push({
        type: 'categories',
        value: systemData.seller?.categories || [],
        count: systemData.seller?.categoryCount || 0
      });
    } else if (matches(/product|item/)) {
      analysis.intent = 'count_query';
      analysis.topic = 'products';
      analysis.dataPoints.push({
        type: 'products',
        value: systemData.seller?.products || [],
        count: systemData.seller?.productCount || 0
      });
    } else if (matches(/order/)) {
      analysis.intent = 'count_query';
      analysis.topic = 'orders';
      analysis.dataPoints.push({
        type: 'orders',
        value: systemData.seller?.stats || {},
        count: systemData.seller?.stats?.totalOrders || 0
      });
    }
    return analysis;
  }

  if (matches(/revenue|earning|income|kamaye|paise/)) {
    analysis.intent = 'revenue_query';
    analysis.topic = 'earnings';
    analysis.needsData = true;
    analysis.dataPoints.push({
      type: 'revenue',
      value: systemData.seller?.stats?.totalRevenue || 0
    });
    return analysis;
  }

  if (matches(/order/)) {
    analysis.intent = 'order_query';
    analysis.topic = 'orders';
    analysis.needsData = true;
    return analysis;
  }

  if (matches(/product/)) {
    analysis.intent = 'product_query';
    analysis.topic = 'products';
    analysis.needsData = true;
    return analysis;
  }

  if (matches(/cart|basket/)) {
    analysis.intent = 'cart_query';
    analysis.topic = 'cart';
    analysis.needsData = true;
    return analysis;
  }

  if (matches(/hello|hi|hey|salam|assalam/)) {
    analysis.intent = 'greeting';
    return analysis;
  }

  if (canonicalQuery.includes('?')) {
    analysis.intent = 'general_question';
  } else {
    analysis.intent = 'general_statement';
  }

  return analysis;
}

async function generateResponse(query, analysis, systemData, lang) {
  if (!isSecureQuery(query)) {
    return lang === 'urdu'
      ? "Maaf kijiye, lekin main is sawal ka jawab nahi de sakta. Meherbani karke sirf e-commerce platform se related sawaal poochen."
      : "I'm sorry, but I cannot assist with that query. Please ask questions related to our e-commerce platform services only.";
  }

  if (analysis.language) {
    return analysis.language === 'urdu'
      ? "Main ab Urdu mein baat karunga. Aap mujhse kuch bhi pooch sakte hain!"
      : "I will now respond in English. How can I help you?";
  }

  if (analysis.intent === 'switch_mode') {
    return lang === 'urdu'
      ? "Zaroor! Meherbani karke apna role dobara select karein - Seller ya Customer?"
      : "Sure! Please choose your role again - Seller or Customer?";
  }

  if (analysis.intent === 'greeting') {
    return lang === 'urdu'
      ? `Assalam o Alaikum ${systemData.user.name}! Main aapki kaise madad kar sakta hoon?`
      : `Hello ${systemData.user.name}! How can I assist you today?`;
  }

  if (analysis.intent === 'password_help') {
    if (analysis.entities.includes('forgot_password')) {
      return lang === 'urdu'
        ? `Agar aap password bhool gaye hain, toh ye steps follow karein:\n\n1. Login page par jaayen\n2. 'Forgot Password' link par click karein\n3. Apna registered email address enter karein\n4. Email check karein - aapko password reset link milega\n5. Link par click karke naya password set karein\n6. Naye password se login karein\n\nEmail nahi aa raha? Spam folder check karein ya 5-10 minutes wait karein.`
        : `If you forgot your password, follow these steps:\n\n1. Go to the login page\n2. Click on 'Forgot Password' link\n3. Enter your registered email address\n4. Check your email - you'll receive a password reset link\n5. Click the link and set a new password\n6. Login with your new password\n\nEmail not received? Check spam folder or wait 5-10 minutes.`;
    }
    
    return lang === 'urdu'
      ? `Password change karne ke liye:\n\n1. Dashboard ke top-right corner mein apne profile icon par click karein\n2. 'Profile Settings' ya 'Account Settings' select karein\n3. 'Security' section mein jaayen\n4. Current password enter karein\n5. Naya password enter karein (minimum 8 characters)\n6. Password confirm karein\n7. 'Save Changes' button click karein\n\nPassword strong hona chahiye - letters, numbers aur special characters ka mix use karein.`
      : `To change your password:\n\n1. Click your profile icon in the top-right corner\n2. Select 'Profile Settings' or 'Account Settings'\n3. Go to 'Security' section\n4. Enter your current password\n5. Enter new password (minimum 8 characters)\n6. Confirm the password\n7. Click 'Save Changes'\n\nMake your password strong - use a mix of letters, numbers, and special characters.`;
  }

  if (analysis.intent === 'profile_help') {
    return lang === 'urdu'
      ? `Profile update karne ke liye:\n\n1. Dashboard mein profile icon par click karein\n2. 'Profile Settings' option select karein\n3. Ye fields update kar sakte hain:\n   • Name aur personal details\n   • Email address\n   • Phone number\n   • Profile picture upload\n   • Bio/About section\n   • Address information\n\n${systemData.user.role === 'seller' ? '\nSeller ke liye additional options:\n   • Business name aur description\n   • Store logo\n   • Business documents\n   • Bank account details\n   • Tax information' : ''}\n\n4. Changes save karne ke liye 'Save' button click karein\n\nKisi specific field ko update karne mein problem aa rahi hai?`
      : `To update your profile:\n\n1. Click on profile icon in dashboard\n2. Select 'Profile Settings'\n3. You can update these fields:\n   • Name and personal details\n   • Email address\n   • Phone number\n   • Upload profile picture\n   • Bio/About section\n   • Address information\n\n${systemData.user.role === 'seller' ? '\nAdditional options for sellers:\n   • Business name and description\n   • Store logo\n   • Business documents\n   • Bank account details\n   • Tax information' : ''}\n\n4. Click 'Save' to save changes\n\nHaving trouble updating any specific field?`;
  }

  if (analysis.intent === 'vacation_mode') {
    return lang === 'urdu'
      ? `Vacation Mode ek feature hai jo sellers ke liye hai. Isse aap apni shop temporarily band kar sakte hain.\n\n**Vacation Mode kya karta hai:**\n• Aapki shop temporarily inactive ho jati hai\n• Customers products dekh sakte hain lekin order nahi kar sakte\n• Aapke existing orders affected nahi hote\n• Aap vacation message set kar sakte hain\n\n**Kaise enable karein:**\n1. Seller Dashboard mein jaayen\n2. 'Settings' ya 'Store Settings' par click karein\n3. 'Vacation Mode' section dhundein\n4. Toggle switch ON karein\n5. Vacation dates select karein (optional)\n6. Custom message likhein customers ke liye\n7. 'Save Settings' click karein\n\n**Kab use karein:**\n• Jab aap travel par ja rahe hain\n• Personal emergency\n• Inventory restock ke time\n• Shop maintenance ke liye\n\nVacation mode automatically disable bhi ho sakta hai agar aapne end date set ki hai.`
      : `Vacation Mode is a feature for sellers that lets you temporarily pause your shop.\n\n**What Vacation Mode does:**\n• Your shop becomes temporarily inactive\n• Customers can view products but cannot place orders\n• Your existing orders are not affected\n• You can set a custom vacation message\n\n**How to enable:**\n1. Go to Seller Dashboard\n2. Click on 'Settings' or 'Store Settings'\n3. Find 'Vacation Mode' section\n4. Turn the toggle switch ON\n5. Select vacation dates (optional)\n6. Write a custom message for customers\n7. Click 'Save Settings'\n\n**When to use:**\n• When traveling\n• Personal emergency\n• Inventory restocking time\n• Shop maintenance\n\nVacation mode can auto-disable if you set an end date.`;
  }

  if (analysis.intent === 'settings_help') {
    if (analysis.entities.includes('vacation_mode')) {
      return generateResponse(query, { ...analysis, intent: 'vacation_mode' }, systemData, lang);
    }
    
    return lang === 'urdu'
      ? `Settings mein aap ye sab manage kar sakte hain:\n\n**Account Settings:**\n• Profile information\n• Password change\n• Email preferences\n• Notification settings\n\n**Seller Settings (agar seller hain):**\n• Store information\n• Business details\n• Vacation Mode\n• Shipping options\n• Payment methods\n• Tax settings\n\n**Privacy Settings:**\n• Data privacy\n• Account visibility\n• Communication preferences\n\nKis setting ke baare mein janna chahte hain?`
      : `In Settings, you can manage:\n\n**Account Settings:**\n• Profile information\n• Password change\n• Email preferences\n• Notification settings\n\n**Seller Settings (if you're a seller):**\n• Store information\n• Business details\n• Vacation Mode\n• Shipping options\n• Payment methods\n• Tax settings\n\n**Privacy Settings:**\n• Data privacy\n• Account visibility\n• Communication preferences\n\nWhich setting would you like to know about?`;
  }

  if (analysis.intent === 'count_query' && analysis.needsData) {
    const dataPoint = analysis.dataPoints[0];
    
    if (analysis.topic === 'categories') {
      if (dataPoint.count === 0) {
        return lang === 'urdu'
          ? "Abhi aapke dashboard mein koi category nahi hai. Jab aap products add karenge with different categories, tab automatically categories create ho jayengi. Har product ko ek category assign karni hoti hai jaise Electronics, Clothing, Books, etc."
          : "You currently have no categories in your dashboard. When you add products with different categories, they will be created automatically. Each product needs to be assigned a category like Electronics, Clothing, Books, etc.";
      }
      
      const categoryList = dataPoint.value.join(', ');
      return lang === 'urdu'
        ? `Aapke dashboard mein ${dataPoint.count} ${dataPoint.count === 1 ? 'category hai' : 'categories hain'}: ${categoryList}\n\nHar category mein different products hain jo aap manage kar sakte hain. Categories se customers ko products dhundne mein asaani hoti hai.`
        : `You have ${dataPoint.count} ${dataPoint.count === 1 ? 'category' : 'categories'} in your dashboard: ${categoryList}\n\nEach category contains different products that you can manage. Categories help customers find products easily.`;
    }
    
    if (analysis.topic === 'products') {
      if (dataPoint.count === 0) {
        return lang === 'urdu'
          ? "Aapke inventory mein abhi koi product nahi hai.\n\nProduct add karne ke liye:\n1. Dashboard > Products > Add New Product\n2. Product details fill karein (title, description, price)\n3. Category select karein\n4. Images upload karein\n5. Stock quantity set karein\n6. 'Publish' button click karein\n\nPehla product add karne ke baad aap easily aur products add kar sakte hain!"
          : "You currently have no products in your inventory.\n\nTo add products:\n1. Dashboard > Products > Add New Product\n2. Fill product details (title, description, price)\n3. Select category\n4. Upload images\n5. Set stock quantity\n6. Click 'Publish'\n\nAfter adding your first product, you can easily add more!";
      }
      
      return lang === 'urdu'
        ? `Aapke inventory mein total ${dataPoint.count} ${dataPoint.count === 1 ? 'product hai' : 'products hain'}.\n\nAap Dashboard > Products section mein jaakar:\n• Products ki list dekh sakte hain\n• Prices update kar sakte hain\n• Stock levels manage kar sakte hain\n• Naye products add kar sakte hain\n• Products edit ya delete kar sakte hain\n\nKya kisi specific product ke baare mein madad chahiye?`
        : `You have a total of ${dataPoint.count} ${dataPoint.count === 1 ? 'product' : 'products'} in your inventory.\n\nIn Dashboard > Products section, you can:\n• View product list\n• Update prices\n• Manage stock levels\n• Add new products\n• Edit or delete products\n\nNeed help with any specific product?`;
    }
    
    if (analysis.topic === 'orders') {
      if (dataPoint.count === 0) {
        return lang === 'urdu'
          ? "Abhi tak koi order nahi aaya hai. Jab customers aapke products order karenge, tab orders Dashboard > Orders section mein dikhai denge.\n\nOrders increase karne ke liye:\n• Quality products add karein\n• Competitive prices set karein\n• Clear product descriptions likhein\n• Good quality images use karein\n• Fast shipping offer karein"
          : "You haven't received any orders yet. When customers order your products, they will appear in Dashboard > Orders section.\n\nTo increase orders:\n• Add quality products\n• Set competitive prices\n• Write clear product descriptions\n• Use good quality images\n• Offer fast shipping";
      }
      
      const stats = dataPoint.value;
      return lang === 'urdu'
        ? `Aapke paas total ${dataPoint.count} orders hain:\n\n• Pending: ${stats.pendingOrders} orders (process karne hain)\n• Completed: ${stats.completedOrders} orders\n${stats.todayOrders > 0 ? `• Aaj ke orders: ${stats.todayOrders}` : ''}\n\nDashboard > Orders mein jaakar:\n• Order details dekh sakte hain\n• Order status update kar sakte hain\n• Shipping information add kar sakte hain\n• Customer se communicate kar sakte hain`
        : `You have a total of ${dataPoint.count} orders:\n\n• Pending: ${stats.pendingOrders} orders (need processing)\n• Completed: ${stats.completedOrders} orders\n${stats.todayOrders > 0 ? `• Today's orders: ${stats.todayOrders}` : ''}\n\nIn Dashboard > Orders, you can:\n• View order details\n• Update order status\n• Add shipping information\n• Communicate with customers`;
    }
  }

  if (analysis.intent === 'revenue_query' && analysis.needsData) {
    const revenue = analysis.dataPoints[0].value;
    
    if (revenue === 0) {
      return lang === 'urdu'
        ? "Abhi tak koi revenue generate nahi hui hai. Jab aapke products sell honge aur orders complete honge, tab earnings Dashboard > Earnings section mein dikhegi.\n\nRevenue generate karne ke liye:\n• Products add karein\n• Competitive pricing set karein\n• Marketing karein\n• Customer service improve karein"
        : "No revenue has been generated yet. When your products sell and orders are completed, earnings will appear in Dashboard > Earnings section.\n\nTo generate revenue:\n• Add products\n• Set competitive pricing\n• Do marketing\n• Improve customer service";
    }
    
    const stats = systemData.seller.stats;
    return lang === 'urdu'
      ? `Aapki total revenue Rs. ${revenue.toLocaleString()} hai.\n\n**Revenue Breakdown:**\n• Total Orders: ${stats.totalOrders}\n• Completed Orders: ${stats.completedOrders}\n${stats.todayRevenue > 0 ? `• Aaj ki Revenue: Rs. ${stats.todayRevenue.toLocaleString()}` : ''}\n\n**Earnings Details:**\nDashboard > Earnings mein jaakar:\n• Detailed revenue breakdown dekhein\n• Payout history check karein\n• Bank account details manage karein\n• Tax information dekhein\n\nPayouts weekly process hote hain.`
      : `Your total revenue is Rs. ${revenue.toLocaleString()}.\n\n**Revenue Breakdown:**\n• Total Orders: ${stats.totalOrders}\n• Completed Orders: ${stats.completedOrders}\n${stats.todayRevenue > 0 ? `• Today's Revenue: Rs. ${stats.todayRevenue.toLocaleString()}` : ''}\n\n**Earnings Details:**\nIn Dashboard > Earnings, you can:\n• View detailed revenue breakdown\n• Check payout history\n• Manage bank account details\n• View tax information\n\nPayouts are processed weekly.`;
  }

  if (analysis.intent === 'cart_query') {
    const cartCount = systemData.customer?.cartItems || 0;
    
    if (cartCount === 0) {
      return lang === 'urdu'
        ? "Aapki cart abhi empty hai.\n\nCart mein items add karne ke liye:\n1. Products browse karein\n2. Pasand ka product select karein\n3. 'Add to Cart' button click karein\n4. Quantity select karein\n5. Cart icon par click karke items dekh sakte hain\n\nCart mein items add karne ke baad checkout kar sakte hain."
        : "Your cart is currently empty.\n\nTo add items to cart:\n1. Browse products\n2. Select a product you like\n3. Click 'Add to Cart' button\n4. Select quantity\n5. Click cart icon to view items\n\nAfter adding items, you can proceed to checkout.";
    }
    
    return lang === 'urdu'
      ? `Aapki cart mein ${cartCount} ${cartCount === 1 ? 'item hai' : 'items hain'}.\n\nAap ye kar sakte hain:\n• Cart page par jaakar items dekh sakte hain\n• Quantity update kar sakte hain\n• Items remove kar sakte hain\n• Discount code apply kar sakte hain\n• Checkout proceed kar sakte hain\n\nCheckout karne ke liye cart icon par click karein aur 'Proceed to Checkout' button use karein.`
      : `You have ${cartCount} ${cartCount === 1 ? 'item' : 'items'} in your cart.\n\nYou can:\n• View items on cart page\n• Update quantities\n• Remove items\n• Apply discount codes\n• Proceed to checkout\n\nTo checkout, click cart icon and use 'Proceed to Checkout' button.`;
  }

  return lang === 'urdu'
    ? `Main aapki madad karne ki koshish kar raha hoon. Kya aap thoda aur detail mein bata sakte hain?\n\nMain in cheezon mein madad kar sakta hoon:\n• Products aur inventory\n• Orders management\n• Payments aur earnings\n• Profile aur settings\n• Password change\n• Vacation mode\n\nKya aap kisi specific cheez ke baare mein janna chahte hain?`
    : `I'm trying to help you. Could you provide more details?\n\nI can help with:\n• Products and inventory\n• Orders management\n• Payments and earnings\n• Profile and settings\n• Password change\n• Vacation mode\n\nWould you like to know about something specific?`;
}
