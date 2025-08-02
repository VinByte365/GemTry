// This script handles the dashboard functionality and data visualization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize charts with empty data
    initializeCharts();
    
    // Fetch data from the server
    fetchDashboardData();
    
    // Refresh data every 5 minutes
    setInterval(fetchDashboardData, 300000);
});

function initializeCharts() {
    // Sales Over Time Line Chart
    const salesCtx = document.getElementById('salesChart').getContext('2d');
    const salesChart = new Chart(salesCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
            datasets: [{
                label: 'Sales',
                data: [],
                backgroundColor: 'rgba(94, 34, 23, 0.05)',
                borderColor: 'rgba(94, 34, 23, 1)',
                pointBackgroundColor: 'rgba(94, 34, 23, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(94, 34, 23, 1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    // Order Status Doughnut Chart
    const orderStatusCtx = document.getElementById('orderStatusChart').getContext('2d');
    const orderStatusChart = new Chart(orderStatusCtx, {
        type: 'doughnut',
        data: {
            labels: ['Processing', 'Shipped', 'Delivered', 'Cancelled'],
            datasets: [{
                data: [],
                backgroundColor: [
                    'rgba(94, 34, 23, 0.8)',
                    'rgba(139, 69, 19, 0.8)',
                    'rgba(160, 82, 45, 0.8)',
                    'rgba(210, 105, 30, 0.8)'
                ],
                hoverBackgroundColor: [
                    'rgba(94, 34, 23, 1)',
                    'rgba(139, 69, 19, 1)',
                    'rgba(160, 82, 45, 1)',
                    'rgba(210, 105, 30, 1)'
                ],
                hoverBorderColor: "rgba(252, 248, 214, 1)",
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            cutout: '70%'
        }
    });

    // Top Selling Products Bar Chart
    const topProductsCtx = document.getElementById('topProductsChart').getContext('2d');
    const topProductsChart = new Chart(topProductsCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Units Sold',
                data: [],
                backgroundColor: 'rgba(94, 34, 23, 0.8)',
                hoverBackgroundColor: 'rgba(94, 34, 23, 1)',
                borderColor: "",
                borderWidth: 1
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    // Store chart references for later updates
    window.dashboardCharts = {
        sales: salesChart,
        orderStatus: orderStatusChart,
        topProducts: topProductsChart
    };
}

// Function to fetch data from the backend using AJAX
function fetchDashboardData() {
    // Show loading indicator if available
    showLoadingIndicator();
    
    $.ajax({
        url: 'http://localhost:8080/api/v1/dashboard/stats',
        method: 'GET',
        dataType: 'json',
        timeout: 30000, // 30 second timeout
        crossDomain: true,
        xhrFields: {
            withCredentials: false
        },
        beforeSend: function(xhr) {
            // Add any headers if needed
            xhr.setRequestHeader('Content-Type', 'application/json');
        },
        success: function(data) {
            console.log('Dashboard data received:', data);
            
            try {
                // Validate the response structure
                if (!data || typeof data !== 'object') {
                    throw new Error('Invalid response format');
                }
                
                // Process and update dashboard with the received data
                updateDashboard(data);
                
            } catch (error) {
                console.error('Error processing dashboard data:', error);
                showErrorMessage('Failed to process dashboard data');
                loadFallbackData();
            }
        },
        error: function(xhr, status, error) {
            console.error('AJAX Error Details:');
            console.error('Status:', status);
            console.error('Error:', error);
            console.error('Response Text:', xhr.responseText);
            console.error('Status Code:', xhr.status);
            
            let errorMessage = 'Failed to fetch dashboard data.';
            
            // Handle different error types
            switch(status) {
                case 'timeout':
                    errorMessage = 'Request timed out. Please check your connection.';
                    break;
                case 'error':
                    if (xhr.status === 0) {
                        errorMessage = 'Unable to connect to server. Please check if the server is running.';
                    } else if (xhr.status >= 500) {
                        errorMessage = 'Server error occurred. Please try again later.';
                    } else if (xhr.status >= 400) {
                        errorMessage = 'Bad request. Please check the API endpoint.';
                    }
                    break;
                case 'parsererror':
                    errorMessage = 'Invalid response format from server.';
                    break;
            }
            
            showErrorMessage(errorMessage);
            
            // Load fallback data to prevent broken dashboard
            loadFallbackData();
        },
        complete: function() {
            // Hide loading indicator
            hideLoadingIndicator();
        }
    });
}

// Function to update dashboard with fetched data
function updateDashboard(data) {
    try {
        // Safely extract statistics with fallbacks
        const statistics = data.statistics || {};
        const totalProducts = statistics.totalItems || 0;
        const totalOrders = statistics.totalOrders || 0;
        const totalRevenue = parseFloat(statistics.totalSales) || 0;
        
        // Update stat cards
        const productElement = document.getElementById('total-products');
        const ordersElement = document.getElementById('total-orders');
        const revenueElement = document.getElementById('total-revenue');
        
        if (productElement) productElement.textContent = totalProducts.toLocaleString();
        if (ordersElement) ordersElement.textContent = totalOrders.toLocaleString();
        if (revenueElement) revenueElement.textContent = `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        
        // Update sales chart with mock data for now (you can modify backend to provide monthly sales)
        const salesData = data.salesData || generateMockSalesData(totalRevenue);
        if (window.dashboardCharts && window.dashboardCharts.sales) {
            window.dashboardCharts.sales.data.datasets[0].data = salesData;
            window.dashboardCharts.sales.update();
        }
        
        // Update order status chart with calculated data
        const orderStatusData = calculateOrderStatusData(data.recentOrders || []);
        if (window.dashboardCharts && window.dashboardCharts.orderStatus) {
            window.dashboardCharts.orderStatus.data.datasets[0].data = orderStatusData;
            window.dashboardCharts.orderStatus.update();
        }
        
        // Update top products chart
        const topProducts = data.topSellingItems || [];
        const topProductsLabels = topProducts.map(item => item.item_name || 'Unknown').slice(0, 5);
        const topProductsData = topProducts.map(item => parseInt(item.total_quantity) || 0).slice(0, 5);
        
        if (window.dashboardCharts && window.dashboardCharts.topProducts) {
            window.dashboardCharts.topProducts.data.labels = topProductsLabels;
            window.dashboardCharts.topProducts.data.datasets[0].data = topProductsData;
            window.dashboardCharts.topProducts.update();
        }
        
        // Update recent orders table
        updateRecentOrdersTable(data.recentOrders || []);
        
        console.log('Dashboard updated successfully');
        
    } catch (error) {
        console.error('Error updating dashboard:', error);
        showErrorMessage('Failed to update dashboard display');
    }
}

// Function to update recent orders table
function updateRecentOrdersTable(recentOrders) {
    const ordersTable = document.querySelector('#recent-orders tbody');
    
    if (!ordersTable) {
        console.warn('Recent orders table not found');
        return;
    }
    
    if (!recentOrders || recentOrders.length === 0) {
        ordersTable.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No recent orders found</td></tr>';
        return;
    }
    
    ordersTable.innerHTML = '';
    
    recentOrders.forEach(order => {
        const row = document.createElement('tr');
        
        // Format order data safely
        const orderId = order.order_id ? `#ORD-${order.order_id}` : 'N/A';
        const customerName = order.customer_name || 'Anonymous';
        const orderDate = order.order_placed ? new Date(order.order_placed).toLocaleDateString() : 'N/A';
        const totalAmount = parseFloat(order.total_amount) || 0;
        const orderStatus = order.order_status || 'unknown';
        
        // Status badge styling
        let statusClass = '';
        switch(orderStatus.toLowerCase()) {
            case 'processing': statusClass = 'bg-primary'; break;
            case 'shipped': statusClass = 'bg-info'; break;
            case 'delivered': statusClass = 'bg-success'; break;
            case 'cancelled': statusClass = 'bg-danger'; break;
            case 'refunded': statusClass = 'bg-warning'; break;
            default: statusClass = 'bg-secondary';
        }
        
        row.innerHTML = `
            <td>${orderId}</td>
            <td>${customerName}</td>
            <td>${orderDate}</td>
            <td>$${totalAmount.toFixed(2)}</td>
            <td><span class="badge ${statusClass}">${orderStatus}</span></td>
            <td><button class="btn btn-sm btn-outline-primary" onclick="viewOrder(${order.order_id})">View</button></td>
        `;
        
        ordersTable.appendChild(row);
    });
}

// Helper function to calculate order status distribution
function calculateOrderStatusData(orders) {
    const statusCounts = {
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0
    };
    
    orders.forEach(order => {
        const status = (order.order_status || '').toLowerCase();
        if (statusCounts.hasOwnProperty(status)) {
            statusCounts[status]++;
        }
    });
    
    return [statusCounts.processing, statusCounts.shipped, statusCounts.delivered, statusCounts.cancelled];
}

// Helper function to generate mock sales data based on total revenue
function generateMockSalesData(totalRevenue) {
    const baseValue = totalRevenue / 7; // Distribute across 7 months
    return [
        Math.round(baseValue * 0.8),
        Math.round(baseValue * 1.2),
        Math.round(baseValue * 0.9),
        Math.round(baseValue * 1.4),
        Math.round(baseValue * 1.6),
        Math.round(baseValue * 1.3),
        Math.round(baseValue * 1.1)
    ];
}

// Function to load fallback data when server is unavailable
function loadFallbackData() {
    console.warn('Loading fallback data due to server error');
    
    const fallbackData = {
        statistics: {
            totalItems: 0,
            totalSales: 0,
            totalOrders: 0
        },
        recentOrders: [],
        topSellingItems: []
    };
    
    updateDashboard(fallbackData);
}

// Loading indicator functions
function showLoadingIndicator() {
    const indicators = document.querySelectorAll('.dashboard-loading');
    indicators.forEach(indicator => {
        if (indicator) indicator.style.display = 'block';
    });
}

function hideLoadingIndicator() {
    const indicators = document.querySelectorAll('.dashboard-loading');
    indicators.forEach(indicator => {
        if (indicator) indicator.style.display = 'none';
    });
}

// Error message display function
function showErrorMessage(message) {
    console.error('Dashboard Error:', message);
    
    // You can implement a toast notification or alert here
    const errorContainer = document.getElementById('dashboard-error');
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
        
        // Hide error after 5 seconds
        setTimeout(() => {
            errorContainer.style.display = 'none';
        }, 5000);
    }
}

// Function to view order details (placeholder)
function viewOrder(orderId) {
    console.log('View order:', orderId);
    // Implement order view functionality
    alert(`View order #${orderId} - Feature to be implemented`);
}

// Manual refresh function
function refreshDashboard() {
    console.log('Manually refreshing dashboard...');
    fetchDashboardData();
}