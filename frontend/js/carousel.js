// Generic Carousel Initialization Function
function initializeCarousel(options) {
    const track = document.querySelector(options.trackSelector);
    const items = Array.from(track.children);
    const leftBtn = document.querySelector(options.leftBtnSelector);
    const rightBtn = document.querySelector(options.rightBtnSelector);
    let currentIndex = 0;
    const itemsPerView = 3;
    const totalItems = items.length;
    
    function updateCarousel() {
        const itemWidth = items[0].offsetWidth;
        const gap = 24; // matches CSS gap
        const offset = currentIndex * (itemWidth + gap);
        track.style.transform = `translateX(-${offset}px)`;
        
        // Update button states
        leftBtn.style.opacity = currentIndex === 0 ? '0.5' : '1';
        rightBtn.style.opacity = currentIndex >= totalItems - itemsPerView ? '0.5' : '1';
    }
    
    function moveCarousel(direction) {
        if (direction === 'left' && currentIndex > 0) {
            currentIndex--;
            updateCarousel();
        } else if (direction === 'right' && currentIndex < totalItems - itemsPerView) {
            currentIndex++;
            updateCarousel();
        }
    }
    
    leftBtn.addEventListener('click', () => moveCarousel('left'));
    rightBtn.addEventListener('click', () => moveCarousel('right'));
    
    // Touch support for mobile
    let startX = 0;
    let isDragging = false;
    
    track.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
        isDragging = true;
    });
    
    track.addEventListener('touchmove', e => {
        if (!isDragging) return;
        const currentX = e.touches[0].clientX;
        const diff = startX - currentX;
        
        if (Math.abs(diff) > 50) {
            moveCarousel(diff > 0 ? 'right' : 'left');
            isDragging = false;
        }
    });
    
    track.addEventListener('touchend', () => {
        isDragging = false;
    });
    
    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(updateCarousel, 250);
    });
    
    // Initial setup
    updateCarousel();
}

// Initialize carousels when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize blogs carousel
    initializeCarousel({
        trackSelector: '.carousel-track',
        leftBtnSelector: '.carousel-arrow.left:not(.events-arrow)',
        rightBtnSelector: '.carousel-arrow.right:not(.events-arrow)'
    });

    // Initialize events carousel
    initializeCarousel({
        trackSelector: '.events-carousel-track',
        leftBtnSelector: '.carousel-arrow.left.events-arrow',
        rightBtnSelector: '.carousel-arrow.right.events-arrow'
    });
});
