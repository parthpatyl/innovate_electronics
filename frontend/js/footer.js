// Footer functionality
const newsletterForm = document.querySelector('.footer-col .newsletter-form');
const customAlert = document.getElementById('custom-alert');

function showAlert(message, isSuccess) {
    customAlert.textContent = message;
    customAlert.classList.add(isSuccess ? 'success' : 'error');
    customAlert.style.display = 'block';

    setTimeout(() => {
        customAlert.style.display = 'none';
        customAlert.classList.remove('success', 'error');
    }, 5000); // Hide after 5 seconds
}

if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = e.target.querySelector('input[type="email"]');
        const submitButton = e.target.querySelector('button[type="submit"]');
        
        if (!emailInput || !emailInput.value) {
            showAlert('Please enter your email address', false);
            return;
        }

        // Disable form while submitting
        emailInput.disabled = true;
        submitButton.disabled = true;
        const originalButtonText = submitButton.textContent;
        submitButton.textContent = 'Subscribing...';

        //Update the URL while deployment
        try {
            const response = await fetch('http://localhost:5000/api/newsletter/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: emailInput.value,
                    preferences: {
                        categories: ['electronics', 'tech-news'], // Default categories
                        frequency: 'monthly' // Default frequency
                    }
                })
            });

            const result = await response.json();

            if (result.success) {
                showAlert('Successfully subscribed to our newsletter!', true);
                emailInput.value = ''; // Clear the input
            } else {
                showAlert(result.message || 'Subscription failed. Please try again.', false);
            }
        } catch (error) {
            console.error('Subscription error:', error);
            showAlert('An error occurred. Please try again.', false);
        } finally {
            // Re-enable form
            emailInput.disabled = false;
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });
}
