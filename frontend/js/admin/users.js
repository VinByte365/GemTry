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

// Global config for user management
const userConfig = {
    infiniteScroll: {
        pageSize: 20,
        currentPage: 1,
        loading: false,
        hasMore: true,
        threshold: 200,
        totalRecords: 0,
        lastScrollPosition: 0
    }
};

// Declare usersTable in wider scope
let usersTable;

function initializeUserManagement() {
    // Initialize the DataTable with proper configuration
    usersTable = $('#accountsTable').DataTable({
        serverSide: false, // Changed to false since we're handling pagination ourselves
        processing: true,
        paging: false,
        scrollY: '65vh',
        scrollCollapse: true,
        scrollX: true,
        responsive: true,
        autoWidth: true,
        info: true,
        deferRender: true,
        ajax: {
            url: 'http://localhost:8080/api/v1/user',
            type: 'GET',
            headers: { 
                'Authorization': 'Bearer ' + sessionStorage.getItem('authToken')
            },
            data: function(d) {
                // Add all DataTables parameters
                return {
                    page: userConfig.infiniteScroll.currentPage,
                    limit: userConfig.infiniteScroll.pageSize,
                    search: d.search?.value,
                    order: d.order?.[0]?.dir || 'desc',
                    orderBy: d.columns?.[d.order?.[0]?.column]?.data || 'user_id'
                };
            },
            dataSrc: function(json) {
                console.log('Server response:', json); // Debug log
                
                if (!json) {
                    console.error('No data received');
                    userConfig.infiniteScroll.loading = false;
                    return [];
                }
                
                // Handle both array and object responses
                const data = Array.isArray(json) ? json : (json.data || []);
                
                // Update infinite scroll state
                userConfig.infiniteScroll.hasMore = data.length >= userConfig.infiniteScroll.pageSize;
                userConfig.infiniteScroll.loading = false;
                userConfig.infiniteScroll.totalRecords = data.length;
                
                // Set total records for DataTables
                if (json.recordsTotal !== undefined) {
                    userConfig.infiniteScroll.totalRecords = json.recordsTotal;
                }
                
                // Modify the json object to include DataTables required properties
                if (!json.recordsTotal) {
                    json.recordsTotal = userConfig.infiniteScroll.totalRecords;
                    json.recordsFiltered = userConfig.infiniteScroll.totalRecords;
                    json.data = data;
                }
                
                return data;
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
                searchable: false,
                width: '30px',
                className: 'text-center'
            },
            {
                data: 'user_id',
                title: 'ID',
                width: '50px',
                className: 'text-center'
            },
            {
                data: 'name',
                title: 'Name',
                width: '200px',
                render: function (data, type, row) {
                    const imageHtml = row.img ?
                        `<img src="/${row.img}" alt="${data}" class="user-avatar me-2" style="width: 32px; height: 32px; object-fit: cover; border-radius: 50%;">` :
                        '<div class="user-avatar me-2 bg-light d-inline-block text-center" style="width: 32px; height: 32px; line-height: 32px; color: #ccc; border-radius: 50%;"><i class="bi bi-person"></i></div>';
                    return imageHtml + `<span class="ms-2">${data}</span>`;
                }
            },
            {
                data: 'email',
                title: 'Email',
                width: '200px'
            },
            {
                data: 'role',
                title: 'Role',
                width: '100px',
                className: 'text-center',
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
                width: '100px',
                className: 'text-center',
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
                width: '100px',
                className: 'text-center',
                render: function (data) {
                    if (!data) return 'N/A';
                    return new Date(data).toLocaleDateString();
                }
            },
            {
                data: null,
                title: 'Actions',
                width: '100px',
                className: 'text-center',
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
            info: "_START_ to _END_ of _TOTAL_ users",
            infoEmpty: "No users found",
            infoFiltered: "",
            emptyTable: '<div class="text-center p-3"><i class="bi bi-people text-muted display-4"></i><p class="mt-2">No users found</p></div>',
            zeroRecords: '<div class="text-center p-3"><i class="bi bi-search text-muted display-4"></i><p class="mt-2">No matching users found</p></div>',
            loadingRecords: '<div class="text-center p-3"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Loading users...</p></div>'
        },
        drawCallback: function (settings) {
            // Update select all checkbox state
            const allCheckboxes = $('.user-checkbox');
            const checkedCheckboxes = $('.user-checkbox:checked');
            $('#selectAll').prop('indeterminate', checkedCheckboxes.length > 0 && checkedCheckboxes.length < allCheckboxes.length);
            $('#selectAll').prop('checked', checkedCheckboxes.length === allCheckboxes.length && allCheckboxes.length > 0);
            
            // Update loading state
            const loadingSpinner = $('#loadingSpinner');
            if (userConfig.infiniteScroll.loading) {
                loadingSpinner.show();
            } else {
                loadingSpinner.hide();
            }

            // Update info text with proper total and "+" sign when there's more
            const info = $('.dataTables_info');
            if (info.length) {
                const currentInfo = info.text();
                if (currentInfo.includes(' to ')) {
                    const [start, rest] = currentInfo.split(' to ');
                    const [end, total] = rest.split(' of ');
                    if (userConfig.infiniteScroll.hasMore) {
                        info.text(`${start} to ${end} of ${userConfig.infiniteScroll.totalRecords}+ users`);
                    } else {
                        info.text(`${start} to ${end} of ${userConfig.infiniteScroll.totalRecords} users`);
                    }
                }
            }
        }
    });

    // Setup infinite scroll
    function setupInfiniteScroll() {
        const scrollContainer = $('.dataTables_scrollBody');
        let scrollTimeout;
        
        // Remove any existing scroll handlers
        scrollContainer.off('scroll.infiniteScroll');
        
        // Add new scroll handler with namespace
        scrollContainer.on('scroll.infiniteScroll', () => {
            // Don't load more if already loading or no more data
            if (userConfig.infiniteScroll.loading || !userConfig.infiniteScroll.hasMore) return;

            const container = scrollContainer[0];
            const scrollPos = container.scrollTop;
            const scrollHeight = container.scrollHeight;
            const viewportHeight = scrollContainer.height();
            const distanceFromBottom = scrollHeight - scrollPos - viewportHeight;
            const scrolledDown = scrollPos > userConfig.infiniteScroll.lastScrollPosition;

            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                if (distanceFromBottom < userConfig.infiniteScroll.threshold && scrolledDown) {
                    // Update state before loading
                    userConfig.infiniteScroll.currentPage++;
                    userConfig.infiniteScroll.loading = true;
                    userConfig.infiniteScroll.lastScrollPosition = scrollPos;
                    
                    // Show loading spinner
                    $('#loadingSpinner').show();
                    
                    // Reload with callback to handle errors
                    usersTable.ajax.reload((json) => {
                        if (!json || (Array.isArray(json) && !json.length)) {
                            userConfig.infiniteScroll.hasMore = false;
                        }
                        $('#loadingSpinner').hide();
                    }, false); // false to maintain scroll position
                }
            }, 100);
        });
    }

    // Initialize infinite scroll
    setupInfiniteScroll();

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

     // Delete User Handler with SweetAlert
    $(document).on('click', '.delete-user', function () {
        const userId = $(this).data('id');
        
        Swal.fire({
            title: 'Delete User?',
            text: "This action cannot be undone!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d4af37',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `http://localhost:8080/api/v1/user/${userId}`,
                    type: 'DELETE',
                    headers: {
                        'Authorization': 'Bearer ' + sessionStorage.getItem('authToken')
                    },
                    success: function (data) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Deleted!',
                            text: data.msg || 'User deleted successfully.',
                            confirmButtonColor: '#d4af37'
                        });
                        usersTable.ajax.reload();
                    },
                    error: function (xhr) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: xhr.responseJSON?.msg || 'Failed to delete user',
                            confirmButtonColor: '#d4af37'
                        });
                    }
                });
            }
        });
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

     // Bulk Actions with SweetAlert
    document.getElementById('bulkDelete').addEventListener('click', function (e) {
        e.preventDefault();
        const selectedUsers = document.querySelectorAll('.user-checkbox:checked');

        if (selectedUsers.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Selection',
                text: 'Please select users to delete.',
                confirmButtonColor: '#d4af37'
            });
            return;
        }

        const userIds = Array.from(selectedUsers).map(cb => cb.value);

        Swal.fire({
            title: 'Delete Multiple Users?',
            html: `You are about to delete <strong>${userIds.length}</strong> user(s).<br>This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d4af37',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete them!',
            showLoaderOnConfirm: true,
            preConfirm: () => {
                return $.ajax({
                    url: 'http://localhost:8080/api/v1/user/bulk/delete',
                    type: 'DELETE',
                    headers: {
                        'Authorization': 'Bearer ' + sessionStorage.getItem('authToken')
                    },
                    contentType: 'application/json',
                    data: JSON.stringify({ ids: userIds })
                }).then(response => {
                    return response;
                }).catch(error => {
                    Swal.showValidationMessage(
                        `Request failed: ${error.responseJSON?.msg || error.statusText}`
                    );
                });
            }
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: result.value.msg || 'Users deleted successfully.',
                    confirmButtonColor: '#d4af37'
                });
                usersTable.ajax.reload();
                document.getElementById('selectAll').checked = false;
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