// Tab Navigation
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-content');

    // Handle navigation clicks
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links and content
            navLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Show corresponding content
            const tabId = this.getAttribute('data-tab');
            const targetContent = document.getElementById(tabId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
            // Update URL hash without scrolling
            history.pushState(null, null, `#${tabId}`);
        });
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', function() {
        const hash = window.location.hash.substring(1) || 'home';
        activateTab(hash);
    });

    // Handle initial page load with hash
    function activateTab(tabId) {
        navLinks.forEach(link => {
            if (link.getAttribute('data-tab') === tabId) {
                link.click();
            }
        });
    }

    // Check for hash on page load
    const initialHash = window.location.hash.substring(1);
    if (initialHash) {
        activateTab(initialHash);
    }

    // Smooth scroll behavior for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            if (this.getAttribute('href') !== '#') {
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    e.preventDefault();
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Add scroll effect to header
    let lastScroll = 0;
    const header = document.querySelector('header');
    
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll <= 0) {
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.2)';
        }
        
        lastScroll = currentScroll;
    });

    // Add loading animation for iframes
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
        iframe.addEventListener('load', function() {
            this.style.opacity = '1';
            this.style.transition = 'opacity 0.5s ease-in';
        });
        iframe.style.opacity = '0.5';
    });

    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all grid items
    const gridItems = document.querySelectorAll('.featured-item, .model-item, .tour-item, .video-item');
    gridItems.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(30px)';
        item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(item);
    });

    // Add click tracking for analytics (optional)
    document.querySelectorAll('.featured-item, .model-item, .tour-item, .video-item').forEach(item => {
        item.addEventListener('click', function() {
            const itemName = this.querySelector('h3')?.textContent || 'Unknown';
            console.log(`User clicked on: ${itemName}`);
            // You can add analytics tracking here
        });
    });
});

// Utility function to check if element is in viewport
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Handle window resize
let resizeTimer;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
        console.log('Window resized');
        // Add any resize-specific logic here
    }, 250);
});

// Preload images and iframes for better performance
window.addEventListener('load', function() {
    console.log('Page fully loaded');
    // Add any post-load logic here
});
