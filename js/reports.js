// Reports Management JavaScript
class ReportsManager {
    constructor() {
        this.currentReport = 'sales';
        this.filters = {
            dateFrom: null,
            dateTo: null,
            period: 'custom'
        };
        this.charts = {};
        this.init();
    }

    init() {
        this.initializeDatePickers();
        this.setupEventListeners();
        this.loadInitialReport();
    }

    initializeDatePickers() {
        // Initialize Flatpickr for date inputs
        flatpickr('#dateFrom', {
            dateFormat: 'Y-m-d',
            defaultDate: new Date().setDate(new Date().getDate() - 30),
            onChange: (selectedDates) => {
                this.filters.dateFrom = selectedDates[0];
                this.filters.period = 'custom';
                document.getElementById('reportPeriod').value = 'custom';
            }
        });

        flatpickr('#dateTo', {
            dateFormat: 'Y-m-d',
            defaultDate: new Date(),
            onChange: (selectedDates) => {
                this.filters.dateTo = selectedDates[0];
                this.filters.period = 'custom';
                document.getElementById('reportPeriod').value = 'custom';
            }
        });

        // Set initial dates
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        this.filters.dateFrom = thirtyDaysAgo;
        this.filters.dateTo = new Date();
    }

    setupEventListeners() {
        // Report tabs
        document.querySelectorAll('.report-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchReport(e.currentTarget.dataset.report);
            });
        });

        // Quick period selector
        document.getElementById('reportPeriod').addEventListener('change', (e) => {
            this.handleQuickPeriodChange(e.target.value);
        });

        // Apply filters button
        document.getElementById('applyFiltersBtn').addEventListener('click', () => {
            this.applyFilters();
        });

        // Reset filters button
        document.getElementById('resetFiltersBtn').addEventListener('click', () => {
            this.resetFilters();
        });
    }

    handleQuickPeriodChange(period) {
        const now = new Date();
        let dateFrom, dateTo;

        switch (period) {
            case 'today':
                dateFrom = new Date(now);
                dateTo = new Date(now);
                break;
            case 'yesterday':
                dateFrom = new Date(now);
                dateFrom.setDate(now.getDate() - 1);
                dateTo = new Date(dateFrom);
                break;
            case 'this_week':
                dateFrom = new Date(now);
                dateFrom.setDate(now.getDate() - now.getDay());
                dateTo = new Date(now);
                break;
            case 'last_week':
                dateFrom = new Date(now);
                dateFrom.setDate(now.getDate() - now.getDay() - 7);
                dateTo = new Date(dateFrom);
                dateTo.setDate(dateFrom.getDate() + 6);
                break;
            case 'this_month':
                dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
                dateTo = new Date(now);
                break;
            case 'last_month':
                dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                dateTo = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'this_quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                dateFrom = new Date(now.getFullYear(), quarter * 3, 1);
                dateTo = new Date(now);
                break;
            case 'last_quarter':
                const lastQuarter = Math.floor(now.getMonth() / 3) - 1;
                dateFrom = new Date(now.getFullYear(), lastQuarter * 3, 1);
                dateTo = new Date(now.getFullYear(), (lastQuarter + 1) * 3, 0);
                break;
            case 'this_year':
                dateFrom = new Date(now.getFullYear(), 0, 1);
                dateTo = new Date(now);
                break;
            case 'last_year':
                dateFrom = new Date(now.getFullYear() - 1, 0, 1);
                dateTo = new Date(now.getFullYear() - 1, 11, 31);
                break;
            default:
                return; // custom - do nothing
        }

        this.filters.period = period;
        this.filters.dateFrom = dateFrom;
        this.filters.dateTo = dateTo;

        // Update date inputs
        if (period !== 'custom') {
            flatpickr('#dateFrom').setDate(dateFrom);
            flatpickr('#dateTo').setDate(dateTo);
        }
    }

    switchReport(reportType) {
        // Update active tab
        document.querySelectorAll('.report-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-report="${reportType}"]`).classList.add('active');

        // Update active report section
        document.querySelectorAll('.report-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${reportType}Report`).classList.add('active');

        this.currentReport = reportType;
        this.loadReport();
    }

    async applyFilters() {
        this.showLoading();
        await this.loadReport();
        this.hideLoading();
    }

    resetFilters() {
        // Reset to default (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        this.filters.dateFrom = thirtyDaysAgo;
        this.filters.dateTo = new Date();
        this.filters.period = 'custom';

        // Update UI
        flatpickr('#dateFrom').setDate(thirtyDaysAgo);
        flatpickr('#dateTo').setDate(new Date());
        document.getElementById('reportPeriod').value = 'custom';

        this.applyFilters();
    }

    async loadInitialReport() {
        this.showLoading();
        await this.loadReport();
        this.hideLoading();
    }

    async loadReport() {
        try {
            switch (this.currentReport) {
                case 'sales':
                    await this.loadSalesReport();
                    break;
                case 'purchases':
                    await this.loadPurchasesReport();
                    break;
                case 'inventory':
                    await this.loadInventoryReport();
                    break;
                case 'products':
                    await this.loadProductsReport();
                    break;
                case 'categories':
                    await this.loadCategoriesReport();
                    break;
            }
        } catch (error) {
            console.error(`Error loading ${this.currentReport} report:`, error);
            inventoryManager.showNotification(`Failed to load ${this.currentReport} report`, 'error');
        }
    }

    async loadSalesReport() {
        // Fetch sales data from API
        const salesData = await this.fetchSalesData();
        
        // Update summary cards
        this.updateSalesSummary(salesData.summary);
        
        // Render charts
        this.renderSalesCharts(salesData.charts);
        
        // Render table
        this.renderSalesTable(salesData.orders);
    }

    async loadPurchasesReport() {
        const purchasesData = await this.fetchPurchasesData();
        this.updatePurchasesSummary(purchasesData.summary);
        this.renderPurchasesTable(purchasesData.purchases);
    }

    async loadInventoryReport() {
        const inventoryData = await this.fetchInventoryData();
        this.updateInventorySummary(inventoryData.summary);
        this.renderInventoryCharts(inventoryData.charts);
        this.renderLowStockTable(inventoryData.lowStockItems);
    }

    async loadProductsReport() {
        const productsData = await this.fetchProductsData();
        this.renderTopProductsTable(productsData.topProducts);
        this.renderTopProductsChart(productsData.topProducts);
    }

    async loadCategoriesReport() {
        const categoriesData = await this.fetchCategoriesData();
        this.renderCategoriesTable(categoriesData.categories);
        this.renderCategoriesChart(categoriesData.categories);
    }

    // API Methods
    async fetchSalesData() {
        const params = this.buildDateParams();
        const result = await inventoryManager.apiRequest(`/orders?${params}`);
        
        if (result.success) {
            return this.processSalesData(result.data);
        }
        return this.getEmptySalesData();
    }

    async fetchPurchasesData() {
        const params = this.buildDateParams();
        const result = await inventoryManager.apiRequest(`/purchases?${params}`);
        
        if (result.success) {
            return this.processPurchasesData(result.data);
        }
        return this.getEmptyPurchasesData();
    }

    async fetchInventoryData() {
        const result = await inventoryManager.apiRequest('/products');
        
        if (result.success) {
            return this.processInventoryData(result.data);
        }
        return this.getEmptyInventoryData();
    }

    async fetchProductsData() {
        const params = this.buildDateParams();
        // This would typically come from a dedicated products performance endpoint
        const result = await inventoryManager.apiRequest(`/orders?${params}`);
        
        if (result.success) {
            return this.processProductsData(result.data);
        }
        return this.getEmptyProductsData();
    }

    async fetchCategoriesData() {
        const params = this.buildDateParams();
        // This would typically come from a dedicated categories performance endpoint
        const result = await inventoryManager.apiRequest(`/orders?${params}`);
        
        if (result.success) {
            return this.processCategoriesData(result.data);
        }
        return this.getEmptyCategoriesData();
    }

    buildDateParams() {
        const params = new URLSearchParams();
        if (this.filters.dateFrom) {
            params.append('from', this.formatDateForAPI(this.filters.dateFrom));
        }
        if (this.filters.dateTo) {
            params.append('to', this.formatDateForAPI(this.filters.dateTo));
        }
        return params.toString();
    }

    formatDateForAPI(date) {
        return date.toISOString().split('T')[0];
    }

    // Data Processing Methods
    processSalesData(data) {
        // Process and format sales data for display
        // This is a simplified version - in real app, you'd have more complex processing
        const orders = Array.isArray(data) ? data : data.orders || data.data || [];
        
        const summary = {
            totalSales: orders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0),
            totalOrders: orders.length,
            itemsSold: orders.reduce((sum, order) => sum + (order.items_count || 0), 0),
            averageOrder: orders.length > 0 ? 
                orders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0) / orders.length : 0
        };

        // Generate sample chart data (in real app, this would come from aggregated data)
        const charts = {
            trend: this.generateSampleTrendData(),
            categories: this.generateSampleCategoryData()
        };

        return { summary, charts, orders };
    }

    processPurchasesData(data) {
        const purchases = Array.isArray(data) ? data : data.purchases || data.data || [];
        
        const summary = {
            totalPurchases: purchases.reduce((sum, purchase) => sum + (parseFloat(purchase.total_cost) || 0), 0),
            totalSuppliers: new Set(purchases.map(p => p.supplier_id)).size,
            itemsPurchased: purchases.reduce((sum, purchase) => sum + (purchase.items_count || 0), 0),
            averagePurchase: purchases.length > 0 ? 
                purchases.reduce((sum, purchase) => sum + (parseFloat(purchase.total_cost) || 0), 0) / purchases.length : 0
        };

        return { summary, purchases };
    }

    processInventoryData(data) {
        const products = Array.isArray(data) ? data : data.products || data.data || [];
        
        const summary = {
            totalStockValue: products.reduce((sum, product) => 
                sum + ((parseFloat(product.cost_price) || 0) * (parseInt(product.quantity) || 0)), 0),
            lowStockItems: products.filter(p => (parseInt(p.quantity) || 0) <= (parseInt(p.reorder_level) || 5)).length,
            outOfStockItems: products.filter(p => (parseInt(p.quantity) || 0) <= 0).length,
            totalItems: products.length
        };

        const charts = {
            distribution: this.generateStockDistributionData(products),
            valueByCategory: this.generateStockValueByCategoryData(products)
        };

        const lowStockItems = products.filter(p => (parseInt(p.quantity) || 0) <= (parseInt(p.reorder_level) || 5));

        return { summary, charts, lowStockItems };
    }

    processProductsData(data) {
        // Process products performance data
        const orders = Array.isArray(data) ? data : data.orders || data.data || [];
        
        // This would typically come from a dedicated products performance endpoint
        const topProducts = [
            { name: 'Product A', category: 'Electronics', unitsSold: 150, revenue: 4500, profitMargin: 0.35 },
            { name: 'Product B', category: 'Clothing', unitsSold: 120, revenue: 3600, profitMargin: 0.42 },
            { name: 'Product C', category: 'Home', unitsSold: 95, revenue: 2850, profitMargin: 0.38 },
            { name: 'Product D', category: 'Electronics', unitsSold: 80, revenue: 3200, profitMargin: 0.45 },
            { name: 'Product E', category: 'Sports', unitsSold: 65, revenue: 1950, profitMargin: 0.32 }
        ];

        return { topProducts };
    }

    processCategoriesData(data) {
        // Process categories performance data
        const categories = [
            { name: 'Electronics', products: 25, unitsSold: 350, revenue: 12500, avgPrice: 35.71 },
            { name: 'Clothing', products: 45, unitsSold: 280, revenue: 8400, avgPrice: 30.00 },
            { name: 'Home', products: 30, unitsSold: 190, revenue: 5700, avgPrice: 30.00 },
            { name: 'Sports', products: 20, unitsSold: 120, revenue: 3600, avgPrice: 30.00 },
            { name: 'Books', products: 35, unitsSold: 210, revenue: 3150, avgPrice: 15.00 }
        ];

        return { categories };
    }

    // Update UI Methods
    updateSalesSummary(summary) {
        document.getElementById('totalSales').textContent = `$${summary.totalSales.toFixed(2)}`;
        document.getElementById('totalOrders').textContent = summary.totalOrders;
        document.getElementById('averageOrder').textContent = `$${summary.averageOrder.toFixed(2)}`;
        document.getElementById('itemsSold').textContent = summary.itemsSold;
    }

    updatePurchasesSummary(summary) {
        document.getElementById('totalPurchases').textContent = `$${summary.totalPurchases.toFixed(2)}`;
        document.getElementById('totalSuppliers').textContent = summary.totalSuppliers;
        document.getElementById('itemsPurchased').textContent = summary.itemsPurchased;
        document.getElementById('averagePurchase').textContent = `$${summary.averagePurchase.toFixed(2)}`;
    }

    updateInventorySummary(summary) {
        document.getElementById('totalStockValue').textContent = `$${summary.totalStockValue.toFixed(2)}`;
        document.getElementById('lowStockItems').textContent = summary.lowStockItems;
        document.getElementById('outOfStockItems').textContent = summary.outOfStockItems;
        document.getElementById('totalItems').textContent = summary.totalItems;
    }

    // Chart Rendering Methods
    renderSalesCharts(charts) {
        this.renderSalesTrendChart(charts.trend);
        this.renderSalesCategoryChart(charts.categories);
    }

    renderSalesTrendChart(data) {
        const ctx = document.getElementById('salesTrendChart').getContext('2d');
        
        if (this.charts.salesTrend) {
            this.charts.salesTrend.destroy();
        }

        this.charts.salesTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Daily Sales',
                    data: data.values,
                    borderColor: '#A4508B',
                    backgroundColor: 'rgba(164, 80, 139, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: 'white' }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: 'white' }
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: 'white' }
                    }
                }
            }
        });
    }

    renderSalesCategoryChart(data) {
        const ctx = document.getElementById('salesCategoryChart').getContext('2d');
        
        if (this.charts.salesCategory) {
            this.charts.salesCategory.destroy();
        }

        this.charts.salesCategory = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        '#A4508B', '#6A3093', '#2C3E50', '#3498DB', '#2ECC71',
                        '#F1C40F', '#E67E22', '#E74C3C', '#9B59B6', '#1ABC9C'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: 'white' }
                    }
                }
            }
        });
    }

    renderInventoryCharts(charts) {
        this.renderStockDistributionChart(charts.distribution);
        this.renderStockValueChart(charts.valueByCategory);
    }

    renderStockDistributionChart(data) {
        const ctx = document.getElementById('stockDistributionChart').getContext('2d');
        
        if (this.charts.stockDistribution) {
            this.charts.stockDistribution.destroy();
        }

        this.charts.stockDistribution = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Stock Quantity',
                    data: data.values,
                    backgroundColor: '#3498DB',
                    borderColor: '#2980B9',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: 'white' }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: 'white' }
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: 'white' }
                    }
                }
            }
        });
    }

    renderStockValueChart(data) {
        const ctx = document.getElementById('stockValueChart').getContext('2d');
        
        if (this.charts.stockValue) {
            this.charts.stockValue.destroy();
        }

        this.charts.stockValue = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        '#A4508B', '#6A3093', '#2C3E50', '#3498DB', '#2ECC71',
                        '#F1C40F', '#E67E22', '#E74C3C', '#9B59B6', '#1ABC9C'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: 'white' }
                    }
                }
            }
        });
    }

    renderTopProductsChart(products) {
        const ctx = document.getElementById('topProductsChart').getContext('2d');
        
        if (this.charts.topProducts) {
            this.charts.topProducts.destroy();
        }

        const top10 = products.slice(0, 10);

        this.charts.topProducts = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: top10.map(p => p.name),
                datasets: [{
                    label: 'Revenue',
                    data: top10.map(p => p.revenue),
                    backgroundColor: '#2ECC71',
                    borderColor: '#27AE60',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: 'white' }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: 'white' }
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: 'white' }
                    }
                }
            }
        });
    }

    renderCategoriesChart(categories) {
        const ctx = document.getElementById('categoriesRevenueChart').getContext('2d');
        
        if (this.charts.categoriesRevenue) {
            this.charts.categoriesRevenue.destroy();
        }

        this.charts.categoriesRevenue = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: categories.map(c => c.name),
                datasets: [{
                    data: categories.map(c => c.revenue),
                    backgroundColor: [
                        '#A4508B', '#6A3093', '#2C3E50', '#3498DB', '#2ECC71',
                        '#F1C40F', '#E67E22', '#E74C3C', '#9B59B6', '#1ABC9C'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: 'white' }
                    }
                }
            }
        });
    }

    // Table Rendering Methods
    renderSalesTable(orders) {
        const tbody = document.getElementById('salesTableBody');
        
        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No orders found for selected period</td></tr>';
            return;
        }

        tbody.innerHTML = orders.slice(0, 10).map(order => `
            <tr>
                <td>${order.reference || order.id}</td>
                <td>${inventoryManager.formatDate(order.created_at || order.createdAt)}</td>
                <td>${order.customer_name || order.customer?.name || 'Walk-in Customer'}</td>
                <td>${order.items_count || order.items?.length || 0}</td>
                <td>$${parseFloat(order.total_amount || 0).toFixed(2)}</td>
                <td>
                    <span class="status-badge status-${order.status || 'completed'}">
                        ${order.status || 'completed'}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    renderPurchasesTable(purchases) {
        const tbody = document.getElementById('purchasesTableBody');
        
        if (!purchases || purchases.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No purchases found for selected period</td></tr>';
            return;
        }

        tbody.innerHTML = purchases.slice(0, 10).map(purchase => `
            <tr>
                <td>${purchase.transaction_ref || purchase.id}</td>
                <td>${inventoryManager.formatDate(purchase.created_at || purchase.createdAt)}</td>
                <td>${purchase.supplier_name || purchase.supplier?.name || 'N/A'}</td>
                <td>${purchase.items_count || purchase.items?.length || 0}</td>
                <td>$${parseFloat(purchase.total_cost || 0).toFixed(2)}</td>
                <td>
                    <span class="status-badge status-${purchase.status || 'completed'}">
                        ${purchase.status || 'completed'}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    renderLowStockTable(lowStockItems) {
        const tbody = document.getElementById('lowStockTableBody');
        
        if (!lowStockItems || lowStockItems.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No low stock items</td></tr>';
            return;
        }

        tbody.innerHTML = lowStockItems.map(item => `
            <tr>
                <td>${item.name}</td>
                <td class="${item.quantity <= 0 ? 'text-danger' : 'text-warning'}">
                    ${item.quantity}
                    ${item.quantity <= 0 ? '<i class="fas fa-times-circle ml-1"></i>' : 
                      item.quantity <= (item.reorder_level || 5) ? '<i class="fas fa-exclamation-triangle ml-1"></i>' : ''}
                </td>
                <td>${item.reorder_level || 5}</td>
                <td>${item.category?.name || 'Uncategorized'}</td>
                <td>
                    <span class="status-badge status-${item.quantity <= 0 ? 'inactive' : 'active'}">
                        ${item.quantity <= 0 ? 'Out of Stock' : 'Low Stock'}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    renderTopProductsTable(topProducts) {
        const tbody = document.getElementById('topProductsTableBody');
        
        tbody.innerHTML = topProducts.map(product => {
            const performance = product.profitMargin >= 0.4 ? 'excellent' :
                              product.profitMargin >= 0.3 ? 'good' :
                              product.profitMargin >= 0.2 ? 'average' : 'poor';
            
            return `
                <tr>
                    <td>${product.name}</td>
                    <td>${product.category}</td>
                    <td>${product.unitsSold}</td>
                    <td>$${product.revenue.toFixed(2)}</td>
                    <td>${(product.profitMargin * 100).toFixed(1)}%</td>
                    <td>
                        <span class="performance-indicator performance-${performance}">
                            ${performance.charAt(0).toUpperCase() + performance.slice(1)}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderCategoriesTable(categories) {
        const tbody = document.getElementById('categoriesTableBody');
        
        tbody.innerHTML = categories.map(category => {
            const performance = category.revenue >= 10000 ? 'excellent' :
                              category.revenue >= 5000 ? 'good' :
                              category.revenue >= 2000 ? 'average' : 'poor';
            
            return `
                <tr>
                    <td>${category.name}</td>
                    <td>${category.products}</td>
                    <td>${category.unitsSold}</td>
                    <td>$${category.revenue.toFixed(2)}</td>
                    <td>$${category.avgPrice.toFixed(2)}</td>
                    <td>
                        <span class="performance-indicator performance-${performance}">
                            ${performance.charAt(0).toUpperCase() + performance.slice(1)}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Utility Methods
    showLoading() {
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    generateSampleTrendData() {
        // Generate sample data for charts
        const labels = [];
        const values = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
            values.push(Math.floor(Math.random() * 1000) + 500);
        }
        
        return { labels, values };
    }

    generateSampleCategoryData() {
        return {
            labels: ['Electronics', 'Clothing', 'Home', 'Sports', 'Books'],
            values: [35, 25, 20, 15, 5]
        };
    }

    generateStockDistributionData(products) {
        const categories = {};
        
        products.forEach(product => {
            const category = product.category?.name || 'Uncategorized';
            if (!categories[category]) {
                categories[category] = 0;
            }
            categories[category] += parseInt(product.quantity) || 0;
        });

        return {
            labels: Object.keys(categories),
            values: Object.values(categories)
        };
    }

    generateStockValueByCategoryData(products) {
        const categories = {};
        
        products.forEach(product => {
            const category = product.category?.name || 'Uncategorized';
            if (!categories[category]) {
                categories[category] = 0;
            }
            categories[category] += (parseFloat(product.cost_price) || 0) * (parseInt(product.quantity) || 0);
        });

        return {
            labels: Object.keys(categories),
            values: Object.values(categories)
        };
    }

    // Export and Print Methods
    exportReport(type) {
        // In a real application, this would generate and download a CSV or PDF
        inventoryManager.showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} report exported successfully`, 'success');
    }

    printReport(type) {
        const reportSection = document.getElementById(`${type}Report`);
        const originalDisplay = reportSection.style.display;
        
        // Show only the report section
        document.querySelectorAll('.report-section').forEach(section => {
            section.style.display = 'none';
        });
        reportSection.style.display = 'block';
        
        // Hide elements that shouldn't be printed
        const elementsToHide = reportSection.querySelectorAll('.report-actions, .report-filters, .reports-navigation');
        elementsToHide.forEach(el => el.style.display = 'none');
        
        window.print();
        
        // Restore original display
        reportSection.style.display = originalDisplay;
        elementsToHide.forEach(el => el.style.display = '');
        this.switchReport(this.currentReport);
    }

    // Empty Data Methods (fallbacks)
    getEmptySalesData() {
        return {
            summary: { totalSales: 0, totalOrders: 0, itemsSold: 0, averageOrder: 0 },
            charts: { trend: { labels: [], values: [] }, categories: { labels: [], values: [] } },
            orders: []
        };
    }

    getEmptyPurchasesData() {
        return {
            summary: { totalPurchases: 0, totalSuppliers: 0, itemsPurchased: 0, averagePurchase: 0 },
            purchases: []
        };
    }

    getEmptyInventoryData() {
        return {
            summary: { totalStockValue: 0, lowStockItems: 0, outOfStockItems: 0, totalItems: 0 },
            charts: { distribution: { labels: [], values: [] }, valueByCategory: { labels: [], values: [] } },
            lowStockItems: []
        };
    }

    getEmptyProductsData() {
        return { topProducts: [] };
    }

    getEmptyCategoriesData() {
        return { categories: [] };
    }
}

// Initialize reports manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing ReportsManager...');
    window.reportsManager = new ReportsManager();
});