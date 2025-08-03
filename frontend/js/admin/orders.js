// Optimized Order Management JavaScript with Fixed Infinite Scroll
document.addEventListener('DOMContentLoaded', function() {
    initializeOrderManagement();
});

// Configuration
const CONFIG = {
    apiBaseUrl: 'http://localhost:8080/api/v1/order',
    statusConfig: {
        pending: { class: 'bg-warning text-dark', icon: 'clock' },
        shipped: { class: 'bg-info', icon: 'truck' },
        delivered: { class: 'bg-success', icon: 'check-circle' },
        cancelled: { class: 'bg-danger', icon: 'x-circle' }
    },
    infiniteScroll: {
        pageSize: 20,
        currentPage: 1,
        loading: false,
        hasMore: true,
        threshold: 200, // pixels from bottom to trigger load
        totalRecords: 0, // Track total available records
        lastScrollPosition: 0 // Prevent duplicate triggers
    }
};

let ordersTable;
let allOrders = []; // Store all loaded orders
let filteredOrders = []; // Store filtered orders
let currentFilters = {
    status: '',
    date: '',
    search: ''
};

function initializeOrderManagement() {
    // Initialize DataTable with pagination disabled and infinite scroll
    ordersTable = $('#ordersTable').DataTable({
        data: [], // Start with empty data
        columns: getTableColumns(),
        order: [[1, 'desc']],
        responsive: true,
        paging: false, // Disable pagination
        scrollY: '60vh', // Set fixed height for scrolling
        scrollCollapse: true,
        info: false, // Disable info display
        searching: false, // Disable built-in search (we'll handle it manually)
        language: {
            emptyTable: "No orders available",
            zeroRecords: "No matching orders found",
            processing: "Loading orders..."
        },
        processing: false,
        stateSave: false,
        drawCallback: function() {
            updateSelectAllCheckbox();
            // Initialize tooltips for new elements
            $('[data-bs-toggle="tooltip"]').tooltip();
        }
    });

    // Load initial data
    loadOrders(true);
    
    // Setup infinite scroll
    setupInfiniteScroll();
    
    bindEventHandlers();
}

