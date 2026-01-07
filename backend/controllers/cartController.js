import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

const getItemProductId = (item) => {
  if (!item?.product) return null;
  if (typeof item.product === 'string') return item.product;
  if (item.product._id) return item.product._id.toString();
  if (item.product.toString) return item.product.toString();
  return null;
};

const findOrCreateCart = async (userId, guestId) => {
  const query = userId ? { user: userId } : { guestId };
  
  let cart = await Cart.findOne(query).populate(
    'items.product',
    'title price discountPrice images slug stock'
  );
  
  if (!cart) {
    const cartData = userId ? { user: userId, items: [] } : { guestId, items: [] };
    cart = await Cart.create(cartData);
  }
  return cart;
};

const recalcCart = (cart) => {
  cart.subtotal = cart.items.reduce((acc, item) => {
    const price = item.product?.discountPrice || item.product?.price || item.price;
    return acc + price * item.quantity;
  }, 0);
};

const getCart = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const guestId = req.guestId;
    
    const cart = await findOrCreateCart(userId, guestId);
    recalcCart(cart);
    await cart.save();
    
    const formattedCart = {
      items: cart.items.map(item => ({
        productId: item.product._id,
        title: item.product.title || item.title,
        price: item.product.discountPrice || item.product.price,
        image: item.product.images?.[0]?.url || item.image,
        slug: item.product.slug,
        stock: item.product.stock,
        quantity: item.quantity,
      })),
      subtotal: cart.subtotal,
    };
    
    res.json({ cart: formattedCart });
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    const userId = req.user?._id;
    const guestId = req.guestId;
    const cart = await findOrCreateCart(userId, guestId);
    const existingItem = cart.items.find((item) => getItemProductId(item) === productId);

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (product.stock < newQuantity) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }
      existingItem.quantity = newQuantity;
      existingItem.price = product.discountPrice || product.price;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        price: product.discountPrice || product.price,
        title: product.title,
        image: product.images?.[0]?.url,
      });
    }

    recalcCart(cart);
    await cart.save();
    await cart.populate('items.product', 'title price discountPrice images slug stock');
    
    const formattedCart = {
      items: cart.items.map(item => ({
        productId: item.product._id,
        title: item.product.title || item.title,
        price: item.product.discountPrice || item.product.price,
        image: item.product.images?.[0]?.url || item.image,
        slug: item.product.slug,
        stock: item.product.stock,
        quantity: item.quantity,
      })),
      subtotal: cart.subtotal,
    };
    
    res.status(200).json({ cart: formattedCart });
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    
    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    const userId = req.user?._id;
    const guestId = req.guestId;
    const cart = await findOrCreateCart(userId, guestId);
    const item = cart.items.find((item) => getItemProductId(item) === productId);

    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    item.quantity = quantity;
    item.price = product.discountPrice || product.price;

    recalcCart(cart);
    await cart.save();
    await cart.populate('items.product', 'title price discountPrice images slug stock');
    
    const formattedCart = {
      items: cart.items.map(item => ({
        productId: item.product._id,
        title: item.product.title || item.title,
        price: item.product.discountPrice || item.product.price,
        image: item.product.images?.[0]?.url || item.image,
        slug: item.product.slug,
        stock: item.product.stock,
        quantity: item.quantity,
      })),
      subtotal: cart.subtotal,
    };
    
    res.json({ cart: formattedCart });
  } catch (error) {
    next(error);
  }
};

const removeFromCart = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const guestId = req.guestId;
    const cart = await findOrCreateCart(userId, guestId);
    cart.items = cart.items.filter((item) => getItemProductId(item) !== req.params.productId);
    recalcCart(cart);
    await cart.save();
    await cart.populate('items.product', 'name price discountPrice images slug stock');
    
    const formattedCart = {
      items: cart.items.map(item => ({
        productId: item.product._id,
        name: item.product.name,
        price: item.product.discountPrice || item.product.price,
        image: item.product.images?.[0]?.url,
        slug: item.product.slug,
        stock: item.product.stock,
        quantity: item.quantity,
      })),
      subtotal: cart.subtotal,
    };
    
    res.json({ cart: formattedCart });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const guestId = req.guestId;
    const cart = await findOrCreateCart(userId, guestId);
    cart.items = [];
    recalcCart(cart);
    await cart.save();
    res.json({ cart: { items: [], subtotal: 0 } });
  } catch (error) {
    next(error);
  }
};

export { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
