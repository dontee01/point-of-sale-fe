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


        // Modal events

        // Form submission


        // Delete modal events
 

        // Close modals when clicking outside

    }

    async loadCategories() {
        const tableBody = document.getElementById('categoriesTableBody');
    }

    renderCategories() {
        const tableBody = document.getElementById('categoriesTableBody');
    }

    openAddModal() {
        this.currentCategoryId = null;
    }

    openEditModal(categoryId) {
        
    }

    closeModal() {
        document.getElementById('categoryModal').classList.remove('active');
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const form = e.target;

        inventoryManager.showButtonLoading(saveButton);

    }

    openDeleteModal(categoryId) {
        
    }

    closeDeleteModal() {
        document.getElementById('deleteModal').classList.remove('active');
    }

    async confirmDelete() {
        
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