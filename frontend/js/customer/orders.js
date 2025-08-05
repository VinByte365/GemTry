// Orders page functionality

$(document).ready(function () {
    const baseURL = 'http://localhost:8080/';
    // Check authentication
    checkAuthStatus();

    // Load orders
    loadOrders();

    // Initialize filters
    initializeFilters();

    // Bind events
    bindEvents();

    // Function to check authentication status
    function checkAuthStatus() {
        const authToken = sessionStorage.getItem('authToken');
        const userName = sessionStorage.getItem('name');
        const userInitial = sessionStorage.getItem('initial');
        
        if (!authToken) {
            // Redirect to login if not authenticated
            window.location.href = '../../login.html';
            return;
        }

        // Update UI for authenticated user
        $('#guestNav').addClass('hidden');
        $('#userNav').removeClass('hidden');
        
        if (userName) {
            $('#userName').text(userName);
        }
        if (userInitial) {
            $('#userAvatar').text(userInitial);
        }
    }

    // Function to load orders
    function loadOrders() {
        showLoading();
        
        $.ajax({
            url: `http://localhost:8080/api/v1/order/user/${sessionStorage.getItem('userId')}`,
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + sessionStorage.getItem('authToken')
            },
            success: function(data) {
                hideLoading();
                if (data && data.length > 0) {
                    renderOrders(data);
                } else {
                    showNoOrders();
                }
            },
            error: function(xhr, status, error) {
                hideLoading();
                showError('Failed to load orders. Please try again.');
            }
        });
    }

    // Function to render orders
        function renderOrders(orders) {
            const ordersList = $('.orders-list');
            ordersList.empty();

            orders.forEach(order => {
                const orderHtml = `
                    <div class="order-card">
                        <div class="order-header">
                            <div class="order-id">Order #${order.order_id}</div>
                            <div class="order-date">${formatDate(order.created_at)}</div>
                            <div class="order-status status-${order.status.toLowerCase()}">${capitalizeFirstLetter(order.status)}</div>
                        </div>
                        
                        <div class="order-items">
                            ${renderOrderItems(order.items)}
                        </div>
                        
                        <div class="order-summary">
                            <div class="order-total">Total: ₱${formatPrice(order.total_amount)}</div>
                            <div class="order-actions">
                                <button class="view-details-btn" onclick="viewOrderDetails('${order.order_id}')">
                                    View Details
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                ordersList.append(orderHtml);
            });
        }

    // Function to render order items
    function renderOrderItems(items) {
        return items.map(item => `
            <div class="order-item" style="display: flex; align-items: center; margin-bottom: 10px;">
                <img src="${baseURL + item.item_img || '/images/placeholder.jpg'}" 
                     alt="${escapeHtml(item.item_name)}"
                     onerror="this.src='/images/placeholder.jpg'; this.onerror=null;"
                     style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px; border-radius: 4px;">
                <div class="item-details">
                    <h4 class="item-name" style="margin: 0; font-weight: bold; font-size: 1rem;">${escapeHtml(item.item_name)}</h4>
                </div>
            </div>
        `).join('');
    }
    
    

    // Function to initialize filters
    function initializeFilters() {
        // Status filter
        $('#statusFilter').on('change', function() {
            applyFilters();
        });

        // Time filter
        $('#timeFilter').on('change', function() {
            applyFilters();
        });

        // Search input
        $('#orderSearch').on('input', debounce(function() {
            applyFilters();
        }, 300));
    }

    // Function to apply filters
    function applyFilters() {
        const status = $('#statusFilter').val();
        const timeFrame = $('#timeFilter').val();
        const searchTerm = $('#orderSearch').val().toLowerCase();

        $.ajax({
            url: 'http://localhost:8080/api/v1/orders',
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + sessionStorage.getItem('authToken')
            },
            data: {
                status: status === 'all' ? null : status,
                timeFrame: timeFrame === 'all' ? null : timeFrame,
                search: searchTerm || null
            },
            success: function(data) {
                if (data && data.length > 0) {
                    renderOrders(data);
                } else {
                    showNoOrders();
                }
            },
            error: function(xhr, status, error) {
                showError('Failed to filter orders. Please try again.');
            }
        });
    }

    // Function to view order details
    window.viewOrderDetails = function(orderId) {
        $.ajax({
            url: `http://localhost:8080/api/v1/order/${orderId}`,
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + sessionStorage.getItem('authToken')
            },
            success: function (data) {
                showOrderDetails(data);
            },
            error: function(xhr, status, error) {
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to load order details. Please try again.',
                    icon: 'error'
                });
            }
        });
    };

    // Function to show order details
    function showOrderDetails(order) {
        // Debugging: Log the order object to ensure it contains the expected data
        console.log('Order object:', order);
    
        Swal.fire({
            title: `Order #${order?.order?.order_id || 'N/A'}`, // Safely access order_id
            html: `
                <div class="order-details">
                    <div class="order-info">
                        <p><strong>Date:</strong> ${order?.order?.created_at ? formatDate(order.order.created_at) : 'N/A'}</p>
                        <p><strong>Status:</strong> ${order?.order?.status ? capitalizeFirstLetter(order.order.status) : 'N/A'}</p>
                        <p><strong>Total Amount:</strong> ₱${order?.order?.total_amount ? formatPrice(order.order.total_amount) : '0.00'}</p>
                    </div>
                    <div class="order-items-list">
                        ${
                            Array.isArray(order.items) && order.items.length > 0
                            ? order.items.map(item => `
                                <div class="order-item-detail">
                                    <img src="${item.item_img ? baseURL + item.item_img : '/images/placeholder.jpg'}" alt="${escapeHtml(item.item_name || 'Item')}">
                                    <div class="item-info">
                                        <h4>${escapeHtml(item.item_name || 'Unnamed Item')}</h4>
                                        <p>Quantity: ${item.quantity || 0}</p>
                                        <p>Price: ₱${item.item_price ? formatPrice(item.item_price) : '0.00'}</p>
                                    </div>
                                </div>
                            `).join('')
                            : '<p>No items found for this order.</p>'
                        }
                    </div>
                </div>
            `,
            width: '600px',
            showCloseButton: true,
            showConfirmButton: false
        });
    }

    // Function to show tracking details
    // function showTrackingDetails(tracking) {
    //     Swal.fire({
    //         title: 'Order Tracking',
    //         html: `
    //             <div class="order-timeline">
    //                 ${tracking.events.map(event => `
    //                     <div class="timeline-item">
    //                         <div class="timeline-date">${formatDate(event.timestamp)}</div>
    //                         <div class="timeline-status">${event.status}</div>
    //                         <div class="timeline-description">${event.description}</div>
    //                     </div>
    //                 `).join('')}
    //             </div>
    //         `,
    //         width: '600px',
    //         showCloseButton: true,
    //         showConfirmButton: false
    //     });
    // }

    // Helper Functions
    function showLoading() {
        $('#loadingOrders').removeClass('hidden');
        $('.orders-list').addClass('hidden');
        $('#noOrders').addClass('hidden');
    }

    function hideLoading() {
        $('#loadingOrders').addClass('hidden');
        $('.orders-list').removeClass('hidden');
    }

    function showNoOrders() {
        $('#noOrders').removeClass('hidden');
        $('.orders-list').addClass('hidden');
    }

    function showError(message) {
        Swal.fire({
            title: 'Error',
            text: message,
            icon: 'error'
        });
    }

    function formatDate(dateString) {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    function formatPrice(price) {
        return parseFloat(price).toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function capitalizeFirstLetter(string) {
        if (!string || typeof string !== 'string') return '';
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }
    

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

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

    // Bind additional events
    function bindEvents() {
        // Logout button
        $('#logoutBtn').on('click', function(e) {
            e.preventDefault();
            sessionStorage.clear();
            window.location.href = '/frontend/views/customer/login.html';
        });

        // User dropdown
        $('#userAvatar').on('click', function() {
            $('#dropdownMenu').toggleClass('active');
        });

        $(document).on('click', function(e) {
            if (!$(e.target).closest('.user-dropdown').length) {
                $('#dropdownMenu').removeClass('active');
            }
        });
    }
});