function loadOrders(reset = false) {
    // Prevent multiple simultaneous requests
    if (CONFIG.infiniteScroll.loading) {
        console.log('Already loading, skipping request');
        return;
    }

    // If we've loaded all available data and this isn't a reset, don't load more
    if (!CONFIG.infiniteScroll.hasMore && !reset) {
        console.log('No more data to load');
        return;
    }

    CONFIG.infiniteScroll.loading = true;
    
    if (reset) {
        CONFIG.infiniteScroll.currentPage = 1;
        CONFIG.infiniteScroll.hasMore = true;
        CONFIG.infiniteScroll.totalRecords = 0;
        allOrders = [];
        showLoadingIndicator();
    } else {
        showLoadMoreIndicator();
    }

    // Simulate pagination parameters (adjust based on your API)
    const params = {
        page: CONFIG.infiniteScroll.currentPage,
        limit: CONFIG.infiniteScroll.pageSize
    };

    console.log(`Loading page ${CONFIG.infiniteScroll.currentPage} with limit ${CONFIG.infiniteScroll.pageSize}`);

    $.ajax({
        url: CONFIG.apiBaseUrl,
        type: 'GET',
        data: params,
        headers: {
            'Authorization': 'Bearer ' + sessionStorage.getItem('authToken')
        },
        success: function(data) {
            console.log('API Response:', data);
            
            // Handle different API response formats
            let orders = [];
            let totalCount = 0;
            
            if (Array.isArray(data)) {
                // Simple array response
                orders = data;
                totalCount = CONFIG.infiniteScroll.totalRecords + orders.length; // Estimate
            } else if (data.orders) {
                // Object with orders array
                orders = data.orders;
                totalCount = data.total || data.totalCount || (CONFIG.infiniteScroll.totalRecords + orders.length);
            } else if (data.data) {
                // Nested data structure
                orders = data.data;
                totalCount = data.total || data.totalCount || (CONFIG.infiniteScroll.totalRecords + orders.length);
            }

            console.log(`Received ${orders.length} orders, total available: ${totalCount}`);

            if (reset) {
                allOrders = orders;
                CONFIG.infiniteScroll.totalRecords = totalCount;
            } else {
                // Check for duplicates before adding
                const existingIds = new Set(allOrders.map(order => order.order_id));
                const newOrders = orders.filter(order => !existingIds.has(order.order_id));
                allOrders = allOrders.concat(newOrders);
                console.log(`Added ${newOrders.length} new orders (filtered ${orders.length - newOrders.length} duplicates)`);
            }

            // Determine if there are more records to load
            const loadedCount = allOrders.length;
            
            // Multiple conditions to determine if more data is available
            CONFIG.infiniteScroll.hasMore = 
                orders.length === CONFIG.infiniteScroll.pageSize && // Got full page
                loadedCount < CONFIG.infiniteScroll.totalRecords && // Haven't loaded all records
                orders.length > 0; // Actually received data

            console.log(`Loaded: ${loadedCount}, Total: ${CONFIG.infiniteScroll.totalRecords}, HasMore: ${CONFIG.infiniteScroll.hasMore}`);

            // Only increment page if we successfully loaded data
            if (orders.length > 0) {
                CONFIG.infiniteScroll.currentPage++;
            }

            // Apply current filters and update table
            applyFiltersAndUpdateTable();
            
            hideLoadingIndicators();
            CONFIG.infiniteScroll.loading = false;

            // Update order count display
            updateOrderCount();
        },
        error: function(xhr, error, thrown) {
            console.error('Error loading orders:', error);
            showErrorAlert('Failed to load orders', 'Please refresh the page to try again.');
            hideLoadingIndicators();
            CONFIG.infiniteScroll.loading = false;
            
            // Don't increment page on error
            CONFIG.infiniteScroll.hasMore = false; // Stop trying on error
        }
    });
}

function setupInfiniteScroll() {
    const scrollContainer = $('.dataTables_scrollBody');
    let scrollTimeout;
    
    scrollContainer.on('scroll', function() {
        const container = $(this);
        const scrollTop = container.scrollTop();
        const scrollHeight = container[0].scrollHeight;
        const containerHeight = container.height();
        
        // Debounce scroll events
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(function() {
            // Check if we're near the bottom and haven't moved much
            const distanceFromBottom = scrollHeight - scrollTop - containerHeight;
            const scrolledDown = scrollTop > CONFIG.infiniteScroll.lastScrollPosition;
            
            console.log(`Scroll position: ${scrollTop}, Distance from bottom: ${distanceFromBottom}, Scrolled down: ${scrolledDown}`);
            
            if (distanceFromBottom < CONFIG.infiniteScroll.threshold && 
                scrolledDown && 
                !CONFIG.infiniteScroll.loading &&
                CONFIG.infiniteScroll.hasMore) {
                
                console.log('Triggering infinite scroll load');
                CONFIG.infiniteScroll.lastScrollPosition = scrollTop;
                loadOrders(false);
            }
        }, 100); // 100ms debounce
    });
}

function applyFiltersAndUpdateTable() {
    filteredOrders = allOrders.filter(order => {
        let matches = true;

        // Status filter
        if (currentFilters.status && order.order_status !== currentFilters.status) {
            matches = false;
        }

        // Search filter
        if (currentFilters.search) {
            const searchTerm = currentFilters.search.toLowerCase();
            const searchableText = `${order.order_id || ''} ${order.customer_name || ''} ${order.customer_email || ''}`.toLowerCase();
            if (!searchableText.includes(searchTerm)) {
                matches = false;
            }
        }

        // Date filter (implement based on your needs)
        if (currentFilters.date && currentFilters.date !== '') {
            // Add date filtering logic here
            // This is a placeholder - implement based on your date filter requirements
        }

        return matches;
    });

    // Update DataTable with filtered data
    ordersTable.clear();
    ordersTable.rows.add(filteredOrders);
    ordersTable.draw();
}

