$(document).ready(function () {
    const productGrid = $('#productGrid');
    const productModal = $('#productModal');
    const productDetail = $('#productDetail');
    const modalClose = $('#modalClose');

    // Fetch and render products
    function renderProducts() {
        $.ajax({
            url: 'http://localhost:8080/api/v1/product',
            method: 'GET',
            success: function (products) {
                const html = products.map(product => `
                    <div class="product-card" data-id="${product.item_id}">
                        <div class="product-image">
                            <img src="${product.item_img}" 
                                 alt="${escapeHtml(product.item_name)}"
                                 onerror="this.src='/images/placeholder.jpg'; this.onerror=null;">
                        </div>
                        <div class="product-info">
                            <h3 class="product-name">${escapeHtml(product.item_name)}</h3>
                            <p class="product-price">₱${formatPrice(product.item_price)}</p>
                            <button class="add-to-cart" data-product-id="${product.item_id}">Add to Cart</button>
                        </div>
                    </div>
                `).join('');

                productGrid.html(html);

                // Add click event to product cards
                $('.product-card').on('click', function (e) {
                    // Don't trigger if clicking on the add to cart button
                    if (!$(e.target).hasClass('add-to-cart')) {
                        const productId = $(this).data('id');
                        showProductDetail(productId);
                    }
                });

                // Handle add to cart from grid
                $('.add-to-cart').on('click', function (e) {
                    e.stopPropagation();
                    const productId = $(this).data('product-id');
                    // Add your cart logic here
                    console.log(`Quick add to cart: Product ${productId}`);
                });
            },
            error: function (xhr, status, error) {
                console.error('Error loading products:', error);
                productGrid.html(`
                    <div class="error-message">
                        <h3>Failed to load products</h3>
                        <p>Please check your connection and try again.</p>
                        <button onclick="location.reload()" class="retry-btn">Retry</button>
                    </div>
                `);
            }
        });
    }

    // Show product detail modal - IMPROVED VERSION
    function showProductDetail(productId) {
        // Show loading state
        const loadingHTML = `
            <div class="product-detail-loading">
                <div class="loading-spinner"></div>
                <p>Loading product details...</p>
            </div>
        `;
        
        productDetail.html(loadingHTML);
        productModal.show();
        $('body').css('overflow', 'hidden');

        $.ajax({
            url: `http://localhost:8080/api/v1/product/${productId}`,
            method: 'GET',
            timeout: 10000, // 10 second timeout
            success: function (data) {
                try {
                    const product = data.product;
                    const gallery = data.gallery || [];

                    // Validate required product data
                    if (!product || !product.item_name) {
                        throw new Error('Invalid product data received');
                    }

                    // Handle image paths with fallback
                    const mainImage = product.item_img || '/images/placeholder.jpg';
                    const galleryImages = gallery
                        .filter(g => g.item_path) // Filter out null/undefined paths
                        .map(g => g.item_path);
                    
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
                }
            },
            error: function (xhr, status, error) {
                console.error('AJAX Error:', {
                    status: xhr.status,
                    statusText: xhr.statusText,
                    error: error,
                    responseText: xhr.responseText
                });
                
                let errorMessage = 'Failed to load product details.';
                
                if (xhr.status === 404) {
                    errorMessage = 'Product not found.';
                } else if (xhr.status === 500) {
                    errorMessage = 'Server error. Please try again later.';
                } else if (status === 'timeout') {
                    errorMessage = 'Request timed out. Please check your connection.';
                }
                
                showProductError(errorMessage);
            }
        });
    }

    // Helper function to initialize image gallery
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

    // Helper function to initialize product actions
    function initializeProductActions(productId, product) {
        // Add to cart functionality (detailed view)
        $('.add-to-cart-detail').off('click').on('click', function() {
            const quantity = parseInt($('#quantity').val()) || 1;
            const maxStock = product.stock_qty || 0;
            
            if (quantity > maxStock) {
                alert(`Only ${maxStock} items available in stock.`);
                return;
            }
            
            const button = $(this);
            const originalText = button.text();
            button.prop('disabled', true).text('Adding...');

            $.ajax({
                url: 'http://localhost:8080/api/v1/cart/add',
                method: 'POST',
                data: JSON.stringify({
                    item_id: productId,
                    quantity: quantity
                }),
                contentType: 'application/json',
                success: function(response) {
                    button.text('Added!');
                    
                    // Optional: Update cart counter if you have one
                    if (response.cartCount) {
                        $('.cart-count').text(response.cartCount);
                    }
                    
                    setTimeout(() => {
                        button.text(originalText).prop('disabled', false);
                    }, 2000);
                },
                error: function(xhr, status, error) {
                    let errorMessage = 'Failed to add item to cart';
                    
                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        errorMessage = xhr.responseJSON.message;
                    }
                    
                    alert(errorMessage);
                    button.text(originalText).prop('disabled', false);
                }
            });
        });
        
        
        // Quantity validation
        $('#quantity').on('change input', function() {
            const value = parseInt($(this).val());
            const max = parseInt($(this).attr('max'));
            
            if (value > max) {
                $(this).val(max);
                alert(`Maximum quantity available: ${max}`);
            } else if (value < 1 || isNaN(value)) {
                $(this).val(1);
            }
        });
    }

    // Helper function to show error state
    function showProductError(message) {
        const errorHTML = `
            <div class="product-detail-error">
                <div class="error-icon">⚠️</div>
                <h3>Oops!</h3>
                <p>${message}</p>
                <button class="retry-btn" onclick="productModal.hide(); $('body').css('overflow', 'auto');">Close</button>
            </div>
        `;
        
        productDetail.html(errorHTML);
    }

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

    // Modal close actions
    modalClose.on('click', function () {
        productModal.hide();
        $('body').css('overflow', 'auto');
        $(document).off('keydown.gallery');
    });

    productModal.on('click', function (e) {
        if (e.target === this) {
            productModal.hide();
            $('body').css('overflow', 'auto');
            $(document).off('keydown.gallery');
        }
    });

    // Clean up when modal is closed
    productModal.on('hidden.bs.modal', function () {
        $('body').css('overflow', 'auto');
        $(document).off('keydown.gallery');
    });

    // ESC key to close modal
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape' && productModal.is(':visible')) {
            productModal.hide();
            $('body').css('overflow', 'auto');
            $(document).off('keydown.gallery');
        }
    });

    // Global quantity adjustment function
    window.adjustQuantity = function(change) {
        const quantityInput = $('#quantity');
        const currentValue = parseInt(quantityInput.val()) || 1;
        const min = parseInt(quantityInput.attr('min')) || 1;
        const max = parseInt(quantityInput.attr('max')) || 999;
        
        const newValue = currentValue + change;
        
        if (newValue >= min && newValue <= max) {
            quantityInput.val(newValue);
        }
    };

    // Initialize the application
    renderProducts();
});