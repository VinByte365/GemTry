// Shop page functionality
$(document).ready(function() {
    // State management
    const baseURL = 'http://localhost:8080/';
    let allProducts = [];
    let filteredProducts = [];
    let categories = [];
    let currentPage = 1;
    const productsPerPage = 12;
    let currentView = 'grid';
    let currentFilters = {
        categories: ['all'],
        minPrice: 0,
        maxPrice: Infinity,
        sortBy: 'name-asc'
    };

    // Initialize the shop
    initializeShop();

    function initializeShop() {
        checkAuthStatus();
        loadCategories();
        loadProducts();
        initializeAutocomplete();
        bindEvents();
    }

    // Initialize search autocomplete
    function initializeAutocomplete() {
        $("#searchInput").autocomplete({
            source: function(request, response) {
                // If no search term, return empty array
                if (!request.term) {
                    response([]);
                    return;
                }

                // First try to filter the existing products array for immediate response
                const localResults = allProducts.filter(product => 
                    product.item_name.toLowerCase().includes(request.term.toLowerCase())
                ).map(item => ({
                    label: item.item_name,
                    value: item.item_name,
                    id: item.item_id,
                    price: item.item_price,
                    image: item.item_img
                }));

                // Show local results immediately
                response(localResults);

                // Then make the API call for complete results
                $.ajax({
                    url: "http://localhost:8080/api/v1/product/search",
                    method: "GET",
                    data: { search: request.term },
                    success: function(data) {
                        if (!$("#searchInput").val()) return; // Don't update if input is cleared

                        const items = data.map(item => ({
                            label: item.item_name,
                            value: item.item_name,
                            id: item.item_id,
                            price: item.item_price,
                            image: item.item_img
                        }));
                        response(items);
                    },
                    error: function(xhr, status, error) {
                        console.error('Search error:', error);
                        // Keep showing local results on error
                        response(localResults);
                    }
                });
            },
            // Reduce minLength to 1 for more responsive search
            minLength: 1,
            // Add delay to prevent too many requests
            delay: 300,
            minLength: 2,
            select: function(event, ui) {
                showProductDetail(ui.item.id);
                return false;
            }
        }).autocomplete("instance")._renderItem = function(ul, item) {
            return $("<li>")
                .append(`
                    <div class='autocomplete-item'>
                        <img src='${baseURL + item.image || "/images/placeholder.jpg"}' 
                             alt='${escapeHtml(item.label)}'
                             onerror="this.src='/images/placeholder.jpg'; this.onerror=null;"
                             class="search-result-image">
                        <div class='autocomplete-item-details'>
                            <div class='autocomplete-item-name'>${escapeHtml(item.label)}</div>
                            <div class='autocomplete-item-price'>₱${formatPrice(item.price)}</div>
                        </div>
                    </div>
                `)
                .appendTo(ul);
        };
    }

    // Authentication check (same as homepage)
    function checkAuthStatus() {
        const authToken = sessionStorage.getItem('authToken');
        const userName = sessionStorage.getItem('name');
        const userInitial = sessionStorage.getItem('initial');
        
        if (authToken) {
            $('#guestNav').addClass('hidden');
            $('#userNav').removeClass('hidden');
            
            if (userName) {
                $('#userName').text(userName);
            }
            if (userInitial) {
                $('#userAvatar').text(userInitial);
            }
        } else {
            $('#guestNav').removeClass('hidden');
            $('#userNav').addClass('hidden');
        }
    }

    // Load categories for filter
    function loadCategories() {
        $.ajax({
            url: 'http://localhost:8080/api/v1/product/categories',
            method: 'GET',
            success: function (data) {
                console.log('Categories loaded:', data); // Debug log
                if (Array.isArray(data)) {
                    categories = data;
                } else if (data && typeof data === 'object') {
                    categories = data.categories || [];
                } else {
                    categories = [];
                }
                renderCategoryFilters();
            },
            error: function (error) {
                console.error('Error loading categories:', error);
                // Use default categories if API fails
                categories = [
                    { id: 1, name: 'Necklaces' },
                    { id: 2, name: 'Rings' },
                    { id: 3, name: 'Bracelets' },
                    { id: 4, name: 'Earrings' }
                ];
                renderCategoryFilters();
            }
        });
    }

    // Render category filters
    function renderCategoryFilters() {
        const container = $('#categoryFilters');
        let html = `
            <div class="category-filter">
                <input type="checkbox" id="cat-all" value="all" checked>
                <label for="cat-all">All Categories</label>
                <span class="category-count" id="count-all">0</span>
            </div>
        `;

        categories.forEach(category => {
            const categoryName = category.name || category.category_name;
            const displayName = capitalizeFirstLetter(categoryName);
            html += `
                <div class="category-filter">
                    <input type="checkbox" id="cat-${categoryName}" value="${categoryName}">
                    <label for="cat-${categoryName}">${escapeHtml(displayName)}</label>
                    <span class="category-count" id="count-${categoryName}">0</span>
                </div>
            `;
        });

        container.html(html);
    }

    // Load products
    function loadProducts() {
        showLoading();
        
        $.ajax({
            url: 'http://localhost:8080/api/v1/product',
            method: 'GET',
            timeout: 10000,
            success: function (products) {
                allProducts = products || [];
                updateCategoryCounts();
                applyFilters();
            },
            error: function (xhr, status, error) {
                console.error('Error loading products:', error);
                showError('Failed to load products. Please try again.');
            }
        });
    }

    // Show loading state
    function showLoading() {
        $('#productGrid').html(`
            <div class="loading-products">
                <div class="loading-spinner"></div>
                <p>Loading our exquisite jewelry collection...</p>
            </div>
        `);
    }

    // Show error state
    function showError(message) {
        $('#productGrid').html(`
            <div class="no-products">
                <div class="no-products-icon">⚠️</div>
                <h3>Oops!</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="retry-btn">Try Again</button>
            </div>
        `);
    }

    // Update category counts
    function updateCategoryCounts() {
        $('#count-all').text(allProducts.length);
        
        categories.forEach(category => {
            const categoryName = category.name || category.category_name;
            const count = allProducts.filter(product => 
                product.category_name === categoryName
            ).length;
            $(`#count-${categoryName}`).text(count);
        });
    }

    // Apply filters
    function applyFilters() {
        let filtered = [...allProducts];

        // Apply category filter
        if (!currentFilters.categories.includes('all') && currentFilters.categories.length > 0) {
            filtered = filtered.filter(product => {
                return currentFilters.categories.some(categoryName => {
                    // Compare category names directly
                    return product.category_name === categoryName;
                });
            });
        }

        // Apply price filter
        filtered = filtered.filter(product => {
            const price = parseFloat(product.item_price) || 0;
            return price >= currentFilters.minPrice && price <= currentFilters.maxPrice;
        });

        // Apply sorting
        filtered.sort((a, b) => {
            switch (currentFilters.sortBy) {
                case 'name-asc':
                    return a.item_name.localeCompare(b.item_name);
                case 'name-desc':
                    return b.item_name.localeCompare(a.item_name);
                case 'price-asc':
                    return parseFloat(a.item_price) - parseFloat(b.item_price);
                case 'price-desc':
                    return parseFloat(b.item_price) - parseFloat(a.item_price);
                case 'newest':
                    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                default:
                    return 0;
            }
        });

        filteredProducts = filtered;
        currentPage = 1;
        renderProducts();
        renderPagination();
        updateResultsCount();
    }

    // Render products
    function renderProducts() {
        const startIndex = (currentPage - 1) * productsPerPage;
        const endIndex = startIndex + productsPerPage;
        const productsToShow = filteredProducts.slice(startIndex, endIndex);

        if (productsToShow.length === 0) {
            $('#productGrid').html(`
                <div class="no-products">
                    <div class="no-products-icon">🔍</div>
                    <h3>No Products Found</h3>
                    <p>Try adjusting your filters to see more results.</p>
                </div>
            `);
            return;
        }

        const html = productsToShow.map(product => {
            if (currentView === 'list') {
                // List view layout
                return `
                    <div class="product-card" data-id="${product.item_id}">
                        ${product.stock_qty <= 0 ? '<div class="product-badge">Out of Stock</div>' : ''}
                        <div class="product-image">
                            <img src="${baseURL + product.item_img}" 
                                 alt="${escapeHtml(product.item_name)}"
                                 onerror="this.src='/images/placeholder.jpg'; this.onerror=null;">
                        </div>
                        <div class="product-info">
                            <h3 class="product-name">${escapeHtml(product.item_name)}</h3>
                            <p class="product-category">${escapeHtml(capitalizeFirstLetter(product.category_name) || 'Uncategorized')}</p>
                            <p class="product-price">₱${formatPrice(product.item_price)}</p>
                            ${product.item_desc ? `<p class="product-description">${escapeHtml(product.item_desc.substring(0, 150))}${product.item_desc.length > 150 ? '...' : ''}</p>` : ''}
                        </div>
                        <div class="product-actions">
                            <button class="wishlist-btn" data-product-id="${product.item_id}">
                                <i class="fas fa-heart"></i>
                            </button>
                            <button class="add-to-cart-btn" data-product-id="${product.item_id}" ${product.stock_qty <= 0 ? 'disabled' : ''}>
                                <i class="fas fa-shopping-cart"></i>
                                ${product.stock_qty <= 0 ? 'Out of Stock' : 'Add to Cart'}
                            </button>
                        </div>
                    </div>
                `;
            } else {
                // Grid view layout (default)
                return `
                    <div class="product-card" data-id="${product.item_id}">
                        ${product.stock_qty <= 0 ? '<div class="product-badge">Out of Stock</div>' : ''}
                        <div class="product-image">
                            <img src="${baseURL + product.item_img}" 
                                 alt="${escapeHtml(product.item_name)}"
                                 onerror="this.src='/images/placeholder.jpg'; this.onerror=null;">
                        </div>
                        <div class="product-info">
                            <h3 class="product-name">${escapeHtml(product.item_name)}</h3>
                            <p class="product-category">${escapeHtml(capitalizeFirstLetter(product.category_name) || 'Uncategorized')}</p>
                            <p class="product-price">₱${formatPrice(product.item_price)}</p>
                            <div class="product-actions">
                                <button class="wishlist-btn" data-product-id="${product.item_id}">
                                    <i class="fas fa-heart"></i>
                                </button>
                                <button class="add-to-cart-btn" data-product-id="${product.item_id}" ${product.stock_qty <= 0 ? 'disabled' : ''}>
                                    <i class="fas fa-shopping-cart"></i>
                                    ${product.stock_qty <= 0 ? 'Out of Stock' : 'Add to Cart'}
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }
        }).join('');

        const $productGrid = $('#productGrid');
        $productGrid.html(html);
        
        // Apply the correct view class
        if (currentView === 'list') {
            $productGrid.addClass('list-view');
        } else {
            $productGrid.removeClass('list-view');
        }
    }

    // Render pagination
    function renderPagination() {
        const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
        const pagination = $('#pagination');

        if (totalPages <= 1) {
            pagination.html('');
            return;
        }

        let html = `
            <button class="pagination-btn" id="prevPage" ${currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i> Previous
            </button>
        `;

        // Page numbers
        for (let i = 1; i <= Math.min(totalPages, 5); i++) {
            let pageNum = i;
            if (totalPages > 5 && currentPage > 3) {
                pageNum = currentPage - 2 + i - 1;
                if (pageNum > totalPages) break;
            }
            
            html += `
                <button class="pagination-btn ${pageNum === currentPage ? 'active' : ''}" data-page="${pageNum}">
                    ${pageNum}
                </button>
            `;
        }

        html += `
            <button class="pagination-btn" id="nextPage" ${currentPage === totalPages ? 'disabled' : ''}>
                Next <i class="fas fa-chevron-right"></i>
            </button>
        `;

        pagination.html(html);
    }

    // Update results count
    function updateResultsCount() {
        const startIndex = (currentPage - 1) * productsPerPage + 1;
        const endIndex = Math.min(currentPage * productsPerPage, filteredProducts.length);
        const total = filteredProducts.length;

        $('#resultsCount').html(`
            Showing <strong>${total > 0 ? startIndex : 0}-${endIndex}</strong> of <strong>${total}</strong> products
        `);
    }

    // Bind events
    function bindEvents() {
        // Heart icon (Wishlist) click
        $('.fas.fa-heart').on('click', function() {
            if (!sessionStorage.getItem('authToken')) {
                Swal.fire({
                    title: 'Please Log In',
                    text: 'You need to be logged in to access your wishlist',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Log In',
                    cancelButtonText: 'Cancel'
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.href = '../login.html';
                    }
                });
                return;
            }
            window.location.href = '../user/wishlist.html';
        });

        // Shopping bag icon click
        $('.fas.fa-shopping-bag').on('click', function() {
            window.location.href = 'cart.html';
        });

        // User avatar click
        $('#userAvatar').on('click', function(e) {
            e.stopPropagation();
            $('#dropdownMenu').toggleClass('active');
        });

        // Close dropdown when clicking outside
        $(document).on('click', function(e) {
            if (!$(e.target).closest('.user-dropdown').length) {
                $('#dropdownMenu').removeClass('active');
            }
        });

        // Logout button click
        $('#logoutBtn').on('click', function(e) {
            e.preventDefault();
            Swal.fire({
                title: 'Logout',
                text: 'Are you sure you want to log out?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Yes, logout',
                cancelButtonText: 'Cancel'
            }).then((result) => {
                if (result.isConfirmed) {
                    sessionStorage.clear();
                    window.location.href = '../login.html';
                }
            });
        });

        // Mobile menu toggle
        $('#mobileToggle').on('click', function() {
            $(this).toggleClass('active');
            $('#navLinks').toggleClass('active');
            $('.nav-icons').toggleClass('active');
        });

        // Category filter change
        $(document).on('change', '.category-filter input[type="checkbox"]', function() {
            const value = $(this).val();
            const isChecked = $(this).is(':checked');

            if (value === 'all') {
                if (isChecked) {
                    $('.category-filter input[type="checkbox"]').not(this).prop('checked', false);
                    currentFilters.categories = ['all'];
                }
            } else {
                if (isChecked) {
                    $('#cat-all').prop('checked', false);
                    currentFilters.categories = currentFilters.categories.filter(cat => cat !== 'all');
                    if (!currentFilters.categories.includes(value)) {
                        currentFilters.categories.push(value);
                    }
                } else {
                    currentFilters.categories = currentFilters.categories.filter(cat => cat !== value);
                    if (currentFilters.categories.length === 0) {
                        $('#cat-all').prop('checked', true);
                        currentFilters.categories = ['all'];
                    }
                }
            }
            // Immediately apply filters when category changes
            applyFilters();
        });

        // Price range inputs
        $('#minPrice, #maxPrice').on('input', function() {
            const minPrice = parseFloat($('#minPrice').val()) || 0;
            const maxPrice = parseFloat($('#maxPrice').val()) || Infinity;
            
            currentFilters.minPrice = minPrice;
            currentFilters.maxPrice = maxPrice;
        });

        // Sort change
        $('#sortBy').on('change', function() {
            currentFilters.sortBy = $(this).val();
            applyFilters();
        });

        // Apply filters button
        $('#applyFilters').on('click', function() {
            applyFilters();
            
            Swal.fire({
                title: 'Filters Applied! ✨',
                text: `Found ${filteredProducts.length} matching products`,
                icon: 'success',
                showConfirmButton: false,
                timer: 1500,
                toast: true,
                position: 'top-end'
            });
        });

        // Clear filters button
        $('#clearFilters').on('click', function() {
            // Reset all filters
            currentFilters = {
                categories: ['all'],
                minPrice: 0,
                maxPrice: Infinity,
                sortBy: 'name-asc'
            };

            // Reset UI
            $('.category-filter input[type="checkbox"]').prop('checked', false);
            $('#cat-all').prop('checked', true);
            $('#minPrice, #maxPrice').val('');
            $('#sortBy').val('name-asc');

            applyFilters();

            Swal.fire({
                title: 'Filters Cleared! 🧹',
                text: 'Showing all products',
                icon: 'info',
                showConfirmButton: false,
                timer: 1500,
                toast: true,
                position: 'top-end'
            });
        });

        // View toggle - Fixed to work with any view toggle buttons
        $(document).on('click', '.view-btn', function() {
            const $btn = $(this);
            const view = $btn.data('view') || ($btn.hasClass('list-view-btn') ? 'list' : 'grid');
            
            // Update current view
            currentView = view;
            
            // Update button states
            $('.view-btn').removeClass('active');
            $btn.addClass('active');
            
            // Update grid layout
            const productGrid = $('#productGrid');
            if (view === 'list') {
                productGrid.addClass('list-view');
            } else {
                productGrid.removeClass('list-view');
            }
            
            // Re-render products to apply new layout
            renderProducts();
        });

        // Alternative view toggle handlers for different button types
        $(document).on('click', '[data-view="grid"]', function() {
            currentView = 'grid';
            $('.view-btn').removeClass('active');
            $(this).addClass('active');
            $('#productGrid').removeClass('list-view');
            renderProducts();
        });

        $(document).on('click', '[data-view="list"]', function() {
            currentView = 'list';
            $('.view-btn').removeClass('active');
            $(this).addClass('active');
            $('#productGrid').addClass('list-view');
            renderProducts();
        });

        // Product card click
        $(document).on('click', '.product-card', function(e) {
            if (!$(e.target).hasClass('wishlist-btn') && !$(e.target).closest('.product-actions').length) {
                const productId = $(this).data('id');
                showProductDetail(productId);
            }
        });

        // Wishlist button click
        $(document).on('click', '.wishlist-btn', function(e) {
            e.stopPropagation();
            const productId = $(this).data('product-id');
            toggleWishlist(productId, this);
        });

        // Add to cart button click (works for both grid and modal)
        $(document).on('click', '.add-to-cart-btn', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const productId = $(this).data('product-id');
            const $btn = $(this);

            if ($btn.prop('disabled')) {
                return;
            }

            // Show loading state
            const originalText = $btn.html();
            $btn.prop('disabled', true)
                .html('<i class="fas fa-spinner fa-spin"></i> Adding...');

            // Call addToCart function
            addToCart(productId, 1, function(success, response) {
                if (success) {
                    // Visual feedback with button animation
                    $btn.addClass('added');
                    setTimeout(() => $btn.removeClass('added'), 1000);

                    // If we're in the modal, close it after successful add
                    if ($btn.closest('#productModal').length) {
                        setTimeout(() => {
                            $('#productModal').hide();
                            $('body').css('overflow', 'auto');
                        }, 1500);
                    }
                }
                // Reset button state
                setTimeout(() => {
                    $btn.prop('disabled', false).html(originalText);
                }, 1000);
            });
        });

        // Pagination clicks
        $(document).on('click', '.pagination-btn[data-page]', function() {
            currentPage = parseInt($(this).data('page'));
            renderProducts();
            renderPagination();
            updateResultsCount();
            
            // Scroll to top of products
            $('.products-area')[0].scrollIntoView({ behavior: 'smooth' });
        });

        $(document).on('click', '#prevPage', function() {
            if (currentPage > 1) {
                currentPage--;
                renderProducts();
                renderPagination();
                updateResultsCount();
                $('.products-area')[0].scrollIntoView({ behavior: 'smooth' });
            }
        });

        $(document).on('click', '#nextPage', function() {
            const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderProducts();
                renderPagination();
                updateResultsCount();
                $('.products-area')[0].scrollIntoView({ behavior: 'smooth' });
            }
        });

        // Modal events
        $('#modalClose').on('click', function() {
            $('#productModal').hide();
            $('body').css('overflow', 'auto');
        });

        $('#productModal').on('click', function(e) {
            if (e.target === this) {
                $(this).hide();
                $('body').css('overflow', 'auto');
            }
        });

        $(document).on('keydown', function(e) {
            if (e.key === 'Escape' && $('#productModal').is(':visible')) {
                $('#productModal').hide();
                $('body').css('overflow', 'auto');
            }
        });

        // Auth dropdown
        $('#userAvatar').on('click', function() {
            $('#dropdownMenu').toggleClass('active');
        });

        $(document).on('click', function(e) {
            if (!$(e.target).closest('.user-dropdown').length) {
                $('#dropdownMenu').removeClass('active');
            }
        });
    }

    // Toggle wishlist function
    function toggleWishlist(productId, buttonElement) {
        const $btn = $(buttonElement);
        const $icon = $btn.find('i');
        
        // Toggle visual state
        if ($icon.hasClass('fas')) {
            $icon.removeClass('fas').addClass('far');
            $btn.removeClass('active');
            
            Swal.fire({
                title: 'Removed from Wishlist',
                text: 'Item removed from your wishlist',
                icon: 'info',
                showConfirmButton: false,
                timer: 1500,
                toast: true,
                position: 'top-end'
            });
        } else {
            $icon.removeClass('far').addClass('fas');
            $btn.addClass('active');
            
            Swal.fire({
                title: 'Added to Wishlist! ❤️',
                text: 'Item added to your wishlist',
                icon: 'success',
                showConfirmButton: false,
                timer: 1500,
                toast: true,
                position: 'top-end'
            });
        }

        // Here you would typically make an API call to update the wishlist
        // For now, we'll just update the UI
    }

    // Add to cart function
    function addToCart(productId, quantity = 1, callback = null) {
        const authToken = sessionStorage.getItem('authToken');
        
        if (!authToken) {
            Swal.fire({
                title: 'Please Log In',
                text: 'You need to be logged in to add items to cart',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Log In',
                cancelButtonText: 'Cancel'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = '/frontend/views/customer/login.html';
                }
            });
            if (callback) callback(false, { message: 'Not logged in' });
            return;
        }

        $.ajax({
            url: 'http://localhost:8080/api/v1/cart/add',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + sessionStorage.getItem('authToken')
            },
            data: JSON.stringify({
                item_id: productId,
                quantity: quantity
            }),
            contentType: 'application/json',
            success: function(response) {
                // Update cart count badge
                const count = response.count || (parseInt($('.cart-count').text() || '0') + 1);
                $('.cart-count').text(count).toggleClass('hidden', count === 0);
                
                Swal.fire({
                    title: 'Added to Cart! 🛍️',
                    text: 'Item successfully added to your cart',
                    icon: 'success',
                    showConfirmButton: false,
                    timer: 1500,
                    toast: true,
                    position: 'top-end'
                });
                if (callback) callback(true, response);
            },
            error: function(xhr, status, error) {
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to add item to cart. Please try again.',
                    icon: 'error',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000
                });
                if (callback) callback(false, { message: error });
            }
        });
    }

    // Show product detail modal
    function showProductDetail(productId) {
        const loadingHTML = `
            <div class="product-detail-loading">
                <div class="loading-spinner"></div>
                <p>Loading exquisite details...</p>
            </div>
        `;
        
        $('#productDetail').html(loadingHTML);
        $('#productModal').show();
        $('body').css('overflow', 'hidden');

        $.ajax({
            url: `http://localhost:8080/api/v1/product/${productId}`,
            method: 'GET',
            success: function(data) {
                renderProductDetail(data);
            },
            error: function() {
                $('#productDetail').html(`
                    <div class="product-detail-error">
                        <div class="error-icon">⚠️</div>
                        <h3>Oops!</h3>
                        <p>Failed to load product details.</p>
                        <button onclick="$('#productModal').hide(); $('body').css('overflow', 'auto');">Close</button>
                    </div>
                `);
            }
        });
    }

    // Render product detail
    function renderProductDetail(data) {
        const product = data.product;
        const gallery = data.gallery || [];

        const mainImage = product.item_img || '/images/placeholder.jpg';
        const galleryImages = gallery.filter(g => g.item_path).map(g => g.item_path);
        const allImages = [mainImage, ...galleryImages];

        const detailHTML = `
            <div class="product-detail-container">
                <div class="product-gallery">
                    <div class="main-image-container">
                        <img src="${baseURL + mainImage}" 
                             alt="${escapeHtml(product.item_name)}" 
                             class="main-image" 
                             id="mainImage">
                    </div>
                    ${allImages.length > 1 ? `
                        <div class="thumbnail-container">
                            ${allImages.map((img, index) => `
                                <img src="${baseURL + img}" 
                                     alt="View ${index + 1}" 
                                     class="thumbnail ${index === 0 ? 'active' : ''}" 
                                     data-img="${img}">
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                
                <div class="product-detail-info">
                    <h1 class="product-title">${escapeHtml(product.item_name)}</h1>
                    <div class="product-detail-price">₱${formatPrice(product.item_price)}</div>
                    ${product.item_desc ? `<div class="product-description">${escapeHtml(product.item_desc)}</div>` : ''}
                    
                    <div class="product-specs">
                        <h3>Product Details</h3>
                        <div class="specs-grid">
                            <div class="spec-item">
                                <span class="spec-label">Category:</span>
                                <span class="spec-value">${escapeHtml(capitalizeFirstLetter(product.category_name) || 'Uncategorized')}</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-label">Stock:</span>
                                <span class="spec-value">${product.stock_qty || 0} available</span>
                            </div>
                        </div>
                    </div>

                    <div class="product-actions">
                        <div class="action-buttons">
                            <button class="add-to-cart-btn" data-product-id="${product.item_id}" ${product.stock_qty <= 0 ? 'disabled' : ''}>
                                <i class="fas fa-shopping-cart"></i>
                                ${product.stock_qty <= 0 ? 'Out of Stock' : 'Add to Cart'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        $('#productDetail').html(detailHTML);

        // Initialize thumbnail clicking
        $('.thumbnail').on('click', function() {
            const newSrc = $(this).data('img');
            $('.thumbnail').removeClass('active');
            $(this).addClass('active');
            $('#mainImage').attr('src', newSrc);
        });

        // Initialize wishlist button in modal
        $('.wishlist-btn-detail').on('click', function() {
            const productId = $(this).data('product-id');
            toggleWishlist(productId, this);
        });
    }

    // Helper functions
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function formatPrice(price) {
        const numPrice = parseFloat(price) || 0;
        return numPrice.toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function capitalizeFirstLetter(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }
});

