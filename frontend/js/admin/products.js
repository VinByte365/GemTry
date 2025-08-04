// Improved Product Management JavaScript with Enhanced Infinite Scroll
class ProductManager {
    constructor() {
        this.config = {
            apiBaseUrl: 'http://localhost:8080/api/v1/product',
            infiniteScroll: {
                pageSize: 20,
                currentPage: 1,
                loading: false,
                hasMore: true,
                threshold: 200, // pixels from bottom to trigger load
                totalRecords: 0,
                lastScrollPosition: 0
            }
        };
        
        this.allProducts = [];
        this.filteredProducts = [];
        this.filters = { category: '', price: '', search: '' };
        this.init();
    }

    // Initialize the product management system
    async init() {
        this.addValidationMethods();
        this.setupValidation();
        await this.loadCategories();
        this.setupTableStructure();
        this.setupEventListeners();
        this.setupInfiniteScroll();
        await this.loadProducts(true);
    }

    // Add custom validation methods
    addValidationMethods() {
        $.validator.addMethod("filesize", function(value, element, param) {
            if (!element.files?.length) return true;
            return Array.from(element.files).every(file => file.size <= param);
        }, "File size is too large");

        $.validator.addMethod("maxfiles", function(value, element, param) {
            return !element.files || element.files.length <= param;
        }, "Too many files selected");

        $.validator.addMethod("accept", function(value, element, param) {
            if (!element.files?.length) return true;
            if (param === "image/*") {
                return Array.from(element.files).every(file => file.type.startsWith('image/'));
            }
            return element.files[0].type.match(new RegExp(param));
        }, "Invalid file type");
    }

    // Setup form validation
    setupValidation() {
        $('#productForm').validate({
            rules: {
                productName: { required: true, minlength: 2 },
                productCategory: { required: true },
                productPrice: { required: true, number: true, min: 0.01 },
                productStock: { required: true, digits: true, min: 0 },
                mainProductImage: {
                    required: () => !$('#productId').val(),
                    accept: "image/*",
                    filesize: 5 * 1024 * 1024
                },
                productGallery: {
                    required: () => !$('#productId').val(),
                    accept: "image/*",
                    maxfiles: 5,
                    filesize: 5 * 1024 * 1024
                }
            },
            messages: {
                productName: { required: "Please enter the product name", minlength: "Name must be at least 2 characters" },
                productCategory: { required: "Please select a product category" },
                productPrice: { required: "Please enter the product price", number: "Please enter a valid number", min: "Price must be at least $0.01" },
                productStock: { required: "Please enter the stock quantity", digits: "Only whole numbers are allowed", min: "Stock cannot be negative" },
                mainProductImage: { required: "Please select a main product image", accept: "Only image files are allowed", filesize: "File size must be less than 5MB" },
                productGallery: { required: "Please select at least one gallery image", accept: "Only image files are allowed", maxfiles: "Maximum 5 files allowed", filesize: "Each file must be less than 5MB" }
            },
            errorClass: 'text-danger',
            errorElement: 'div',
            highlight: element => $(element).addClass('is-invalid'),
            unhighlight: element => $(element).removeClass('is-invalid'),
            errorPlacement: (error, element) => error.insertAfter(element)
        });
    }

