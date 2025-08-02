$(document).ready(function () {
  let isShowingSignIn = true;

  const slidingDivision = document.querySelector('.sliding-division');
  const divisionContent = document.querySelector('.division-content');
  const toggleBtn = document.getElementById('toggleBtn');

  // Toggle Sign In/Up
  function toggleDivision() {
    if (isShowingSignIn) {
      slidingDivision.classList.add('slide-right');
      divisionContent.innerHTML = `
        <h2>Hello, Friend!</h2>
        <p>Enter your personal details and start your journey with us</p>
        <button class="toggle-btn" id="toggleBtn">Sign Up</button>
      `;
      isShowingSignIn = false;
    } else {
      slidingDivision.classList.remove('slide-right');
      divisionContent.innerHTML = `
        <h2>Welcome Back!</h2>
        <p>To keep connected with us please login with your personal info</p>
        <button class="toggle-btn" id="toggleBtn">Sign In</button>
      `;
      isShowingSignIn = true;
    }

    // Re-attach the new button event
    document.getElementById('toggleBtn').addEventListener('click', toggleDivision);
  }

  if (toggleBtn) toggleBtn.addEventListener('click', toggleDivision);

  // Password strength for Sign In
  $('#signin-password').on('input', function () {
    const password = $(this).val();
    const strengthBar = $('#signin-password-strength');
    let strength = 0;

    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;

    strengthBar.css({
      width: strength + '%',
      backgroundColor: strength < 50 ? '#dc3545' : strength < 75 ? '#ffc107' : '#28a745'
    });
  });
    //LOGIN TOGGLE
$('#togglePassword').on('click', function () {
  const passwordInput = $('#login-password');
  const type = passwordInput.attr('type') === 'password' ? 'text' : 'password';
  passwordInput.attr('type', type);

  $(this).toggleClass('fa-eye fa-eye-slash');
});
    
  //SIGNUP TOGGLE  
$('#toggleSigninPassword').on('click', function () {
  const passwordInput = $('#signin-password');
  const type = passwordInput.attr('type') === 'password' ? 'text' : 'password';
  passwordInput.attr('type', type);

    $(this).toggleClass('fa-eye fa-eye-slash');
});

  // LOGIN
  $('#login-form').on('submit', function (e) {
    e.preventDefault();

    const submitBtn = $(this).find('.submit-btn');
    const originalText = submitBtn.text();
    submitBtn.text('Processing...').prop('disabled', true);

    const email = $('#login-email').val();
    const password = $('#login-password').val();

    $.ajax({
      url: 'http://localhost:8080/api/v1/auth/login',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ email, password }),
      success: function (response) {
        Swal.fire({
          icon: 'success',
          title: 'Login Successful',
          text: 'You will be redirected shortly.',
          timer: 2000,
          showConfirmButton: false
        });

        sessionStorage.setItem('authToken', response.token);
        sessionStorage.setItem('userRole', response.user.role);

        setTimeout(() => {
          if (response.user.role === 'admin') {
            window.location.href = '../views/admin/index.html';
          } else {
            window.location.href = '../views/customer/index.html';
          }
        }, 1500);
      },
      error: function (xhr) {
        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: xhr.responseJSON?.message || 'Invalid email or password.'
        });
      },
      complete: function () {
        submitBtn.text(originalText).prop('disabled', false);
      }
    });
  });

  // REGISTER
  $('#signin-form').on('submit', function (e) {
    e.preventDefault();

    const submitBtn = $(this).find('.submit-btn');
    const originalText = submitBtn.text();
    submitBtn.text('Processing...').prop('disabled', true);

    const name = $('#signin-name').val();
    const email = $('#signin-email').val();
    const password = $('#signin-password').val();
    const phone = $('#signin-phone').val();

    $.ajax({
      url: 'http://localhost:8080/api/v1/auth/register',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({ name, email, password }),
      success: function () {
        Swal.fire({
          icon: 'success',
          title: 'Registration Successful',
          text: 'You can now log in.',
          timer: 2000,
          showConfirmButton: false
        });

        $('#register-form')[0].reset();
      },
      error: function (xhr) {
        Swal.fire({
          icon: 'error',
          title: 'Registration Failed',
          text: xhr.responseJSON?.message || 'Something went wrong.'
        });
      },
      complete: function () {
        submitBtn.text(originalText).prop('disabled', false);
      }
    });
  });
});
