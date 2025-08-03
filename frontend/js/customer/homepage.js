$(document).ready(function () {
    // DOM elements
    const productGrid = $('#productGrid');
    const productModal = $('#productModal');
    const productDetail = $('#productDetail');
    const modalClose = $('#modalClose');
    const baseUrl = 'http://localhost:8080/';
    // Initialize the application
    initializeProducts();

    function initializeProducts() {
        checkAuthStatus();
        renderProducts();
        bindProductEvents();
    }

    // Authentication status check
    function checkAuthStatus() {
        const authToken = sessionStorage.getItem('authToken');
        const userName = sessionStorage.getItem('name');
        const userInitial = sessionStorage.getItem('initial');
        
        if (authToken) {
            // User is logged in
            $('#guestNav').addClass('hidden');
            $('#userNav').removeClass('hidden');
            
            // Set user information if available
            if (userName) {
                $('#userName').text(userName);
            }
            if (userInitial) {
                $('#userAvatar').text(userInitial);
            }

            if (!sessionStorage.getItem('swalWelcomeShown')) {
                Swal.fire({
                    title: `Welcome back, ${userName || 'Valued Customer'}! 👋`,
                    text: 'Ready to discover more beautiful jewelry pieces?',
                    icon: 'success',
                    showConfirmButton: false,
                    timer: 2500,
                    timerProgressBar: true,
                    toast: true,
                    position: 'top-end',
                    background: '#f8f9fa',
                    color: '#212529'
                });
                sessionStorage.setItem('swalWelcomeShown', 'true');
                sessionStorage.setItem('swalGuestShown', 'false');
            }

        } else {
            // User is not logged in
            $('#guestNav').removeClass('hidden');
            $('#userNav').addClass('hidden');

            if (!sessionStorage.getItem('swalGuestShown')) {
            Swal.fire({
                title: 'Browsing as Guest 👤',
                text: 'Sign in to save favorites and track your orders!',
                icon: 'info',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                toast: true,
                position: 'top-end',
                showCloseButton: true   
            });
                sessionStorage.setItem('swalGuestShown', 'true');
                sessionStorage.setItem('swalWelcomeShown', 'false');
            }
        }
    }

    // Handle logout functionality
    function bindAuthEvents() {
        $('#logoutBtn').on('click', function(e) {
            e.preventDefault();
            
            // Confirmation dialog
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
                            
                            // Update UI
                            checkAuthStatus();
                            
                            // Success notification
                            Swal.fire({
                                title: 'Successfully Signed Out! 👋',
                                text: 'Thank you for visiting GemTry. Come back soon for more beautiful jewelry!',
                                icon: 'success',
                                confirmButtonColor: '#d4af37',
                                confirmButtonText: 'Browse More',
                                timer: 4000,
                                timerProgressBar: true
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
        });

        // Initialize dropdown menu toggle
        $('#userAvatar').on('click', function() {
            $('#dropdownMenu').toggleClass('active');
        });

        // Close dropdown when clicking outside
        $(document).on('click', function(e) {
            if (!$(e.target).closest('.user-dropdown').length) {
                $('#dropdownMenu').removeClass('active');
            }
        });
    }

    // Fetch and render products
    function renderProducts() {
        // Show enhanced loading state
        productGrid.html(`
            <div class="loading-products">
                <div class="loading-spinner"></div>
                <p>Loading our finest jewelry collection...</p>
            </div>
        `);

        $.ajax({
            url: 'http://localhost:8080/api/v1/product',
            method: 'GET',
            timeout: 10000,
            success: function (products) {
                if (!products || products.length === 0) {
                    showNoProducts();
                    return;
                }

                const html = products.map(product => `
                    <div class="product-card" data-id="${product.item_id}">
                        <div class="product-image">
                            <img src="${baseUrl+product.item_img}" 
                                 alt="${escapeHtml(product.item_name)}"
                                 onerror="this.src='/images/placeholder.jpg'; this.onerror=null;">
                        </div>
                        <div class="product-info">
                            <h3 class="product-name">${escapeHtml(product.item_name)}</h3>
                            <p class="product-price">₱${formatPrice(product.item_price)}</p>
                            <button class="add-to-cart" data-product-id="${product.item_id}" ${product.stock_qty <= 0 ? 'disabled' : ''}>
                                ${product.stock_qty <= 0 ? 'Out of Stock' : 'Add to Cart'}
                            </button>
                        </div>
                    </div>
                `).join('');

                productGrid.html(html);
            },
            error: function (xhr, status, error) {
                console.error('Error loading products:', error);
                
                let errorTitle = 'Collection Loading Failed! 😞';
                let errorText = 'We couldn\'t load our jewelry collection right now.';
                
                if (status === 'timeout') {
                    errorTitle = 'Connection Timeout! ⏰';
                    errorText = 'The request took too long. Please check your internet connection.';
                } else if (xhr.status >= 500) {
                    errorTitle = 'Server Maintenance! 🔧';
                    errorText = 'Our servers are currently being maintained. Please try again in a few minutes.';
                }
                
                showProductsError(errorText);
                
                Swal.fire({
                    title: errorTitle,
                    text: errorText,
                    icon: 'error',
                    confirmButtonColor: '#d4af37',
                    confirmButtonText: 'Try Again',
                    showCancelButton: true,
                    cancelButtonText: 'Browse Later',
                    footer: '<small>Our technical team has been notified</small>'
                }).then((result) => {
                    if (result.isConfirmed) {
                        location.reload();
                    }
                });
            }
        });
    }

    // Show no products message
    function showNoProducts() {
        productGrid.html(`
            <div class="no-products">
                <div class="no-products-icon">📦</div>
                <h3>No Products Available</h3>
                <p>Check back later for new arrivals!</p>
                <button onclick="location.reload()" class="retry-btn">Refresh</button>
            </div>
        `);

        Swal.fire({
            title: 'Collection Temporarily Empty 📦',
            text: 'We\'re restocking our beautiful jewelry collection. New pieces coming soon!',
            icon: 'info',
            confirmButtonColor: '#d4af37',
            confirmButtonText: 'Notify Me',
            showCancelButton: true,
            cancelButtonText: 'Browse Later',
            footer: '<small>Follow us on social media for restock updates</small>'
        });
    }

    // Show products loading error
    function showProductsError(message) {
        productGrid.html(`
            <div class="error-message">
                <div class="error-icon">⚠️</div>
                <h3>Oops!</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="retry-btn">Retry</button>
            </div>
        `);
    }

    // Bind product-related events
    function bindProductEvents() {
        // Product card click to show detail
        $(document).on('click', '.product-card', function (e) {
            // Don't trigger if clicking on the add to cart button
            if (!$(e.target).hasClass('add-to-cart')) {
                const productId = $(this).data('id');
                showProductDetail(productId);
            }
        });

        // Modal close events
        bindModalEvents();
        
        // Auth events
        bindAuthEvents();
    }

    // Show product detail modal
    function showProductDetail(productId) {
        // Show loading state with enhanced message
        const loadingHTML = `
            <div class="product-detail-loading">
                <div class="loading-spinner"></div>
                <p>Loading exquisite details...</p>
            </div>
        `;
        
        productDetail.html(loadingHTML);
        productModal.show();
        $('body').css('overflow', 'hidden');

        $.ajax({
            url: `http://localhost:8080/api/v1/product/${productId}`,
            method: 'GET',
            timeout: 10000,
            success: function (data) {
                try {
                    const product = data.product;
                    const gallery = data.gallery || [];

                    // Validate required product data
                    if (!product || !product.item_name) {
                        throw new Error('Invalid product data received');
                    }

                    // Handle image paths with fallback
                    const mainImage = product.item_img 
                        ? baseUrl + product.item_img 
                        : baseUrl + 'images/placeholder.jpg';
                                    
                    const galleryImages = gallery
                        .filter(g => g.item_path)
                        .map(g => baseUrl + g.item_path);

                    
                    const allImages = [mainImage, ...galleryImages];

                    const detailHTML = `
                        <div class="product-detail-container">
                            <div class="product-gallery">
                                <div class="main-image-container">
                                    <img src="${mainImage}" 
                                         alt="${escapeHtml(product.item_name)}" 
                                         class="main-image" 
                                         id="mainImage"
                                         onerror="this.src='/images/placeholder.jpg'; this.onerror=null;">
                                    <div class="image-loading-overlay" id="imageLoader" style="display: none;">
                                        <div class="spinner"></div>
                                    </div>
                                </div>
                                ${allImages.length > 1 ? `
                                    <div class="thumbnail-container">
                                        ${allImages.map((img, index) => `
                                            <img src="${img}" 
                                                 alt="Thumbnail ${index + 1}" 
                                                 class="thumbnail ${index === 0 ? 'active' : ''}" 
                                                 data-img="${img}"
                                                 onerror="this.style.display='none';">
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                            
                            <div class="product-info">
                                <h1 class="product-title">${escapeHtml(product.item_name)}</h1>
                                <div class="product-price">₱${formatPrice(product.item_price)}</div>
                                ${product.item_desc ? `<div class="product-description">${escapeHtml(product.item_desc)}</div>` : ''}

                                <div class="product-specs">
                                    <h3>Product Details</h3>
                                    <div class="specs-grid">
                                        <div class="spec-item">
                                            <span class="spec-label">Category:</span>
                                            <span class="spec-value">${escapeHtml(product.category_name || 'Uncategorized')}</span>
                                        </div>
                                        <div class="spec-item">
                                            <span class="spec-label">Stock:</span>
                                            <span class="spec-value">${product.stock_qty || 0} available</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="product-actions">
                                    <div class="quantity-selector">
                                        <label for="quantity">Quantity:</label>
                                        <div class="quantity-input-wrapper">
                                            <button type="button" class="quantity-btn minus" onclick="adjustQuantity(-1)">-</button>
                                            <input type="number" id="quantity" min="1" max="${product.stock_qty || 1}" value="1" readonly>
                                            <button type="button" class="quantity-btn plus" onclick="adjustQuantity(1)">+</button>
                                        </div>
                                    </div>
                                    <div class="action-buttons">
                                        <button class="add-to-cart-detail" data-product-id="${productId}" ${product.stock_qty <= 0 ? 'disabled' : ''}>
                                            ${product.stock_qty <= 0 ? 'Out of Stock' : 'Add to Cart'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;

                    productDetail.html(detailHTML);

                    // Initialize image functionality
                    initializeImageGallery();
                    initializeProductActions(productId, product);

                } catch (error) {
                    console.error('Error processing product data:', error);
                    showProductError('Failed to process product information.');
                    
                    Swal.fire({
                        title: 'Data Processing Error! 🔧',
                        text: 'We couldn\'t process this product\'s information properly.',
                        icon: 'error',
                        confirmButtonColor: '#dc3545',
                        confirmButtonText: 'Close',
                        footer: '<small>Our team has been notified of this issue</small>'
                    });
                }
            },
            error: function (xhr, status, error) {
                console.error('AJAX Error:', {
                    status: xhr.status,
                    statusText: xhr.statusText,
                    error: error,
                    responseText: xhr.responseText
                });
                
                let errorTitle = 'Product Details Error! 😞';
                let errorMessage = 'Failed to load product details.';
                
                if (xhr.status === 404) {
                    errorTitle = 'Product Not Found! 🔍';
                    errorMessage = 'This beautiful piece seems to have moved or is no longer available.';
                } else if (xhr.status === 500) {
                    errorTitle = 'Server Error! 🔧';
                    errorMessage = 'Our servers are experiencing issues. Please try again in a moment.';
                } else if (status === 'timeout') {
                    errorTitle = 'Loading Timeout! ⏰';
                    errorMessage = 'The product details are taking too long to load. Please check your connection.';
                }
                
                showProductError(errorMessage);
                
                Swal.fire({
                    title: errorTitle,
                    text: errorMessage,
                    icon: 'error',
                    confirmButtonColor: '#d4af37',
                    confirmButtonText: 'Browse Other Items',
                    showCancelButton: true,
                    cancelButtonText: 'Try Again',
                    footer: '<small>Our technical team has been notified</small>'
                }).then((result) => {
                    if (result.isDismissed && result.dismiss === Swal.DismissReason.cancel) {
                        // Try again
                        setTimeout(() => {
                            showProductDetail(productId);
                        }, 1000);
                    } else {
                        // Close modal and browse other items
                        closeProductModal();
                    }
                });
            }
        });
    }

    // Initialize image gallery functionality
    function initializeImageGallery() {
        const mainImage = $('#mainImage');
        const imageLoader = $('#imageLoader');
        
        // Show loader when image starts loading
        mainImage.on('load', function() {
            imageLoader.hide();
            $(this).fadeIn(300);
        });
        
        mainImage.on('loadstart', function() {
            imageLoader.show();
            $(this).hide();
        });

        // Thumbnail switching with smooth transition
        $('.thumbnail').off('click').on('click', function () {
            const newSrc = $(this).data('img');
            const currentSrc = mainImage.attr('src');
            
            if (newSrc !== currentSrc) {
                // Update active thumbnail
                $('.thumbnail').removeClass('active');
                $(this).addClass('active');
                
                // Show loading and switch image
                imageLoader.show();
                mainImage.hide();
                mainImage.attr('src', newSrc);
            }
        });

        // Add keyboard navigation for thumbnails
        $(document).off('keydown.gallery').on('keydown.gallery', function(e) {
            if (productModal.is(':visible')) {
                const thumbnails = $('.thumbnail');
                const activeThumbnail = $('.thumbnail.active');
                let nextIndex;
                
                if (e.key === 'ArrowLeft') {
                    nextIndex = Math.max(0, thumbnails.index(activeThumbnail) - 1);
                    thumbnails.eq(nextIndex).click();
                    e.preventDefault();
                } else if (e.key === 'ArrowRight') {
                    nextIndex = Math.min(thumbnails.length - 1, thumbnails.index(activeThumbnail) + 1);
                    thumbnails.eq(nextIndex).click();
                    e.preventDefault();
                }
            }
        });
    }

    // Initialize product actions (quantity controls)
    function initializeProductActions(productId, product) {
        // Quantity validation with enhanced feedback
        $('#quantity').on('change input', function() {
            const value = parseInt($(this).val());
            const max = parseInt($(this).attr('max'));
            
            if (value > max) {
                $(this).val(max);
                Swal.fire({
                    title: 'Quantity Limit Reached! 📦',
                    text: `Only ${max} pieces available in stock for this beautiful item.`,
                    icon: 'warning',
                    confirmButtonColor: '#d4af37',
                    confirmButtonText: 'I Understand',
                    timer: 3000,
                    timerProgressBar: true
                });
            } else if (value < 1 || isNaN(value)) {
                $(this).val(1);
                Swal.fire({
                    title: 'Invalid Quantity! ❌',
                    text: 'Please select at least 1 piece to add to your cart.',
                    icon: 'error',
                    confirmButtonColor: '#dc3545',
                    confirmButtonText: 'Got It',
                    timer: 2000
                });
            } else {
                // Valid quantity selected
                Swal.fire({
                    title: 'Quantity Updated! ✅',
                    text: `${value} piece${value > 1 ? 's' : ''} selected`,
                    icon: 'success',
                    showConfirmButton: false,
                    timer: 1000,
                    toast: true,
                    position: 'bottom-end'
                });
            }
        });
    }

    // Show error state in product detail modal
    function showProductError(message) {
        const errorHTML = `
            <div class="product-detail-error">
                <div class="error-icon">⚠️</div>
                <h3>Oops!</h3>
                <p>${message}</p>
                <button class="retry-btn" onclick="closeProductModal()">Close</button>
            </div>
        `;
        
        productDetail.html(errorHTML);
    }

    // Modal event bindings
    function bindModalEvents() {
        // Modal close button
        modalClose.on('click', function () {
            closeProductModal();
        });

        // Click outside modal to close
        productModal.on('click', function (e) {
            if (e.target === this) {
                closeProductModal();
            }
        });

        // ESC key to close modal
        $(document).on('keydown', function(e) {
            if (e.key === 'Escape' && productModal.is(':visible')) {
                closeProductModal();
            }
        });
    }

    // Close product modal
    function closeProductModal() {
        productModal.hide();
        cleanupModal();
    }

    // Clean up modal state
    function cleanupModal() {
        $('body').css('overflow', 'auto');
        $(document).off('keydown.gallery');
    }

    // Global quantity adjustment function
    window.adjustQuantity = function(change) {
        const quantityInput = $('#quantity');
        const currentValue = parseInt(quantityInput.val()) || 1;
        const min = parseInt(quantityInput.attr('min')) || 1;
        const max = parseInt(quantityInput.attr('max')) || 999;
        
        const newValue = currentValue + change;
        
        if (newValue >= min && newValue <= max) {
            quantityInput.val(newValue);
            
            // Quantity adjustment feedback
            Swal.fire({
                title: `Quantity ${change > 0 ? 'Increased' : 'Decreased'}! ${change > 0 ? '➕' : '➖'}`,
                text: `Now selecting ${newValue} piece${newValue > 1 ? 's' : ''}`,
                icon: 'success',
                showConfirmButton: false,
                timer: 1000,
                toast: true,
                position: 'bottom-end'
            });
        } else {
            // Quantity limit feedback
            if (newValue > max) {
                Swal.fire({
                    title: 'Maximum Reached! 📦',
                    text: `Only ${max} pieces available`,
                    icon: 'warning',
                    showConfirmButton: false,
                    timer: 1500,
                    toast: true,
                    position: 'bottom-end'
                });
            } else {
                Swal.fire({
                    title: 'Minimum Quantity! 📝',
                    text: 'At least 1 piece required',
                    icon: 'info',
                    showConfirmButton: false,
                    timer: 1500,
                    toast: true,
                    position: 'bottom-end'
                });
            }
        }
    };

    // Global function to close modal (for use in error states)
    window.closeProductModal = closeProductModal;

    // Helper function to escape HTML
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Helper function to format price
    function formatPrice(price) {
        const numPrice = parseFloat(price) || 0;
        return numPrice.toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // Public API for external access
    window.productFunctions = {
        renderProducts,
        showProductDetail,
        closeProductModal,
        checkAuthStatus
    };
});