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
        document.getElementById('addProductBtn').addEventListener('click', () => {
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
        document.getElementById('productForm').addEventListener('submit', (e) => {
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

        // Details modal events
        document.getElementById('closeDetailsModal').addEventListener('click', () => {
            this.closeDetailsModal();
        });

        document.getElementById('closeDetailsBtn').addEventListener('click', () => {
            this.closeDetailsModal();
        });

        // Filters
        document.getElementById('categoryFilter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('statusFilter').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('searchProducts').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
                this.closeDeleteModal();
                this.closeDetailsModal();
            }
        });

        // Generate SKU automatically when product name changes
        document.getElementById('productName').addEventListener('blur', (e) => {
            this.generateSku(e.target.value);
        });
    }

    async loadCategories() {
        try {
            const result = await inventoryManager.apiRequest('/categories');
            if (result.success) {
                this.categories = result.data;
                this.populateCategoryFilters();
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    populateCategoryFilters() {
        const categoryFilter = document.getElementById('categoryFilter');
        const productCategory = document.getElementById('productCategory');
        
        const categoryOptions = this.categories
            .filter(cat => cat.status === 'active')
            .map(category => 
                `<option value="${category.id}">${this.escapeHtml(category.name)}</option>`
            ).join('');
        
        categoryFilter.innerHTML = '<option value="">All Categories</option>' + categoryOptions;
        productCategory.innerHTML = '<option value="">Select Category</option>' + categoryOptions;
    }

    async loadProducts() {
        const tableBody = document.getElementById('productsTableBody');
        
        try {
            const result = await inventoryManager.apiRequest('/products');
            
            if (result.success) {
                this.products = result.data;
                this.renderProducts();
            } else {
                throw new Error(result.message || 'Failed to load products');
            }
        } catch (error) {
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
        const products = productsToRender || this.products;
        
        if (products.length === 0) {
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
            const stockClass = product.quantity <= (product.reorder_level || 0) ? 'text-warning' : 
                              product.quantity === 0 ? 'text-danger' : '';
            
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
                                <strong>${this.escapeHtml(product.name)}</strong>
                                <small>${this.escapeHtml(product.sku)}</small>
                            </div>
                        </div>
                    </td>
                    <td>${category ? this.escapeHtml(category.name) : 'Uncategorized'}</td>
                    <td>&#8358;${parseFloat(product.unit_price).toFixed(2)}</td>
                    <td class="${stockClass}">
                        ${product.quantity}
                        ${product.quantity <= (product.reorder_level || 0) ? '<i class="fas fa-exclamation-triangle ml-1"></i>' : ''}
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
    }

    generateSku(productName) {
        const skuInput = document.getElementById('productSku');
        if (!skuInput.value && productName) {
            // Generate a simple SKU from product name
            const sku = productName
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '')
                .substring(0, 8) + Math.floor(1000 + Math.random() * 9000);
            skuInput.value = sku;
        }
    }

    openAddModal() {
        this.currentProductId = null;
        document.getElementById('modalTitle').textContent = 'Add New Product';
        document.getElementById('productForm').reset();
        document.getElementById('productId').value = '';
        document.getElementById('productStatus').value = 'active';
        this.clearErrors();
        document.getElementById('productModal').classList.add('active');
    }

    openEditModal(productId) {
        const product = this.products.find(prod => prod.id === productId);
        if (!product) return;

        this.currentProductId = productId;
        document.getElementById('modalTitle').textContent = 'Edit Product';
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productSku').value = product.sku;
        document.getElementById('productCategory').value = product.category_id;
        document.getElementById('productBarcode').value = product.barcode || '';
        document.getElementById('productPrice').value = product.unit_price;
        document.getElementById('productType').value = product.type || '';
        document.getElementById('productQuantity').value = product.quantity;
        document.getElementById('productReorder').value = product.reorder_level || '';
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productStatus').value = product.status || 'active';
        
        this.clearErrors();
        document.getElementById('productModal').classList.add('active');
    }

    closeModal() {
        document.getElementById('productModal').classList.remove('active');
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const saveButton = document.getElementById('saveProductBtn');
        const productId = document.getElementById('productId').value;
        
        const productData = {
            name: document.getElementById('productName').value.trim(),
            sku: document.getElementById('productSku').value.trim(),
            category_id: document.getElementById('productCategory').value,
            barcode: document.getElementById('productBarcode').value.trim(),
            price: parseFloat(document.getElementById('productPrice').value),
            is_rgb: document.getElementById('productType').value ? 
                        parseFloat(document.getElementById('productType').value) : null,
            quantity: parseInt(document.getElementById('productQuantity').value),
            reorder_level: document.getElementById('productReorder').value ? 
                         parseInt(document.getElementById('productReorder').value) : null,
            description: document.getElementById('productDescription').value.trim(),
            status: document.getElementById('productStatus').value
        };

        // Validation
        if (!this.validateForm(productData)) {
            return;
        }

        inventoryManager.showButtonLoading(saveButton);

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
            inventoryManager.showNotification(error.message, 'error');
        } finally {
            inventoryManager.hideButtonLoading(saveButton);
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

        // if (!data.quantity || data.quantity < 0) {
        //     document.getElementById('quantityError').textContent = 'Valid quantity is required';
        //     isValid = false;
        // }

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
        document.getElementById('deleteProductName').textContent = product.name;
        document.getElementById('deleteModal').classList.add('active');
    }

    closeDeleteModal() {
        document.getElementById('deleteModal').classList.remove('active');
    }

    async confirmDelete() {
        const deleteButton = document.getElementById('confirmDeleteBtn');
        inventoryManager.showButtonLoading(deleteButton);

        try {
            const result = await inventoryManager.apiRequest(`/products/${this.currentProductId}`, {
                method: 'DELETE'
            });
            
            console.log('Delete response:', result);

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
            inventoryManager.hideButtonLoading(deleteButton);
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
                        <h4>${this.escapeHtml(product.name)}</h4>
                        <p class="product-sku">SKU: ${this.escapeHtml(product.sku)}</p>
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
                        <span>&#8358;${parseFloat(product.unit_price).toFixed(2)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Cost Price:</label>
                        <span>${product.cost_price ? '&#8358;' + parseFloat(product.cost_price).toFixed(2) : 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Quantity:</label>
                        <span class="${product.quantity <= (product.reorder_level || 0) ? 'text-warning' : ''}">
                            ${product.quantity}
                            ${product.quantity <= (product.reorder_level || 0) ? '(Low Stock)' : ''}
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

        document.getElementById('productDetailsContent').innerHTML = detailsContent;
        document.getElementById('detailsModal').classList.add('active');
    }

    closeDetailsModal() {
        document.getElementById('detailsModal').classList.remove('active');
    }

    applyFilters() {
        const categoryFilter = document.getElementById('categoryFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        
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
        const filteredProducts = this.products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        
        this.renderProducts(filteredProducts);
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

// Initialize products manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.productsManager = new ProductsManager();
});