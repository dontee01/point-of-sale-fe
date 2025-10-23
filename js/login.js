// Additional JavaScript for login page
        document.addEventListener('DOMContentLoaded', function() {
            const loginForm = document.getElementById('loginForm');
            
            // Form submission handling
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const remember = document.getElementById('remember').checked;
                
                // Simple validation
                if (!email || !password) {
                    showMessage('Please fill in all fields', 'error');
                    return;
                }
                
                // Simulate login process
                const loginBtn = loginForm.querySelector('.login-btn');
                const originalText = loginBtn.textContent;
                
                loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
                loginBtn.disabled = true;
                
                // Simulate API call
                setTimeout(() => {
                    // In a real application, you would make an API call here
                    showMessage('Login successful! Redirecting...', 'success');
                    
                    // Reset button
                    loginBtn.textContent = originalText;
                    loginBtn.disabled = false;
                    
                    // Redirect to dashboard (simulated)
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1500);
                }, 2000);
            });
            
            // Function to show messages
            function showMessage(message, type) {
                // Remove any existing messages
                const existingMessage = document.querySelector('.login-message');
                if (existingMessage) {
                    existingMessage.remove();
                }
                
                // Create message element
                const messageEl = document.createElement('div');
                messageEl.className = `login-message ${type}`;
                messageEl.textContent = message;
                messageEl.style.cssText = `
                    padding: 12px 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    font-weight: 500;
                    text-align: center;
                    animation: fadeInUp 0.5s ease-out;
                `;
                
                if (type === 'success') {
                    messageEl.style.background = 'rgba(46, 204, 113, 0.2)';
                    messageEl.style.color = '#2ecc71';
                    messageEl.style.border = '1px solid rgba(46, 204, 113, 0.3)';
                } else {
                    messageEl.style.background = 'rgba(231, 76, 60, 0.2)';
                    messageEl.style.color = '#e74c3c';
                    messageEl.style.border = '1px solid rgba(231, 76, 60, 0.3)';
                }
                
                // Insert message after the login header
                const loginHeader = document.querySelector('.login-header');
                loginHeader.parentNode.insertBefore(messageEl, loginHeader.nextSibling);
                
                // Auto remove after 5 seconds
                setTimeout(() => {
                    if (messageEl.parentNode) {
                        messageEl.style.opacity = '0';
                        messageEl.style.transition = 'opacity 0.5s ease';
                        setTimeout(() => {
                            if (messageEl.parentNode) {
                                messageEl.remove();
                            }
                        }, 500);
                    }
                }, 5000);
            }
            
            // Toggle password visibility (bonus feature)
            const passwordInput = document.getElementById('password');
            const passwordIcon = passwordInput.nextElementSibling;
            
            passwordIcon.addEventListener('click', function() {
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    passwordIcon.className = 'fas fa-eye input-icon';
                } else {
                    passwordInput.type = 'password';
                    passwordIcon.className = 'fas fa-lock input-icon';
                }
            });
        });