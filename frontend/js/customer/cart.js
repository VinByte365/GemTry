// Cart functionality for e-commerce application

$(document).ready(function() {
    // Initialize cart on page load
    initializeCart();
    loadCartItems();
});

const baseURL = 'http://localhost:8080/';

function initializeCart() {
    fetchCartCount();
    bindCartEvents();
}

// Fetch and display cart count for authenticated user
function fetchCartCount() {
    const authToken = sessionStorage.getItem('authToken');
    
    if (!authToken) {
        $('.cart-count').addClass('hidden');
        return;
    }

    $.ajax({
        url: 'http://localhost:8080/api/v1/cart/count',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + authToken
        },
        success: function(response) {
            const count = response.count || 0;
            $('.cart-count').text(count).toggleClass('hidden', count === 0);
        },
        error: function(xhr) {
            console.error('Failed to fetch cart count:', xhr.responseText);
            $('.cart-count').addClass('hidden');
        }
    });
}

// Add item to cart (can be called from product grid or detail view)
function addToCart(productId, quantity = 1, callback = null) {
    const authToken = sessionStorage.getItem('authToken');
    
    if (!authToken) {
        alert('Please log in to add items to cart');
        // Optionally redirect to login page
        // window.location.href = '/login';
        return;
    }

    const button = $(`[data-product-id="${productId}"]`);
    const originalText = button.length ? button.text() : '';
    
    if (button.length) {
        button.prop('disabled', true).text('Adding...');
    }

    $.ajax({
        url: 'http://localhost:8080/api/v1/cart/add',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        },
        data: JSON.stringify({
            item_id: productId,
            quantity: quantity
        }),
        contentType: 'application/json',
        success: function(response) {
            if (button.length) {
                button.text('Added!');
            }
            
            // Update cart count
            fetchCartCount();
            
            // Execute callback if provided
            if (callback && typeof callback === 'function') {
                callback(true, response);
            }
            
            // Show success message (optional)
            showCartMessage('Item added to cart successfully!', 'success');
            
            // Reset button after delay
            if (button.length) {
                setTimeout(() => {
                    button.text(originalText).prop('disabled', false);
                }, 2000);
            }
        },
        error: function(xhr, status, error) {
            let errorMessage = 'Failed to add item to cart';
            
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMessage = xhr.responseJSON.message;
            } else if (xhr.status === 401) {
                errorMessage = 'Please log in to add items to cart';
            } else if (xhr.status === 400) {
                errorMessage = 'Invalid item or quantity';
            }
            
            alert(errorMessage);
            
            // Execute callback if provided
            if (callback && typeof callback === 'function') {
                callback(false, { message: errorMessage });
            }
            
            // Reset button
            if (button.length) {
                button.text(originalText).prop('disabled', false);
            }
        }
    });
}

// Add to cart from product detail modal with quantity validation
function addToCartFromDetail(productId, product) {
    const quantity = parseInt($('#quantity').val()) || 1;
    const maxStock = product.stock_qty || 0;
    
    if (quantity > maxStock) {
        alert(`Only ${maxStock} items available in stock.`);
        return;
    }
    
    if (quantity < 1) {
        alert('Please select a valid quantity.');
        return;
    }
    
    addToCart(productId, quantity, function(success, response) {
        if (success) {
            // Optional: Close modal after successful add
            // $('#productModal').hide();
            // $('body').css('overflow', 'auto');
        }
    });
}

// Remove item from cart with reload cart page
function removeFromCart(cartItemId, callback = null) {
    const authToken = sessionStorage.getItem('authToken');
    
    if (!authToken) {
        Swal.fire({
            icon: 'warning',
            title: 'Authentication Required',
            text: 'Please log in to manage your cart.',
            confirmButtonColor: '#3085d6'
        });
        return;
    }

    $.ajax({
        url: `http://localhost:8080/api/v1/cart/remove/${cartItemId}`,
        method: 'DELETE',
        headers: {
            'Authorization': 'Bearer ' + authToken
        },
        success: function(response) {
            fetchCartCount();

            Swal.fire({
                icon: 'success',
                title: 'Item Removed',
                text: 'The item has been removed from your cart.',
                timer: 1500,
                showConfirmButton: false
            });
            loadCartItems();
        },
        error: function(xhr) {
            let errorMessage = 'Failed to remove item from cart';
            
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMessage = xhr.responseJSON.message;
            }

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage,
                confirmButtonColor: '#d33'
            });

            // Optional callback
            if (callback && typeof callback === 'function') {
                callback(false, { message: errorMessage });
            }
        }
    });
}

// Update cart item quantity
function updateCartQuantity(cartItemId, newQuantity, callback = null) {
    const authToken = sessionStorage.getItem('authToken');
    
    if (!authToken) {
        alert('Please log in to manage cart');
        return;
    }

    if (newQuantity < 1) {
        alert('Quantity must be at least 1');
        return;
    }

    $.ajax({
        url: `http://localhost:8080/api/v1/cart/update/${cartItemId}`,
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
        },
        data: JSON.stringify({
            quantity: newQuantity
        }),
        contentType: 'application/json',
        success: function(response) {
            // Update cart count
            fetchCartCount();
            
            // Execute callback if provided
            if (callback && typeof callback === 'function') {
                callback(true, response);
            }
        },
        error: function(xhr, status, error) {
            let errorMessage = 'Failed to update cart item';
            
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMessage = xhr.responseJSON.message;
            }
            
            alert(errorMessage);
            
            // Execute callback if provided
            if (callback && typeof callback === 'function') {
                callback(false, { message: errorMessage });
            }
        }
    });
}

