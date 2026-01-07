import mongoose from 'mongoose';
import slugify from 'slugify';
import streamifier from 'streamifier';
import { cloudinary } from '../config/cloudinary.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

const resolveCategoryValue = async (rawValue) => {
  if (!rawValue) return null;
  const normalizedSlug = slugify(String(rawValue), { lower: true, strict: true });

  let categoryDoc = await Category.findOne({
    $or: [{ slug: normalizedSlug }, { name: new RegExp(`^${rawValue}$`, 'i') }],
  });

  if (!categoryDoc) {
    let slugCandidate = normalizedSlug || `category-${Date.now()}`;
    let counter = 1;
    while (await Category.exists({ slug: slugCandidate })) {
      slugCandidate = `${normalizedSlug}-${counter++}`;
    }

    categoryDoc = await Category.create({
      name: rawValue,
      slug: slugCandidate,
    });
  }

  return categoryDoc._id;
};

export const mapCategoryField = async (data, fieldName) => {
  if (!data[fieldName]) return;
  const currentValue = data[fieldName];
  const isValidId = mongoose.Types.ObjectId.isValid(currentValue);
  if (isValidId) return;

  const resolvedId = await resolveCategoryValue(currentValue);
  if (resolvedId) {
    data[fieldName] = resolvedId;
  } else {
    delete data[fieldName];
  }
};

export const parseExistingImages = (input) => {
  if (input === undefined || input === null) return null;
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return Array.isArray(parsed) ? parsed : null;
    } catch (error) {
      return null;
    }
  }
  return Array.isArray(input) ? input : null;
};

export const uploadProductImages = async (files = []) => {
  if (!files.length || !cloudinary?.uploader) return [];

  const uploadOptions = {
    folder: 'novamart/products',
    transformation: [
      { width: 800, height: 800, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  };

  return Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
            if (error) reject(error);
            else
              resolve({
                public_id: result.public_id,
                url: result.secure_url,
                alt: file.originalname,
              });
          });

          streamifier.createReadStream(file.buffer).pipe(uploadStream);
        })
    )
  );
};

export const ensureUniqueSlug = async (title, providedSlug) => {
  if (!title && !providedSlug) {
    throw new Error('Product title or slug is required');
  }

  const baseSlug = slugify(providedSlug || title, { lower: true, strict: true });
  let uniqueSlug = baseSlug || `product-${Date.now()}`;
  let counter = 1;

  while (await Product.exists({ slug: uniqueSlug })) {
    uniqueSlug = `${baseSlug}-${counter++}`;
  }

  return uniqueSlug;
};

export const normalizeNumericFields = (data, fields = []) => {
  fields.forEach((field) => {
    if (data[field] !== undefined && data[field] !== '') {
      data[field] = Number(data[field]);
    }
  });
};
