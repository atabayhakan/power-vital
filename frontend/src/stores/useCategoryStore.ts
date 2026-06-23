import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '../utils/api';

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconEmoji: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  translations?: any | null;
}

export const useCategoryStore = defineStore('category', () => {
  const categories = ref<Category[]>([]);
  const isLoading = ref(false);

  const fetchCategories = async () => {
    isLoading.value = true;
    try {
      const res = await api.get('/categories');
      categories.value = res.data;
    } catch (error) {
      console.error('Failed to fetch categories', error);
    } finally {
      isLoading.value = false;
    }
  };

  const addCategory = async (name: string, iconEmoji: string | null, imageUrl?: string | null) => {
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const sortOrder = categories.value.length;
      const res = await api.post('/categories', { name, slug, iconEmoji, imageUrl, sortOrder });
      categories.value.push(res.data);
      return res.data as Category;
    } catch (error) {
      console.error('Failed to add category', error);
      throw error;
    }
  };

  const updateCategory = async (id: string, payload: Partial<Category>) => {
    try {
      // Backend Prisma expects undefined (not null) for unset string fields
      const sanitized: Record<string, any> = {};
      for (const [k, v] of Object.entries(payload)) {
        if (v !== null) sanitized[k] = v;
      }
      const res = await api.put(`/categories/${id}`, sanitized);
      // Replace local state with backend response
      const idx = categories.value.findIndex(c => c.id === id);
      if (idx !== -1) categories.value[idx] = res.data;
      return res.data as Category;
    } catch (error) {
      console.error('Failed to update category', error);
      throw error;
    }
  };

  const toggleVisibility = async (id: string) => {
    const cat = categories.value.find(c => c.id === id);
    if (cat) {
      const newStatus = !cat.isActive;
      cat.isActive = newStatus; // optimistic update
      try {
        await api.put(`/categories/${id}`, { isActive: newStatus });
      } catch (e) {
        cat.isActive = !newStatus; // revert
      }
    }
  };

  const moveCategory = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const temp = categories.value[index];
      categories.value[index] = categories.value[index - 1];
      categories.value[index - 1] = temp;
    } else if (direction === 'down' && index < categories.value.length - 1) {
      const temp = categories.value[index];
      categories.value[index] = categories.value[index + 1];
      categories.value[index + 1] = temp;
    }
    
    // Update sortOrder locally
    categories.value.forEach((cat, idx) => {
      cat.sortOrder = idx;
    });

    // Send updates to backend
    // In a real app we'd do a bulk update, but for now we'll just update the two swapped items
    try {
      const item1 = categories.value[index];
      const item2 = direction === 'up' ? categories.value[index - 1] : categories.value[index + 1];
      
      if (item1) await api.put(`/categories/${item1.id}`, { sortOrder: item1.sortOrder });
      if (item2) await api.put(`/categories/${item2.id}`, { sortOrder: item2.sortOrder });
    } catch (e) {
      console.error('Failed to update sort order', e);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await api.delete(`/categories/${id}`);
      categories.value = categories.value.filter(c => c.id !== id);
    } catch (e) {
      console.error('Failed to delete category', e);
    }
  };

  const visibleCategories = computed(() => {
    return categories.value.filter(c => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  });

  return {
    categories,
    visibleCategories,
    isLoading,
    fetchCategories,
    addCategory,
    updateCategory,
    toggleVisibility,
    moveCategory,
    deleteCategory
  };
});

