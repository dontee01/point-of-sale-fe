// Purchases Management JavaScript
class PurchasesManager {
    constructor() {
        this.purchases = [];
        this.products = [];
        this.currentPurchaseItems = [];
        this.editingItemIndex = null;
        this.init();
    }

    init() {
        this.loadPurchases();
        this.loadProducts();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // New purchase button
        document.getElementById('newPurchaseBtn').addEventListener('click', () => {
            this.openNewPurchaseModal();
        });

        // Purchase modal events
        document.getElementById('closePurchaseModal').addEventListener('click', () => {
            this.closePurchaseModal();
        });

        document.getElementById('cancelPurchaseBtn').addEventListener('click', () => {
            this.closePurchaseModal();
        });

        // Add product modal events
        document.getElementById('closeAddProductModal').addEventListener('click', () => {
            this.closeAddProductModal();
        });

        document.getElementById('cancelAddProductBtn').addEventListener('click', () => {
            this.closeAddProductModal();
        });

        // Add item button
        document.getElementById('addItemBtn').addEventListener('click', () => {
            this.openAddProductModal();
        });

        // Form submissions
        document.getElementById('purchaseForm').addEventListener('submit', (e) => {
            this.submitPurchase(e);
        });

        document.getElementById('addProductForm').addEventListener('submit', (e) => {
            this.savePurchaseItem(e);
        });

        // RGB checkbox change
        document.getElementById('isRgb').addEventListener('change', (e) => {
            this.toggleRgbInfo(e.target.checked);
        });

        // Details modal events
        document.getElementById('closeDetailsModal').addEventListener('click', () => {
            this.closeDetailsModal();
        });

        document.getElementById('closeDetailsBtn').addEventListener('click', () => {
            this.closeDetailsModal();
        });

        // Search functionality
        document.getElementById('searchPurchases').addEventListener('input', (e) => {
            this.searchPurchases(e.target.value);
        });

        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closePurchaseModal();
                this.closeAddProductModal();
                this.closeDetailsModal();
            }
        });
    }

    async loadPurchases() {
        try {
            const result = await inventoryManager.apiRequest('/purchases');
            
            if (result.success && result.data) {
                this.purchases = Array.isArray(result.data) ? result.data : 
                               result.data.purchases || result.data.data || [];
                this.renderPurchasesTable();
            } else {
                throw new Error(result.message || 'Failed to load purchases');
            }
        } catch (error) {
            console.error('Failed to load purchases:', error);
            this.showEmptyPurchasesTable('Failed to load purchases. Please try again.');
        }
    }

    async loadProducts() {
        try {
            const result = await inventoryManager.apiRequest('/products');
            if (result.success && result.data) {
                this.products = Array.isArray(result.data) ? result.data : 
                               result.data.products || result.data.data || [];
                this.populateProductDropdown();
            }
        } catch (error) {
            console.error('Failed to load products:', error);
        }
    }

    populateProductDropdown() {
        const productSelect = document.getElementById('purchaseProduct');
        if (!productSelect) return;

        productSelect.innerHTML = '<option value="">Select Product</option>';
        
        this.products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} (Stock: ${product.quantity || 0})`;
            option.dataset.isRgb = product.is_rgb || false;
            productSelect.appendChild(option);
        });

        // Add change event to auto-fill RGB setting
        productSelect.addEventListener('change', (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            if (selectedOption.value) {
                const isRgb = selectedOption.dataset.isRgb === 'true';
                document.getElementById('isRgb').checked = isRgb;
                this.toggleRgbInfo(isRgb);
            }
        });
    }

    renderPurchasesTable() {
        const tbody = document.getElementById('purchasesTableBody');
        
        if (this.purchases.length === 0) {
            this.showEmptyPurchasesTable('No purchases found');
            return;
        }

        tbody.innerHTML = this.purchases.map(purchase => `
            <tr>
                <td>
                    <strong>${purchase.purchase_session || 'N/A'}</strong>
                </td>
                <td>${this.escapeHtml(purchase.product_name)}</td>
                <td>${this.escapeHtml(purchase.supplier_name || 'N/A')}</td>
                <td>${purchase.quantity}</td>
                <td>$${parseFloat(purchase.cost_price || 0).toFixed(2)}</td>
                <td>$${parseFloat(purchase.unit_price || 0).toFixed(2)}</td>
                <td>$${parseFloat(purchase.total || 0).toFixed(2)}</td>
                <td>
                    <span class="type-badge ${purchase.is_rgb ? 'rgb' : 'regular'}">
                        ${purchase.is_rgb ? 'RGB' : 'Regular'}
                    </span>
                </td>
                <td>${inventoryManager.formatDate(purchase.created_at)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-view" onclick="purchasesManager.viewPurchase('${purchase.purchase_session}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    showEmptyPurchasesTable(message) {
        const tbody = document.getElementById('purchasesTableBody');
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-shopping-cart"></i>
                        <p>${message}</p>
                    </div>
                </td>
            </tr>
        `;
    }

    openNewPurchaseModal() {
        this.currentPurchaseItems = [];
        this.editingItemIndex = null;
        
        document.getElementById('purchaseForm').reset();
        document.getElementById('purchaseItemsList').innerHTML = `
            <div class="empty-items">
                <i class="fas fa-cart-plus"></i>
                <p>No items added yet. Click "Add Item" to start.</p>
            </div>
        `;
        
        this.updatePurchaseSummary();
        document.getElementById('purchaseModal').classList.add('active');
    }

    closePurchaseModal() {
        document.getElementById('purchaseModal').classList.remove('active');
    }

    openAddProductModal() {
        this.editingItemIndex = null;
        document.getElementById('addProductForm').reset();
        document.getElementById('editItemIndex').value = '';
        document.getElementById('rgbInfo').style.display = 'none';
        document.getElementById('addProductModal').classList.add('active');
    }

    closeAddProductModal() {
        document.getElementById('addProductModal').classList.remove('active');
    }

    toggleRgbInfo(isRgb) {
        const rgbInfo = document.getElementById('rgbInfo');
        rgbInfo.style.display = isRgb ? 'block' : 'none';
    }

    savePurchaseItem(e) {
        e.preventDefault();
        
        const productSelect = document.getElementById('purchaseProduct');
        const selectedProduct = this.products.find(p => p.id == productSelect.value);
        
        if (!selectedProduct) {
            inventoryManager.showNotification('Please select a product', 'error');
            return;
        }

        const purchaseItem = {
            product_id: parseInt(productSelect.value),
            name: selectedProduct.name,
            supplier_name: document.getElementById('supplierName').value.trim(),
            quantity: parseInt(document.getElementById('purchaseQuantity').value),
            cost_price: parseFloat(document.getElementById('costPrice').value),
            unit_price: parseFloat(document.getElementById('unitPrice').value),
            is_rgb: document.getElementById('isRgb').checked,
            total: parseInt(document.getElementById('purchaseQuantity').value) * parseFloat(document.getElementById('costPrice').value)
        };

        // Validation
        if (!this.validatePurchaseItem(purchaseItem)) {
            return;
        }

        const editIndex = document.getElementById('editItemIndex').value;
        
        if (editIndex !== '') {
            // Editing existing item
            this.currentPurchaseItems[editIndex] = purchaseItem;
            inventoryManager.showNotification('Item updated successfully', 'success');
        } else {
            // Adding new item
            this.currentPurchaseItems.push(purchaseItem);
            inventoryManager.showNotification('Item added to purchase', 'success');
        }

        this.renderPurchaseItems();
        this.updatePurchaseSummary();
        this.closeAddProductModal();
    }

    validatePurchaseItem(item) {
        if (!item.supplier_name) {
            inventoryManager.showNotification('Supplier name is required', 'error');
            return false;
        }

        if (item.quantity <= 0) {
            inventoryManager.showNotification('Quantity must be greater than 0', 'error');
            return false;
        }

        if (item.cost_price <= 0) {
            inventoryManager.showNotification('Cost price must be greater than 0', 'error');
            return false;
        }

        if (item.unit_price <= 0) {
            inventoryManager.showNotification('Unit price must be greater than 0', 'error');
            return false;
        }

        return true;
    }

    renderPurchaseItems() {
        const itemsList = document.getElementById('purchaseItemsList');
        
        if (this.currentPurchaseItems.length === 0) {
            itemsList.innerHTML = `
                <div class="empty-items">
                    <i class="fas fa-cart-plus"></i>
                    <p>No items added yet. Click "Add Item" to start.</p>
                </div>
            `;
            return;
        }

        itemsList.innerHTML = this.currentPurchaseItems.map((item, index) => `
            <div class="purchase-item">
                <div class="purchase-item-header">
                    <div class="purchase-item-info">
                        <div class="purchase-item-name">${this.escapeHtml(item.name)}</div>
                        <div class="purchase-item-supplier">Supplier: ${this.escapeHtml(item.supplier_name)}</div>
                        <span class="purchase-item-type ${item.is_rgb ? 'rgb' : 'regular'}">
                            ${item.is_rgb ? 'RGB Product' : 'Regular Product'}
                        </span>
                    </div>
                    <div class="purchase-item-actions">
                        <button type="button" class="btn-icon btn-edit" onclick="purchasesManager.editPurchaseItem(${index})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn-icon btn-delete" onclick="purchasesManager.removePurchaseItem(${index})" title="Remove">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="purchase-item-details">
                    <div class="detail-group">
                        <span class="detail-label">Quantity</span>
                        <span class="detail-value">${item.quantity}</span>
                    </div>
                    <div class="detail-group">
                        <span class="detail-label">Cost Price</span>
                        <span class="detail-value">${item.cost_price.toFixed(2)}</span>
                    </div>
                    <div class="detail-group">
                        <span class="detail-label">Unit Price</span>
                        <span class="detail-value">${item.unit_price.toFixed(2)}</span>
                    </div>
                    <div class="detail-group">
                        <span class="detail-label">Total</span>
                        <span class="detail-value total">${item.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    editPurchaseItem(index) {
        const item = this.currentPurchaseItems[index];
        
        document.getElementById('purchaseProduct').value = item.product_id;
        document.getElementById('supplierName').value = item.supplier_name;
        document.getElementById('costPrice').value = item.cost_price;
        document.getElementById('unitPrice').value = item.unit_price;
        document.getElementById('purchaseQuantity').value = item.quantity;
        document.getElementById('isRgb').checked = item.is_rgb;
        document.getElementById('editItemIndex').value = index;
        
        this.toggleRgbInfo(item.is_rgb);
        document.getElementById('addProductModal').classList.add('active');
    }

    removePurchaseItem(index) {
        if (confirm('Are you sure you want to remove this item from the purchase?')) {
            this.currentPurchaseItems.splice(index, 1);
            this.renderPurchaseItems();
            this.updatePurchaseSummary();
            inventoryManager.showNotification('Item removed from purchase', 'success');
        }
    }

    updatePurchaseSummary() {
        const totalItems = this.currentPurchaseItems.length;
        const totalQuantity = this.currentPurchaseItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalCost = this.currentPurchaseItems.reduce((sum, item) => sum + item.total, 0);

        document.getElementById('totalItemsCount').textContent = totalItems;
        document.getElementById('totalQuantity').textContent = totalQuantity;
        document.getElementById('totalCost').textContent = `₦${totalCost.toFixed(2)}`;
    }

    async submitPurchase(e) {
        e.preventDefault();
        
        if (this.currentPurchaseItems.length === 0) {
            inventoryManager.showNotification('Please add at least one item to the purchase', 'error');
            return;
        }

        const submitBtn = document.getElementById('submitPurchaseBtn');
        inventoryManager.showButtonLoading(submitBtn);

        try {
            const result = await inventoryManager.apiRequest('/purchases', {
                method: 'POST',
                body: JSON.stringify({
                    items: this.currentPurchaseItems
                })
            });

            if (result.success) {
                inventoryManager.showNotification('Purchase created successfully!', 'success');
                this.closePurchaseModal();
                this.loadPurchases(); // Reload the purchases list
            } else {
                throw new Error(result.message || 'Failed to create purchase');
            }
        } catch (error) {
            console.error('Failed to create purchase:', error);
            inventoryManager.showNotification(error.message, 'error');
        } finally {
            inventoryManager.hideButtonLoading(submitBtn);
        }
    }

    async viewPurchase(purchaseSession) {
        try {
            const result = await inventoryManager.apiRequest(`/purchases/${purchaseSession}`);
            
            if (result.success && result.data) {
                this.displayPurchaseDetails(result.data, purchaseSession);
            } else {
                throw new Error(result.message || 'Failed to load purchase details');
            }
        } catch (error) {
            console.error('Failed to load purchase details:', error);
            inventoryManager.showNotification('Failed to load purchase details', 'error');
        }
    }

    displayPurchaseDetails(purchaseData, purchaseSession) {
        // If we get a single purchase object, wrap it in an array
        const purchases = Array.isArray(purchaseData) ? purchaseData : [purchaseData];
        
        // Group purchases by session (in case there are multiple items in the same session)
        const sessionPurchases = purchases.filter(p => p.purchase_session === purchaseSession);
        
        if (sessionPurchases.length === 0) {
            inventoryManager.showNotification('No purchase details found', 'error');
            return;
        }

        const totalCost = sessionPurchases.reduce((sum, p) => sum + parseFloat(p.total || 0), 0);
        const totalQuantity = sessionPurchases.reduce((sum, p) => sum + parseInt(p.quantity || 0), 0);

        const detailsContent = `
            <div class="purchase-details">
                <div class="purchase-session">
                    <div class="purchase-session-id">${purchaseSession}</div>
                    <div class="purchase-date">${inventoryManager.formatDate(sessionPurchases[0].created_at)}</div>
                </div>
                
                <div class="purchase-items-details">
                    ${sessionPurchases.map(purchase => `
                        <div class="purchase-item-detail">
                            <div class="item-info">
                                <div class="item-name">${this.escapeHtml(purchase.product_name)}</div>
                                <div class="item-supplier">Supplier: ${this.escapeHtml(purchase.supplier_name || 'N/A')}</div>
                                <div class="item-meta">
                                    <span>Type: ${purchase.is_rgb ? 'RGB' : 'Regular'}</span>
                                    <span>Cost: $${parseFloat(purchase.cost_price || 0).toFixed(2)}</span>
                                    <span>Unit: $${parseFloat(purchase.unit_price || 0).toFixed(2)}</span>
                                </div>
                            </div>
                            <div class="item-quantity">
                                <strong>${purchase.quantity} units</strong>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="purchase-totals">
                    <div class="total-row">
                        <span>Total Items:</span>
                        <span>${sessionPurchases.length}</span>
                    </div>
                    <div class="total-row">
                        <span>Total Quantity:</span>
                        <span>${totalQuantity}</span>
                    </div>
                    <div class="total-row grand-total">
                        <span>Total Cost:</span>
                        <span>$${totalCost.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('purchaseDetailsContent').innerHTML = detailsContent;
        document.getElementById('purchaseDetailsModal').classList.add('active');
    }

    closeDetailsModal() {
        document.getElementById('purchaseDetailsModal').classList.remove('active');
    }

    searchPurchases(searchTerm) {
        if (!searchTerm) {
            this.renderPurchasesTable();
            return;
        }

        const filteredPurchases = this.purchases.filter(purchase =>
            purchase.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            purchase.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            purchase.purchase_session.toLowerCase().includes(searchTerm.toLowerCase())
        );

        this.renderFilteredPurchases(filteredPurchases);
    }

    renderFilteredPurchases(purchases) {
        const tbody = document.getElementById('purchasesTableBody');
        
        if (purchases.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-search"></i>
                            <p>No purchases found matching your search</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = purchases.map(purchase => `
            <tr>
                <td>
                    <strong>${purchase.purchase_session || 'N/A'}</strong>
                </td>
                <td>${this.escapeHtml(purchase.product_name)}</td>
                <td>${this.escapeHtml(purchase.supplier_name || 'N/A')}</td>
                <td>${purchase.quantity}</td>
                <td>${parseFloat(purchase.cost_price || 0).toFixed(2)}</td>
                <td>${parseFloat(purchase.unit_price || 0).toFixed(2)}</td>
                <td>${parseFloat(purchase.total || 0).toFixed(2)}</td>
                <td>
                    <span class="type-badge ${purchase.is_rgb ? 'rgb' : 'regular'}">
                        ${purchase.is_rgb ? 'RGB' : 'Regular'}
                    </span>
                </td>
                <td>${inventoryManager.formatDate(purchase.created_at)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-view" onclick="purchasesManager.viewPurchase('${purchase.purchase_session}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
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

// Initialize purchases manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing PurchasesManager...');
    window.purchasesManager = new PurchasesManager();
});