function showLoadingIndicator() {
    $('#initialLoadingIndicator').show();
}

function showLoadMoreIndicator() {
    $('#loadMoreIndicator').show();
}

function hideLoadingIndicators() {
    $('#initialLoadingIndicator').hide();
    $('#loadMoreIndicator').hide();
}

function updateOrderCount() {
    const totalCount = allOrders.length;
    const filteredCount = filteredOrders.length;
    const totalAvailable = CONFIG.infiniteScroll.totalRecords;
    
    let countText = '';
    if (currentFilters.status || currentFilters.search || currentFilters.date) {
        countText = `Showing ${filteredCount} of ${totalCount} loaded orders`;
    } else {
        if (totalAvailable > totalCount) {
            countText = `${totalCount} of ${totalAvailable} orders loaded`;
            if (CONFIG.infiniteScroll.hasMore) {
                countText += ' (scroll for more)';
            }
        } else {
            countText = `All ${totalCount} orders loaded`;
        }
    }
    
    $('#orderCountDisplay').text(countText);
}

function getTableColumns() {
    return [
        {
            data: null,
            render: function(data, type, row) {
                return `<input type="checkbox" class="order-checkbox" value="${row.order_id}">`;
            },
            orderable: false,
            searchable: false,
            width: '40px'
        },
        { 
            data: 'order_id',
            title: 'Order ID',
            className: 'fw-bold'
        },
        { 
            data: 'customer_name',
            title: 'Customer',
            render: function(data) {
                return data || 'Unknown Customer';
            }
        },
        { 
            data: 'order_placed',
            title: 'Date',
            render: function(data) {
                if (!data) return 'N/A';
                return new Date(data).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            }
        },
        { 
            data: 'total_amount',
            title: 'Total',
            render: function(data) {
                return `$${parseFloat(data || 0).toFixed(2)}`;
            },
            className: 'text-end'
        },
        { 
            data: 'order_status',
            title: 'Status',
            render: function(data) {
                return renderStatusBadge(data);
            }
        },
        { 
            data: 'item_count',
            title: 'Items',
            render: function(data) {
                return `<span class="badge bg-secondary">${data || 0}</span>`;
            },
            className: 'text-center'
        },
        {
            data: null,
            title: 'Actions',
            render: function(data, type, row) {
                return `
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-info view-order" 
                                data-id="${row.order_id}" 
                                title="View Details"
                                data-bs-toggle="tooltip">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-primary edit-order" 
                                data-id="${row.order_id}" 
                                title="Edit Status"
                                data-bs-toggle="tooltip">
                            <i class="bi bi-pencil"></i>
                        </button>
                    </div>
                `;
            },
            orderable: false,
            searchable: false,
            width: '100px'
        }
    ];
}

function renderStatusBadge(status) {
    const config = CONFIG.statusConfig[status] || CONFIG.statusConfig.pending;
    return `<span class="badge ${config.class}">
                <i class="bi bi-${config.icon} me-1"></i>${status || 'pending'}
            </span>`;
}