// Clear entire cart
function clearCart(callback = null) {
    const authToken = sessionStorage.getItem('authToken');
    
    if (!authToken) {
        alert('Please log in to manage cart');
        return;
    }

    if (!confirm('Are you sure you want to clear your entire cart?')) {
        return;
    }

    $.ajax({
        url: 'http://localhost:8080/api/v1/cart/clear',
        method: 'DELETE',
        headers: {
            'Authorization': 'Bearer ' + authToken
        },
        success: function(response) {
            // Update cart count
            fetchCartCount();
            
            // Execute callback if provided
            if (callback && typeof callback === 'function') {
                callback(true, response);
            }
            
            showCartMessage('Cart cleared successfully', 'success');
        },
        error: function(xhr, status, error) {
            let errorMessage = 'Failed to clear cart';
            
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMessage = xhr.responseJSON.message;
            }
            
            alert(errorMessage);
            
            // Execute callback if provided
            if (callback && typeof callback === 'function') {
                callback(false, { message: errorMessage });
            }
        }
    });
}

// Load cart page data
function loadCartItems() {
    const authToken = sessionStorage.getItem('authToken');

    if (!authToken) {
        $('#emptyCart').removeClass('hidden');
        $('.cart-container').hide();
        return;
    }

    $.ajax({
        url: 'http://localhost:8080/api/v1/cart',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + authToken
        },
        success: function(response) {
            if (!response.cartItems || response.cartItems.length === 0) {
                $('#emptyCart').removeClass('hidden');
                $('.cart-container').hide();
                return;
            }

            $('#cartItems').empty();

            // After appending cart items
response.cartItems.forEach(item => {
    const cartItemHTML = `
        <div class="cart-item" data-cart-id="${item.cart_id}" data-quantity="${item.quantity}">
    <div class="item-image-container">
        <img src="${baseURL + item.item_img}" alt="${item.item_name}" loading="lazy" class="item-image">
    </div>
    
    <div class="item-info">
        <div class="item-header">
            <h3 class="item-title">${item.item_name}</h3>
        </div>
        
        <div class="price-calculation">
            <div class="price-row">
                <span class="price-label">Unit Price:</span>
                <span class="unit-price">₱${item.item_price.toFixed(2)}</span>
            </div>
            
            <div class="quantity-row">
                <span class="quantity-label">Quantity:</span>
                <div class="quantity-controls">
                    <button class="quantity-btn minus" data-id="${item.cart_id}" data-current="${item.quantity}">
                        <i class="fas fa-minus"></i>
                    </button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn plus" data-id="${item.cart_id}" data-current="${item.quantity}">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
            
            <div class="subtotal-row">
                <span class="subtotal-label">Subtotal:</span>
                <span class="subtotal">₱${item.subtotal.toFixed(2)}</span>
            </div>
        </div>
    </div>
    
    <div class="item-actions">
        <button class="remove-item" onclick="removeFromCart(${item.cart_id})" title="Remove item">
            <i class="fas fa-trash-alt"></i>
            <span class="remove-text">Remove</span>
        </button>
    </div>
</div>
    `;
    $('#cartItems').append(cartItemHTML);
});
//Event listeners for quantity buttons
$('.quantity-btn').off('click').on('click', function () {
    const cartId = $(this).data('id');
    const currentQty = parseInt($(this).data('current'));
    const isIncrement = $(this).hasClass('plus');

    const newQty = isIncrement ? currentQty + 1 : currentQty - 1;

    updateCartItemQuantity(cartId, newQty);
});

            // Update totals
            const total = response.total || 0;
            $('#subtotal').text(`₱${total.toFixed(2)}`);
            $('#total').text(`₱${total.toFixed(2)}`);
        },
        error: function(xhr) {
            console.error('❌ Failed to load cart:', xhr.responseJSON?.message || xhr.statusText);
            $('#emptyCart').removeClass('hidden');
            $('.cart-container').hide();
        }
    });
}

// Bind cart-related events
function bindCartEvents() {
    // Quick add to cart from product grid
    $(document).on('click', '.add-to-cart', function(e) {
        e.stopPropagation();
        const productId = $(this).data('product-id');
        
        if (productId) {
            addToCart(productId, 1);
        }
    });

    // Add to cart from detail view
    $(document).on('click', '.add-to-cart-detail', function(e) {
        e.preventDefault();
        const productId = $(this).data('product-id');
        
        if (productId) {
            // Get product data from the detail view
            const product = {
                stock_qty: parseInt($('#quantity').attr('max')) || 0
            };
            
            addToCartFromDetail(productId, product);
        }
    });
}

// Helper function to show cart messages (you can customize this)
function showCartMessage(message, type = 'info') {
    // Simple implementation - you can replace with toast notifications
    if (type === 'success') {
        console.log('✅ ' + message);
    } else if (type === 'error') {
        console.error('❌ ' + message);
    } else {
        console.log('ℹ️ ' + message);
    }
    
    // Optional: Show a temporary notification
    // You can implement a toast notification system here
}

//Another helper function to update cart item quantity
function updateCartItemQuantity(cartId, quantity) {
    const authToken = sessionStorage.getItem('authToken');
    if (!authToken) {
        return Swal.fire('Please log in to update cart.');
    }

    $.ajax({
        url: 'http://localhost:8080/api/v1/cart/update',
        method: 'PUT',
        contentType: 'application/json',
        headers: {
            'Authorization': 'Bearer ' + authToken
        },
        data: JSON.stringify({ cart_id: cartId, quantity }),
        success: function (response) {
            // Reload cart items to reflect changes
            loadCartItems();
            fetchCartCount();
        },
        error: function (xhr) {
            Swal.fire({
                icon: 'error',
                title: 'Error updating cart',
                text: xhr.responseJSON?.message || 'Something went wrong'
            });
        }
    });
}
