// Product Management JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeProductManagement();
});

function initializeProductManagement() {
    // Initialize DataTable
    const productsTable = $('#productsTable').DataTable({
        ajax: {
            url: 'http://localhost:8080/api/v1/product',
            dataSrc: '',
            error: function(xhr, error, thrown) {
                console.error('DataTable error:', error);
                alert('Error loading products. Please refresh the page.');
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

    // Handle image preview
    document.getElementById('productImage').addEventListener('change', function(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        
        if (file) {
            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('File size must be less than 5MB.');
                this.value = '';
                return;
            }
            
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!allowedTypes.includes(file.type)) {
                alert('Please select a valid image file (JPG, PNG, GIF).');
                this.value = '';
                return;
            }
            
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

    // Handle form submission
    document.getElementById('saveProduct').addEventListener('click', function() {
        const formData = new FormData();
        const productId = document.getElementById('productId').value;
        const productName = document.getElementById('productName').value.trim();
        const productPrice = document.getElementById('productPrice').value;
        const productDescription = document.getElementById('productDescription').value.trim();
        const productImage = document.getElementById('productImage').files[0];

        // Validate required fields
        if (!productName) {
            alert('Please enter a product name.');
            document.getElementById('productName').focus();
            return;
        }
        
        if (!productPrice || parseFloat(productPrice) <= 0) {
            alert('Please enter a valid price.');
            document.getElementById('productPrice').focus();
            return;
        }

        // Show loading state
        const saveBtn = this;
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Saving...';
        saveBtn.disabled = true;

        formData.append('name', productName);
        formData.append('price', productPrice);
        formData.append('description', productDescription);
        
        if (productImage) {
            formData.append('image', productImage);
        }

        const url = productId ? `http://localhost:8080/api/v1/product/${productId}` : 'http://localhost:8080/api/v1/product';
        const method = productId ? 'PUT' : 'POST';

        $.ajax({
            url: url,
            type: method,
            data: formData,
            processData: false,
            contentType: false,
            success: function(data) {
                if (data.msg) {
                    alert(data.msg);
                    if (data.msg.includes('successfully')) {
                        // Close modal and refresh table
                        const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
                        modal.hide();
                        productsTable.ajax.reload();
                        resetForm();
                    }
                }
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
                let errorMessage = 'An error occurred while saving the product.';
                
                if (xhr.responseJSON && xhr.responseJSON.msg) {
                    errorMessage = xhr.responseJSON.msg;
                }
                
                alert(errorMessage);
            },
            complete: function() {
                // Reset button state
                saveBtn.innerHTML = originalText;
                saveBtn.disabled = false;
            }
        });
    });

    // Handle edit product
    $(document).on('click', '.edit-product', function() {
        const productId = $(this).data('id');
        
        // Show loading state
        $(this).prop('disabled', true).html('<i class="bi bi-hourglass-split"></i>');
        
        $.ajax({
            url: `http://localhost:8080/api/v1/product/${productId}`,
            type: 'GET',
            success: function(data) {
                if (data.product) {
                    const product = data.product;
                    document.getElementById('productId').value = product.item_id;
                    document.getElementById('productName').value = product.item_name;
                    document.getElementById('productPrice').value = product.item_price;
                    document.getElementById('productDescription').value = product.item_desc || '';
                    
                    // Show current image if exists
                    const preview = document.getElementById('imagePreview');
                    const previewImg = document.getElementById('previewImg');
                    if (product.item_img) {
                        previewImg.src = `/${product.item_img}`;
                        preview.style.display = 'block';
                    } else {
                        preview.style.display = 'none';
                    }
                    
                    document.getElementById('productModalLabel').textContent = 'Edit Product';
                    const modal = new bootstrap.Modal(document.getElementById('productModal'));
                    modal.show();
                }
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
                alert('Error loading product details.');
            },
            complete: function() {
                // Reset button state
                $('.edit-product[data-id="' + productId + '"]').prop('disabled', false).html('<i class="bi bi-pencil"></i>');
            }
        });
    });

    // Handle delete product
    $(document).on('click', '.delete-product', function() {
        const productId = $(this).data('id');
        const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
        deleteModal.show();
        
        document.getElementById('confirmDelete').onclick = function() {
            // Show loading state
            const confirmBtn = this;
            const originalText = confirmBtn.innerHTML;
            confirmBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Deleting...';
            confirmBtn.disabled = true;
            
            $.ajax({
                url: `http://localhost:8080/api/v1/product/${productId}`,
                type: 'DELETE',
                success: function(data) {
                    alert(data.msg);
                    if (data.msg.includes('successfully')) {
                        productsTable.ajax.reload();
                    }
                    deleteModal.hide();
                },
                error: function(xhr, status, error) {
                    console.error('Error:', error);
                    let errorMessage = 'Error deleting product.';
                    
                    if (xhr.responseJSON && xhr.responseJSON.msg) {
                        errorMessage = xhr.responseJSON.msg;
                    }
                    
                    alert(errorMessage);
                },
                complete: function() {
                    // Reset button state
                    confirmBtn.innerHTML = originalText;
                    confirmBtn.disabled = false;
                }
            });
        };
    });

    // Handle add new product
    document.getElementById('addProductBtn').addEventListener('click', function() {
        resetForm();
        document.getElementById('productModalLabel').textContent = 'Add New Product';
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
            alert('Please select products to delete.');
            return;
        }

        if (confirm(`Are you sure you want to delete ${selectedProducts.length} product(s)? This action cannot be undone.`)) {
            const deletePromises = [];
            
            Array.from(selectedProducts).forEach(checkbox => {
                const productId = checkbox.value;
                deletePromises.push($.ajax({
                    url: `http://localhost:8080/api/v1/product/${productId}`,
                    type: 'DELETE'
                }));
            });

            $.when.apply($, deletePromises)
                .done(function() {
                    alert('Selected products deleted successfully.');
                    productsTable.ajax.reload();
                    document.getElementById('selectAll').checked = false;
                })
                .fail(function() {
                    console.error('Error:', arguments);
                    alert('Error deleting products.');
                });
        }
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
}

function resetForm() {
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('imagePreview').style.display = 'none';
}

function populateCategoryFilter() {
    // Get unique categories from the DataTable data
    const categories = new Set();
    productsTable.data().each(function(row) {
        if (row.category_name) {
            categories.add(row.category_name);
        }
    });
    
    // Populate the category filter dropdown
    const categoryFilter = document.getElementById('categoryFilter');
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
} 