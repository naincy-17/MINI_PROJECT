// Modal Functions
var modal = document.getElementById('loginModal');
var isLoginMode = true;

function openModal() {
    modal.style.display = 'block';
}

function closeModal() {
    modal.style.display = 'none';
}

function toggleForm() {
    var modalTitle = document.getElementById('modalTitle');
    var submitBtn = document.getElementById('submitBtn');
    var toggleText = document.getElementById('toggleText');
    var nameGroup = document.getElementById('nameGroup');
    
    isLoginMode = !isLoginMode;
    
    if (isLoginMode) {
        modalTitle.textContent = 'Login to Your Account';
        submitBtn.textContent = 'Login';
        toggleText.innerHTML = 'Don\'t have an account? <a href="#" onclick="toggleForm(); return false;">Sign Up</a>';
        nameGroup.style.display = 'none';
    } else {
        modalTitle.textContent = 'Create New Account';
        submitBtn.textContent = 'Sign Up';
        toggleText.innerHTML = 'Already have an account? <a href="#" onclick="toggleForm(); return false;">Login</a>';
        nameGroup.style.display = 'block';
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target == modal) {
        closeModal();
    }
}

// Form submission
document.getElementById('authForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var email = document.getElementById('email').value;
    
    if (isLoginMode) {
        alert('Welcome back! Login successful for ' + email);
    } else {
        var name = document.getElementById('name').value;
        alert('Account created successfully for ' + name + '! Please login to continue.');
        toggleForm();
    }
    
    closeModal();
    document.getElementById('authForm').reset();
});

// Button click alert for CTA buttons
var ctaButtons = document.querySelectorAll('.btn-primary');
ctaButtons.forEach(function(button) {
    if (button.textContent.includes('Start')) {
        button.addEventListener('click', function() {
            alert('Welcome to Budget Planning Website! Start managing your finances smartly.');
        });
    }
});