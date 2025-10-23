// Orders Management JavaScript
class OrdersManager {
    constructor() {
        this.orders = [];
        this.products = [];
        this.categories = [];
        this.activeOrderId = null;
        this.orderCounter = 1;
        this.companyInfo = {
            name: "Sahlat Enterprises",
            address: "123 Business Street",
            city: "Abeokuta, Ogun State",
            phone: "08031234567",
            email: "info@sahlat.com.ng",
            website: "www.sahlat.com.ng"
        };
        this.init();
    }

    init() {
        this.loadProducts();
        this.loadCategories();
        this.setupEventListeners();
        this.loadActiveOrders();
    }

    setupEventListeners() {
        // New order tab button
        document.getElementById('newOrderTabBtn').addEventListener('click', () => {
            this.createNewOrderTab();
        });

        // View active orders button
        document.getElementById('viewActiveOrdersBtn').addEventListener('click', () => {
            this.showActiveOrders();
        });

        // Products modal
        document.getElementById('closeProductsModal').addEventListener('click', () => {
            this.closeProductsModal();
        });

        // Checkout modal
        document.getElementById('closeCheckoutModal').addEventListener('click', () => {
            this.closeCheckoutModal();
        });

        document.getElementById('cancelCheckoutBtn').addEventListener('click', () => {
            this.closeCheckoutModal();
        });

        document.getElementById('completeOrderBtn').addEventListener('click', () => {
            this.completeOrder();
        });

        // Active orders modal
        document.getElementById('closeActiveOrdersModal').addEventListener('click', () => {
            this.closeActiveOrdersModal();
        });

        // Payment method change
        document.getElementById('paymentMethod').addEventListener('change', (e) => {
            this.toggleCashPaymentSection(e.target.value);
        });

        // Amount tendered change
        document.getElementById('amountTendered').addEventListener('input', (e) => {
            this.calculateChange(e.target.value);
        });

        // Receipt modal events
        document.getElementById('closeReceiptModal').addEventListener('click', () => {
            this.closeReceiptModal();
        });

        document.getElementById('closeReceiptBtn').addEventListener('click', () => {
            this.closeReceiptModal();
        });

        document.getElementById('printReceiptBtn').addEventListener('click', () => {
            this.printReceipt();
        });

        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeProductsModal();
                this.closeCheckoutModal();
                this.closeActiveOrdersModal();
                this.closeReceiptModal();
            }
        });
    }

    async loadProducts() {
        try {
            const result = await inventoryManager.apiRequest('/products');
            if (result.success && result.data) {
                this.products = Array.isArray(result.data) ? result.data : 
                               result.data.products || result.data.data || [];
                this.populateProductsGrid();
            }
        } catch (error) {
            console.error('Failed to load products:', error);
        }
    }

    async loadCategories() {
        try {
            const result = await inventoryManager.apiRequest('/categories');
            if (result.success && result.data) {
                this.categories = Array.isArray(result.data) ? result.data : 
                                 result.data.categories || result.data.data || [];
                this.populateCategoryFilters();
            }
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    async loadActiveOrders() {
        try {
            const result = await inventoryManager.apiRequest('/orders/active');
            if (result.success && result.data) {
                // Store active orders for reference
                this.activeOrders = Array.isArray(result.data) ? result.data : 
                                  result.data.orders || result.data.data || [];
            }
        } catch (error) {
            console.error('Failed to load active orders:', error);
        }
    }

    populateCategoryFilters() {
        const categoryFilter = document.getElementById('categoryFilterModal');
        if (!categoryFilter) return;

        categoryFilter.innerHTML = '<option value="">All Categories</option>';
        
        this.categories
            .filter(cat => cat.status === 'active' || cat.status === undefined)
            .forEach(category => {
                const option = `<option value="${category.id}">${this.escapeHtml(category.name)}</option>`;
                categoryFilter.innerHTML += option;
            });

        // Add event listener for category filter
        categoryFilter.addEventListener('change', () => {
            this.filterProductsModal();
        });
    }

    populateProductsGrid() {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;

        productsGrid.innerHTML = this.products.map(product => {
            const stockClass = (product.quantity || 0) <= 0 ? 'out-of-stock' : '';
            
            return `
                <div class="product-card ${stockClass}" data-product-id="${product.id}" 
                     onclick="ordersManager.addProductToOrder(${product.id})">
                    <div class="product-card-image">
                        ${product.image ? 
                            `<img src="${product.image}" alt="${this.escapeHtml(product.name)}">` : 
                            '<i class="fas fa-box"></i>'
                        }
                    </div>
                    <div class="product-card-name">${this.escapeHtml(product.name || 'Unnamed Product')}</div>
                    <div class="product-card-price">&#8358;${parseFloat(product.unit_price || 0).toFixed(2)}</div>
                    <div class="product-card-stock">
                        Stock: ${product.quantity || 0}
                        ${(product.quantity || 0) <= 0 ? ' (Out of Stock)' : ''}
                    </div>
                </div>
            `;
        }).join('');

        // Add search functionality
        const searchInput = document.getElementById('searchProductsModal');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterProductsModal(e.target.value);
            });
        }
    }

    filterProductsModal(searchTerm = '') {
        const categoryFilter = document.getElementById('categoryFilterModal');
        const selectedCategory = categoryFilter ? categoryFilter.value : '';
        
        const filteredProducts = this.products.filter(product => {
            const matchesSearch = !searchTerm || 
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.sku.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesCategory = !selectedCategory || product.category_id == selectedCategory;
            
            return matchesSearch && matchesCategory;
        });

        this.renderFilteredProducts(filteredProducts);
    }

    renderFilteredProducts(products) {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;

        productsGrid.innerHTML = products.map(product => {
            const stockClass = (product.quantity || 0) <= 0 ? 'out-of-stock' : '';
            
            return `
                <div class="product-card ${stockClass}" data-product-id="${product.id}" 
                     onclick="ordersManager.addProductToOrder(${product.id})">
                    <div class="product-card-image">
                        ${product.image ? 
                            `<img src="${product.image}" alt="${this.escapeHtml(product.name)}">` : 
                            '<i class="fas fa-box"></i>'
                        }
                    </div>
                    <div class="product-card-name">${this.escapeHtml(product.name)}</div>
                    <div class="product-card-price">&#8358;${parseFloat(product.unit_price || 0).toFixed(2)}</div>
                    <div class="product-card-stock">
                        Stock: ${product.quantity || 0}
                        ${(product.quantity || 0) <= 0 ? ' (Out of Stock)' : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    createNewOrderTab() {
        const orderId = `order_${Date.now()}`;
        const orderNumber = this.orderCounter++;
        
        const order = {
            id: orderId,
            number: orderNumber,
            items: [],
            customer: `Customer ${orderNumber}`,
            createdAt: new Date(),
            status: 'draft'
        };

        this.orders.push(order);
        
        // Create tab
        this.createOrderTab(order);
        
        // Switch to this order
        this.switchToOrder(orderId);
        
        // Update placeholder visibility
        this.updateTabsPlaceholder();
    }

    createOrderTab(order) {
        const tabsContainer = document.getElementById('ordersTabs');
        const placeholder = tabsContainer.querySelector('.order-tab-placeholder');
        
        if (placeholder) {
            placeholder.style.display = 'none';
        }

        const tab = document.createElement('div');
        tab.className = 'order-tab';
        tab.dataset.orderId = order.id;
        tab.innerHTML = `
            <div class="order-tab-header">
                <div class="order-tab-title">${order.customer}</div>
                <button class="order-tab-close" onclick="ordersManager.closeOrderTab('${order.id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="order-tab-info">
                ${order.items.length} items
            </div>
            <div class="order-tab-items">
                &#8358;${this.calculateOrderTotal(order).toFixed(2)}
            </div>
        `;

        tab.addEventListener('click', (e) => {
            if (!e.target.closest('.order-tab-close')) {
                this.switchToOrder(order.id);
            }
        });

        tabsContainer.appendChild(tab);
    }

    switchToOrder(orderId) {
        // Update active tab
        document.querySelectorAll('.order-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`[data-order-id="${orderId}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        this.activeOrderId = orderId;
        this.renderOrderWorkspace(orderId);
    }

    renderOrderWorkspace(orderId) {
        const orderContent = document.getElementById('orderContent');
        const order = this.orders.find(o => o.id === orderId);
        
        if (!order) return;

        // Hide no order selected message
        const noOrderMsg = orderContent.querySelector('.no-order-selected');
        if (noOrderMsg) {
            noOrderMsg.style.display = 'none';
        }

        // Remove existing workspace
        const existingWorkspace = orderContent.querySelector('.order-workspace');
        if (existingWorkspace) {
            existingWorkspace.remove();
        }

        // Create new workspace
        const workspace = document.createElement('div');
        workspace.className = 'order-workspace active';
        workspace.innerHTML = this.getOrderWorkspaceHTML(order);
        
        orderContent.appendChild(workspace);

        // Setup workspace event listeners
        this.setupWorkspaceEventListeners(order);
    }

    getOrderWorkspaceHTML(order) {
        const total = this.calculateOrderTotal(order);
        
        return `
            <div class="order-header">
                <h2 class="order-title">${order.customer}</h2>
                <div class="order-actions">
                    <button class="btn btn-secondary" onclick="ordersManager.openProductsModal()">
                        <i class="fas fa-plus"></i> Add Products
                    </button>
                    <button class="btn btn-success" onclick="ordersManager.openCheckoutModal('${order.id}')" 
                            ${order.items.length === 0 ? 'disabled' : ''}>
                        <i class="fas fa-credit-card"></i> Checkout
                    </button>
                </div>
            </div>
            
            <div class="products-section">
                <div class="products-list">
                    <div class="products-header">
                        <h3>Quick Products</h3>
                        <div class="products-search">
                            <input type="text" class="form-control" placeholder="Search products..." 
                                   id="quickSearchProducts">
                            <button class="btn btn-primary" onclick="ordersManager.openProductsModal()">
                                <i class="fas fa-search"></i>
                            </button>
                        </div>
                    </div>
                    <div class="products-grid-small" id="quickProductsGrid">
                        ${this.getQuickProductsHTML()}
                    </div>
                </div>
                
                <div class="cart-section">
                    <div class="cart-header">
                        <h3>Order Items</h3>
                    </div>
                    <div class="cart-items" id="cartItems">
                        ${this.getCartItemsHTML(order)}
                    </div>
                    <div class="cart-summary">
                        <div class="summary-row">
                            <span>Subtotal:</span>
                            <span>&#8358;${total.toFixed(2)}</span>
                        </div>
                        <!--div class="summary-row">
                            <span>Tax (10%):</span>
                            <span>&#8358;${(total * 0.1).toFixed(2)}</span>
                        </div-->
                        <div class="summary-row total">
                            <span>Total:</span>
                            <span>&#8358;${(total).toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="cart-actions">
                        <button class="btn btn-danger" onclick="ordersManager.clearCart('${order.id}')" 
                                ${order.items.length === 0 ? 'disabled' : ''}>
                            <i class="fas fa-trash"></i> Clear Cart
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getQuickProductsHTML() {
        // Show first 6 products for quick access
        const quickProducts = this.products.slice(0, 6);
        
        return quickProducts.map(product => `
            <div class="product-item-small" onclick="ordersManager.addProductToOrder(${product.id})">
                <div class="product-name">${this.escapeHtml(product.name)}</div>
                <div class="product-price">&#8358;${parseFloat(product.unit_price || 0).toFixed(2)}</div>
                <div class="product-stock">Stock: ${product.quantity || 0}</div>
            </div>
        `).join('');
    }

    getCartItemsHTML(order) {
        if (order.items.length === 0) {
            return '<div class="text-center" style="color: rgba(255,255,255,0.5); padding: 40px;">Cart is empty</div>';
        }

        return order.items.map((item, index) => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${this.escapeHtml(item.name)}</div>
                    <div class="cart-item-price">&#8358;${parseFloat(item.price).toFixed(2)} each</div>
                </div>
                <div class="cart-item-controls">
                    <div class="quantity-control">
                        <button class="quantity-btn" onclick="ordersManager.updateQuantity('${order.id}', ${index}, ${item.quantity - 1})">-</button>
                        <input type="number" class="quantity-input" value="${item.quantity}" 
                               min="1" onchange="ordersManager.updateQuantity('${order.id}', ${index}, parseInt(this.value))">
                        <button class="quantity-btn" onclick="ordersManager.updateQuantity('${order.id}', ${index}, ${item.quantity + 1})">+</button>
                    </div>
                    <div class="cart-item-total">&#8358;${(item.price * item.quantity).toFixed(2)}</div>
                    <button class="cart-item-remove" onclick="ordersManager.removeItem('${order.id}', ${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    setupWorkspaceEventListeners(order) {
        // Quick search functionality
        const quickSearch = document.getElementById('quickSearchProducts');
        if (quickSearch) {
            quickSearch.addEventListener('input', (e) => {
                this.filterQuickProducts(e.target.value);
            });
        }
    }

    filterQuickProducts(searchTerm) {
        const quickProductsGrid = document.getElementById('quickProductsGrid');
        if (!quickProductsGrid) return;

        const filteredProducts = this.products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 6); // Limit to 6 products

        quickProductsGrid.innerHTML = filteredProducts.map(product => `
            <div class="product-item-small" onclick="ordersManager.addProductToOrder(${product.id})">
                <div class="product-name">${this.escapeHtml(product.name)}</div>
                <div class="product-price">&#8358;${parseFloat(product.unit_price || 0).toFixed(2)}</div>
                <div class="product-stock">Stock: ${product.quantity || 0}</div>
            </div>
        `).join('');
    }

    addProductToOrder(productId) {
        if (!this.activeOrderId) {
            inventoryManager.showNotification('Please select or create an order first', 'error');
            return;
        }

        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        // Check stock
        if ((product.quantity || 0) <= 0) {
            inventoryManager.showNotification('Product is out of stock', 'error');
            return;
        }

        const order = this.orders.find(o => o.id === this.activeOrderId);
        if (!order) return;

        // Check if product already in cart
        const existingItem = order.items.find(item => item.productId === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            order.items.push({
                productId: product.id,
                name: product.name,
                price: product.unit_price,
                quantity: 1
            });
        }

        // Update UI
        this.updateOrderTab(order);
        this.renderOrderWorkspace(this.activeOrderId);
        
        inventoryManager.showNotification(`${product.name} added to order`, 'success');
        this.closeProductsModal();
    }

    updateQuantity(orderId, itemIndex, newQuantity) {
        if (newQuantity < 1) return;

        const order = this.orders.find(o => o.id === orderId);
        if (!order || !order.items[itemIndex]) return;

        order.items[itemIndex].quantity = newQuantity;
        this.updateOrderTab(order);
        this.renderOrderWorkspace(orderId);
    }

    removeItem(orderId, itemIndex) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order || !order.items[itemIndex]) return;

        order.items.splice(itemIndex, 1);
        this.updateOrderTab(order);
        this.renderOrderWorkspace(orderId);
        
        inventoryManager.showNotification('Item removed from order', 'success');
    }

    clearCart(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        if (confirm('Are you sure you want to clear all items from this order?')) {
            order.items = [];
            this.updateOrderTab(order);
            this.renderOrderWorkspace(orderId);
            inventoryManager.showNotification('Cart cleared', 'success');
        }
    }

    updateOrderTab(order) {
        const tab = document.querySelector(`[data-order-id="${order.id}"]`);
        if (tab) {
            const info = tab.querySelector('.order-tab-info');
            const items = tab.querySelector('.order-tab-items');
            
            if (info) info.textContent = `${order.items.length} items`;
            if (items) items.textContent = `₦${this.calculateOrderTotal(order).toFixed(2)}`;
        }
    }

    calculateOrderTotal(order) {
        return order.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    closeOrderTab(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        if (order.items.length > 0 && !confirm('This order has items. Are you sure you want to close it?')) {
            return;
        }

        // Remove from orders array
        this.orders = this.orders.filter(o => o.id !== orderId);
        
        // Remove tab
        const tab = document.querySelector(`[data-order-id="${orderId}"]`);
        if (tab) {
            tab.remove();
        }

        // If this was the active order, switch to another or show placeholder
        if (this.activeOrderId === orderId) {
            this.activeOrderId = null;
            const remainingOrders = this.orders.filter(o => o.id !== orderId);
            
            if (remainingOrders.length > 0) {
                this.switchToOrder(remainingOrders[0].id);
            } else {
                this.showNoOrderSelected();
            }
        }

        this.updateTabsPlaceholder();
        inventoryManager.showNotification('Order tab closed', 'success');
    }

    showNoOrderSelected() {
        const orderContent = document.getElementById('orderContent');
        const noOrderMsg = orderContent.querySelector('.no-order-selected');
        const workspace = orderContent.querySelector('.order-workspace');
        
        if (noOrderMsg) noOrderMsg.style.display = 'block';
        if (workspace) workspace.remove();
    }

    updateTabsPlaceholder() {
        const tabsContainer = document.getElementById('ordersTabs');
        const placeholder = tabsContainer.querySelector('.order-tab-placeholder');
        
        if (placeholder) {
            placeholder.style.display = this.orders.length === 0 ? 'block' : 'none';
        }
    }

    openProductsModal() {
        document.getElementById('productsModal').classList.add('active');
    }

    closeProductsModal() {
        document.getElementById('productsModal').classList.remove('active');
    }

    openCheckoutModal(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const subtotal = this.calculateOrderTotal(order);
        const tax = subtotal * 0.1;
        const total = subtotal + tax;

        document.getElementById('checkoutOrderId').value = orderId;
        document.getElementById('checkoutSubtotal').textContent = `₦${subtotal.toFixed(2)}`;
        // document.getElementById('checkoutTax').textContent = `₦${tax.toFixed(2)}`;
        document.getElementById('checkoutTotal').textContent = `₦${total.toFixed(2)}`;
        document.getElementById('customerName').value = order.customer;

        document.getElementById('checkoutModal').classList.add('active');
    }

    closeCheckoutModal() {
        document.getElementById('checkoutModal').classList.remove('active');
    }

    toggleCashPaymentSection(paymentMethod) {
        const cashSection = document.getElementById('cashPaymentSection');
        const changeDisplay = document.getElementById('changeDisplay');
        
        if (paymentMethod === 'cash') {
            cashSection.style.display = 'block';
            this.calculateChange(document.getElementById('amountTendered').value);
        } else {
            cashSection.style.display = 'none';
            changeDisplay.style.display = 'none';
        }
    }

    calculateChange(amountTendered) {
        const total = parseFloat(document.getElementById('checkoutTotal').textContent.replace('$', ''));
        const tendered = parseFloat(amountTendered) || 0;
        const change = tendered - total;

        const changeDisplay = document.getElementById('changeDisplay');
        const changeAmount = document.getElementById('changeAmount');

        if (change > 0) {
            changeDisplay.style.display = 'block';
            changeAmount.textContent = `&#8358;${change.toFixed(2)}`;
            changeAmount.style.color = '#2ecc71';
        } else if (change < 0) {
            changeDisplay.style.display = 'block';
            changeAmount.textContent = `-&#8358;${Math.abs(change).toFixed(2)}`;
            changeAmount.style.color = '#e74c3c';
        } else {
            changeDisplay.style.display = 'none';
        }
    }

    async completeOrder() {
        const orderId = document.getElementById('checkoutOrderId').value;
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        const customerName = document.getElementById('customerName').value || 'Walk-in Customer';
        const customerPhone = document.getElementById('customerPhone').value;
        const paymentMethod = document.getElementById('paymentMethod').value;

        // Validate cash payment
        if (paymentMethod === 'cash') {
            const amountTendered = parseFloat(document.getElementById('amountTendered').value) || 0;
            const total = parseFloat(document.getElementById('checkoutTotal').textContent.replace('$', ''));
            
            if (amountTendered < total) {
                inventoryManager.showNotification('Amount tendered is less than total amount', 'error');
                return;
            }
        }

        const completeBtn = document.getElementById('completeOrderBtn');
        inventoryManager.showButtonLoading(completeBtn);

        try {
            // Create order session
            const sessionResult = await inventoryManager.apiRequest('/order/new', {
                method: 'POST',
                body: JSON.stringify({
                    customer_name: customerName,
                    customer_phone: customerPhone
                })
            });

            if (!sessionResult.success) {
                throw new Error(sessionResult.message || 'Failed to create order session');
            }

            const sessionId = sessionResult.data.session_id || sessionResult.data.id;

            // Add order items
            for (const item of order.items) {
                const itemResult = await inventoryManager.apiRequest(`/save-order-item/${sessionId}`, {
                    method: 'POST',
                    body: JSON.stringify({
                        product_id: item.productId,
                        quantity: item.quantity,
                        price: item.price
                    })
                });

                if (!itemResult.success) {
                    throw new Error(`Failed to add item: ${item.name}`);
                }
            }

            inventoryManager.showNotification('Order completed successfully!', 'success');
            this.closeCheckoutModal();
            this.closeOrderTab(orderId);

        } catch (error) {
            console.error('Order completion failed:', error);
            inventoryManager.showNotification(
                error.message || 'Failed to complete order. Please try again.',
                'error'
            );
        } finally {
            inventoryManager.hideButtonLoading(completeBtn);
        }
    }

    showActiveOrders() {
        this.renderActiveOrdersTable();
        document.getElementById('activeOrdersModal').classList.add('active');
    }

    closeActiveOrdersModal() {
        document.getElementById('activeOrdersModal').classList.remove('active');
    }

    renderActiveOrdersTable() {
        const tableBody = document.getElementById('activeOrdersTableBody');
        if (!tableBody) return;

        // For now, show local orders. In production, you'd fetch from API
        const ordersToShow = this.orders.filter(order => order.status === 'draft');

        if (ordersToShow.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">
                        <div class="empty-state">
                            <i class="fas fa-list"></i>
                            <p>No active orders found</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = ordersToShow.map(order => `
            <tr>
                <td>${order.number}</td>
                <td>${this.escapeHtml(order.customer)}</td>
                <td>${order.items.length}</td>
                <td>$${this.calculateOrderTotal(order).toFixed(2)}</td>
                <td>
                    <span class="status-badge status-${order.status}">
                        ${order.status}
                    </span>
                </td>
                <td>${inventoryManager.formatDate(order.createdAt)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-edit" onclick="ordersManager.switchToOrder('${order.id}')" title="Open">
                            <i class="fas fa-external-link-alt"></i>
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

// Initialize orders manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing OrdersManager...');
    window.ordersManager = new OrdersManager();
});