// Order Management JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeOrderManagement();
});

function initializeOrderManagement() {
    // Initialize DataTable
    const ordersTable = $('#ordersTable').DataTable({
        ajax: {
            url: 'http://localhost:8080/api/v1/order',
            dataSrc: '',
            error: function(xhr, error, thrown) {
                console.error('DataTable error:', error);
                alert('Error loading orders. Please refresh the page.');
            }
        },
        columns: [
            {
                data: null,
                render: function(data, type, row) {
                    return `<input type="checkbox" class="order-checkbox" value="${row.order_id}">`;
                },
                orderable: false,
                searchable: false
            },
            { 
                data: 'order_id',
                title: 'Order ID'
            },
            { 
                data: 'customer_name',
                title: 'Customer',
                render: function(data, type, row) {
                    return data || 'Unknown Customer';
                }
            },
            { 
                data: 'order_placed',
                title: 'Date',
                render: function(data) {
                    if (!data) return 'N/A';
                    return new Date(data).toLocaleDateString();
                }
            },
            { 
                data: 'total_amount',
                title: 'Total',
                render: function(data) {
                    return `$${parseFloat(data || 0).toFixed(2)}`;
                }
            },
            { 
                data: 'order_status',
                title: 'Status',
                render: function(data) {
                    const status = data || 'pending';
                    let badgeClass = 'badge bg-warning';
                    if (status === 'delivered') {
                        badgeClass = 'badge bg-success';
                    } else if (status === 'cancelled') {
                        badgeClass = 'badge bg-danger';
                    } else if (status === 'shipped') {
                        badgeClass = 'badge bg-info';
                    }
                    return `<span class="${badgeClass}">${status}</span>`;
                }
            },
            { 
                data: 'item_count',
                title: 'Items',
                render: function(data) {
                    return `<span class="badge bg-secondary">${data || 0}</span>`;
                }
            },
            {
                data: null,
                title: 'Actions',
                render: function(data, type, row) {
                    return `
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-outline-info view-order" data-id="${row.order_id}" title="View Details">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-primary edit-order" data-id="${row.order_id}" title="Edit Status">
                                <i class="bi bi-pencil"></i>
                            </button>
                        </div>
                    `;
                },
                orderable: false,
                searchable: false
            }
        ],
        order: [[1, 'desc']],
        responsive: true,
        pageLength: 10,
        lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]],
        language: {
            search: "Search orders:",
            lengthMenu: "Show _MENU_ orders per page",
            info: "Showing _START_ to _END_ of _TOTAL_ orders",
            infoEmpty: "Showing 0 to 0 of 0 orders",
            infoFiltered: "(filtered from _MAX_ total orders)",
            emptyTable: "No orders found",
            zeroRecords: "No matching orders found"
        },
        drawCallback: function(settings) {
            // Update select all checkbox state
            const allCheckboxes = $('.order-checkbox');
            const checkedCheckboxes = $('.order-checkbox:checked');
            $('#selectAll').prop('indeterminate', checkedCheckboxes.length > 0 && checkedCheckboxes.length < allCheckboxes.length);
            $('#selectAll').prop('checked', checkedCheckboxes.length === allCheckboxes.length && allCheckboxes.length > 0);
        }
    });

    // Handle view order details
    $(document).on('click', '.view-order', function() {
        const orderId = $(this).data('id');
        
        // Show loading state
        $(this).prop('disabled', true).html('<i class="bi bi-hourglass-split"></i>');
        
        $.ajax({
            url: `http://localhost:8080/api/v1/order/${orderId}`,
            type: 'GET',
            success: function(data) {
                if (data.order) {
                    populateOrderDetails(data.order);
                    const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
                    modal.show();
                }
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
                alert('Error loading order details.');
            },
            complete: function() {
                // Reset button state
                $('.view-order[data-id="' + orderId + '"]').prop('disabled', false).html('<i class="bi bi-eye"></i>');
            }
        });
    });

    // Handle edit order status
    $(document).on('click', '.edit-order', function() {
        const orderId = $(this).data('id');
        const currentStatus = $(this).closest('tr').find('td:eq(5) .badge').text();
        
        const newStatus = prompt(`Current status: ${currentStatus}\nEnter new status (pending/shipped/cancelled/delivered):`, currentStatus);
        
        if (newStatus && newStatus !== currentStatus) {
            updateOrderStatus(orderId, newStatus);
        }
    });

    // Handle bulk actions
    document.getElementById('bulkProcess').addEventListener('click', function(e) {
        e.preventDefault();
        performBulkAction('shipped');
    });

    document.getElementById('bulkComplete').addEventListener('click', function(e) {
        e.preventDefault();
        performBulkAction('delivered');
    });

    document.getElementById('bulkCancel').addEventListener('click', function(e) {
        e.preventDefault();
        const selectedOrders = document.querySelectorAll('.order-checkbox:checked');
        
        if (selectedOrders.length === 0) {
            alert('Please select orders to cancel.');
            return;
        }

        if (confirm(`Are you sure you want to cancel ${selectedOrders.length} order(s)?`)) {
            const updatePromises = [];
            
            Array.from(selectedOrders).forEach(checkbox => {
                const orderId = checkbox.value;
                updatePromises.push($.ajax({
                    url: `http://localhost:8080/api/v1/order/${orderId}`,
                    type: 'PUT',
                    data: { status: 'cancelled' }
                }));
            });

            $.when.apply($, updatePromises)
                .done(function() {
                    alert('Selected orders cancelled successfully.');
                    ordersTable.ajax.reload();
                    document.getElementById('selectAll').checked = false;
                })
                .fail(function() {
                    console.error('Error:', arguments);
                    alert('Error cancelling orders.');
                });
        }
    });

    // Handle select all checkbox
    document.getElementById('selectAll').addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.order-checkbox');
        Array.from(checkboxes).forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });

    // Handle filters
    $('#statusFilter').on('change', function() {
        const selectedStatus = $(this).val();
        ordersTable.column(5).search(selectedStatus).draw();
    });

    $('#dateFilter').on('change', function() {
        const selectedDate = $(this).val();
        if (selectedDate === 'custom') {
            $('#customDateStartContainer, #customDateEndContainer').show();
        } else {
            $('#customDateStartContainer, #customDateEndContainer').hide();
            // Custom date filtering logic can be implemented here
            ordersTable.draw();
        }
    });

    // Handle export orders
    document.getElementById('exportOrdersBtn').addEventListener('click', function() {
        exportOrders();
    });

    // Handle order status buttons in modal
    document.getElementById('markAsProcessingBtn').addEventListener('click', function() {
        const orderId = document.getElementById('detailOrderId').textContent;
        updateOrderStatus(orderId, 'shipped');
    });

    document.getElementById('markAsCompletedBtn').addEventListener('click', function() {
        const orderId = document.getElementById('detailOrderId').textContent;
        updateOrderStatus(orderId, 'delivered');
    });

    document.getElementById('cancelOrderBtn').addEventListener('click', function() {
        const orderId = document.getElementById('detailOrderId').textContent;
        if (confirm('Are you sure you want to cancel this order?')) {
            updateOrderStatus(orderId, 'cancelled');
        }
    });
}

