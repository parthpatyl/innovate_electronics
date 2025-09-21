// Footer functionality
document.addEventListener('DOMContentLoaded', () => {
    const newsletterForm = document.querySelector('.footer-col .newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = e.target.querySelector('input[type="email"]');
            const submitButton = e.target.querySelector('button[type="submit"]');
            
            if (!emailInput || !emailInput.value) {
                alert('Please enter your email address');
                return;
            }

            // Disable form while submitting
            emailInput.disabled = true;
            submitButton.disabled = true;
            const originalButtonText = submitButton.textContent;
            submitButton.textContent = 'Subscribing...';

            try {
                const response = await fetch('/api/newsletter/subscribe', {
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
                    alert('Successfully subscribed to our newsletter!');
                    emailInput.value = ''; // Clear the input
                } else {
                    alert(result.message || 'Subscription failed. Please try again.');
                }
            } catch (error) {
                console.error('Subscription error:', error);
                alert('An error occurred. Please try again.');
            } finally {
                // Re-enable form
                emailInput.disabled = false;
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        });
    }
});
