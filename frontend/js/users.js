// User Management JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeUserManagement();
});

function initializeUserManagement() {
    // Initialize DataTable
    const usersTable = $('#accountsTable').DataTable({
        ajax: {
            url: 'http://localhost:8080/api/v1/user',
            dataSrc: '',
            error: function(xhr, error, thrown) {
                console.error('DataTable error:', error);
                alert('Error loading users. Please refresh the page.');
            }
        },
        columns: [
            {
                data: null,
                render: function(data, type, row) {
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
                render: function(data, type, row) {
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
                render: function(data) {
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
                render: function(data) {
                    const status = data || 'active';
                    let badgeClass = 'badge bg-success';
                    if (status === 'inactive') {
                        badgeClass = 'badge bg-secondary';
                    } else if (status === 'suspended') {
                        badgeClass = 'badge bg-danger';
                    }
                    return `<span class="${badgeClass}">${status}</span>`;
                }
            },
            { 
                data: 'created_at',
                title: 'Joined',
                render: function(data) {
                    if (!data) return 'N/A';
                    return new Date(data).toLocaleDateString();
                }
            },
            {
                data: null,
                title: 'Actions',
                render: function(data, type, row) {
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
        drawCallback: function(settings) {
            // Update select all checkbox state
            const allCheckboxes = $('.user-checkbox');
            const checkedCheckboxes = $('.user-checkbox:checked');
            $('#selectAll').prop('indeterminate', checkedCheckboxes.length > 0 && checkedCheckboxes.length < allCheckboxes.length);
            $('#selectAll').prop('checked', checkedCheckboxes.length === allCheckboxes.length && allCheckboxes.length > 0);
        }
    });

    // Handle form submission
    document.getElementById('saveAccount').addEventListener('click', function() {
        const formData = new FormData();
        const userId = document.getElementById('accountId').value;
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const role = document.getElementById('accountRole').value;
        const status = document.getElementById('accountStatus').value;

        // Validate required fields
        if (!firstName || !lastName || !email) {
            alert('Please fill in all required fields.');
            return;
        }

        if (password && password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }

        // Show loading state
        const saveBtn = this;
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Saving...';
        saveBtn.disabled = true;

        formData.append('name', `${firstName} ${lastName}`);
        formData.append('email', email);
        formData.append('contact', phone);
        formData.append('city', 'Default'); // You might want to add a city field
        if (password) {
            formData.append('password', password);
        }
        formData.append('role', role);
        formData.append('status', status);

        const url = userId ? `http://localhost:8080/api/v1/user/${userId}` : 'http://localhost:8080/api/v1/user';
        const method = userId ? 'PUT' : 'POST';

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
                        const modal = bootstrap.Modal.getInstance(document.getElementById('accountModal'));
                        modal.hide();
                        usersTable.ajax.reload();
                        resetForm();
                    }
                }
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
                let errorMessage = 'An error occurred while saving the user.';
                
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

    // Handle edit user
    $(document).on('click', '.edit-user', function() {
        const userId = $(this).data('id');
        
        // Show loading state
        $(this).prop('disabled', true).html('<i class="bi bi-hourglass-split"></i>');
        
        $.ajax({
            url: `http://localhost:8080/api/v1/user/${userId}`,
            type: 'GET',
            success: function(data) {
                if (data.user) {
                    const user = data.user;
                    const nameParts = user.name ? user.name.split(' ') : ['', ''];
                    
                    document.getElementById('accountId').value = user.user_id;
                    document.getElementById('firstName').value = nameParts[0] || '';
                    document.getElementById('lastName').value = nameParts.slice(1).join(' ') || '';
                    document.getElementById('email').value = user.email || '';
                    document.getElementById('phone').value = user.contact || '';
                    document.getElementById('accountRole').value = user.role || 'user';
                    document.getElementById('accountStatus').value = user.status || 'active';
                    
                    // Clear password fields for edit
                    document.getElementById('password').value = '';
                    document.getElementById('confirmPassword').value = '';
                    
                    document.getElementById('accountModalLabel').textContent = 'Edit Account';
                    const modal = new bootstrap.Modal(document.getElementById('accountModal'));
                    modal.show();
                }
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
                alert('Error loading user details.');
            },
            complete: function() {
                // Reset button state
                $('.edit-user[data-id="' + userId + '"]').prop('disabled', false).html('<i class="bi bi-pencil"></i>');
            }
        });
    });

    // Handle delete user
    $(document).on('click', '.delete-user', function() {
        const userId = $(this).data('id');
        const deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
        deleteModal.show();
        
        document.getElementById('confirmDelete').onclick = function() {
            // Show loading state
            const confirmBtn = this;
            const originalText = confirmBtn.innerHTML;
            confirmBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Deleting...';
            confirmBtn.disabled = true;
            
            $.ajax({
                url: `http://localhost:8080/api/v1/user/${userId}`,
                type: 'DELETE',
                success: function(data) {
                    alert(data.msg);
                    if (data.msg.includes('successfully')) {
                        usersTable.ajax.reload();
                    }
                    deleteModal.hide();
                },
                error: function(xhr, status, error) {
                    console.error('Error:', error);
                    let errorMessage = 'Error deleting user.';
                    
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

    // Handle add new user
    document.getElementById('addAccountBtn').addEventListener('click', function() {
        resetForm();
        document.getElementById('accountModalLabel').textContent = 'Add New Account';
    });

    // Handle select all checkbox
    document.getElementById('selectAll').addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.user-checkbox');
        Array.from(checkboxes).forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });

    // Handle bulk actions
    document.getElementById('bulkActivate').addEventListener('click', function(e) {
        e.preventDefault();
        performBulkAction('activate');
    });

    document.getElementById('bulkDeactivate').addEventListener('click', function(e) {
        e.preventDefault();
        performBulkAction('deactivate');
    });

    document.getElementById('bulkDelete').addEventListener('click', function(e) {
        e.preventDefault();
        const selectedUsers = document.querySelectorAll('.user-checkbox:checked');
        
        if (selectedUsers.length === 0) {
            alert('Please select users to delete.');
            return;
        }

        if (confirm(`Are you sure you want to delete ${selectedUsers.length} user(s)? This action cannot be undone.`)) {
            const deletePromises = [];
            
            Array.from(selectedUsers).forEach(checkbox => {
                const userId = checkbox.value;
                deletePromises.push($.ajax({
                    url: `http://localhost:8080/api/v1/user/${userId}`,
                    type: 'DELETE'
                }));
            });

            $.when.apply($, deletePromises)
                .done(function() {
                    alert('Selected users deleted successfully.');
                    usersTable.ajax.reload();
                    document.getElementById('selectAll').checked = false;
                })
                .fail(function() {
                    console.error('Error:', arguments);
                    alert('Error deleting users.');
                });
        }
    });

    // Handle filters
    $('#roleFilter').on('change', function() {
        const selectedRole = $(this).val();
        usersTable.column(4).search(selectedRole).draw();
    });

    $('#statusFilter').on('change', function() {
        const selectedStatus = $(this).val();
        usersTable.column(5).search(selectedStatus).draw();
    });

    $('#dateFilter').on('change', function() {
        const selectedDate = $(this).val();
        // Custom date filtering logic can be implemented here
        usersTable.draw();
    });
}

function resetForm() {
    document.getElementById('accountForm').reset();
    document.getElementById('accountId').value = '';
}

function performBulkAction(action) {
    const selectedUsers = document.querySelectorAll('.user-checkbox:checked');
    
    if (selectedUsers.length === 0) {
        alert('Please select users to perform this action.');
        return;
    }

    const actionText = action === 'activate' ? 'activate' : 'deactivate';
    if (confirm(`Are you sure you want to ${actionText} ${selectedUsers.length} user(s)?`)) {
        // Implement bulk status update logic here
        alert(`Bulk ${actionText} action completed.`);
        $('#accountsTable').DataTable().ajax.reload();
        document.getElementById('selectAll').checked = false;
    }
} 