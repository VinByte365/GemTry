// Product Management JavaScript with SweetAlert2
document.addEventListener('DOMContentLoaded', function() {
    // Add custom validation methods first
    addCustomValidationMethods();
    initializeProductManagement();

    // JQUERY Validation Setup
    $('#productForm').validate({
        rules: {
            productName: {
                required: true,
                minlength: 2
            },
            productCategory: {
                required: true
            },
            productPrice: {
                required: true,
                number: true,
                min: 0.01
            },
            productStock: {
                required: true,
                digits: true,
                min: 0
            },
            mainProductImage: {
                required: function() {
                    // Only required if no product ID (new product)
                    return !$('#productId').val();
                },
                accept: "image/*",
                filesize: 5 * 1024 * 1024 // 5MB
            },
            productGallery: {
                required: function() {
                    // Only required if no product ID (new product)
                    return !$('#productId').val();
                },
                accept: "image/*",
                maxfiles: 5,
                filesize: 5 * 1024 * 1024 // 5MB per file
            }
        },
        messages: {
            productName: {
                required: "Please enter the product name",
                minlength: "Name must be at least 2 characters"
            },
            productCategory: {
                required: "Please select a product category"
            },
            productPrice: {
                required: "Please enter the product price",
                number: "Please enter a valid number",
                min: "Price must be at least $0.01"
            },
            productStock: {
                required: "Please enter the stock quantity",
                digits: "Only whole numbers are allowed",
                min: "Stock cannot be negative"
            },
            mainProductImage: {
                required: "Please select a main product image",
                accept: "Only image files are allowed",
                filesize: "File size must be less than 5MB"
            },
            productGallery: {
                required: "Please select at least one gallery image",
                accept: "Only image files are allowed",
                maxfiles: "Maximum 5 files allowed",
                filesize: "Each file must be less than 5MB"
            }
        },
        errorClass: 'text-danger',
        errorElement: 'div',
        highlight: function(element) {
            $(element).addClass('is-invalid');
        },
        unhighlight: function(element) {
            $(element).removeClass('is-invalid');
        },
        errorPlacement: function(error, element) {
            // Place error message after the element
            error.insertAfter(element);
        }
    });
});

// For product gallery validation
function addCustomValidationMethods() {
    // File size validation method
    $.validator.addMethod("filesize", function(value, element, param) {
        if (!element.files || element.files.length === 0) {
            return true; // Let required handle empty files
        }
        
        for (let i = 0; i < element.files.length; i++) {
            if (element.files[i].size > param) {
                return false;
            }
        }
        return true;
    }, "File size is too large");

    // Maximum files validation method
    $.validator.addMethod("maxfiles", function(value, element, param) {
        if (!element.files) {
            return true;
        }
        return element.files.length <= param;
    }, "Too many files selected");

    // File type validation method (improved accept method)
    $.validator.addMethod("accept", function(value, element, param) {
        if (!element.files || element.files.length === 0) {
            return true; // Let required handle empty files
        }
        
        // If param is "image/*", check if all files are images
        if (param === "image/*") {
            for (let i = 0; i < element.files.length; i++) {
                if (!element.files[i].type.startsWith('image/')) {
                    return false;
                }
            }
            return true;
        }
        
        // Original accept method logic for other cases
        return this.optional(element) || element.files[0].type.match(new RegExp(param));
    }, "Invalid file type");
}

