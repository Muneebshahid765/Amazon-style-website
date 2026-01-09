import express from 'express';
import { 
  getOrCreateChatSession, 
  getUserContextData,
  sendMessage,
  setUserType,
  updateLanguage,
  clearChatSession
} from '../controllers/chatBotController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/session', getOrCreateChatSession);
router.get('/context', getUserContextData);
router.post('/message', sendMessage);
router.post('/user-type', setUserType);
router.post('/language', updateLanguage);
router.post('/clear', clearChatSession);

export default router;