    // Load categories from API
    async loadCategories() {
        try {
            const categories = await $.ajax({
                url: `${this.config.apiBaseUrl}/categories`,
                type: 'GET'
            });

            // Populate dropdowns
            this.populateSelect('#categoryFilter', categories, 'category_name', 'All Categories');
            this.populateSelect('#productCategory', categories, 'category_name', 'Select Category', 'category_id');
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    // Utility to populate select elements
    populateSelect(selector, data, textField, defaultText, valueField = null) {
        const select = $(selector);
        select.empty().append(`<option value="">${defaultText}</option>`);
        data.forEach(item => {
            const value = valueField ? item[valueField] : item[textField];
            select.append(`<option value="${value}">${item[textField]}</option>`);
        });
    }

    // Setup table structure
    setupTableStructure() {
        // Initialize DataTable with infinite scroll configuration
        this.dataTable = $('#productsTable').DataTable({
            data: [],
            columns: [
                { data: '0', orderable: false, width: '5%' }, // Checkbox column
                { data: '1', width: '10%' }, // ID
                { data: '2', width: '25%' }, // Name
                { data: '3', width: '20%' }, // Category
                { data: '4', width: '15%' }, // Price
                { data: '5', width: '15%' }, // Stock
                { data: '6', orderable: false, width: '10%' } // Actions column
            ],
            order: [[1, 'desc']],
            responsive: true,
            paging: false,
            scrollY: '60vh',
            scrollCollapse: true,
            info: false,
            searching: false,
            language: {
                emptyTable: "No products available",
                zeroRecords: "No matching products found",
                processing: "Loading products..."
            },
            processing: false,
            stateSave: false,
            drawCallback: function() {
                if (this.api().data().length) {
                    $('.dataTables_scrollBody').show();
                } else {
                    $('.dataTables_scrollBody').hide();
                }
            }
        });

        // Setup infinite scroll
        this.setupInfiniteScroll();
    }

    // Enhanced infinite scroll setup
    setupInfiniteScroll() {
        const scrollContainer = $('.dataTables_scrollBody');
        let scrollTimeout;
        
        scrollContainer.on('scroll', () => {
            if (this.config.infiniteScroll.loading || !this.config.infiniteScroll.hasMore) return;

            const container = scrollContainer[0];
            const scrollPos = container.scrollTop;
            const scrollHeight = container.scrollHeight;
            const viewportHeight = scrollContainer.height();
            const distanceFromBottom = scrollHeight - scrollPos - viewportHeight;
            const scrolledDown = scrollPos > this.config.infiniteScroll.lastScrollPosition;

            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                if (distanceFromBottom < this.config.infiniteScroll.threshold && 
                    scrolledDown && 
                    !this.hasActiveFilters()) {
                    
                    this.config.infiniteScroll.lastScrollPosition = scrollPos;
                    this.loadProducts(false);
                }
            }, 100);
        });
    }