function bindEventHandlers() {
    // View order details
    $(document).on('click', '.view-order', function() {
        const orderId = $(this).data('id');
        viewOrderDetails(orderId);
    });

    // Edit order status
    $(document).on('click', '.edit-order', function() {
        const orderId = $(this).data('id');
        const currentStatus = $(this).closest('tr').find('td:eq(5) .badge').text().trim();
        editOrderStatus(orderId, currentStatus);
    });

    // Bulk actions
    $('#bulkShip').on('click', function(e) {
        e.preventDefault();
        performBulkAction('shipped', 'ship');
    });

    $('#bulkProcess').on('click', function(e) {
        e.preventDefault();
        performBulkAction('pending', 'process');
    });

    $('#bulkComplete').on('click', function(e) {
        e.preventDefault();
        performBulkAction('delivered', 'complete');
    });

    $('#bulkCancel').on('click', function(e) {
        e.preventDefault();
        bulkCancelOrders();
    });

    // Select all checkbox
    $('#selectAll').on('change', function() {
        $('.order-checkbox').prop('checked', this.checked);
    });

    // Filters
    $('#statusFilter').on('change', function() {
        currentFilters.status = $(this).val();
        applyFiltersAndUpdateTable();
        updateOrderCount();
    });

    $('#dateFilter').on('change', function() {
        currentFilters.date = $(this).val();
        handleDateFilter($(this).val());
    });

    // Custom search input
    $('#orderSearch').on('input', debounce(function() {
        currentFilters.search = $(this).val();
        applyFiltersAndUpdateTable();
        updateOrderCount();
    }, 300));

    // Refresh button
    $('#refreshOrdersBtn').on('click', function() {
        $(this).html('<i class="bi bi-arrow-clockwise spinner-border spinner-border-sm"></i> Refreshing...');
        $(this).prop('disabled', true);
        
        // Reset scroll position tracking
        CONFIG.infiniteScroll.lastScrollPosition = 0;
        
        loadOrders(true);
        
        setTimeout(() => {
            $(this).html('<i class="bi bi-arrow-clockwise"></i> Refresh');
            $(this).prop('disabled', false);
        }, 1000);
    });

    // Export orders
    $('#exportOrdersBtn').on('click', function() {
        exportOrders();
    });

    // Modal action buttons
    $('#markAsProcessingBtn').on('click', function() {
        const orderId = $('#detailOrderId').text();
        updateOrderStatus(orderId, 'shipped');
    });

    $('#markAsCompletedBtn').on('click', function() {
        const orderId = $('#detailOrderId').text();
        updateOrderStatus(orderId, 'delivered');
    });

    $('#cancelOrderBtn').on('click', function() {
        const orderId = $('#detailOrderId').text();
        cancelSingleOrder(orderId);
    });
}

// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function viewOrderDetails(orderId) {
    const button = $(`.view-order[data-id="${orderId}"]`);
    button.prop('disabled', true).html('<i class="bi bi-hourglass-split"></i>');
    
    $.ajax({
        url: `${CONFIG.apiBaseUrl}/${orderId}`,
        type: 'GET',
        headers: {
            'Authorization': 'Bearer ' + sessionStorage.getItem('authToken')
        },
        success: function(data) {
            if (data.order) {
                populateOrderDetails(data.order);
                const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
                modal.show();
            } else {
                showErrorAlert('Order Not Found', 'The requested order could not be found.');
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading order details:', error);
            showErrorAlert('Failed to Load Order', 'Unable to load order details. Please try again.');
        },
        complete: function() {
            button.prop('disabled', false).html('<i class="bi bi-eye"></i>');
        }
    });
}

