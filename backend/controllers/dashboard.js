const db = require('../config/database');

exports.getDashboardStats = async (req, res) => {
    try {
        console.log('Fetching dashboard statistics...');

        // Get total active items count
        const itemCountQuery = 'SELECT COUNT(*) as total_items FROM items';
        
        // Get total sales amount
        const salesQuery = `
            SELECT COALESCE(SUM(ol.order_price * ol.qty), 0) as total_sales 
            FROM orderlines ol 
            JOIN orders o ON ol.order_id = o.order_id 
            WHERE o.order_status NOT IN ('cancelled', 'refunded')
        `;
        
        // Get total orders count (excluding cancelled/refunded)
        const orderCountQuery = `
            SELECT COUNT(*) as total_orders 
            FROM orders 
            WHERE order_status NOT IN ('cancelled', 'refunded')
        `;
        
        // Get recent orders with user and order details
        const recentOrdersQuery = `
            SELECT 
                o.order_id,
                o.order_status,
                o.order_placed,
                COALESCE(u.name, 'Guest') as customer_name,
                COALESCE(SUM(ol.order_price * ol.qty), 0) as total_amount,
                COUNT(DISTINCT ol.item_id) as items_count
            FROM orders o
            LEFT JOIN user u ON o.user_id = u.user_id
            LEFT JOIN orderlines ol ON o.order_id = ol.order_id
            GROUP BY o.order_id, o.order_status, o.order_placed, u.name
            ORDER BY o.order_placed DESC
            LIMIT 10
        `;

        // Get top selling items with their total quantity and revenue
        const topItemsQuery = `
            SELECT 
                i.item_id,
                i.item_name,
                i.item_price,
                COUNT(DISTINCT o.order_id) as order_count,
                COALESCE(SUM(ol.qty), 0) as total_quantity,
                COALESCE(SUM(ol.order_price * ol.qty), 0) as total_revenue
            FROM items i
            LEFT JOIN orderlines ol ON i.item_id = ol.item_id
            LEFT JOIN orders o ON ol.order_id = o.order_id AND o.order_status NOT IN ('cancelled', 'refunded')
            GROUP BY i.item_id, i.item_name, i.item_price
            HAVING total_quantity > 0
            ORDER BY total_quantity DESC, total_revenue DESC
            LIMIT 5
        `;

        // Get monthly sales data for the chart
        const monthlySalesQuery = `
            SELECT 
                MONTH(o.order_placed) as month,
                MONTHNAME(o.order_placed) as month_name,
                COALESCE(SUM(ol.order_price * ol.qty), 0) as monthly_sales
            FROM orders o
            LEFT JOIN orderlines ol ON o.order_id = ol.order_id
            WHERE YEAR(o.order_placed) = YEAR(CURDATE())
            AND o.order_status NOT IN ('cancelled', 'refunded')
            GROUP BY MONTH(o.order_placed), MONTHNAME(o.order_placed)
            ORDER BY MONTH(o.order_placed)
        `;

        // Get order status distribution
        const orderStatusQuery = `
            SELECT 
                order_status,
                COUNT(*) as status_count
            FROM orders
            WHERE order_status IS NOT NULL
            GROUP BY order_status
            ORDER BY status_count DESC
        `;

        // Execute all queries concurrently
        const [
            itemCount, 
            salesTotal, 
            orderCount, 
            recentOrders, 
            topItems, 
            monthlySales,
            orderStatusData
        ] = await Promise.all([
            executeQuery(itemCountQuery),
            executeQuery(salesQuery),
            executeQuery(orderCountQuery),
            executeQuery(recentOrdersQuery),
            executeQuery(topItemsQuery),
            executeQuery(monthlySalesQuery),
            executeQuery(orderStatusQuery)
        ]);

        // Process monthly sales data
        const monthlyData = processMonthlySalesData(monthlySales);
        
        // Process order status data
        const statusDistribution = processOrderStatusData(orderStatusData);

        // Prepare response data
        const response = {
            success: true,
            statistics: {
                totalItems: (itemCount && itemCount[0]) ? itemCount[0].total_items : 0,
                totalSales: (salesTotal && salesTotal[0]) ? parseFloat(salesTotal[0].total_sales) : 0,
                totalOrders: (orderCount && orderCount[0]) ? orderCount[0].total_orders : 0
            },
            recentOrders: recentOrders || [],
            topSellingItems: topItems || [],
            salesData: monthlyData.salesData,
            salesLabels: monthlyData.labels,
            orderStatusData: statusDistribution,
            timestamp: new Date().toISOString()
        };

        console.log('Dashboard data prepared successfully');
        console.log('Response preview:', {
            totalItems: response.statistics.totalItems,
            totalSales: response.statistics.totalSales,
            totalOrders: response.statistics.totalOrders,
            recentOrdersCount: response.recentOrders.length,
            topItemsCount: response.topSellingItems.length
        });

        return res.status(200).json(response);

    } catch (error) {
        console.error('Dashboard Error:', error);
        console.error('Error stack:', error.stack);
        
        return res.status(500).json({ 
            success: false,
            error: 'Failed to fetch dashboard statistics',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

// Helper function to execute database queries with promises
function executeQuery(query) {
    return new Promise((resolve, reject) => {
        console.log('Executing query:', query.substring(0, 100) + '...');
        
        db.query(query, (err, result) => {
            if (err) {
                console.error('Query error:', err);
                reject(err);
            } else {
                console.log('Query result length:', result ? result.length : 0);
                resolve(result);
            }
        });
    });
}

// Helper function to process monthly sales data
function processMonthlySalesData(monthlySales) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const salesData = new Array(12).fill(0);
    const labels = monthNames;

    if (monthlySales && monthlySales.length > 0) {
        monthlySales.forEach(row => {
            const monthIndex = row.month - 1; // Convert to 0-based index
            if (monthIndex >= 0 && monthIndex < 12) {
                salesData[monthIndex] = parseFloat(row.monthly_sales) || 0;
            }
        });
    }

    return {
        salesData: salesData,
        labels: labels
    };
}

// Helper function to process order status data
function processOrderStatusData(orderStatusData) {
    const defaultStatuses = {
        'processing': 0,
        'shipped': 0,
        'delivered': 0,
        'cancelled': 0
    };

    if (orderStatusData && orderStatusData.length > 0) {
        orderStatusData.forEach(row => {
            const status = row.order_status.toLowerCase();
            if (defaultStatuses.hasOwnProperty(status)) {
                defaultStatuses[status] = parseInt(row.status_count) || 0;
            }
        });
    }

    return [
        defaultStatuses.processing,
        defaultStatuses.shipped,
        defaultStatuses.delivered,
        defaultStatuses.cancelled
    ];
}

// Additional endpoint for real-time stats refresh
exports.getQuickStats = async (req, res) => {
    try {
        const quickStatsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM items) as total_items,
                (SELECT COUNT(*) FROM orders WHERE order_status NOT IN ('cancelled', 'refunded')) as total_orders,
                (SELECT COALESCE(SUM(ol.order_price * ol.qty), 0) 
                 FROM orderlines ol 
                 JOIN orders o ON ol.order_id = o.order_id 
                 WHERE o.order_status NOT IN ('cancelled', 'refunded')) as total_sales
        `;

        const result = await executeQuery(quickStatsQuery);
        
        const stats = result && result[0] ? result[0] : {
            total_items: 0,
            total_orders: 0,
            total_sales: 0
        };

        return res.status(200).json({
            success: true,
            statistics: {
                totalItems: parseInt(stats.total_items) || 0,
                totalOrders: parseInt(stats.total_orders) || 0,
                totalSales: parseFloat(stats.total_sales) || 0
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Quick stats error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch quick statistics',
            message: error.message
        });
    }
};