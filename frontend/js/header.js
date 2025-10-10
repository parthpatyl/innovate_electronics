function setupHeaderMenu() {
    const menuButton = document.getElementById('menuButton');
    const closeMenuButton = document.getElementById('closeMenuButton');
    const sideMenu = document.getElementById('sideMenu');
    const overlay = document.getElementById('overlay');
    const whatsappButton = document.getElementById('whatsapp-btn'); // WhatsApp button

    // Apply transition style to WhatsApp button
    if (whatsappButton) {
        whatsappButton.style.transition = 'transform 0.3s ease-in-out';
    }

    // Open menu function
    function openMenu() {
        sideMenu.classList.add('open');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling of main content
        if (whatsappButton) whatsappButton.style.transform = 'translateX(320px)'; // Slide WhatsApp icon
    }

    // Close menu function
    function closeMenu() {
        sideMenu.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
        if (whatsappButton) whatsappButton.style.transform = 'translateX(0)'; // Reset WhatsApp icon position
    }

    if (menuButton) menuButton.addEventListener('click', openMenu);
    if (closeMenuButton) closeMenuButton.addEventListener('click', closeMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);

    // Close menu on window resize if it's open (optional)
    window.addEventListener('resize', function () {
        if (window.innerWidth > 1024 && sideMenu.classList.contains('open')) {
            closeMenu();
        }
    });

    // Close menu when clicking menu items (optional - for better mobile experience)
    const menuLinks = document.querySelectorAll('.side-menu-nav a');
    menuLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // Logo scroll trigger
    const logoTop = document.querySelector('.logo-top');
    const logoBottom = document.querySelector('.logo-bottom');
    let inactivityTimer;
    let hasScrolledFromTop = false;

    function showLogo() {
        if (logoTop) logoTop.classList.remove('hidden');
        if (logoBottom) logoBottom.classList.remove('enlarged');
    }

    function hideLogo() {
        if (logoTop) logoTop.classList.add('hidden');
        if (logoBottom) logoBottom.classList.add('enlarged');
    }

    function resetInactivityTimer() {
        showLogo();
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(hideLogo, 5000);
    }

    function handleActivity() {
        resetInactivityTimer();
    }

    function handleLogoScroll() {
        if (!hasScrolledFromTop && window.scrollY > 10) {
            hasScrolledFromTop = true;
            // When user scrolls down, keep logo enlarged only
            hideLogo();
            // Remove any previous inactivity listeners if present
            document.removeEventListener('mousemove', handleActivity);
            document.removeEventListener('keydown', handleActivity);
            document.removeEventListener('click', handleActivity);
            document.removeEventListener('scroll', handleActivity);
        } else if (!hasScrolledFromTop && window.scrollY <= 10) {
            // At the top, apply inactivity logic
            resetInactivityTimer();
            document.addEventListener('mousemove', handleActivity);
            document.addEventListener('keydown', handleActivity);
            document.addEventListener('click', handleActivity);
            document.addEventListener('scroll', handleActivity);
        }
    }

    // Only trigger resetInactivityTimer once when user scrolls from top (handled in handleLogoScroll)

    window.addEventListener('scroll', handleLogoScroll);
    // Initial check
    handleLogoScroll();
    // Do not call resetInactivityTimer here; it will be called on first scroll from top
}

// No code runs here directly; call setupHeaderMenu after header is loaded.
setupHeaderMenu();