function editOrderStatus(orderId, currentStatus) {
    const statusOptions = [
        { value: 'pending', text: 'Pending', icon: 'clock' },
        { value: 'shipped', text: 'Shipped', icon: 'truck' },
        { value: 'delivered', text: 'Delivered', icon: 'check-circle' },
        { value: 'cancelled', text: 'Cancelled', icon: 'x-circle' }
    ];

    const selectOptions = statusOptions.map(option => 
        `<option value="${option.value}" ${option.value === currentStatus ? 'selected' : ''}>
            ${option.text}
        </option>`
    ).join('');

    Swal.fire({
        title: 'Update Order Status',
        html: `
            <div class="text-start">
                <div class="mb-3">
                    <label class="form-label">Order ID: <strong>#${orderId}</strong></label>
                </div>
                <div class="mb-3">
                    <label class="form-label">Current Status: ${renderStatusBadge(currentStatus)}</label>
                </div>
                <div class="mb-3">
                    <label for="statusSelect" class="form-label">New Status:</label>
                    <select id="statusSelect" class="form-select">
                        ${selectOptions}
                    </select>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: '<i class="bi bi-check-lg me-1"></i>Update Status',
        cancelButtonText: '<i class="bi bi-x-lg me-1"></i>Cancel',
        confirmButtonColor: '#0d6efd',
        cancelButtonColor: '#6c757d',
        preConfirm: function() {
            const selectedStatus = document.getElementById('statusSelect').value;
            if (selectedStatus === currentStatus) {
                Swal.showValidationMessage('Please select a different status');
                return false;
            }
            return selectedStatus;
        }
    }).then(function(result) {
        if (result.isConfirmed) {
            updateOrderStatus(orderId, result.value);
        }
    });
}

function updateOrderStatus(orderId, newStatus) {
    // Show loading state
    Swal.fire({
        title: 'Updating Status...',
        text: 'Please wait while we update the order status.',
        allowOutsideClick: false,
        didOpen: function() {
            Swal.showLoading();
        }
    });

    $.ajax({
        url: `${CONFIG.apiBaseUrl}/${orderId}`,
        type: 'PUT',
        data: { status: newStatus },
        headers: {
            'Authorization': 'Bearer ' + sessionStorage.getItem('authToken')
        },
        success: function(data) {
            Swal.fire({
                icon: 'success',
                title: 'Status Updated!',
                text: `Order #${orderId} has been marked as ${newStatus}.`,
                confirmButtonColor: '#198754'
            });
            
            // Update the order in our local data
            const orderIndex = allOrders.findIndex(order => order.order_id == orderId);
            if (orderIndex !== -1) {
                allOrders[orderIndex].order_status = newStatus;
                applyFiltersAndUpdateTable();
            }
            
            // Close modal if open
            const modal = bootstrap.Modal.getInstance(document.getElementById('orderDetailsModal'));
            if (modal) {
                modal.hide();
            }
        },
        error: function(xhr, status, error) {
            console.error('Error updating order status:', error);
            let errorMessage = 'Failed to update order status.';
            
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMessage = xhr.responseJSON.message;
            }
            
            showErrorAlert('Update Failed', errorMessage);
        }
    });
}

function performBulkAction(action, actionText) {
    const selectedOrders = $('.order-checkbox:checked');
    
    if (selectedOrders.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'No Orders Selected',
            text: `Please select orders to ${actionText}.`,
            confirmButtonColor: '#ffc107'
        });
        return;
    }

    Swal.fire({
        title: `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Orders?`,
        text: `Are you sure you want to ${actionText} ${selectedOrders.length} order(s)?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: `Yes, ${actionText} them!`,
        cancelButtonText: 'Cancel',
        confirmButtonColor: getButtonColor(action)
    }).then(function(result) {
        if (result.isConfirmed) {
            executeBulkAction(selectedOrders, action, actionText);
        }
    });
}

// Helper function to determine button color based on action
function getButtonColor(action) {
    switch(action) {
        case 'delivered':
            return '#198754'; // Bootstrap success green
        case 'shipped':
            return '#0dcaf0'; // Bootstrap info blue
        case 'pending':
            return '#ffc107'; // Bootstrap warning yellow
        case 'cancelled':
            return '#dc3545'; // Bootstrap danger red
        default:
            return '#0d6efd'; // Bootstrap primary blue (default)
    }
}

function executeBulkAction(selectedOrders, action, actionText) {
    // Show progress
    Swal.fire({
        title: `${actionText.charAt(0).toUpperCase() + actionText.slice(1)}ing Orders...`,
        text: 'Please wait while we process the orders.',
        allowOutsideClick: false,
        didOpen: function() {
            Swal.showLoading();
        }
    });

    const updatePromises = [];
    const orderIds = [];
    
    selectedOrders.each(function() {
        const orderId = $(this).val();
        orderIds.push(orderId);
        updatePromises.push($.ajax({
            url: `${CONFIG.apiBaseUrl}/${orderId}`,
            type: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + sessionStorage.getItem('authToken')
            },
            data: { status: action }
        }));
    });

    $.when.apply($, updatePromises)
        .done(function() {
            // Update local data
            orderIds.forEach(orderId => {
                const orderIndex = allOrders.findIndex(order => order.order_id == orderId);
                if (orderIndex !== -1) {
                    allOrders[orderIndex].order_status = action;
                }
            });
            
            applyFiltersAndUpdateTable();
            
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: `${selectedOrders.length} order(s) ${actionText}ed successfully.`,
                confirmButtonColor: '#198754'
            });
            
            $('#selectAll').prop('checked', false);
        })
        .fail(function() {
            console.error('Bulk action error:', arguments);
            showErrorAlert('Bulk Action Failed', `Error ${actionText}ing orders. Some orders may not have been updated.`);
        });
}

function bulkCancelOrders() {
    const selectedOrders = $('.order-checkbox:checked');
    
    if (selectedOrders.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'No Orders Selected',
            text: 'Please select orders to cancel.',
            confirmButtonColor: '#ffc107'
        });
        return;
    }

    Swal.fire({
        title: 'Cancel Orders?',
        text: `Are you sure you want to cancel ${selectedOrders.length} order(s)? This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, cancel them!',
        cancelButtonText: 'No, keep orders',
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d'
    }).then(function(result) {
        if (result.isConfirmed) {
            executeBulkAction(selectedOrders, 'cancelled', 'cancel');
        }
    });
}

