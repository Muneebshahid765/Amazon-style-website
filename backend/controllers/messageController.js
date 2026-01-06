import Message from '../models/Message.js';
import Order from '../models/Order.js';

const sendMessage = async (req, res, next) => {
  try {
    const { orderId, message, attachments } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to send message for this order' });
    }

    const newMessage = await Message.create({
      order: orderId,
      sender: req.user._id,
      senderRole: req.user.role,
      message,
      attachments: attachments || [],
    });

    const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'firstName lastName email');

    res.status(201).json({ message: populatedMessage });
  } catch (error) {
    next(error);
  }
};

const getOrderMessages = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view messages for this order' });
    }

    const messages = await Message.find({ order: orderId })
      .sort('createdAt')
      .populate('sender', 'firstName lastName email role');

    res.json({ messages });
  } catch (error) {
    next(error);
  }
};

const markMessageAsRead = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (!message.readBy.includes(req.user._id)) {
      message.readBy.push(req.user._id);
      message.readAt = new Date();
      await message.save();
    }

    res.json({ message });
  } catch (error) {
    next(error);
  }
};

export { sendMessage, getOrderMessages, markMessageAsRead };
