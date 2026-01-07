import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../../../redux/slices/adminSlice';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiFolder } from 'react-icons/fi';
import styles from './CategoryList.module.css';

const CategoryList = () => {
  const dispatch = useDispatch();
  const { categories, loading, pagination } = useSelector((state) => state.admin);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parent: '',
    isActive: true,
  });

  useEffect(() => {
    dispatch(fetchCategories({ search: searchTerm }));
  }, [dispatch, searchTerm]);

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      parent: '',
      isActive: true,
    });
    setEditingCategory(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const categoryData = {
      ...formData,
      parent: formData.parent || null,
    };

    if (editingCategory) {
      await dispatch(updateCategory({ id: editingCategory._id, ...categoryData }));
    } else {
      await dispatch(createCategory(categoryData));
    }
    setShowModal(false);
    resetForm();
    dispatch(fetchCategories({}));
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug || '',
      description: category.description || '',
      parent: category.parent?._id || '',
      isActive: category.isActive !== false,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      const result = await dispatch(deleteCategory(id));
      if (deleteCategory.rejected.match(result)) {
        alert(result.payload || 'Cannot delete category');
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Category Management</h1>
          <p>Organize your products with categories</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className={styles.addBtn}>
          <FiPlus /> Add Category
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <FiSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading categories...</div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Category</th>
                <th>Slug</th>
                <th>Parent</th>
                <th>Products</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category._id}>
                  <td>
                    <div className={styles.categoryInfo}>
                      <div className={styles.icon}>
                        <FiFolder />
                      </div>
                      <div>
                        <p className={styles.categoryName}>{category.name}</p>
                        {category.description && (
                          <p className={styles.categoryDesc}>{category.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td><code className={styles.slug}>{category.slug}</code></td>
                  <td>{category.parent?.name || '-'}</td>
                  <td>{category.productCount || 0}</td>
                  <td>
                    <span className={`${styles.status} ${category.isActive !== false ? styles.active : styles.inactive}`}>
                      {category.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.actionBtn} onClick={() => handleEdit(category)}>
                        <FiEdit />
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        onClick={() => handleDelete(category._id)}
                        disabled={category.productCount > 0}
                        title={category.productCount > 0 ? 'Cannot delete category with products' : 'Delete'}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan="6" className={styles.empty}>No categories found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Category Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Slug (auto-generated if empty)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="category-slug"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  placeholder="Optional description"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Parent Category</label>
                <select
                  value={formData.parent}
                  onChange={(e) => setFormData({ ...formData, parent: e.target.value })}
                >
                  <option value="">None (Top Level)</option>
                  {categories
                    .filter((c) => c._id !== editingCategory?._id)
                    .map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  Active
                </label>
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryList;
