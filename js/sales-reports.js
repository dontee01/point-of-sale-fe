// Sales Reports Management JavaScript
class SalesReportsManager {
    constructor() {
        this.currentReport = null;
        this.filters = {
            start_date: null,
            end_date: null,
            payment_status: '',
            payment_method: '',
            group_by: '',
            page: 1,
            per_page: 50
        };
        this.charts = {};
        this.pagination = {
            current_page: 1,
            last_page: 1,
            total: 0
        };
        this.init();
    }

    init() {
        this.initializeDatePickers();
        this.setupEventListeners();
        this.loadDashboardStats();
    }

    initializeDatePickers() {
        // Set default dates (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        flatpickr('#dateFrom', {
            dateFormat: 'Y-m-d',
            defaultDate: thirtyDaysAgo,
            onChange: (selectedDates) => {
                this.filters.start_date = selectedDates[0] ? selectedDates[0].toISOString().split('T')[0] : null;
            }
        });

        flatpickr('#dateTo', {
            dateFormat: 'Y-m-d',
            defaultDate: new Date(),
            onChange: (selectedDates) => {
                this.filters.end_date = selectedDates[0] ? selectedDates[0].toISOString().split('T')[0] : null;
            }
        });

        // Set initial filter values
        this.filters.start_date = thirtyDaysAgo.toISOString().split('T')[0];
        this.filters.end_date = new Date().toISOString().split('T')[0];
    }

    setupEventListeners() {
        // Generate report button
        document.getElementById('generateReportBtn').addEventListener('click', () => {
            this.generateSalesReport();
        });

        // Reset filters button
        document.getElementById('resetFiltersBtn').addEventListener('click', () => {
            this.resetFilters();
        });

        // Refresh dashboard
        document.getElementById('refreshDashboard').addEventListener('click', () => {
            this.loadDashboardStats();
        });

        // Pagination
        document.getElementById('prevPageBtn').addEventListener('click', () => {
            this.previousPage();
        });

        document.getElementById('nextPageBtn').addEventListener('click', () => {
            this.nextPage();
        });

        // Chart type change
        document.getElementById('chartType').addEventListener('change', (e) => {
            if (this.currentReport && this.currentReport.data && this.currentReport.data.length > 0) {
                this.renderSalesTrendChart(this.currentReport.data, e.target.value);
            }
        });

        // Filter changes
        document.getElementById('paymentStatus').addEventListener('change', (e) => {
            this.filters.payment_status = e.target.value;
        });

        document.getElementById('paymentMethod').addEventListener('change', (e) => {
            this.filters.payment_method = e.target.value;
        });

        document.getElementById('groupBy').addEventListener('change', (e) => {
            this.filters.group_by = e.target.value;
        });
    }

    async loadDashboardStats() {
        try {
            const result = await inventoryManager.apiRequest('/sales-dashboard');
            
            if (result.success && result.data) {
                this.updateDashboardStats(result.data);
            } else {
                throw new Error(result.message || 'Failed to load dashboard stats');
            }
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
            inventoryManager.showNotification('Failed to load dashboard statistics', 'error');
        }
    }

    updateDashboardStats(data) {
        document.getElementById('todaySales').textContent = `$${parseFloat(data.today_sales || 0).toFixed(2)}`;
        document.getElementById('yesterdaySales').textContent = `$${parseFloat(data.yesterday_sales || 0).toFixed(2)}`;
        document.getElementById('thisMonthSales').textContent = `$${parseFloat(data.this_month_sales || 0).toFixed(2)}`;
        document.getElementById('lastMonthSales').textContent = `$${parseFloat(data.last_month_sales || 0).toFixed(2)}`;
        document.getElementById('todayCustomers').textContent = data.total_customers_today || 0;
        document.getElementById('pendingPayments').textContent = data.pending_payments || 0;
    }

    async generateSalesReport() {
        this.showLoading();
        
        try {
            // Build query parameters
            const params = new URLSearchParams();
            
            Object.entries(this.filters).forEach(([key, value]) => {
                if (value && key !== 'page' && key !== 'per_page') {
                    params.append(key, value);
                }
            });

            if (!this.filters.group_by) {
                params.append('page', this.filters.page);
                params.append('per_page', this.filters.per_page);
            }

            const result = await inventoryManager.apiRequest(`/sales-report?${params}`);
            
            if (result.success) {
                this.currentReport = result;
                this.displayReport(result);
                inventoryManager.showNotification('Sales report generated successfully', 'success');
            } else {
                throw new Error(result.message || 'Failed to generate sales report');
            }
        } catch (error) {
            console.error('Failed to generate sales report:', error);
            inventoryManager.showNotification(error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    displayReport(report) {
        // Show report summary section
        document.getElementById('reportSummary').style.display = 'block';
        
        // Update summary cards
        this.updateSummaryCards(report.summary);
        
        // Handle data display based on grouping
        if (this.filters.group_by) {
            this.displayGroupedData(report.data);
        } else {
            this.displayDetailedData(report.data);
        }
        
        // Render charts if we have trend data
        if (report.data && report.data.length > 0 && this.filters.group_by) {
            this.renderSalesTrendChart(report.data);
            this.renderPaymentBreakdownCharts(report.summary);
        }
    }

    updateSummaryCards(summary) {
        const overview = summary.overview || {};
        const cardsContainer = document.getElementById('summaryCards');
        
        cardsContainer.innerHTML = `
            <div class="summary-card">
                <div class="value">${overview.total_transactions || 0}</div>
                <div class="label">Total Transactions</div>
            </div>
            <div class="summary-card">
                <div class="value">$${parseFloat(overview.gross_sales || 0).toFixed(2)}</div>
                <div class="label">Gross Sales</div>
            </div>
            <div class="summary-card">
                <div class="value">$${parseFloat(overview.net_sales || 0).toFixed(2)}</div>
                <div class="label">Net Sales</div>
            </div>
            <div class="summary-card">
                <div class="value">$${parseFloat(overview.average_transaction_value || 0).toFixed(2)}</div>
                <div class="label">Average Transaction</div>
            </div>
            <div class="summary-card">
                <div class="value">${overview.total_quantity_sold || 0}</div>
                <div class="label">Quantity Sold</div>
            </div>
            <div class="summary-card">
                <div class="value">${overview.total_customers || 0}</div>
                <div class="label">Unique Customers</div>
            </div>
        `;
    }

    displayGroupedData(data) {
        // Hide detailed table, show grouped table
        document.getElementById('salesTableSection').style.display = 'none';
        document.getElementById('groupedTableSection').style.display = 'block';
        
        // Show charts
        document.getElementById('trendChartSection').style.display = 'block';
        document.getElementById('paymentMethodsSection').style.display = 'block';
        
        // Update grouped table title and header based on grouping type
        const groupBy = this.filters.group_by;
        const periodHeader = this.getPeriodHeaderText(groupBy);
        
        document.getElementById('groupedTableTitle').textContent = `Sales Data Grouped by ${periodHeader}`;
        document.getElementById('groupedPeriodHeader').textContent = periodHeader;
        
        // Populate grouped table
        const tbody = document.getElementById('groupedTableBody');
        tbody.innerHTML = data.map(item => `
            <tr>
                <td>${this.formatPeriod(item.period, groupBy)}</td>
                <td>${item.total_transactions || 0}</td>
                <td>${item.total_quantity || 0}</td>
                <td>$${parseFloat(item.total_sales || 0).toFixed(2)}</td>
                <td>$${parseFloat(item.total_amount_paid || 0).toFixed(2)}</td>
                <td>$${parseFloat(item.average_sale_value || 0).toFixed(2)}</td>
                <td>${item.unique_customers || 0}</td>
            </tr>
        `).join('');
        
        // Hide pagination for grouped data
        document.querySelector('.table-actions').style.display = 'none';
    }

    displayDetailedData(data) {
        // Hide grouped table, show detailed table
        document.getElementById('groupedTableSection').style.display = 'none';
        document.getElementById('salesTableSection').style.display = 'block';
        
        // Hide charts for detailed view
        document.getElementById('trendChartSection').style.display = 'none';
        document.getElementById('paymentMethodsSection').style.display = 'none';
        
        // Update pagination
        this.updatePagination(data);
        
        // Populate detailed table
        const tbody = document.getElementById('salesTableBody');
        const salesData = data.data || [];
        
        tbody.innerHTML = salesData.map(sale => `
            <tr>
                <td>${sale.transaction_ref || 'N/A'}</td>
                <td>${inventoryManager.formatDate(sale.created_at)}</td>
                <td>${sale.quantity || 0}</td>
                <td>$${parseFloat(sale.total || 0).toFixed(2)}</td>
                <td>$${parseFloat(sale.amount_paid || 0).toFixed(2)}</td>
                <td>${sale.payment_method || 'N/A'}</td>
                <td>
                    <span class="status-badge status-${sale.payment_status || 'pending'}">
                        ${sale.payment_status || 'pending'}
                    </span>
                </td>
                <td>${sale.user?.name || sale.user?.email || 'Guest'}</td>
            </tr>
        `).join('');
        
        // Show pagination
        document.querySelector('.table-actions').style.display = 'flex';
    }

    updatePagination(data) {
        this.pagination = {
            current_page: data.current_page || 1,
            last_page: data.last_page || 1,
            total: data.total || 0
        };
        
        document.getElementById('pageInfo').textContent = `Page ${this.pagination.current_page} of ${this.pagination.last_page}`;
        document.getElementById('paginationInfo').textContent = `Showing ${((this.pagination.current_page - 1) * this.filters.per_page) + 1} to ${Math.min(this.pagination.current_page * this.filters.per_page, this.pagination.total)} of ${this.pagination.total} entries`;
        
        document.getElementById('prevPageBtn').disabled = this.pagination.current_page <= 1;
        document.getElementById('nextPageBtn').disabled = this.pagination.current_page >= this.pagination.last_page;
    }

    previousPage() {
        if (this.pagination.current_page > 1) {
            this.filters.page = this.pagination.current_page - 1;
            this.generateSalesReport();
        }
    }

    nextPage() {
        if (this.pagination.current_page < this.pagination.last_page) {
            this.filters.page = this.pagination.current_page + 1;
            this.generateSalesReport();
        }
    }

    renderSalesTrendChart(data, chartType = 'line') {
        const ctx = document.getElementById('salesTrendChart').getContext('2d');
        
        // Destroy existing chart
        if (this.charts.salesTrend) {
            this.charts.salesTrend.destroy();
        }

        const labels = data.map(item => this.formatPeriodForChart(item.period, this.filters.group_by));
        const salesData = data.map(item => parseFloat(item.total_sales || 0));

        this.charts.salesTrend = new Chart(ctx, {
            type: chartType,
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Sales',
                    data: salesData,
                    borderColor: '#A4508B',
                    backgroundColor: chartType === 'line' ? 'rgba(164, 80, 139, 0.1)' : '#A4508B',
                    borderWidth: 2,
                    fill: chartType === 'line',
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
                        ticks: { 
                            color: 'white',
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    }
                }
            }
        });
    }

    renderPaymentBreakdownCharts(summary) {
        this.renderPaymentMethodsChart(summary.payment_methods);
        this.renderPaymentStatusChart(summary.payment_statuses);
    }

    renderPaymentMethodsChart(paymentMethods) {
        const ctx = document.getElementById('paymentMethodsChart').getContext('2d');
        
        if (this.charts.paymentMethods) {
            this.charts.paymentMethods.destroy();
        }

        const labels = paymentMethods.map(pm => pm.payment_method);
        const data = paymentMethods.map(pm => parseFloat(pm.total_amount || 0));

        this.charts.paymentMethods = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#A4508B', '#6A3093', '#2C3E50', '#3498DB', '#2ECC71'
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

    renderPaymentStatusChart(paymentStatuses) {
        const ctx = document.getElementById('paymentStatusChart').getContext('2d');
        
        if (this.charts.paymentStatus) {
            this.charts.paymentStatus.destroy();
        }

        const labels = paymentStatuses.map(ps => ps.payment_status);
        const data = paymentStatuses.map(ps => parseInt(ps.transaction_count || 0));

        this.charts.paymentStatus = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#F1C40F', '#2ECC71', '#3498DB', '#E74C3C'
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

    resetFilters() {
        // Reset date filters to default (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        this.filters = {
            start_date: thirtyDaysAgo.toISOString().split('T')[0],
            end_date: new Date().toISOString().split('T')[0],
            payment_status: '',
            payment_method: '',
            group_by: '',
            page: 1,
            per_page: 50
        };

        // Update UI
        flatpickr('#dateFrom').setDate(thirtyDaysAgo);
        flatpickr('#dateTo').setDate(new Date());
        document.getElementById('paymentStatus').value = '';
        document.getElementById('paymentMethod').value = '';
        document.getElementById('groupBy').value = '';

        inventoryManager.showNotification('Filters reset to default', 'success');
    }

    exportReport() {
        if (!this.currentReport) {
            inventoryManager.showNotification('No report data to export', 'error');
            return;
        }

        let csvContent = '';
        const data = this.currentReport.data;
        
        if (this.filters.group_by) {
            // Export grouped data
            csvContent = 'Period,Transactions,Quantity,Sales Amount,Amount Paid,Average Sale,Unique Customers\n';
            data.forEach(item => {
                csvContent += `"${this.formatPeriod(item.period, this.filters.group_by)}",${item.total_transactions},${item.total_quantity},${item.total_sales},${item.total_amount_paid},${item.average_sale_value},${item.unique_customers}\n`;
            });
        } else {
            // Export detailed data
            csvContent = 'Transaction Ref,Date,Quantity,Total Amount,Amount Paid,Payment Method,Payment Status,User\n';
            const salesData = data.data || [];
            salesData.forEach(sale => {
                csvContent += `"${sale.transaction_ref || ''}","${inventoryManager.formatDate(sale.created_at)}",${sale.quantity},${sale.total},${sale.amount_paid},"${sale.payment_method}","${sale.payment_status}","${sale.user?.name || ''}"\n`;
            });
        }

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        inventoryManager.showNotification('Report exported successfully', 'success');
    }

    printReport() {
        window.print();
    }

    // Utility Methods
    getPeriodHeaderText(groupBy) {
        switch (groupBy) {
            case 'daily': return 'Date';
            case 'weekly': return 'Week';
            case 'monthly': return 'Month';
            case 'yearly': return 'Year';
            default: return 'Period';
        }
    }

    formatPeriod(period, groupBy) {
        switch (groupBy) {
            case 'daily':
                return new Date(period).toLocaleDateString();
            case 'weekly':
                const [year, week] = period.split('-');
                return `Week ${week}, ${year}`;
            case 'monthly':
                const [yearM, month] = period.split('-');
                return new Date(yearM, month - 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
            case 'yearly':
                return period;
            default:
                return period;
        }
    }

    formatPeriodForChart(period, groupBy) {
        switch (groupBy) {
            case 'daily':
                return new Date(period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            case 'weekly':
                const [year, week] = period.split('-');
                return `W${week}`;
            case 'monthly':
                const [yearM, month] = period.split('-');
                return new Date(yearM, month - 1).toLocaleDateString('en-US', { month: 'short' });
            case 'yearly':
                return period;
            default:
                return period;
        }
    }

    showLoading() {
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }
}

// Initialize sales reports manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing SalesReportsManager...');
    window.salesReportsManager = new SalesReportsManager();
});