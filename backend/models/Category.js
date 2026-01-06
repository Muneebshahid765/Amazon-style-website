import mongoose from 'mongoose';

const { Schema } = mongoose;

const categorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, trim: true },
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    ancestors: [
      {
        _id: { type: Schema.Types.ObjectId, ref: 'Category' },
        name: String,
        slug: String,
      },
    ],
    image: {
      public_id: String,
      url: String,
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

categorySchema.index({ parent: 1 });
categorySchema.index({ slug: 1 }, { unique: true });

categorySchema.pre('save', async function buildAncestors(next) {
  if (!this.parent) {
    this.ancestors = [];
    return next();
  }

  const parentCategory = await this.constructor.findById(this.parent).select('name slug ancestors');
  if (!parentCategory) {
    return next(new Error('Parent category not found'));
  }

  this.ancestors = [
    ...parentCategory.ancestors,
    { _id: parentCategory._id, name: parentCategory.name, slug: parentCategory.slug },
  ];
  next();
});

const Category = mongoose.model('Category', categorySchema);

export default Category;
