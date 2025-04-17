const signupLink = document.getElementById('signup-link');
const loginLink = document.getElementById('login-link');
const signupForm = document.getElementById('signup-form-container');
const loginForm = document.getElementById('login-form-container');
const errorLogin = document.getElementById('error-login');
const errorSignup = document.getElementById('error-signup');

// Switch forms
signupLink.addEventListener('click', () => {
  loginForm.style.display = 'none';
  signupForm.style.display = 'block';
});
loginLink.addEventListener('click', () => {
  signupForm.style.display = 'none';
  loginForm.style.display = 'block';
});

// SIGN-UP
document.getElementById('signup-form').addEventListener('submit', function (e) {
  e.preventDefault();

  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const role = document.getElementById('signup-role').value; // Get selected role

  if (!name || !email || !password || !role) {
    errorSignup.textContent = 'Please fill in all fields.';
    return;
  }

  fetch('http://localhost:3500/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role })
  })
    .then(response => response.json())
    .then(data => {
      if (data.message.includes("successful")) {
        alert('Sign Up Successful!');
        signupForm.style.display = 'none';
        loginForm.style.display = 'block';
      } else {
        errorSignup.textContent = data.message;
      }
    })
    .catch(err => errorSignup.textContent = 'Sign up failed.');
});

// SIGN-IN
document.getElementById('login-form').addEventListener('submit', function (e) {
  e.preventDefault();

  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    errorLogin.textContent = 'Please fill in all fields.';
    return;
  }

  fetch('http://localhost:3500/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
    .then(response => response.json())
    .then(data => {
      if (data.token) {
        alert('Login Successful!');
        localStorage.setItem('token', data.token);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', data.name);
        localStorage.setItem('userRole', data.role); // Storing the role in localStorage
        window.location.href = 'index.html'; // Redirect after successful login
      } else {
        errorLogin.textContent = data.message;
      }
    })
    .catch(err => errorLogin.textContent = 'Login failed.');
});
