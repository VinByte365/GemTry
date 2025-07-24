// This script handles the dashboard functionality and data visualization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize charts with empty data
    initializeCharts();
    
    // Fetch data from the server (placeholder for Express.js backend)
    fetchDashboardData();
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

// Function to fetch data from the backend (Express.js)
function fetchDashboardData() {
    // Placeholder for actual fetch call to your Express.js backend
    // fetch('/api/dashboard')
    //     .then(response => response.json())
    //     .then(data => updateDashboard(data))
    //     .catch(error => console.error('Error fetching dashboard data:', error));
    
    // For demo purposes, we'll use mock data
    const mockData = {
        totalProducts: 124,
        totalOrders: 56,
        totalRevenue: 8924,
        salesData: [1200, 1900, 1500, 2100, 3200, 2800, 3800],
        orderStatusData: [12, 18, 20, 6],
        topProducts: {
            labels: ['Product A', 'Product B', 'Product C', 'Product D', 'Product E'],
            data: [45, 32, 28, 19, 12]
        },
        recentOrders: [
            { id: '#ORD-001', customer: 'John Doe', date: '2023-07-15', amount: 125.99, status: 'Delivered' },
            { id: '#ORD-002', customer: 'Jane Smith', date: '2023-07-14', amount: 89.50, status: 'Shipped' },
            { id: '#ORD-003', customer: 'Robert Johnson', date: '2023-07-14', amount: 210.00, status: 'Processing' },
            { id: '#ORD-004', customer: 'Emily Davis', date: '2023-07-13', amount: 56.75, status: 'Delivered' },
            { id: '#ORD-005', customer: 'Michael Wilson', date: '2023-07-12', amount: 342.60, status: 'Delivered' }
        ]
    };
    
    updateDashboard(mockData);
}

function updateDashboard(data) {
    // Update stat cards
    document.getElementById('total-products').textContent = data.totalProducts;
    document.getElementById('total-orders').textContent = data.totalOrders;
    document.getElementById('total-revenue').textContent = `$${data.totalRevenue.toLocaleString()}`;
    
    // Update charts with data
    window.dashboardCharts.sales.data.datasets[0].data = data.salesData;
    window.dashboardCharts.sales.update();
    
    window.dashboardCharts.orderStatus.data.datasets[0].data = data.orderStatusData;
    window.dashboardCharts.orderStatus.update();
    
    window.dashboardCharts.topProducts.data.labels = data.topProducts.labels;
    window.dashboardCharts.topProducts.data.datasets[0].data = data.topProducts.data;
    window.dashboardCharts.topProducts.update();
    
    // Update recent orders table
    const ordersTable = document.querySelector('#recent-orders tbody');
    if (data.recentOrders && data.recentOrders.length > 0) {
        ordersTable.innerHTML = '';
        data.recentOrders.forEach(order => {
            const row = document.createElement('tr');
            
            // Status badge
            let statusClass = '';
            switch(order.status.toLowerCase()) {
                case 'processing': statusClass = 'bg-primary'; break;
                case 'shipped': statusClass = 'bg-info'; break;
                case 'delivered': statusClass = 'bg-success'; break;
                case 'cancelled': statusClass = 'bg-danger'; break;
                default: statusClass = 'bg-secondary';
            }
            
            row.innerHTML = `
                <td>${order.id}</td>
                <td>${order.customer}</td>
                <td>${order.date}</td>
                <td>$${order.amount.toFixed(2)}</td>
                <td><span class="badge ${statusClass}">${order.status}</span></td>
                <td><button class="btn btn-sm btn-outline-primary">View</button></td>
            `;
            ordersTable.appendChild(row);
        });
    }
}