function cancelSingleOrder(orderId) {
    Swal.fire({
        title: 'Cancel Order?',
        text: `Are you sure you want to cancel order #${orderId}? This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, cancel it!',
        cancelButtonText: 'No, keep order',
        confirmButtonColor: '#dc3545'
    }).then(function(result) {
        if (result.isConfirmed) {
            updateOrderStatus(orderId, 'cancelled');
        }
    });
}

function updateSelectAllCheckbox() {
    const allCheckboxes = $('.order-checkbox');
    const checkedCheckboxes = $('.order-checkbox:checked');
    const selectAll = $('#selectAll');
    
    selectAll.prop('indeterminate', checkedCheckboxes.length > 0 && checkedCheckboxes.length < allCheckboxes.length);
    selectAll.prop('checked', checkedCheckboxes.length === allCheckboxes.length && allCheckboxes.length > 0);
}

function handleDateFilter(selectedValue) {
    if (selectedValue === 'custom') {
        $('#customDateStartContainer, #customDateEndContainer').show();
    } else {
        $('#customDateStartContainer, #customDateEndContainer').hide();
        applyFiltersAndUpdateTable();
        updateOrderCount();
    }
}

function exportOrders() {
    const data = filteredOrders.length > 0 ? filteredOrders : allOrders;
    
    if (data.length === 0) {
        Swal.fire({
            icon: 'info',
            title: 'No Data to Export',
            text: 'There are no orders to export.',
            confirmButtonColor: '#0d6efd'
        });
        return;
    }

    // Show export options
    Swal.fire({
        title: 'Export Orders',
        text: `Export ${data.length} orders to CSV file?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: '<i class="bi bi-download me-1"></i>Export CSV',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#198754'
    }).then(function(result) {
        if (result.isConfirmed) {
            generateCSVExport(data);
        }
    });
}

function generateCSVExport(data) {
    try {
        // Create CSV content
        let csvContent = 'Order ID,Customer,Date,Total,Status,Items\n';
        
        data.forEach(function(order) {
            const date = order.order_placed ? new Date(order.order_placed).toLocaleDateString() : '';
            const total = parseFloat(order.total_amount || 0).toFixed(2);
            
            csvContent += `"${order.order_id || ''}","${order.customer_name || ''}","${date}","${total}","${order.order_status || ''}","${order.item_count || 0}"\n`;
        });

        // Create and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = `orders_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        Swal.fire({
            icon: 'success',
            title: 'Export Complete!',
            text: 'Orders have been exported successfully.',
            confirmButtonColor: '#198754'
        });
    } catch (error) {
        console.error('Export error:', error);
        showErrorAlert('Export Failed', 'Failed to export orders. Please try again.');
    }
}

