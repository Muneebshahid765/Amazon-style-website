const getItemProductId = (item) => {
  if (!item?.product) return null;
  if (typeof item.product === 'string') return item.product;
  if (item.product._id) return item.product._id.toString();
  if (item.product.toString) return item.product.toString();
  return null;
};

export { getItemProductId };
