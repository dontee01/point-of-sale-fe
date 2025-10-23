// Categories Management JavaScript
class CategoriesManager {
    constructor() {
        this.categories = [];
        this.currentCategoryId = null;
        this.init();
    }

    init() {
        this.loadCategories();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add category button
        document.getElementById('addCategoryBtn').addEventListener('click', () => {
            this.openAddModal();
        });

        // Modal events
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeModal();
        });

        // Form submission
        document.getElementById('categoryForm').addEventListener('submit', (e) => {
            this.handleFormSubmit(e);
        });

        // Delete modal events
        document.getElementById('closeDeleteModal').addEventListener('click', () => {
            this.closeDeleteModal();
        });

        document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
            this.closeDeleteModal();
        });

        document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
            this.confirmDelete();
        });

        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
                this.closeDeleteModal();
            }
        });
    }

    async loadCategories() {
        const tableBody = document.getElementById('categoriesTableBody');
        
        try {
            const result = await inventoryManager.apiRequest('/categories');
            
            if (result.success) {
                this.categories = result.data;
                this.renderCategories();
            } else {
                throw new Error(result.message || 'Failed to load categories');
            }
        } catch (error) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-exclamation-circle"></i>
                            <p>Failed to load categories: ${error.message}</p>
                            <button class="btn btn-primary" onclick="categoriesManager.loadCategories()">
                                <i class="fas fa-redo"></i> Try Again
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    renderCategories() {
        const tableBody = document.getElementById('categoriesTableBody');
        
        if (this.categories.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-folder-open"></i>
                            <p>No categories found</p>
                            <p>Get started by creating your first category</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = this.categories.map(category => `
            <tr>
                <td>
                    <strong>${this.escapeHtml(category.name)}</strong>
                </td>
                <td>${this.escapeHtml(category.description || 'No description')}</td>
                <td>${category.products_count || 0}</td>
                <td>
                    <span class="status-badge status-${category.status || 'active'}">
                        ${category.status || 'active'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-edit" onclick="categoriesManager.openEditModal(${category.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-delete" onclick="categoriesManager.openDeleteModal(${category.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    openAddModal() {
        this.currentCategoryId = null;
        document.getElementById('modalTitle').textContent = 'Add New Category';
        document.getElementById('categoryForm').reset();
        document.getElementById('categoryId').value = '';
        document.getElementById('categoryStatus').value = 1;
        document.getElementById('nameError').textContent = '';
        document.getElementById('categoryModal').classList.add('active');
    }

    openEditModal(categoryId) {
        const category = this.categories.find(cat => cat.id === categoryId);
        if (!category) return;

        this.currentCategoryId = categoryId;
        document.getElementById('modalTitle').textContent = 'Edit Category';
        document.getElementById('categoryId').value = category.id;
        document.getElementById('categoryName').value = category.name;
        document.getElementById('categoryDescription').value = category.description || '';
        document.getElementById('categoryStatus').value = category.status || 'active';
        document.getElementById('nameError').textContent = '';
        document.getElementById('categoryModal').classList.add('active');
    }

    closeModal() {
        document.getElementById('categoryModal').classList.remove('active');
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const saveButton = document.getElementById('saveCategoryBtn');
        const categoryId = document.getElementById('categoryId').value;
        const categoryData = {
            name: document.getElementById('categoryName').value.trim(),
            description: document.getElementById('categoryDescription').value.trim(),
            status: document.getElementById('categoryStatus').value
        };

        // Validation
        if (!categoryData.name) {
            document.getElementById('nameError').textContent = 'Category name is required';
            return;
        }

        inventoryManager.showButtonLoading(saveButton);

        try {
            let result;
            if (categoryId) {
                // Update existing category
                result = await inventoryManager.apiRequest(`/categories/${categoryId}`, {
                    method: 'PUT',
                    body: JSON.stringify(categoryData)
                });
            } else {
                // Create new category
                result = await inventoryManager.apiRequest('/categories', {
                    method: 'POST',
                    body: JSON.stringify(categoryData)
                });
            }

            if (result.success) {
                inventoryManager.showNotification(
                    `Category ${categoryId ? 'updated' : 'created'} successfully!`,
                    'success'
                );
                this.closeModal();
                this.loadCategories(); // Reload the categories list
            } else {
                throw new Error(result.message || `Failed to ${categoryId ? 'update' : 'create'} category`);
            }
        } catch (error) {
            inventoryManager.showNotification(error.message, 'error');
        } finally {
            inventoryManager.hideButtonLoading(saveButton);
        }
    }

    openDeleteModal(categoryId) {
        const category = this.categories.find(cat => cat.id === categoryId);
        if (!category) return;

        this.currentCategoryId = categoryId;
        document.getElementById('deleteCategoryName').textContent = category.name;
        document.getElementById('deleteModal').classList.add('active');
    }

    closeDeleteModal() {
        document.getElementById('deleteModal').classList.remove('active');
    }

    async confirmDelete() {
        const deleteButton = document.getElementById('confirmDeleteBtn');
        inventoryManager.showButtonLoading(deleteButton);

        try {
            const result = await inventoryManager.apiRequest(`/categories/${this.currentCategoryId}`, {
                method: 'DELETE'
            });

            if (result.success) {
                inventoryManager.showNotification('Category deleted successfully!', 'success');
                this.closeDeleteModal();
                this.loadCategories(); // Reload the categories list
            } else {
                throw new Error(result.message || 'Failed to delete category');
            }
        } catch (error) {
            inventoryManager.showNotification(error.message, 'error');
        } finally {
            inventoryManager.hideButtonLoading(deleteButton);
        }
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Initialize categories manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.categoriesManager = new CategoriesManager();
});