async function fetchCategories() {
    try {
        const response = await $.ajax({
            url: 'http://localhost:8080/api/v1/product/categories',
            type: 'GET'
        });
        return response;
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

async function initializeProductManagement() {
    const categories = await fetchCategories();
    console.log(categories);
    
    // Populate category filter dropdown
    const categoryFilter = $('#categoryFilter');
    categoryFilter.empty().append('<option value="">All Categories</option>');
    categories.forEach(category => {
        categoryFilter.append(`<option value="${category.category_name}">${category.category_name}</option>`);
    });
    
    // Populate product category dropdown in the form
    const productCategory = $('#productCategory');
    productCategory.empty().append('<option value="">Select Category</option>');
    categories.forEach(category => {
        productCategory.append(`<option value="${category.category_id}">${category.category_name}</option>`);
    });
    
    // Initialize DataTable
    const productsTable = $('#productsTable').DataTable({
        ajax: {
            url: 'http://localhost:8080/api/v1/product',
            dataSrc: '',
            error: function(xhr, error, thrown) {
                console.error('DataTable error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Loading Error',
                    text: 'Error loading products. Please refresh the page.',
                    confirmButtonText: 'OK'
                });
            }
        },
        columns: [
            {
                data: null,
                render: function(data, type, row) {
                    return `<input type="checkbox" class="product-checkbox" value="${row.item_id}">`;
                },
                orderable: false,
                searchable: false
            },
            { 
                data: 'item_id',
                title: 'ID'
            },
            { 
                data: 'item_name',
                title: 'Name',
                render: function(data, type, row) {
                    const imageHtml = row.item_img ? 
                        `<img src="/${row.item_img}" alt="${data}" class="product-thumbnail me-2" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">` : 
                        '<div class="product-thumbnail me-2 bg-light d-inline-block text-center" style="width: 40px; height: 40px; line-height: 40px; color: #ccc; border-radius: 4px;">No Image</div>';
                    return imageHtml + `<span class="ms-2">${data}</span>`;
                }
            },
            { 
                data: 'category_name',
                title: 'Category',
                render: function(data) {
                    return data || 'Uncategorized';
                }
            },
            { 
                data: 'item_price',
                title: 'Price',
                render: function(data) {
                    return `$${parseFloat(data || 0).toFixed(2)}`;
                }
            },
            { 
                data: 'stock_qty',
                title: 'Stock',
                render: function(data, type, row) {
                    const qty = parseInt(data || 0);
                    let badgeClass = 'badge bg-success';
                    if (qty === 0) {
                        badgeClass = 'badge bg-danger';
                    } else if (qty < 10) {
                        badgeClass = 'badge bg-warning';
                    }
                    return `<span class="${badgeClass}">${qty}</span>`;
                }
            },
            {
                data: null,
                title: 'Actions',
                render: function(data, type, row) {
                    return `
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-outline-primary edit-product" data-id="${row.item_id}" title="Edit">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-product" data-id="${row.item_id}" title="Delete">
                                <i class="bi bi-trash"></i>
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
            search: "Search products:",
            lengthMenu: "Show _MENU_ products per page",
            info: "Showing _START_ to _END_ of _TOTAL_ products",
            infoEmpty: "Showing 0 to 0 of 0 products",
            infoFiltered: "(filtered from _MAX_ total products)",
            emptyTable: "No products found",
            zeroRecords: "No matching products found"
        },
        drawCallback: function(settings) {
            // Update select all checkbox state
            const allCheckboxes = $('.product-checkbox');
            const checkedCheckboxes = $('.product-checkbox:checked');
            $('#selectAll').prop('indeterminate', checkedCheckboxes.length > 0 && checkedCheckboxes.length < allCheckboxes.length);
            $('#selectAll').prop('checked', checkedCheckboxes.length === allCheckboxes.length && allCheckboxes.length > 0);
        }
    });

    // Handle image preview for main product image
    document.getElementById('mainProductImage').addEventListener('change', function(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('mainImagePreview');
        const previewImg = document.getElementById('mainPreviewImg');
        
        // Validate the file first
        $(this).valid();
        
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImg.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            preview.style.display = 'none';
        }
    });

    // Handle gallery images preview
    document.getElementById('productGallery').addEventListener('change', function(e) {
        const files = e.target.files;
        const galleryContainer = document.getElementById('galleryPreview');
        const emptyMessage = document.getElementById('emptyGalleryMessage');
        
        // Validate the files first
        $(this).valid();

        if (files.length > 0) {
            emptyMessage.style.display = 'none';
            
            // Clear existing previews
            galleryContainer.innerHTML = '';
            
            Array.from(files).forEach((file, index) => {
                if (file && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const galleryItem = document.createElement('div');
                        galleryItem.className = 'position-relative d-inline-block me-2 mb-2';
                        galleryItem.innerHTML = `
                            <img src="${e.target.result}" alt="Gallery Image ${index + 1}" class="img-thumbnail" style="max-width: 120px; max-height: 120px; object-fit: cover;">
                            <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 remove-gallery-preview" data-index="${index}">
                                <i class="bi bi-x-lg"></i>
                            </button>
                        `;
                        galleryContainer.appendChild(galleryItem);
                    };
                    reader.readAsDataURL(file);
                }
            });
        } else {
            emptyMessage.style.display = 'block';
            galleryContainer.innerHTML = '';
        }
    });

    // Handle form submission
    document.getElementById('saveProduct').addEventListener('click', function () {
        // Validate form using JQUERY first
        if (!$('#productForm').valid()) {
            console.log('Form validation failed');
            return;
        }

        const formData = new FormData();
        const productId = document.getElementById('productId').value;
        const productName = document.getElementById('productName').value.trim();
        const productCategory = document.getElementById('productCategory').value;
        const productPrice = document.getElementById('productPrice').value;
        const productStock = document.getElementById('productStock').value;
        const productDescription = document.getElementById('productDescription').value.trim();
        const mainImage = document.getElementById('mainProductImage').files[0];
        const galleryImages = document.getElementById('productGallery').files;

        // Prepare form data - match the backend field names
        formData.append('name', productName);
        if (productCategory) formData.append('category', productCategory);
        if (productPrice) formData.append('price', productPrice);
        if (productStock) formData.append('stock', productStock);
        if (productDescription) formData.append('description', productDescription);

        // Match the backend multer field names
        if (mainImage) {
            formData.append('mainImage', mainImage); // Backend expects 'mainImage'
        }

        if (galleryImages && galleryImages.length > 0) {
            Array.from(galleryImages).forEach(file => {
                formData.append('galleryImages', file); // Backend expects 'galleryImages'
            });
        }

        const url = productId
            ? `http://localhost:8080/api/v1/product/${productId}`
            : 'http://localhost:8080/api/v1/product';
        const method = productId ? 'PUT' : 'POST';

        const saveBtn = this;
        const originalHtml = saveBtn.innerHTML;
        
        // Set loading state
        saveBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Saving...';
        saveBtn.disabled = true;

        // Debug: Log the form data
        console.log('Submitting form with method:', method);
        console.log('URL:', url);
        for (let pair of formData.entries()) {
            console.log(pair[0] + ': ' + pair[1]);
        }

        $.ajax({
            url: url,
            type: method,
            data: formData,
            headers: {
                'Authorization': 'Bearer ' + sessionStorage.getItem('authToken')
            },
            processData: false,
            contentType: false,
            timeout: 30000, // 30 second timeout
            success: function (data) {
                console.log('Success response:', data);
                
                // Show success message with SweetAlert2
                const message = (data && data.msg) ? data.msg : 'Product saved successfully!';
                
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: message,
                    confirmButtonText: 'OK',
                    timer: 3000,
                    timerProgressBar: true
                }).then(() => {
                    // Close modal and refresh table on success
                    try {
                        const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
                        if (modal) {
                            modal.hide();
                        }
                        
                        // Refresh the products table
                        if (typeof productsTable !== 'undefined' && productsTable.ajax) {
                            productsTable.ajax.reload(null, false); // Keep current page
                        }
                        
                        // Reset the form
                        resetForm();
                    } catch (modalError) {
                        console.error('Error closing modal:', modalError);
                    }
                });
            },
            error: function (xhr, status, error) {
                console.error('Ajax error:', {xhr, status, error});
                console.error('Response text:', xhr.responseText);
                
                let errorMessage = 'An error occurred while saving the product.';
                
                // Try to get error message from response
                try {
                    if (xhr.responseJSON && xhr.responseJSON.msg) {
                        errorMessage = xhr.responseJSON.msg;
                    } else if (xhr.responseText) {
                        const responseObj = JSON.parse(xhr.responseText);
                        if (responseObj.msg) {
                            errorMessage = responseObj.msg;
                        }
                    }
                } catch (parseError) {
                    console.error('Error parsing response:', parseError);
                    if (status === 'timeout') {
                        errorMessage = 'Request timed out. Please try again.';
                    } else if (status === 'error') {
                        errorMessage = 'Network error. Please check your connection.';
                    }
                }
                
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: errorMessage,
                    confirmButtonText: 'OK'
                });
            },
            complete: function (xhr, status) {
                console.log('Request completed with status:', status);
                
                // Always reset button state regardless of success or failure
                saveBtn.innerHTML = originalHtml;
                saveBtn.disabled = false;
            }
        });
    });

    // Handle edit product
    $(document).on('click', '.edit-product', function () {
        const productId = $(this).data('id');

        // Show loading state
        $(this).prop('disabled', true).html('<i class="bi bi-hourglass-split"></i>');

        $.ajax({
            url: `http://localhost:8080/api/v1/product/${productId}`,
            type: 'GET',
            headers: {
                'Authorization': 'Bearer ' + sessionStorage.getItem('authToken')
            },
            success: function (data) {
                if (data.product) {
                    const product = data.product;

                    // Fill in basic fields
                    $('#productId').val(product.item_id);
                    $('#productName').val(product.item_name);
                    $('#productPrice').val(product.item_price);
                    $('#productDescription').val(product.item_desc || '');
                    $('#productStock').val(product.stock_qty || '');
                    
                    // Set category - check if category exists in dropdown
                    if (product.category_id) {
                        const categoryOption = $(`#productCategory option[value="${product.category_id}"]`);
                        if (categoryOption.length > 0) {
                            $('#productCategory').val(product.category_id);
                        } else {
                            console.warn(`Category ID ${product.category_id} not found in dropdown options`);
                            $('#productCategory').val('');
                        }
                    } else {
                        $('#productCategory').val('');
                    }

                    // Main image preview
                    const mainImagePreview = $('#mainImagePreview');
                    const mainPreviewImg = $('#mainPreviewImg');
                    if (product.item_img) {
                        mainPreviewImg.attr('src', `http://localhost:8080/${product.item_img}`);
                        mainImagePreview.show();
                    } else {
                        mainPreviewImg.attr('src', '');
                        mainImagePreview.hide();
                    }

                    // Clear existing gallery previews
                    const galleryContainer = $('#galleryPreview');
                    galleryContainer.empty();

                    if (Array.isArray(data.gallery) && data.gallery.length > 0) {
                        $('#emptyGalleryMessage').hide();
                        data.gallery.forEach((img, index) => {
                            const imgPath = `http://localhost:8080/${img.item_path}`;
                            const galleryItem = $(`
                                <div class="position-relative d-inline-block me-2 mb-2">
                                    <img src="${imgPath}" alt="Gallery Image ${index + 1}" class="img-thumbnail" style="max-width: 150px; max-height: 150px;">
                                    <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 remove-gallery-image" data-path="${img.item_path}">
                                        <i class="bi bi-x-lg"></i>
                                    </button>
                                </div>
                            `);
                            galleryContainer.append(galleryItem);
                        });
                    } else {
                        $('#emptyGalleryMessage').show();
                    }

                    // Update modal title and show it
                    $('#productModalLabel').text('Edit Product');
                    const modal = new bootstrap.Modal(document.getElementById('productModal'));
                    modal.show();
                }
            },
            error: function (xhr, status, error) {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Loading Error',
                    text: 'Error loading product details.',
                    confirmButtonText: 'OK'
                });
            },
            complete: function () {
                // Reset button state
                $('.edit-product[data-id="' + productId + '"]').prop('disabled', false).html('<i class="bi bi-pencil"></i>');
            }
        });
    });

    // Handle delete product
    $(document).on('click', '.delete-product', function() {
        const productId = $(this).data('id');
        
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                // Show loading toast
                Swal.fire({
                    title: 'Deleting...',
                    text: 'Please wait while we delete the product.',
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    showConfirmButton: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });
                
                $.ajax({
                    url: `http://localhost:8080/api/v1/product/${productId}`,
                    type: 'DELETE',
                    headers: {
                        'Authorization': 'Bearer ' + sessionStorage.getItem('authToken')
                    },
                    success: function(data) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Deleted!',
                            text: data.msg || 'Product has been deleted successfully.',
                            confirmButtonText: 'OK',
                            timer: 3000,
                            timerProgressBar: true
                        });
                        
                        if (data.msg && data.msg.includes('successfully')) {
                            productsTable.ajax.reload();
                        }
                    },
                    error: function(xhr, status, error) {
                        console.error('Error:', error);
                        let errorMessage = 'Error deleting product.';
                        
                        if (xhr.responseJSON && xhr.responseJSON.msg) {
                            errorMessage = xhr.responseJSON.msg;
                        }
                        
                        Swal.fire({
                            icon: 'error',
                            title: 'Delete Failed',
                            text: errorMessage,
                            confirmButtonText: 'OK'
                        });
                    }
                });
            }
        });
    });

    // Handle add new product
    $(document).on('click', '#addProductBtn', function() {
        resetForm();
        $('#productModalLabel').text('Add New Product');
        const modal = new bootstrap.Modal(document.getElementById('productModal'));
        modal.show();
    });

    // Handle select all checkbox
    document.getElementById('selectAll').addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.product-checkbox');
        Array.from(checkboxes).forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });

    // Handle bulk delete
    document.getElementById('bulkDelete').addEventListener('click', function(e) {
        e.preventDefault();
        const selectedProducts = document.querySelectorAll('.product-checkbox:checked');
        
        if (selectedProducts.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Selection',
                text: 'Please select products to delete.',
                confirmButtonText: 'OK'
            });
            return;
        }

        Swal.fire({
            title: 'Confirm Bulk Delete',
            text: `Are you sure you want to delete ${selectedProducts.length} product(s)? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete them!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                // Show loading
                Swal.fire({
                    title: 'Deleting Products...',
                    text: 'Please wait while we delete the selected products.',
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    showConfirmButton: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                const deletePromises = [];
                
                Array.from(selectedProducts).forEach(checkbox => {
                    const productId = checkbox.value;
                    deletePromises.push($.ajax({
                        url: `http://localhost:8080/api/v1/product/${productId}`,
                        type: 'DELETE',
                        headers: {
                            'Authorization': 'Bearer ' + sessionStorage.getItem('authToken')
                        },
                    }));
                });

                $.when.apply($, deletePromises)
                    .done(function() {
                        Swal.fire({
                            icon: 'success',
                            title: 'Success!',
                            text: 'Selected products deleted successfully.',
                            confirmButtonText: 'OK',
                            timer: 3000,
                            timerProgressBar: true
                        });
                        productsTable.ajax.reload();
                        document.getElementById('selectAll').checked = false;
                    })
                    .fail(function() {
                        console.error('Error:', arguments);
                        Swal.fire({
                            icon: 'error',
                            title: 'Delete Failed',
                            text: 'Error deleting some products. Please try again.',
                            confirmButtonText: 'OK'
                        });
                    });
            }
        });
    });

    // Populate category filter
    populateCategoryFilter();
    
    // Handle category filter
    $('#categoryFilter').on('change', function() {
        const selectedCategory = $(this).val();
        productsTable.column(3).search(selectedCategory).draw();
    });

    // Handle price filter
    $('#priceFilter').on('change', function() {
        const selectedPrice = $(this).val();
        let minPrice = 0;
        let maxPrice = Infinity;
        
        if (selectedPrice === '0-50') {
            maxPrice = 50;
        } else if (selectedPrice === '50-100') {
            minPrice = 50;
            maxPrice = 100;
        } else if (selectedPrice === '100-') {
            minPrice = 100;
        }
        
        // Custom filtering function for price range
        $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
            if (selectedPrice === '') return true;
            
            const price = parseFloat(data[4].replace('$', ''));
            return price >= minPrice && price <= maxPrice;
        });
        
        productsTable.draw();
        
        // Remove the custom filter after drawing
        $.fn.dataTable.ext.search.pop();
    });

    // Handle remove gallery image preview
    $(document).on('click', '.remove-gallery-preview', function() {
        $(this).closest('.position-relative').remove();
        
        // Check if gallery is empty
        const galleryContainer = $('#galleryPreview');
        if (galleryContainer.children().length === 0) {
            $('#emptyGalleryMessage').show();
        }
    });
}

function resetForm() {
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    
    // Hide image previews
    document.getElementById('mainImagePreview').style.display = 'none';
    document.getElementById('galleryPreview').innerHTML = '';
    document.getElementById('emptyGalleryMessage').style.display = 'block';
    
    // Reset category dropdown
    $('#productCategory').val('');
    
    // Clear validation errors
    $('#productForm').validate().resetForm();
    $('#productForm .is-invalid').removeClass('is-invalid');
}

function populateCategoryFilter() {
    // This function should be called after DataTable is initialized
    // You may need to implement this based on your data structure
}

// Function to remove main image
function removeMainImage() {
    document.getElementById('mainProductImage').value = '';
    document.getElementById('mainImagePreview').style.display = 'none';
    // Revalidate the field
    $('#mainProductImage').valid();
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
                            1500
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
            });
}