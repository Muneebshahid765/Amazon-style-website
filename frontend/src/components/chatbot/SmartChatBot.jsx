import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import './ChatBot.css';

const SmartChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [userType, setUserType] = useState(null);
  const [language, setLanguage] = useState('english');
  const [isStorageFull, setIsStorageFull] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const messagesEndRef = useRef(null);

  const authUser = useSelector((state) => state.auth.user);
  const sellerData = useSelector((state) => state.seller || {});
  const products = useSelector((state) => state.product?.productList?.products || []);
  const cart = useSelector((state) => state.cart?.items || []);

  const STORAGE_KEY = 'ecommerce_chatbot_data';
  const MAX_STORAGE_SIZE = 4.5 * 1024 * 1024;
  const AUTO_DELETE_TIME = 2 * 60 * 60 * 1000;

  useEffect(() => {
    loadChatHistory();
    checkStorageSize();
    setupAutoCleanup();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const now = Date.now();
        
        if (now - data.timestamp < AUTO_DELETE_TIME) {
          setMessages(data.messages);
          setUserType(data.userType);
          setLanguage(data.language || 'english');
          setConversationHistory(data.history || []);
        } else {
          localStorage.removeItem(STORAGE_KEY);
          initializeChat();
        }
      } else {
        initializeChat();
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      initializeChat();
    }
  };

  const initializeChat = () => {
    const welcomeMessage = {
      id: Date.now(),
      text: "Hello! I'm your intelligent assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMessage]);
    setConversationHistory([]);
  };

  const setupAutoCleanup = () => {
    const interval = setInterval(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const now = Date.now();
        
        if (now - data.timestamp >= AUTO_DELETE_TIME) {
          localStorage.removeItem(STORAGE_KEY);
          initializeChat();
          setUserType(null);
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  };

  const checkStorageSize = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const size = new Blob([stored]).size;
        setIsStorageFull(size >= MAX_STORAGE_SIZE);
      }
    } catch (error) {
      console.error('Storage check error:', error);
    }
  };

  const saveChatHistory = (newMessages, type, lang, history) => {
    try {
      const data = {
        messages: newMessages,
        userType: type,
        language: lang,
        history: history,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      checkStorageSize();
    } catch (error) {
      console.error('Error saving chat:', error);
      setIsStorageFull(true);
    }
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
      /\.env/i, /config\s+file/i, /source\s+code/i, /git\s+credentials/i
    ];
    return !maliciousPatterns.some(pattern => pattern.test(query));
  };

  const extractSystemData = () => {
    const categories = new Set();
    let productsList = [];
    
    if (Array.isArray(sellerData?.products)) {
      productsList = sellerData.products;
    } else if (sellerData?.products?.products && Array.isArray(sellerData.products.products)) {
      productsList = sellerData.products.products;
    }
    
    productsList.forEach(product => {
      if (product.category) categories.add(product.category);
    });
    
    if (sellerData?.categories && Array.isArray(sellerData.categories)) {
      sellerData.categories.forEach(cat => {
        if (typeof cat === 'string') categories.add(cat);
        else if (cat.name) categories.add(cat.name);
      });
    }

    const stats = sellerData?.dashboardStats || {};
    
    return {
      user: {
        name: authUser?.name || authUser?.firstName || 'User',
        role: authUser?.role || 'customer',
        email: authUser?.email
      },
      seller: {
        products: productsList,
        productCount: productsList.length,
        categories: Array.from(categories),
        categoryCount: categories.size,
        stats: {
          totalOrders: stats.totalOrders || 0,
          pendingOrders: stats.pendingOrders || 0,
          completedOrders: stats.completedOrders || 0,
          totalRevenue: stats.totalRevenue || stats.revenue || 0,
          todayOrders: stats.todayOrders || 0,
          todayRevenue: stats.todayRevenue || 0
        },
        store: sellerData?.store || null
      },
      customer: {
        cartItems: cart?.length || 0,
        products: products
      }
    };
  };

  const analyzeQuery = (query, systemData) => {
    const lowerQuery = query.toLowerCase().trim();
    
    const analysis = {
      intent: null,
      entities: [],
      topic: null,
      needsData: false,
      dataPoints: [],
      language: lowerQuery.match(/urdu|اردو/) ? 'urdu' : 
                 lowerQuery.match(/english/) ? 'english' : null
    };

    if (lowerQuery.match(/switch|change\s+mode/)) {
      analysis.intent = 'switch_mode';
      return analysis;
    }

    if (lowerQuery.match(/password|pass\s*word/)) {
      analysis.intent = 'password_help';
      analysis.topic = 'password_management';
      if (lowerQuery.match(/change|reset|update/)) {
        analysis.entities.push('change_password');
      } else if (lowerQuery.match(/forgot|bhool|yaad\s+nahi/)) {
        analysis.entities.push('forgot_password');
      }
      return analysis;
    }

    if (lowerQuery.match(/profile|personal\s+info|my\s+info/)) {
      analysis.intent = 'profile_help';
      analysis.topic = 'profile_management';
      if (lowerQuery.match(/update|change|edit/)) {
        analysis.entities.push('update_profile');
      }
      return analysis;
    }

    if (lowerQuery.match(/vacation|holiday|break|band\s+kar/)) {
      analysis.intent = 'vacation_mode';
      analysis.topic = 'seller_settings';
      analysis.entities.push('vacation_mode');
      return analysis;
    }

    if (lowerQuery.match(/setting|configuration|preferences/)) {
      analysis.intent = 'settings_help';
      analysis.topic = 'settings';
      if (lowerQuery.match(/vacation/)) {
        analysis.entities.push('vacation_mode');
      }
      return analysis;
    }

    if (lowerQuery.match(/how\s+many|kitne|kitni|count|total/)) {
      analysis.needsData = true;
      
      if (lowerQuery.match(/categor/)) {
        analysis.intent = 'count_query';
        analysis.topic = 'categories';
        analysis.dataPoints.push({
          type: 'categories',
          value: systemData.seller.categories,
          count: systemData.seller.categoryCount
        });
      } else if (lowerQuery.match(/product|item/)) {
        analysis.intent = 'count_query';
        analysis.topic = 'products';
        analysis.dataPoints.push({
          type: 'products',
          value: systemData.seller.products,
          count: systemData.seller.productCount
        });
      } else if (lowerQuery.match(/order/)) {
        analysis.intent = 'count_query';
        analysis.topic = 'orders';
        analysis.dataPoints.push({
          type: 'orders',
          value: systemData.seller.stats,
          count: systemData.seller.stats.totalOrders
        });
      }
      return analysis;
    }

    if (lowerQuery.match(/revenue|earning|income|kamaye|paise/)) {
      analysis.intent = 'revenue_query';
      analysis.topic = 'earnings';
      analysis.needsData = true;
      analysis.dataPoints.push({
        type: 'revenue',
        value: systemData.seller.stats.totalRevenue
      });
      return analysis;
    }

    if (lowerQuery.match(/order/)) {
      analysis.intent = 'order_query';
      analysis.topic = 'orders';
      analysis.needsData = true;
      return analysis;
    }

    if (lowerQuery.match(/product/)) {
      analysis.intent = 'product_query';
      analysis.topic = 'products';
      analysis.needsData = true;
      return analysis;
    }

    if (lowerQuery.match(/cart|basket/)) {
      analysis.intent = 'cart_query';
      analysis.topic = 'cart';
      analysis.needsData = true;
      return analysis;
    }

    if (lowerQuery.match(/hello|hi|hey|salam|assalam/)) {
      analysis.intent = 'greeting';
      return analysis;
    }

    if (lowerQuery.includes('?')) {
      analysis.intent = 'general_question';
    } else {
      analysis.intent = 'general_statement';
    }

    return analysis;
  };

  const generateIntelligentResponse = (query, analysis, systemData, lang) => {
    if (!isSecureQuery(query)) {
      return lang === 'urdu'
        ? "Maaf kijiye, lekin main is sawal ka jawab nahi de sakta. Meherbani karke sirf e-commerce platform se related sawaal poochen."
        : "I'm sorry, but I cannot assist with that query. Please ask questions related to our e-commerce platform services only.";
    }

    if (analysis.language) {
      setLanguage(analysis.language);
      return analysis.language === 'urdu'
        ? "Main ab Urdu mein baat karunga. Aap mujhse kuch bhi pooch sakte hain!"
        : "I will now respond in English. How can I help you?";
    }

    if (analysis.intent === 'switch_mode') {
      setUserType(null);
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
        return generateIntelligentResponse(query, { ...analysis, intent: 'vacation_mode' }, systemData, lang);
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
      const cartCount = systemData.customer.cartItems;
      
      if (cartCount === 0) {
        return lang === 'urdu'
          ? "Aapki cart abhi empty hai.\n\nCart mein items add karne ke liye:\n1. Products browse karein\n2. Pasand ka product select karein\n3. 'Add to Cart' button click karein\n4. Quantity select karein\n5. Cart icon par click karke items dekh sakte hain\n\nCart mein items add karne ke baad checkout kar sakte hain."
          : "Your cart is currently empty.\n\nTo add items to cart:\n1. Browse products\n2. Select a product you like\n3. Click 'Add to Cart' button\n4. Select quantity\n5. Click cart icon to view items\n\nAfter adding items, you can proceed to checkout.";
      }
      
      return lang === 'urdu'
        ? `Aapki cart mein ${cartCount} ${cartCount === 1 ? 'item hai' : 'items hain'}.\n\nAap ye kar sakte hain:\n• Cart page par jaakar items dekh sakte hain\n• Quantity update kar sakte hain\n• Items remove kar sakte hain\n• Discount code apply kar sakte hain\n• Checkout proceed kar sakte hain\n\nCheckout karne ke liye cart icon par click karein aur 'Proceed to Checkout' button use karein.`
        : `You have ${cartCount} ${cartCount === 1 ? 'item' : 'items'} in your cart.\n\nYou can:\n• View items on cart page\n• Update quantities\n• Remove items\n• Apply discount codes\n• Proceed to checkout\n\nTo checkout, click cart icon and use 'Proceed to Checkout' button.`;
    }

    if (!userType) {
      if (query.toLowerCase().match(/seller|freelancer/)) {
        setUserType('seller');
        return lang === 'urdu'
          ? `Khush aamdeed ${systemData.user.name}! Main aapke seller business mein madad karunga. Aap mujhse kuch bhi pooch sakte hain - products, orders, payments, settings, ya kuch bhi.`
          : `Welcome ${systemData.user.name}! I'll help you with your seller business. Ask me anything about products, orders, payments, settings, or anything else.`;
      } else if (query.toLowerCase().match(/customer|buyer|client/)) {
        setUserType('customer');
        return lang === 'urdu'
          ? `Khush aamdeed ${systemData.user.name}! Main aapki shopping mein madad karunga. Products, cart, orders - kuch bhi pooch sakte hain.`
          : `Welcome ${systemData.user.name}! I'll help you with your shopping. Ask me about products, cart, orders - anything!`;
      }
      
      return lang === 'urdu'
        ? `Namaste ${systemData.user.name}! Main aapki madad karne ke liye hazir hoon.\n\nKya aap:\n• Seller hain? (products bechte hain)\n• Customer hain? (products khareedte hain)\n\nMeherbani karke batayen taake main better help kar sakoon.`
        : `Hello ${systemData.user.name}! I'm here to help you.\n\nAre you a:\n• Seller? (selling products)\n• Customer? (buying products)\n\nPlease let me know so I can assist you better.`;
    }

    return lang === 'urdu'
      ? `Main aapki madad karne ki koshish kar raha hoon. Kya aap thoda aur detail mein bata sakte hain?\n\nMain in cheezon mein madad kar sakta hoon:\n• Products aur inventory\n• Orders management\n• Payments aur earnings\n• Profile aur settings\n• Password change\n• Vacation mode\n\nKya aap kisi specific cheez ke baare mein janna chahte hain?`
      : `I'm trying to help you. Could you provide more details?\n\nI can help with:\n• Products and inventory\n• Orders management\n• Payments and earnings\n• Profile and settings\n• Password change\n• Vacation mode\n\nWould you like to know about something specific?`;
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    if (isStorageFull) {
      alert('Chat storage is full. Please wait for automatic cleanup or clear your browser cache.');
      return;
    }

    const userMsg = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    const systemData = extractSystemData();
    const analysis = analyzeQuery(inputMessage, systemData);
    const botResponse = generateIntelligentResponse(inputMessage, analysis, systemData, language);
    
    const botMsg = {
      id: Date.now() + 1,
      text: botResponse,
      sender: 'bot',
      timestamp: new Date().toISOString()
    };

    const newHistory = [
      ...conversationHistory,
      { query: inputMessage, analysis, response: botResponse }
    ].slice(-10);

    const newMessages = [...messages, userMsg, botMsg];
    setMessages(newMessages);
    setConversationHistory(newHistory);
    saveChatHistory(newMessages, userType, language, newHistory);
    setInputMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleUserTypeSelect = (type) => {
    setUserType(type);
    const systemData = extractSystemData();
    
    const userMsg = {
      id: Date.now(),
      text: `I need help as a ${type}`,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    const response = language === 'urdu'
      ? `Khush aamdeed ${systemData.user.name}! Main aapke ${type === 'seller' ? 'business' : 'shopping'} mein madad karunga. Kuch bhi pooch sakte hain!`
      : `Welcome ${systemData.user.name}! I'll help you with your ${type === 'seller' ? 'business' : 'shopping'}. Ask me anything!`;
    
    const botMsg = {
      id: Date.now() + 1,
      text: response,
      sender: 'bot',
      timestamp: new Date().toISOString()
    };

    const newMessages = [...messages, userMsg, botMsg];
    setMessages(newMessages);
    saveChatHistory(newMessages, type, language, conversationHistory);
  };

  return (
    <>
      {!isOpen && (
        <button className="chatbot-toggle" onClick={() => setIsOpen(true)}>
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
              <button onClick={() => {
                const newLang = language === 'english' ? 'urdu' : 'english';
                setLanguage(newLang);
                const msg = {
                  id: Date.now(),
                  text: newLang === 'urdu' ? 'Main ab Urdu mein baat karunga!' : 'I will now respond in English!',
                  sender: 'bot',
                  timestamp: new Date().toISOString()
                };
                const newMessages = [...messages, msg];
                setMessages(newMessages);
                saveChatHistory(newMessages, userType, newLang, conversationHistory);
              }} title={language === 'english' ? 'Switch to Urdu' : 'Switch to English'}>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                  {language === 'english' ? 'اردو' : 'EN'}
                </span>
              </button>
              <button onClick={() => {
                localStorage.removeItem(STORAGE_KEY);
                initializeChat();
                setUserType(null);
                setConversationHistory([]);
              }} title="Refresh">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2"/>
                </svg>
              </button>
              <button onClick={() => setIsOpen(false)} title="Minimize">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M19 12H5"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.sender}`}>
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

            {!userType && messages.length > 0 && (
              <div className="user-type-options">
                <button onClick={() => handleUserTypeSelect('seller')} className="option-btn">
                  {language === 'urdu' ? 'Main seller hoon' : 'I am a seller'}
                </button>
                <button onClick={() => handleUserTypeSelect('customer')} className="option-btn">
                  {language === 'urdu' ? 'Main customer hoon' : 'I am a customer'}
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isStorageFull ? "Storage full" : (language === 'urdu' ? 'Apna sawal likhein...' : 'Type your message...')}
              disabled={isStorageFull}
            />
            <button 
              onClick={handleSendMessage} 
              disabled={!inputMessage.trim() || isStorageFull}
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

export default SmartChatBot;
