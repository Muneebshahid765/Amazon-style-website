class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  search() {
    if (this.queryString.keyword) {
      const keyword = this.queryString.keyword;
      const regex = new RegExp(keyword, 'i');
      this.query = this.query.find({
        $or: [
          { name: regex },
          { description: regex },
          { tags: regex },
          { brand: regex },
        ],
      });
    }
    return this;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excluded = ['keyword', 'page', 'limit', 'sort', 'fields', 'search'];
    excluded.forEach((key) => delete queryObj[key]);

    if (queryObj.category) {
      const categories = Array.isArray(queryObj.category)
        ? queryObj.category
        : queryObj.category.split(',');
      queryObj.category = { $in: categories };
    }

    if (queryObj.brand) {
      const brands = Array.isArray(queryObj.brand) ? queryObj.brand : queryObj.brand.split(',');
      queryObj.brand = { $in: brands };
    }

    if (queryObj.minPrice || queryObj.maxPrice) {
      queryObj.price = {};
      if (queryObj.minPrice) queryObj.price.$gte = Number(queryObj.minPrice);
      if (queryObj.maxPrice) queryObj.price.$lte = Number(queryObj.maxPrice);
      delete queryObj.minPrice;
      delete queryObj.maxPrice;
    }

    if (queryObj.minRating) {
      queryObj.rating = { $gte: Number(queryObj.minRating) };
      delete queryObj.minRating;
    }

    if (queryObj.inStock === 'true') {
      queryObj.stock = { $gt: 0 };
      delete queryObj.inStock;
    }

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt|in)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      let sortBy;
      switch (this.queryString.sort) {
        case 'price-asc':
          sortBy = 'price';
          break;
        case 'price-desc':
          sortBy = '-price';
          break;
        case 'rating':
          sortBy = '-rating';
          break;
        case 'newest':
          sortBy = '-createdAt';
          break;
        case 'popular':
          sortBy = '-views -soldCount';
          break;
        case 'name':
          sortBy = 'name';
          break;
        default:
          sortBy = this.queryString.sort.split(',').join(' ');
      }
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = Number(this.queryString.page) || 1;
    const limit = Number(this.queryString.limit) || 12;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }

  getPage() {
    return Number(this.queryString.page) || 1;
  }

  getLimit() {
    return Number(this.queryString.limit) || 12;
  }
}

export default ApiFeatures;