function populateOrderDetails(order) {
    // Populate order information
    document.getElementById('detailOrderId').textContent = order.order_id;
    document.getElementById('detailOrderDate').textContent = new Date(order.order_placed).toLocaleDateString();
    document.getElementById('detailOrderStatus').textContent = order.order_status;
    document.getElementById('detailCustomerName').textContent = order.customer_name || 'Unknown';
    document.getElementById('detailCustomerEmail').textContent = order.customer_email || 'N/A';
    document.getElementById('detailCustomerPhone').textContent = order.customer_contact || 'N/A';
    document.getElementById('detailShippingAddress').textContent = order.customer_city || 'N/A';
    
    // Payment information (using default values since we don't have payment table)
    document.getElementById('detailPaymentMethod').textContent = 'Credit Card';
    document.getElementById('detailPaymentStatus').textContent = 'Paid';
    document.getElementById('detailTransactionId').textContent = 'TXN' + order.order_id;

    // Populate order items
    const orderItemsBody = document.getElementById('orderItemsBody');
    let itemsHtml = '';
    let subtotal = 0;
    
    if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
            const lineTotal = parseFloat(item.line_total || 0);
            subtotal += lineTotal;
            
            itemsHtml += `
                <tr>
                    <td>${item.item_name || 'Unknown Product'}</td>
                    <td>$${parseFloat(item.order_price || 0).toFixed(2)}</td>
                    <td>${item.qty}</td>
                    <td>$${lineTotal.toFixed(2)}</td>
                </tr>
            `;
        });
    } else {
        itemsHtml = '<tr><td colspan="4" class="text-center">No items found</td></tr>';
    }
    
    orderItemsBody.innerHTML = itemsHtml;

    // Calculate totals
    const shipping = 5.99; // Fixed shipping cost
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + shipping + tax;

    document.getElementById('orderSubtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('orderShipping').textContent = `$${shipping.toFixed(2)}`;
    document.getElementById('orderTax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('orderTotal').textContent = `$${total.toFixed(2)}`;
}

function updateOrderStatus(orderId, newStatus) {
    $.ajax({
        url: `http://localhost:8080/api/v1/order/${orderId}`,
        type: 'PUT',
        data: { status: newStatus },
        success: function(data) {
            alert('Order status updated successfully.');
            $('#ordersTable').DataTable().ajax.reload();
            
            // Close modal if open
            const modal = bootstrap.Modal.getInstance(document.getElementById('orderDetailsModal'));
            if (modal) {
                modal.hide();
            }
        },
        error: function(xhr, status, error) {
            console.error('Error:', error);
            let errorMessage = 'Error updating order status.';
            
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMessage = xhr.responseJSON.message;
            }
            
            alert(errorMessage);
        }
    });
}

