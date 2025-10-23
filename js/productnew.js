// Products Management JavaScript
class ProductsManager {
    constructor() {
        this.products = [];
        this.categories = [];
        this.currentProductId = null;
        this.init();
    }

    init() {
        this.loadCategories();
        this.loadProducts();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add product button
        const addProductBtn = document.getElementById('addProductBtn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                this.openAddModal();
            });
        }

        // Modal events
        const closeModalBtn = document.getElementById('closeModal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeModal();
            });
        }

        // Form submission
        const productForm = document.getElementById('productForm');
        if (productForm) {
            productForm.addEventListener('submit', (e) => {
                this.handleFormSubmit(e);
            });
        }

        // Delete modal events
        const closeDeleteModalBtn = document.getElementById('closeDeleteModal');
        if (closeDeleteModalBtn) {
            closeDeleteModalBtn.addEventListener('click', () => {
                this.closeDeleteModal();
            });
        }

        const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        if (cancelDeleteBtn) {
            cancelDeleteBtn.addEventListener('click', () => {
                this.closeDeleteModal();
            });
        }

        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => {
                this.confirmDelete();
            });
        }

        // Details modal events
        const closeDetailsModalBtn = document.getElementById('closeDetailsModal');
        if (closeDetailsModalBtn) {
            closeDetailsModalBtn.addEventListener('click', () => {
                this.closeDetailsModal();
            });
        }

        const closeDetailsBtn = document.getElementById('closeDetailsBtn');
        if (closeDetailsBtn) {
            closeDetailsBtn.addEventListener('click', () => {
                this.closeDetailsModal();
            });
        }

        // Filters
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }

        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }

        const searchProducts = document.getElementById('searchProducts');
        if (searchProducts) {
            searchProducts.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Generate SKU automatically when product name changes
        const productNameInput = document.getElementById('productName');
        if (productNameInput) {
            productNameInput.addEventListener('blur', (e) => {
                this.generateSku(e.target.value);
            });
        }

        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
                this.closeDeleteModal();
                this.closeDetailsModal();
            }
        });
    }

    async loadCategories() {
        try {
            const result = await inventoryManager.apiRequest('/categories');
            console.log('Categories API Response:', result); // Debug log
            
            if (result.success && result.data) {
                // Handle different possible response structures
                this.categories = Array.isArray(result.data) ? result.data : 
                                 result.data.categories || result.data.data || [];
                this.populateCategoryFilters();
            } else {
                throw new Error(result.message || 'Invalid categories response');
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
            // Set empty categories array to prevent further errors
            this.categories = [];
            this.populateCategoryFilters();
        }
    }

    populateCategoryFilters() {
        const categoryFilter = document.getElementById('categoryFilter');
        const productCategory = document.getElementById('productCategory');
        
        if (!categoryFilter || !productCategory) return;

        // Clear existing options
        categoryFilter.innerHTML = '<option value="">All Categories</option>';
        productCategory.innerHTML = '<option value="">Select Category</option>';

        // Add category options
        this.categories.forEach(category => {
            const categoryName = category.name || 'Unnamed Category';
            const categoryId = category.id;
            const isActive = category.status === 'active' || category.status === undefined;
            
            if (isActive) {
                const option = `<option value="${categoryId}">${this.escapeHtml(categoryName)}</option>`;
                categoryFilter.innerHTML += option;
                productCategory.innerHTML += option;
            }
        });

        console.log('Categories populated:', this.categories.length); // Debug log
    }

    async loadProducts() {
        const tableBody = document.getElementById('productsTableBody');
        if (!tableBody) return;
        
        try {
            const result = await inventoryManager.apiRequest('/products');
            console.log('Products API Response:', result); // Debug log
            
            if (result.success && result.data) {
                // Handle different possible response structures
                this.products = Array.isArray(result.data) ? result.data : 
                               result.data.products || result.data.data || [];
                this.renderProducts();
            } else {
                throw new Error(result.message || 'Invalid products response');
            }
        } catch (error) {
            console.error('Failed to load products:', error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-exclamation-circle"></i>
                            <p>Failed to load products: ${error.message}</p>
                            <button class="btn btn-primary" onclick="productsManager.loadProducts()">
                                <i class="fas fa-redo"></i> Try Again
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    renderProducts(productsToRender = null) {
        const tableBody = document.getElementById('productsTableBody');
        if (!tableBody) return;

        const products = productsToRender || this.products;
        
        if (!products || products.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-box-open"></i>
                            <p>No products found</p>
                            <p>Get started by adding your first product</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = products.map(product => {
            const category = this.categories.find(cat => cat.id === product.category_id);
            const categoryName = category ? category.name : 'Uncategorized';
            const stockLevel = product.quantity || 0;
            const reorderLevel = product.reorder_level || 0;
            
            const stockClass = stockLevel <= reorderLevel ? 'text-warning' : 
                              stockLevel === 0 ? 'text-danger' : '';
            
            return `
                <tr>
                    <td>
                        <div class="product-info">
                            <div class="product-image-small">
                                ${product.image ? 
                                    `<img src="${product.image}" alt="${this.escapeHtml(product.name)}">` : 
                                    '<i class="fas fa-box"></i>'
                                }
                            </div>
                            <div class="product-details">
                                <strong>${this.escapeHtml(product.name || 'Unnamed Product')}</strong>
                                <small>${this.escapeHtml(product.sku || 'No SKU')}</small>
                            </div>
                        </div>
                    </td>
                    <td>${this.escapeHtml(categoryName)}</td>
                    <td>$${parseFloat(product.price || 0).toFixed(2)}</td>
                    <td class="${stockClass}">
                        ${stockLevel}
                        ${stockLevel <= reorderLevel ? '<i class="fas fa-exclamation-triangle ml-1"></i>' : ''}
                    </td>
                    <td>
                        <span class="status-badge status-${product.status || 'active'}">
                            ${product.status || 'active'}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon btn-view" onclick="productsManager.viewProduct(${product.id})" title="View">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn-icon btn-edit" onclick="productsManager.openEditModal(${product.id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon btn-delete" onclick="productsManager.openDeleteModal(${product.id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        console.log('Products rendered:', products.length); // Debug log
    }

    generateSku(productName) {
        const skuInput = document.getElementById('productSku');
        if (skuInput && !skuInput.value && productName) {
            // Generate a simple SKU from product name
            const sku = productName
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '')
                .substring(0, 8) + Math.floor(1000 + Math.random() * 9000);
            skuInput.value = sku;
        }
    }

    openAddModal() {
        console.log('Opening add modal'); // Debug log
        this.currentProductId = null;
        
        const modalTitle = document.getElementById('modalTitle');
        const productForm = document.getElementById('productForm');
        const productId = document.getElementById('productId');
        const productStatus = document.getElementById('productStatus');
        const modal = document.getElementById('productModal');
        
        if (modalTitle) modalTitle.textContent = 'Add New Product';
        if (productForm) productForm.reset();
        if (productId) productId.value = '';
        if (productStatus) productStatus.value = 'active';
        
        this.clearErrors();
        
        if (modal) {
            modal.classList.add('active');
            console.log('Modal should be visible now'); // Debug log
        } else {
            console.error('Product modal not found!');
        }
    }

    openEditModal(productId) {
        console.log('Opening edit modal for product:', productId); // Debug log
        const product = this.products.find(prod => prod.id === productId);
        if (!product) {
            console.error('Product not found:', productId);
            return;
        }

        this.currentProductId = productId;
        
        const modalTitle = document.getElementById('modalTitle');
        const productIdInput = document.getElementById('productId');
        const productName = document.getElementById('productName');
        const productSku = document.getElementById('productSku');
        const productCategory = document.getElementById('productCategory');
        const productBarcode = document.getElementById('productBarcode');
        const productPrice = document.getElementById('productPrice');
        const productCost = document.getElementById('productCost');
        const productQuantity = document.getElementById('productQuantity');
        const productReorder = document.getElementById('productReorder');
        const productDescription = document.getElementById('productDescription');
        const productStatus = document.getElementById('productStatus');
        const modal = document.getElementById('productModal');

        if (modalTitle) modalTitle.textContent = 'Edit Product';
        if (productIdInput) productIdInput.value = product.id;
        if (productName) productName.value = product.name || '';
        if (productSku) productSku.value = product.sku || '';
        if (productCategory) productCategory.value = product.category_id || '';
        if (productBarcode) productBarcode.value = product.barcode || '';
        if (productPrice) productPrice.value = product.price || '';
        if (productCost) productCost.value = product.cost_price || '';
        if (productQuantity) productQuantity.value = product.quantity || '';
        if (productReorder) productReorder.value = product.reorder_level || '';
        if (productDescription) productDescription.value = product.description || '';
        if (productStatus) productStatus.value = product.status || 'active';
        
        this.clearErrors();
        
        if (modal) {
            modal.classList.add('active');
        } else {
            console.error('Product modal not found!');
        }
    }

    closeModal() {
        const modal = document.getElementById('productModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        console.log('Form submitted'); // Debug log
        
        const form = e.target;
        const saveButton = document.getElementById('saveProductBtn');
        const productId = document.getElementById('productId')?.value;
        
        const productData = {
            name: document.getElementById('productName')?.value.trim() || '',
            sku: document.getElementById('productSku')?.value.trim() || '',
            category_id: document.getElementById('productCategory')?.value || '',
            barcode: document.getElementById('productBarcode')?.value.trim() || '',
            price: parseFloat(document.getElementById('productPrice')?.value || 0),
            cost_price: document.getElementById('productCost')?.value ? 
                        parseFloat(document.getElementById('productCost').value) : null,
            quantity: parseInt(document.getElementById('productQuantity')?.value || 0),
            reorder_level: document.getElementById('productReorder')?.value ? 
                         parseInt(document.getElementById('productReorder').value) : null,
            description: document.getElementById('productDescription')?.value.trim() || '',
            status: document.getElementById('productStatus')?.value || 'active'
        };

        console.log('Product data to submit:', productData); // Debug log

        // Validation
        if (!this.validateForm(productData)) {
            return;
        }

        if (saveButton) {
            inventoryManager.showButtonLoading(saveButton);
        }

        try {
            let result;
            if (productId) {
                // Update existing product
                result = await inventoryManager.apiRequest(`/products/${productId}`, {
                    method: 'PUT',
                    body: JSON.stringify(productData)
                });
            } else {
                // Create new product
                result = await inventoryManager.apiRequest('/products', {
                    method: 'POST',
                    body: JSON.stringify(productData)
                });
            }

            console.log('API Response:', result); // Debug log

            if (result.success) {
                inventoryManager.showNotification(
                    `Product ${productId ? 'updated' : 'created'} successfully!`,
                    'success'
                );
                this.closeModal();
                this.loadProducts(); // Reload the products list
            } else {
                throw new Error(result.message || `Failed to ${productId ? 'update' : 'create'} product`);
            }
        } catch (error) {
            console.error('Form submission error:', error);
            inventoryManager.showNotification(error.message, 'error');
        } finally {
            if (saveButton) {
                inventoryManager.hideButtonLoading(saveButton);
            }
        }
    }

    validateForm(data) {
        this.clearErrors();
        let isValid = true;

        if (!data.name) {
            document.getElementById('nameError').textContent = 'Product name is required';
            isValid = false;
        }

        if (!data.sku) {
            document.getElementById('skuError').textContent = 'SKU is required';
            isValid = false;
        }

        if (!data.category_id) {
            document.getElementById('categoryError').textContent = 'Category is required';
            isValid = false;
        }

        if (!data.price || data.price < 0) {
            document.getElementById('priceError').textContent = 'Valid price is required';
            isValid = false;
        }

        if (!data.quantity || data.quantity < 0) {
            document.getElementById('quantityError').textContent = 'Valid quantity is required';
            isValid = false;
        }

        return isValid;
    }

    clearErrors() {
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(element => {
            element.textContent = '';
        });
    }

    openDeleteModal(productId) {
        const product = this.products.find(prod => prod.id === productId);
        if (!product) return;

        this.currentProductId = productId;
        
        const deleteProductName = document.getElementById('deleteProductName');
        const deleteModal = document.getElementById('deleteModal');
        
        if (deleteProductName) deleteProductName.textContent = product.name || 'Unnamed Product';
        if (deleteModal) deleteModal.classList.add('active');
    }

    closeDeleteModal() {
        const deleteModal = document.getElementById('deleteModal');
        if (deleteModal) {
            deleteModal.classList.remove('active');
        }
    }

    async confirmDelete() {
        const deleteButton = document.getElementById('confirmDeleteBtn');
        if (deleteButton) {
            inventoryManager.showButtonLoading(deleteButton);
        }

        try {
            const result = await inventoryManager.apiRequest(`/products/${this.currentProductId}`, {
                method: 'DELETE'
            });

            if (result.success) {
                inventoryManager.showNotification('Product deleted successfully!', 'success');
                this.closeDeleteModal();
                this.loadProducts(); // Reload the products list
            } else {
                throw new Error(result.message || 'Failed to delete product');
            }
        } catch (error) {
            inventoryManager.showNotification(error.message, 'error');
        } finally {
            if (deleteButton) {
                inventoryManager.hideButtonLoading(deleteButton);
            }
        }
    }

    async viewProduct(productId) {
        const product = this.products.find(prod => prod.id === productId);
        if (!product) return;

        const category = this.categories.find(cat => cat.id === product.category_id);
        
        const detailsContent = `
            <div class="product-details-view">
                <div class="product-header">
                    <div class="product-image-large">
                        ${product.image ? 
                            `<img src="${product.image}" alt="${this.escapeHtml(product.name)}">` : 
                            '<i class="fas fa-box"></i>'
                        }
                    </div>
                    <div class="product-info">
                        <h4>${this.escapeHtml(product.name || 'Unnamed Product')}</h4>
                        <p class="product-sku">SKU: ${this.escapeHtml(product.sku || 'No SKU')}</p>
                        <span class="status-badge status-${product.status || 'active'}">
                            ${product.status || 'active'}
                        </span>
                    </div>
                </div>
                
                <div class="details-grid">
                    <div class="detail-item">
                        <label>Category:</label>
                        <span>${category ? this.escapeHtml(category.name) : 'Uncategorized'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Barcode:</label>
                        <span>${product.barcode || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Price:</label>
                        <span>$${parseFloat(product.price || 0).toFixed(2)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Cost Price:</label>
                        <span>${product.cost_price ? '$' + parseFloat(product.cost_price).toFixed(2) : 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Quantity:</label>
                        <span class="${(product.quantity || 0) <= (product.reorder_level || 0) ? 'text-warning' : ''}">
                            ${product.quantity || 0}
                            ${(product.quantity || 0) <= (product.reorder_level || 0) ? '(Low Stock)' : ''}
                        </span>
                    </div>
                    <div class="detail-item">
                        <label>Reorder Level:</label>
                        <span>${product.reorder_level || 'Not set'}</span>
                    </div>
                </div>
                
                ${product.description ? `
                    <div class="description-section">
                        <label>Description:</label>
                        <p>${this.escapeHtml(product.description)}</p>
                    </div>
                ` : ''}
            </div>
        `;

        const productDetailsContent = document.getElementById('productDetailsContent');
        const detailsModal = document.getElementById('detailsModal');
        
        if (productDetailsContent) productDetailsContent.innerHTML = detailsContent;
        if (detailsModal) detailsModal.classList.add('active');
    }

    closeDetailsModal() {
        const detailsModal = document.getElementById('detailsModal');
        if (detailsModal) {
            detailsModal.classList.remove('active');
        }
    }

    applyFilters() {
        const categoryFilter = document.getElementById('categoryFilter')?.value;
        const statusFilter = document.getElementById('statusFilter')?.value;
        
        let filteredProducts = this.products;

        if (categoryFilter) {
            filteredProducts = filteredProducts.filter(product => 
                product.category_id == categoryFilter
            );
        }

        if (statusFilter) {
            filteredProducts = filteredProducts.filter(product => 
                product.status === statusFilter
            );
        }

        this.renderProducts(filteredProducts);
    }

    handleSearch(searchTerm) {
        if (!searchTerm) {
            this.renderProducts();
            return;
        }

        const filteredProducts = this.products.filter(product =>
            (product.name && product.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        
        this.renderProducts(filteredProducts);
    }

    escapeHtml(unsafe) {
        if (unsafe === null || unsafe === undefined) return '';
        return unsafe.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Initialize products manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing ProductsManager...');
    window.productsManager = new ProductsManager();
});