function populateOrderDetails(order) {
    // Populate order information
    $('#detailOrderId').text(order.order_id);
    $('#detailOrderDate').text(order.order_placed ? new Date(order.order_placed).toLocaleDateString() : 'N/A');
    $('#detailOrderStatus').html(renderStatusBadge(order.order_status));
    $('#detailCustomerName').text(order.customer_name || 'Unknown');
    $('#detailCustomerEmail').text(order.customer_email || 'N/A');
    $('#detailCustomerPhone').text(order.customer_contact || 'N/A');
    $('#detailShippingAddress').text(order.customer_city || 'N/A');
    
    // Payment information
    $('#detailPaymentMethod').text('Credit Card');
    $('#detailPaymentStatus').text('Paid');
    $('#detailTransactionId').text('TXN' + order.order_id);

    // Populate order items
    const orderItemsBody = $('#orderItemsBody');
    let itemsHtml = '';
    let subtotal = 0;
    
    if (order.items && order.items.length > 0) {
        order.items.forEach(function(item) {
            const lineTotal = parseFloat(item.line_total || 0);
            subtotal += lineTotal;
            
            itemsHtml += `
                <tr>
                    <td>${item.item_name || 'Unknown Product'}</td>
                    <td>${parseFloat(item.order_price || 0).toFixed(2)}</td>
                    <td><span class="badge bg-primary">${item.qty}</span></td>
                    <td class="fw-bold">${lineTotal.toFixed(2)}</td>
                </tr>
            `;
        });
    } else {
        itemsHtml = '<tr><td colspan="4" class="text-center text-muted">No items found</td></tr>';
    }
    
    orderItemsBody.html(itemsHtml);

    // Calculate totals
    const shipping = 5.99;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    $('#orderSubtotal').text(`${subtotal.toFixed(2)}`);
    $('#orderShipping').text(`${shipping.toFixed(2)}`);
    $('#orderTax').text(`${tax.toFixed(2)}`);
    $('#orderTotal').text(`${total.toFixed(2)}`);
}

// Utility functions
function showErrorAlert(title, message) {
    Swal.fire({
        icon: 'error',
        title: title,
        text: message,
        confirmButtonColor: '#dc3545'
    });
}

function showSuccessAlert(title, message) {
    Swal.fire({
        icon: 'success',
        title: title,
        text: message,
        confirmButtonColor: '#198754'
    });
}

function logout() {
    Swal.fire({
        title: 'Sign Out Confirmation 🚪',
        text: 'Are you sure you want to sign out of your GemTry account?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#d4af37',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, Sign Out',
        cancelButtonText: 'Stay Signed In',
        backdrop: true,
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            try {
                // Show signing out process
                Swal.fire({
                    title: 'Signing You Out... 🔄',
                    text: 'Securely logging you out of your account',
                    icon: 'info',
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                // Simulate logout delay for better UX
                setTimeout(() => {
                    // Clear session storage
                    sessionStorage.removeItem('authToken');
                    sessionStorage.removeItem('role');
                    sessionStorage.removeItem('name');
                    sessionStorage.removeItem('initial');
                    
                    // Success notification
                    Swal.fire({
                        title: 'Successfully Signed Out! 👋',
                        text: 'Thank you for visiting GemTry. Come back soon for more beautiful jewelry!',
                        icon: 'success',
                        confirmButtonColor: '#d4af37',
                        confirmButtonText: 'Browse More',
                        timer: 4000,
                        timerProgressBar: true
                    }).then(() => {
                        window.location.href = '../login.html';
                    });
                }, 1500);
                
            } catch (error) {
                console.error('Logout error:', error);
                Swal.fire({
                    title: 'Sign Out Error! ⚠️',
                    text: 'We encountered an issue while signing you out. Please try closing your browser for security.',
                    icon: 'error',
                    confirmButtonColor: '#dc3545',
                    confirmButtonText: 'I Understand',
                    footer: '<small>For security, please close your browser session</small>'
                });
            }
        }
    });
}