    // Load products with enhanced pagination
    async loadProducts(reset = false) {
        // Prevent multiple simultaneous requests
        if (this.config.infiniteScroll.loading) {
            console.log('Already loading, skipping request');
            return;
        }

        // If we've loaded all available data and this isn't a reset, don't load more
        if (!this.config.infiniteScroll.hasMore && !reset) {
            console.log('No more data to load');
            return;
        }

        this.config.infiniteScroll.loading = true;
        
        if (reset) {
            this.config.infiniteScroll.currentPage = 1;
            this.config.infiniteScroll.hasMore = true;
            this.config.infiniteScroll.totalRecords = 0;
            this.allProducts = [];
            this.showLoadingIndicator();
        } else {
            this.showLoadMoreIndicator();
        }

        const params = {
            page: this.config.infiniteScroll.currentPage,
            limit: this.config.infiniteScroll.pageSize
        };

        console.log(`Loading page ${this.config.infiniteScroll.currentPage} with limit ${this.config.infiniteScroll.pageSize}`);

        try {
            const response = await $.ajax({
                url: this.config.apiBaseUrl,
                type: 'GET',
                data: params,
                headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('authToken') }
            });

            console.log('API Response:', response);
            
            // Handle different API response formats
            let products = [];
            let totalCount = 0;
            
            if (Array.isArray(response)) {
                products = response;
                totalCount = this.config.infiniteScroll.totalRecords + products.length;
            } else if (response.products) {
                products = response.products;
                totalCount = response.total || response.totalCount || (this.config.infiniteScroll.totalRecords + products.length);
            } else if (response.data) {
                products = response.data;
                totalCount = response.total || response.totalCount || (this.config.infiniteScroll.totalRecords + products.length);
            }

            console.log(`Received ${products.length} products, total available: ${totalCount}`);

            if (reset) {
                this.allProducts = products;
                this.config.infiniteScroll.totalRecords = totalCount;
            } else {
                // Check for duplicates before adding
                const existingIds = new Set(this.allProducts.map(product => product.item_id));
                const newProducts = products.filter(product => !existingIds.has(product.item_id));
                this.allProducts = this.allProducts.concat(newProducts);
                console.log(`Added ${newProducts.length} new products (filtered ${products.length - newProducts.length} duplicates)`);
            }

            // Determine if there are more records to load
            const loadedCount = this.allProducts.length;
            
            this.config.infiniteScroll.hasMore = 
                products.length === this.config.infiniteScroll.pageSize && 
                loadedCount < this.config.infiniteScroll.totalRecords && 
                products.length > 0;

            console.log(`Loaded: ${loadedCount}, Total: ${this.config.infiniteScroll.totalRecords}, HasMore: ${this.config.infiniteScroll.hasMore}`);

            // Only increment page if we successfully loaded data
            if (products.length > 0) {
                this.config.infiniteScroll.currentPage++;
            }

            // Apply current filters and update table
            this.applyFiltersAndUpdateTable();
            
        } catch (error) {
            console.error('Error loading products:', error);
            this.showError('Failed to load products. Please refresh the page.');
            this.config.infiniteScroll.hasMore = false;
        } finally {
            this.config.infiniteScroll.loading = false;
            this.hideLoadingIndicators();
            this.updateProductCount();
        }
    }

    // Apply filters and update table display
    applyFiltersAndUpdateTable() {
        this.filteredProducts = this.allProducts.filter(product => {
            let matches = true;

            // Category filter
            if (this.filters.category && product.category_name?.toLowerCase() !== this.filters.category.toLowerCase()) {
                matches = false;
            }

            // Price filter
            if (this.filters.price) {
                const productPrice = parseFloat(product.item_price || 0);
                switch (this.filters.price) {
                    case '0-50': matches = productPrice <= 50; break;
                    case '50-100': matches = productPrice > 50 && productPrice <= 100; break;
                    case '100-': matches = productPrice > 100; break;
                }
            }

            // Search filter
            if (this.filters.search) {
                const searchTerm = this.filters.search.toLowerCase();
                const searchableText = `${product.item_name || ''} ${product.category_name || ''} ${product.item_desc || ''}`.toLowerCase();
                if (!searchableText.includes(searchTerm)) {
                    matches = false;
                }
            }

            return matches;
        });

        this.renderProducts();
    }

    // Render products in table
    renderProducts() {
        const displayProducts = this.hasActiveFilters() ? this.filteredProducts : this.allProducts;
        
        // Clear existing data and add new rows
        this.dataTable.clear();
        
        if (displayProducts.length) {
            this.dataTable.rows.add(displayProducts.map(product => this.createProductRow(product)));
        }
        
        this.dataTable.draw(false); // false to maintain scroll position

        this.updateSelectAllCheckbox();
        this.updateLoadingState();
        this.updateProductCount();
    }

    // Update loading state
    updateLoadingState() {
        const loadingSpinner = $('#loadingSpinner');
        if (this.config.infiniteScroll.loading) {
            loadingSpinner.show();
        } else {
            loadingSpinner.hide();
        }
    }

    // Format row data for DataTable
    createProductRow(product) {
        const imageHtml = product.item_img ? 
            `<img src="/${product.item_img}" alt="${product.item_name}" class="product-thumbnail me-2" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">` : 
            '<div class="product-thumbnail me-2 bg-light d-inline-block text-center" style="width: 40px; height: 40px; line-height: 40px; color: #ccc; border-radius: 4px;">No Image</div>';

        const qty = parseInt(product.stock_qty || 0);
        const badgeClass = qty === 0 ? 'bg-danger' : qty < 10 ? 'bg-warning' : 'bg-success';

        return {
            0: `<input type="checkbox" class="product-checkbox" value="${product.item_id}">`,
            1: product.item_id,
            2: `${imageHtml}<span class="ms-2">${product.item_name}</span>`,
            3: product.category_name || 'Uncategorized',
            4: `$${parseFloat(product.item_price || 0).toFixed(2)}`,
            5: `<span class="badge ${badgeClass}">${qty}</span>`,
            6: `<div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary edit-product" data-id="${product.item_id}" title="Edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-product" data-id="${product.item_id}" title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>`
        };
    }

    // Setup all event listeners
    setupEventListeners() {
        // Form submission
        $('#saveProduct').on('click', (e) => this.handleSaveProduct(e));
        
        // Edit product
        $(document).on('click', '.edit-product', (e) => this.handleEditProduct(e));
        
        // Delete product
        $(document).on('click', '.delete-product', (e) => this.handleDeleteProduct(e));
        
        // Add new product
        $('#addProductBtn').on('click', () => this.handleAddProduct());
        
        // Bulk operations
        $('#selectAll').on('change', (e) => this.handleSelectAll(e));
        $(document).on('change', '.product-checkbox', () => this.updateSelectAllCheckbox());
        $('#bulkDelete').on('click', (e) => this.handleBulkDelete(e));
        
        // Filters
        $('#categoryFilter').on('change', (e) => this.handleFilterChange('category', e.target.value));
        $('#priceFilter').on('change', (e) => this.handleFilterChange('price', e.target.value));
        
        // Search with debounce
        let searchTimeout;
        $('#searchProducts').on('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => this.handleFilterChange('search', e.target.value.trim()), 300);
        });
        
        // Image previews
        $('#mainProductImage').on('change', (e) => this.handleMainImagePreview(e));
        $('#productGallery').on('change', (e) => this.handleGalleryPreview(e));
        
        // Remove gallery preview
        $(document).on('click', '.remove-gallery-preview', (e) => this.handleRemoveGalleryPreview(e));
        
        // Refresh
        $('#refreshProducts').on('click', () => this.refresh());
    }

    // Handle save product
    async handleSaveProduct(e) {
        if (!$('#productForm').valid()) return;

        const formData = new FormData();
        const productId = $('#productId').val();
        
        // Append form data
        formData.append('name', $('#productName').val().trim());
        formData.append('category', $('#productCategory').val());
        formData.append('price', $('#productPrice').val());
        formData.append('stock', $('#productStock').val());
        formData.append('description', $('#productDescription').val().trim());
        
        const mainImage = $('#mainProductImage')[0].files[0];
        const galleryImages = $('#productGallery')[0].files;
        
        if (mainImage) formData.append('mainImage', mainImage);
        if (galleryImages.length) {
            Array.from(galleryImages).forEach(file => formData.append('galleryImages', file));
        }

        const saveBtn = $(e.target);
        const originalHtml = saveBtn.html();
        saveBtn.html('<i class="bi bi-hourglass-split"></i> Saving...').prop('disabled', true);

        try {
            const url = productId ? `${this.config.apiBaseUrl}/${productId}` : this.config.apiBaseUrl;
            const method = productId ? 'PUT' : 'POST';

            const response = await $.ajax({
                url, type: method, data: formData,
                headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('authToken') },
                processData: false, contentType: false, timeout: 30000
            });

            this.showSuccess(response.msg || 'Product saved successfully!');
            this.closeModal();
            await this.refresh();
            this.resetForm();
        } catch (error) {
            this.showError(this.getErrorMessage(error));
        } finally {
            saveBtn.html(originalHtml).prop('disabled', false);
        }
    }

    // Handle edit product
    async handleEditProduct(e) {
        const productId = $(e.target).closest('button').data('id');
        const btn = $(e.target).closest('button');
        btn.prop('disabled', true).html('<i class="bi bi-hourglass-split"></i>');

        try {
            const response = await $.ajax({
                url: `${this.config.apiBaseUrl}/${productId}`,
                type: 'GET',
                headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('authToken') }
            });

            if (response.product) {
                this.populateEditForm(response.product, response.gallery);
                $('#productModalLabel').text('Edit Product');
                new bootstrap.Modal(document.getElementById('productModal')).show();
            }
        } catch (error) {
            this.showError('Error loading product details.');
        } finally {
            btn.prop('disabled', false).html('<i class="bi bi-pencil"></i>');
        }
    }

    // Handle delete product
    handleDeleteProduct(e) {
        const productId = $(e.target).closest('button').data('id');
        
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                this.showLoading('Deleting product...');
                
                try {
                    const response = await $.ajax({
                        url: `${this.config.apiBaseUrl}/${productId}`,
                        type: 'DELETE',
                        headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('authToken') }
                    });
                    
                    this.showSuccess(response.msg || 'Product deleted successfully!');
                    await this.refresh();
                } catch (error) {
                    this.showError(this.getErrorMessage(error));
                }
            }
        });
    }

    // Handle bulk delete
    handleBulkDelete(e) {
        e.preventDefault();
        const selectedProducts = $('.product-checkbox:checked');
        
        if (selectedProducts.length === 0) {
            this.showWarning('Please select products to delete.');
            return;
        }

        Swal.fire({
            title: 'Confirm Bulk Delete',
            text: `Delete ${selectedProducts.length} product(s)? This cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, delete them!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                this.showLoading('Deleting products...');
                
                try {
                    const deletePromises = selectedProducts.map((_, el) => 
                        $.ajax({
                            url: `${this.config.apiBaseUrl}/${el.value}`,
                            type: 'DELETE',
                            headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('authToken') }
                        })
                    ).get();

                    await Promise.all(deletePromises);
                    this.showSuccess('Selected products deleted successfully.');
                    await this.refresh();
                    $('#selectAll').prop('checked', false);
                } catch (error) {
                    this.showError('Error deleting some products. Please try again.');
                }
            }
        });
    }

    // Handle filter changes
    handleFilterChange(filterType, value) {
        this.filters[filterType] = value;
        this.applyFiltersAndUpdateTable();
        this.updateProductCount();
    }

    // Handle select all
    handleSelectAll(e) {
        $('.product-checkbox').prop('checked', e.target.checked);
    }

    // Handle add product
    handleAddProduct() {
        this.resetForm();
        $('#productModalLabel').text('Add New Product');
        new bootstrap.Modal(document.getElementById('productModal')).show();
    }

    // Handle image previews
    handleMainImagePreview(e) {
        const file = e.target.files[0];
        const preview = $('#mainImagePreview');
        const previewImg = $('#mainPreviewImg');
        
        $(e.target).valid();
        
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImg.attr('src', e.target.result);
                preview.show();
            };
            reader.readAsDataURL(file);
        } else {
            preview.hide();
        }
    }

    handleGalleryPreview(e) {
        const files = e.target.files;
        const container = $('#galleryPreview');
        const emptyMessage = $('#emptyGalleryMessage');
        
        $(e.target).valid();

        if (files.length > 0) {
            emptyMessage.hide();
            container.empty();
            
            Array.from(files).forEach((file, index) => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        container.append(`
                            <div class="position-relative d-inline-block me-2 mb-2">
                                <img src="${e.target.result}" alt="Gallery ${index + 1}" class="img-thumbnail" style="max-width: 120px; max-height: 120px; object-fit: cover;">
                                <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 remove-gallery-preview">
                                    <i class="bi bi-x-lg"></i>
                                </button>
                            </div>
                        `);
                    };
                    reader.readAsDataURL(file);
                }
            });
        } else {
            emptyMessage.show();
            container.empty();
        }
    }

    handleRemoveGalleryPreview(e) {
        $(e.target).closest('.position-relative').remove();
        if ($('#galleryPreview').children().length === 0) {
            $('#emptyGalleryMessage').show();
        }
    }

    // Utility methods
    hasActiveFilters() {
        return Object.values(this.filters).some(filter => filter !== '');
    }

    populateEditForm(product, gallery) {
        $('#productId').val(product.item_id);
        $('#productName').val(product.item_name);
        $('#productPrice').val(product.item_price);
        $('#productDescription').val(product.item_desc || '');
        $('#productStock').val(product.stock_qty || '');
        $('#productCategory').val(product.category_id || '');

        // Main image preview
        if (product.item_img) {
            $('#mainPreviewImg').attr('src', `http://localhost:8080/${product.item_img}`);
            $('#mainImagePreview').show();
        } else {
            $('#mainImagePreview').hide();
        }

        // Gallery preview
        const galleryContainer = $('#galleryPreview');
        galleryContainer.empty();

        if (gallery?.length) {
            $('#emptyGalleryMessage').hide();
            gallery.forEach((img, index) => {
                galleryContainer.append(`
                    <div class="position-relative d-inline-block me-2 mb-2">
                        <img src="http://localhost:8080/${img.item_path}" alt="Gallery ${index + 1}" class="img-thumbnail" style="max-width: 150px; max-height: 150px;">
                        <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 remove-gallery-image" data-path="${img.item_path}">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>
                `);
            });
        } else {
            $('#emptyGalleryMessage').show();
        }
    }

    resetForm() {
        $('#productForm')[0].reset();
        $('#productId').val('');
        $('#mainImagePreview').hide();
        $('#galleryPreview').empty();
        $('#emptyGalleryMessage').show();
        $('#productForm').validate().resetForm();
        $('#productForm .is-invalid').removeClass('is-invalid');
    }

    closeModal() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
        modal?.hide();
    }

    async refresh() {
        this.config.infiniteScroll.currentPage = 1;
        this.config.infiniteScroll.hasMore = true;
        this.config.infiniteScroll.totalRecords = 0;
        this.allProducts = [];
        this.filteredProducts = [];
        await this.loadProducts(true);
    }

    updateProductCount() {
        const totalCount = this.allProducts.length;
        const filteredCount = this.filteredProducts.length;
        const totalAvailable = this.config.infiniteScroll.totalRecords;
        
        let countText = '';
        if (this.hasActiveFilters()) {
            countText = `Showing ${filteredCount} of ${totalCount} loaded products`;
        } else {
            if (totalAvailable > totalCount) {
                countText = `${totalCount} of ${totalAvailable} products loaded`;
                if (this.config.infiniteScroll.hasMore) {
                    countText += ' (scroll for more)';
                }
            } else {
                countText = `All ${totalCount} products loaded`;
            }
        }
        
        $('#productCount').text(countText);
    }

    updateSelectAllCheckbox() {
        const allCheckboxes = $('.product-checkbox');
        const checkedCheckboxes = $('.product-checkbox:checked');
        const selectAll = $('#selectAll');
        
        selectAll.prop('indeterminate', checkedCheckboxes.length > 0 && checkedCheckboxes.length < allCheckboxes.length);
        selectAll.prop('checked', allCheckboxes.length > 0 && checkedCheckboxes.length === allCheckboxes.length);
    }

    updateScrollHint() {
        const hint = $('#scrollHint');
        if (this.config.infiniteScroll.hasMore && !this.hasActiveFilters()) {
            hint.show();
        } else {
            hint.hide();
        }
    }

    showLoadingIndicator() {
        $('#loadingSpinner').show();
    }

    hideLoadingIndicators() {
        $('#loadingSpinner').hide();
    }

    showLoading(text = 'Loading...') {
        Swal.fire({ title: text, allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    }

    showSuccess(message) {
        Swal.fire({ icon: 'success', title: 'Success!', text: message, timer: 3000, timerProgressBar: true });
    }

    showError(message) {
        Swal.fire({ icon: 'error', title: 'Error!', text: message });
    }

    showWarning(message) {
        Swal.fire({ icon: 'warning', title: 'Warning!', text: message });
    }

    getErrorMessage(xhr) {
        try {
            return xhr.responseJSON?.msg || 'An error occurred. Please try again.';
        } catch {
            return 'Network error. Please check your connection.';
        }
    }
}

// Logout function (standalone)
function logout() {
    try {
        Swal.fire({
            title: 'Signing You Out...',
            html: 'Please wait while we securely log you out',
            timer: 1500,
            timerProgressBar: true,
            didOpen: () => {
                Swal.showLoading();
                sessionStorage.removeItem('authToken');
                sessionStorage.removeItem('role');
                sessionStorage.removeItem('name');
                sessionStorage.removeItem('initial');
            },
            willClose: () => {
                window.location.href = '../login.html';
            }
        });
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

// Initialize the ProductManager when the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    const authToken = sessionStorage.getItem('authToken');
    if (!authToken) {
        window.location.href = '../login.html';
        return;
    }

    // Initialize product management
    window.productManager = new ProductManager();
});