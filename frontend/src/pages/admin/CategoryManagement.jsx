import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Layers, Sparkles, Edit } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', group: 'Personal', description: '', icon: 'Calendar' });
  const { success, error } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/categories');
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (cat = null) => {
    if (cat) {
      setEditingCategory(cat);
      setFormData({
        name: cat.name,
        group: cat.group || 'Personal',
        description: cat.description || '',
        icon: cat.icon || 'Calendar'
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', group: 'Personal', description: '', icon: 'Calendar' });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.put(`/admin/categories/${editingCategory._id}`, formData);
        success('Category updated successfully');
      } else {
        await api.post('/admin/categories', formData);
        success('Category created successfully');
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event category?')) return;
    try {
      const res = await api.delete(`/admin/categories/${id}`);
      if (res.data.success) {
        success('Category deleted');
        setCategories((prev) => prev.filter((c) => c._id !== id));
      }
    } catch (err) {
      error('Failed to delete category');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Event Categories & Taxonomy
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure system event categories influencing AI planning recommendations
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Category
        </button>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching categories..." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat._id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md bg-indigo-50 text-indigo-700">
                    {cat.group}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenModal(cat)}
                      className="text-slate-400 hover:text-indigo-600 p-1"
                      title="Edit Category"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    {!cat.isDefault && (
                      <button
                        onClick={() => handleDelete(cat._id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-sm text-slate-900">{cat.name}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{cat.description || 'No description'}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Slug: {cat.slug}</span>
                {cat.isDefault && <span className="font-bold text-indigo-600">Built-in</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Modal (Create & Edit) */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? 'Edit Event Category' : 'Add Event Category'}
        subtitle="Define taxonomy for AI recommendations"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Category Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Science Exhibition"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Category Group</label>
            <select
              value={formData.group}
              onChange={(e) => setFormData({ ...formData, group: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Personal">Personal</option>
              <option value="Professional">Professional</option>
              <option value="Educational">Educational</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Sports">Sports</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief summary of events under this category..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              {editingCategory ? 'Save Changes' : 'Save Category'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
