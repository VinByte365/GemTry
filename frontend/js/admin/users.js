// User Management JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeUserManagement();
    // Initialize form validation using jQuery Validate
    $('#accountForm').validate({
    rules: {
        name: {
            required: true,
            minlength: 2
        },
        email: {
            required: true,
            email: true
        },
        password: {
            minlength: 6
        },
        confirmPassword: {
            equalTo: '#password'
        }
    },
    messages: {
        name: {
            required: "Full name is required.",
            minlength: "Name must be at least 2 characters."
        },
        email: {
            required: "Email is required.",
            email: "Enter a valid email address."
        },
        password: {
            minlength: "Password must be at least 6 characters."
        },
        confirmPassword: {
            equalTo: "Passwords do not match."
        }
    },
    errorElement: 'div',
    errorClass: 'invalid-feedback',
    highlight: function (element) {
        $(element).addClass('is-invalid');
    },
    unhighlight: function (element) {
        $(element).removeClass('is-invalid');
    }
});
});

function initializeUserManagement() {
    // Initialize DataTable
    const usersTable = $('#accountsTable').DataTable({
        ajax: {
            url: 'http://localhost:8080/api/v1/user',
            dataSrc: '',
            headers: {
            'Authorization': 'Bearer ' + sessionStorage.getItem('authToken')
        },
            error: function (xhr, error, thrown) {
                console.error('DataTable error:', error);
                alert('Error loading users. Please refresh the page.');
            }
        },
        columns: [
            {
                data: null,
                render: function (data, type, row) {
                    return `<input type="checkbox" class="user-checkbox" value="${row.user_id}">`;
                },
                orderable: false,
                searchable: false
            },
            {
                data: 'user_id',
                title: 'ID'
            },
            {
                data: 'name',
                title: 'Name',
                render: function (data, type, row) {
                    const imageHtml = row.img ?
                        `<img src="/${row.img}" alt="${data}" class="user-avatar me-2" style="width: 32px; height: 32px; object-fit: cover; border-radius: 50%;">` :
                        '<div class="user-avatar me-2 bg-light d-inline-block text-center" style="width: 32px; height: 32px; line-height: 32px; color: #ccc; border-radius: 50%;"><i class="bi bi-person"></i></div>';
                    return imageHtml + `<span class="ms-2">${data}</span>`;
                }
            },
            {
                data: 'email',
                title: 'Email'
            },
            {
                data: 'role',
                title: 'Role',
                render: function (data) {
                    const role = data || 'user';
                    let badgeClass = 'badge bg-secondary';
                    if (role === 'admin') {
                        badgeClass = 'badge bg-danger';
                    } else if (role === 'staff') {
                        badgeClass = 'badge bg-warning';
                    }
                    return `<span class="${badgeClass}">${role}</span>`;
                }
            },
            {
                data: 'status',
                title: 'Status',
                render: function (data) {
                    const isActive = parseInt(data) === 1;
                    const statusText = isActive ? 'Active' : 'Inactive';
                    const badgeClass = isActive ? 'badge bg-success' : 'badge bg-secondary';
                    return `<span class="${badgeClass}">${statusText}</span>`;
                }
            },
            {
                data: 'created_at',
                title: 'Joined',
                render: function (data) {
                    if (!data) return 'N/A';
                    return new Date(data).toLocaleDateString();
                }
            },
            {
                data: null,
                title: 'Actions',
                render: function (data, type, row) {
                    return `
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-outline-primary edit-user" data-id="${row.user_id}" title="Edit">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-user" data-id="${row.user_id}" title="Delete">
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
            search: "Search users:",
            lengthMenu: "Show _MENU_ users per page",
            info: "Showing _START_ to _END_ of _TOTAL_ users",
            infoEmpty: "Showing 0 to 0 of 0 users",
            infoFiltered: "(filtered from _MAX_ total users)",
            emptyTable: "No users found",
            zeroRecords: "No matching users found"
        },
        drawCallback: function (settings) {
            // Update select all checkbox state
            const allCheckboxes = $('.user-checkbox');
            const checkedCheckboxes = $('.user-checkbox:checked');
            $('#selectAll').prop('indeterminate', checkedCheckboxes.length > 0 && checkedCheckboxes.length < allCheckboxes.length);
            $('#selectAll').prop('checked', checkedCheckboxes.length === allCheckboxes.length && allCheckboxes.length > 0);
        }
    });


    

    // Save Account Handler - FIXED
    document.getElementById('saveAccount').addEventListener('click', function () {
        const saveBtn = this;
        const originalHtml = saveBtn.innerHTML; // Store original HTML instead of text

        const formData = new FormData();
        const userId = document.getElementById('user_id').value;
        const fullName = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('contact').value.trim();
        const city = document.getElementById('city').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const role = document.getElementById('role').value;
        const status = document.getElementById('is_active').value;
        const imageFileInput = document.getElementById('userImage');
        const imageFile = imageFileInput?.files[0] || null;

        // Validation (JQUERY Validate)
        if (!$('#accountForm').valid()) {
            return;
        }
            
        // Disable button and show spinner
        saveBtn.disabled = true;
        saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Saving...`;

        // Append form data
        formData.append('name', fullName);
        formData.append('email', email);
        formData.append('contact', phone);
        formData.append('city', city);
        formData.append('role', role);
        formData.append('is_active', status);
        if (password) formData.append('password', password);
        if (imageFile) formData.append('image', imageFile);

        const url = userId
            ? `http://localhost:8080/api/v1/user/${userId}`
            : `http://localhost:8080/api/v1/user`;
        const method = userId ? 'PUT' : 'POST';

        $.ajax({
            url: url,
            type: method,
            data: formData,
            headers: {
            'Authorization': 'Bearer ' + sessionStorage.getItem('authToken')
        },
            processData: false,
            contentType: false,
            success: function (data) {
                if (data.msg) {
                    alert(data.msg);
                    if (data.msg.toLowerCase().includes('successfully')) {
                        const modalEl = document.getElementById('accountModal');
                        const modal = bootstrap.Modal.getInstance(modalEl);
                        modal?.hide();
                        usersTable.ajax.reload();
                        resetForm();
                    }
                }
            },
            error: function (xhr, status, error) {
                console.error('Error:', error);
                let errorMessage = 'An error occurred while saving the user.';
                if (xhr.responseJSON?.msg) {
                    errorMessage = xhr.responseJSON.msg;
                }
                alert(errorMessage);
            },
            complete: function () {
                // Reset button state - FIXED: Use innerHTML instead of textContent
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalHtml;
            }
        });
    });

    // Edit User Handler - Also updated
    $(document).on('click', '.edit-user', function () {
        const userId = $(this).data('id');
        $(this).prop('disabled', true).html('<i class="bi bi-hourglass-split"></i>');

        $.ajax({
            url: `http://localhost:8080/api/v1/user/${userId}`,
            type: 'GET',
            headers: {
            'Authorization': 'Bearer ' + sessionStorage.getItem('authToken')
        },
            success: function (data) {
                if (data.user) {
                    const user = data.user;

                    document.getElementById('user_id').value = user.user_id;
                    document.getElementById('name').value = user.name || '';
                    document.getElementById('email').value = user.email || '';
                    document.getElementById('contact').value = user.contact || '';
                    document.getElementById('city').value = user.city || '';
                    document.getElementById('role').value = user.role || 'user';
                    document.getElementById('is_active').value = (user.is_active ?? '1').toString();

                    document.getElementById('password').value = '';
                    document.getElementById('confirmPassword').value = '';

                    // Show existing image preview if available
                    const previewImg = document.getElementById('previewImg');
                    const previewContainer = document.getElementById('imagePreview');

                    if (user.img) {
                        // Assumes user.img = 'filename.jpg'
                        previewImg.src = `http://localhost:8080/${user.img}`;
                        previewContainer.style.display = 'block';
                    } else {
                        previewImg.src = '#';
                        previewContainer.style.display = 'none';
                    }

                    document.getElementById('accountModalLabel').textContent = 'Edit Account';
                    const modal = new bootstrap.Modal(document.getElementById('accountModal'));
                    modal.show();
                }
            },
            error: function (xhr, status, error) {
                console.error('Error:', error);
                alert('Error loading user details.');
            },
            complete: function () {
                $('.edit-user[data-id="' + userId + '"]').prop('disabled', false).html('<i class="bi bi-pencil"></i>');
            }
        });
    });

    // Image preview on file selection
    document.getElementById('userImage').addEventListener('change', function () {
        const file = this.files[0];
        const previewImg = document.getElementById('previewImg');
        const previewContainer = document.getElementById('imagePreview');

        if (file && previewImg && previewContainer) {
            const reader = new FileReader();
            reader.onload = function (e) {
                previewImg.src = e.target.result;
                previewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            previewImg.src = '#';
            previewContainer.style.display = 'none';
        }
    });

    // Remove preview image
    document.getElementById('removeImage').addEventListener('click', function () {
        const imageInput = document.getElementById('userImage');
        const previewImg = document.getElementById('previewImg');
        const previewContainer = document.getElementById('imagePreview');

        imageInput.value = '';
        previewImg.src = '#';
        previewContainer.style.display = 'none';
    });

    // Handle delete user
    $(document).on('click', '.delete-user', function () {
        const userId = $(this).data('id');
        const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
        deleteModal.show();
        
        document.getElementById('confirmDelete').onclick = function () {
            // Show loading state
            const confirmBtn = this;
            const originalText = confirmBtn.innerHTML;
            confirmBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Deleting...';
            confirmBtn.disabled = true;
            
            $.ajax({
                url: `http://localhost:8080/api/v1/user/${userId}`,
                type: 'DELETE',
                headers: {
            'Authorization': 'Bearer ' + sessionStorage.getItem('authToken')
        },
                success: function (data) {
                    alert(data.msg);
                    if (data.msg.includes('successfully')) {
                        usersTable.ajax.reload();
                    }
                    deleteModal.hide();
                },
                error: function (xhr, status, error) {
                    console.error('Error:', error);
                    let errorMessage = 'Error deleting user.';
                    
                    if (xhr.responseJSON && xhr.responseJSON.msg) {
                        errorMessage = xhr.responseJSON.msg;
                    }
                    
                    alert(errorMessage);
                },
                complete: function () {
                    // Reset button state
                    confirmBtn.innerHTML = originalText;
                    confirmBtn.disabled = false;
                }
            });
        };
    });

    // Handle add new user
    document.getElementById('addAccountBtn').addEventListener('click', function () {
        resetForm();
        document.getElementById('accountModalLabel').textContent = 'Add New Account';
    });

    // Handle select all checkbox
    document.getElementById('selectAll').addEventListener('change', function () {
        const checkboxes = document.querySelectorAll('.user-checkbox');
        Array.from(checkboxes).forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });

    // Handle bulk actions
    document.getElementById('bulkActivate').addEventListener('click', function (e) {
        e.preventDefault();
        performBulkAction('activate');
    });

    document.getElementById('bulkDeactivate').addEventListener('click', function (e) {
        e.preventDefault();
        performBulkAction('deactivate');
    });

    document.getElementById('bulkDelete').addEventListener('click', function (e) {
        e.preventDefault();
        const selectedUsers = document.querySelectorAll('.user-checkbox:checked');

        if (selectedUsers.length === 0) {
            Swal.fire('No Selection', 'Please select users to delete.', 'warning');
            return;
        }

        const userIds = Array.from(selectedUsers).map(cb => cb.value);

        Swal.fire({
            title: 'Confirm Bulk Delete',
            text: `Are you sure you want to delete ${userIds.length} user(s)? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete them',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: 'http://localhost:8080/api/v1/user/bulk/delete',
                    type: 'DELETE',
                    headers: {
            'Authorization': 'Bearer ' + sessionStorage.getItem('authToken')
        },
                    contentType: 'application/json',
                    data: JSON.stringify({ ids: userIds }),
                    success: function (res) {
                        Swal.fire('Deleted', res.msg || 'Users deleted successfully.', 'success');
                        $('#accountsTable').DataTable().ajax.reload();
                        document.getElementById('selectAll').checked = false;
                    },
                    error: function (xhr) {
                        Swal.fire('Error', 'Error deleting users.', 'error');
                        console.error('Bulk delete error:', xhr);
                    }
                });
            }
        });
    });

    // Handle filters
    $('#roleFilter').on('change', function () {
        const selectedRole = $(this).val();
        usersTable.column(4).search(selectedRole).draw();
    });

    $('#statusFilter').on('change', function () {
        const selectedStatus = $(this).val();
        usersTable.column(5).search(selectedStatus).draw();
    });

    $('#dateFilter').on('change', function () {
        const selectedDate = $(this).val();
        // Custom date filtering logic can be implemented here
        usersTable.draw();
    });

    function resetForm() {
        document.getElementById('accountForm').reset();
        // Fixed: Use correct ID for user_id field
        const userIdField = document.getElementById('user_id');
        if (userIdField) {
            userIdField.value = '';
        }
        
        // Also reset image preview
        const previewImg = document.getElementById('previewImg');
        const previewContainer = document.getElementById('imagePreview');
        if (previewImg && previewContainer) {
            previewImg.src = '#';
            previewContainer.style.display = 'none';
        }
    }

    function performBulkAction(action) {
        const selectedUsers = document.querySelectorAll('.user-checkbox:checked');

        if (selectedUsers.length === 0) {
            Swal.fire('No Selection', 'Please select users to perform this action.', 'warning');
            return;
        }

        const status = action === 'activate' ? 1 : 0;
        const userIds = Array.from(selectedUsers).map(cb => cb.value);
        const actionText = action === 'activate' ? 'activate' : 'deactivate';

        Swal.fire({
            title: `Confirm Bulk ${actionText}`,
            text: `Are you sure you want to ${actionText} ${userIds.length} user(s)?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: `Yes, ${actionText}`,
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: 'http://localhost:8080/api/v1/user/bulk/status',
                    type: 'PUT',
                    headers: {
            'Authorization': 'Bearer ' + sessionStorage.getItem('authToken')
        },
                    contentType: 'application/json',
                    data: JSON.stringify({ ids: userIds, status: status }),
                    success: function(res) {
                        Swal.fire('Success', res.msg || 'Bulk status update successful.', 'success');
                        $('#accountsTable').DataTable().ajax.reload();
                        document.getElementById('selectAll').checked = false;
                    },
                    error: function(xhr) {
                        Swal.fire('Error', 'An error occurred while updating statuses.', 'error');
                        console.error('Bulk status error:', xhr);
                    }
                });
            }
        });
    }
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