function performBulkAction(action) {
    const selectedOrders = document.querySelectorAll('.order-checkbox:checked');
    
    if (selectedOrders.length === 0) {
        alert('Please select orders to perform this action.');
        return;
    }

    const actionText = action === 'shipped' ? 'mark as shipped' : 'mark as delivered';
    if (confirm(`Are you sure you want to ${actionText} ${selectedOrders.length} order(s)?`)) {
        const updatePromises = [];
        
        Array.from(selectedOrders).forEach(checkbox => {
            const orderId = checkbox.value;
            updatePromises.push($.ajax({
                url: `http://localhost:8080/api/v1/order/${orderId}`,
                type: 'PUT',
                data: { status: action }
            }));
        });

        $.when.apply($, updatePromises)
            .done(function() {
                alert(`Selected orders ${actionText} successfully.`);
                $('#ordersTable').DataTable().ajax.reload();
                document.getElementById('selectAll').checked = false;
            })
            .fail(function() {
                console.error('Error:', arguments);
                alert(`Error ${actionText} orders.`);
            });
    }
}

function exportOrders() {
    // This is a basic export function - you might want to implement a proper CSV export
    const table = $('#ordersTable').DataTable();
    const data = table.data().toArray();
    
    if (data.length === 0) {
        alert('No orders to export.');
        return;
    }

    // Create CSV content
    let csvContent = 'Order ID,Customer,Date,Total,Status,Payment\n';
    
    data.forEach(order => {
        csvContent += `${order.order_id || ''},${order.customer_name || ''},${order.order_date || ''},${order.total_amount || ''},${order.order_status || ''},${order.payment_status || ''}\n`;
    });

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
} 