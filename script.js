// Tab Navigation
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-content');
    let lastFocusedElement = null;
    // Gallery items populated from data/gallery.json
    let galleryItems = []; // flat array of {src, thumb, webp, name, exif, category}
    let currentIndex = -1;

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

    // (nav underline removed) — navigation uses simple active state without animated underline

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

    // Add scroll effect to header (shrink on scroll)
    let lastScroll = 0;
    const header = document.querySelector('header');
    // Ensure main content is pushed down by header height to avoid overlap
    const mainEl = document.querySelector('main');
    function adjustMainPadding() {
        if (!header || !mainEl) return;
        const h = header.offsetHeight;
        mainEl.style.marginTop = h + 'px';
    }
    // Run once and on resize to keep layout correct
    adjustMainPadding();
    window.addEventListener('resize', adjustMainPadding);

    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;

        // Toggle compact header class when scrolled past threshold
        if (currentScroll > 40) {
            header.classList.add('scrolled');
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.2)';
        } else {
            header.classList.remove('scrolled');
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        }

        lastScroll = currentScroll;
    });

    // Add loading animation for iframes (for any that exist)
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
        iframe.addEventListener('load', function() {
            this.style.opacity = '1';
            this.style.transition = 'opacity 0.5s ease-in';
        });
        iframe.style.opacity = '0.5';
    });

    // --- Lazy-load YouTube thumbnails and modal player ---
    const youtubePlaceholders = document.querySelectorAll('.youtube-lazy');
    const modal = document.getElementById('video-modal');
    const modalContent = modal.querySelector('.video-modal__content');
    const modalClose = modal.querySelector('.video-modal__close');
    lastFocusedElement = null;

    function openModalWithVideo(id, title) {
        lastFocusedElement = document.activeElement;
        modal.setAttribute('aria-hidden', 'false');
        const src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
        modalContent.innerHTML = '';
        // Hide metadata for video
        const meta = modal.querySelector('.video-modal__meta');
        if (meta) meta.setAttribute('aria-hidden', 'true');
        modal.querySelector('.video-modal__dialog')?.classList.remove('with-meta');
        currentIndex = -1;
        modalClose.focus();
        iframe.setAttribute('src', src);
        iframe.setAttribute('title', title);
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
        iframe.setAttribute('allowfullscreen', '');
        modalContent.appendChild(iframe);
        modalClose.focus();
    }

    // Open image by gallery index (preferred) or by src
    function openModalWithImageByIndex(index) {
        if (index < 0 || index >= galleryItems.length) return;
        currentIndex = index;
        const item = galleryItems[index];
        lastFocusedElement = document.activeElement;
        modal.setAttribute('aria-hidden', 'false');
        modalContent.innerHTML = '';
        const img = document.createElement('img');
        img.src = item.file || item.thumb || item.webp || '';
        img.alt = item.name || '';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.loading = 'eager';
        modalContent.appendChild(img);

        // show metadata if available
        const meta = modal.querySelector('.video-modal__meta');
        const dialog = modal.querySelector('.video-modal__dialog');
        if (meta) {
            const metaList = meta.querySelector('.meta-list');
            metaList.innerHTML = '';
            if (item.exif && Object.keys(item.exif).length) {
                // create simple dl
                const dl = document.createElement('dl');
                for (const k of ['Model','DateTime','ExposureTime','FNumber','ISOSpeedRatings','FocalLength']) {
                    if (item.exif[k]) {
                        const dt = document.createElement('dt'); dt.textContent = k.replace(/([A-Z])/g, ' $1').trim();
                        const dd = document.createElement('dd'); dd.textContent = item.exif[k];
                        dl.appendChild(dt); dl.appendChild(dd);
                    }
                }
                // include any remaining keys
                for (const key of Object.keys(item.exif)) {
                    if (['Model','DateTime','ExposureTime','FNumber','ISOSpeedRatings','FocalLength'].includes(key)) continue;
                    const dt = document.createElement('dt'); dt.textContent = key;
                    const dd = document.createElement('dd'); dd.textContent = item.exif[key];
                    dl.appendChild(dt); dl.appendChild(dd);
                }
                metaList.appendChild(dl);
                meta.setAttribute('aria-hidden', 'false');
                dialog.classList.add('with-meta');
            } else {
                meta.setAttribute('aria-hidden', 'true');
                dialog.classList.remove('with-meta');
            }
        }

        // focus the close button for keyboard users
        modal.querySelector('.video-modal__close').focus();
    }

    function openModalWithImage(src, alt) {
        // If galleryItems available, try to find index
        const idx = galleryItems.findIndex(i => (i.file === src) || (i.thumb === src) || (i.webp === src));
        if (idx >= 0) return openModalWithImageByIndex(idx);
        // fallback: simple image modal without metadata
        lastFocusedElement = document.activeElement;
        modal.setAttribute('aria-hidden', 'false');
        modalContent.innerHTML = '';
        const img = document.createElement('img');
        img.src = src;
        img.alt = alt || '';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.loading = 'eager';
        modalContent.appendChild(img);
        const meta = modal.querySelector('.video-modal__meta'); if (meta) meta.setAttribute('aria-hidden', 'true');
        modal.querySelector('.video-modal__dialog')?.classList.remove('with-meta');
        currentIndex = -1;
        modal.querySelector('.video-modal__close').focus();
    }
    function closeModal() {
        modal.setAttribute('aria-hidden', 'true');
        modalContent.innerHTML = '';
        if (lastFocusedElement) lastFocusedElement.focus();
    }

    youtubePlaceholders.forEach(ph => {
        ph.addEventListener('click', function(e) {
            const id = this.dataset.id;
            const title = this.dataset.title || 'Video';
            openModalWithVideo(id, title);
        });
        ph.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });

            galleryItems = [];
    // --- Photo gallery interactions (card-based) ---
    const photosGrid = document.getElementById('photos-grid');
    const photoFilterAll = document.getElementById('photos-filter-all');
    const photoFilterVillage = document.getElementById('photos-filter-village');
    const photoFilterTableRock = document.getElementById('photos-filter-tablerock');

    function filterPhotos(type) {
        if (!photosGrid) return;
        const cards = photosGrid.querySelectorAll('.card');
        cards.forEach(card => {
            if (!type || type === 'all' || card.dataset.type === type) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }

    if (photoFilterAll) photoFilterAll.addEventListener('click', () => filterPhotos('all'));
    if (photoFilterVillage) photoFilterVillage.addEventListener('click', () => filterPhotos('the-village'));
    if (photoFilterTableRock) photoFilterTableRock.addEventListener('click', () => filterPhotos('table-rock'));

    function openModalWithImage(src, alt) {
        lastFocusedElement = document.activeElement;
        modal.setAttribute('aria-hidden', 'false');
        modalContent.innerHTML = '';
        const img = document.createElement('img');
        img.src = src;
        img.alt = alt || '';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.loading = 'eager';
        modalContent.appendChild(img);
        modalClose.focus();
    }

    // Delegate clicks inside photos grid for better dynamic compatibility
    if (photosGrid) {
        photosGrid.addEventListener('click', function(e) {
            const btn = e.target.closest('[data-open-photo]');
            if (btn) {
                const src = btn.getAttribute('data-open-photo');
                openModalWithImage(src, 'Photo');
                return;
            }
            const img = e.target.closest('img[data-full]');
            if (img) {
                openModalWithImage(img.getAttribute('data-full') || img.src, img.alt || 'Photo');
            }
        });
    }

    // --- Dynamic gallery loader (if data/gallery.json is present) ---
    async function loadGalleryJson() {
        try {
            const res = await fetch('data/gallery.json', {cache: 'no-store'});
            if (!res.ok) return;
            const data = await res.json();
            const grid = document.querySelector('.photos-grid');
            if (!grid) return;
            // clear existing static cards
            grid.innerHTML = '';
            Object.keys(data).forEach(category => {
                data[category].forEach(item => {
                    const fig = document.createElement('figure');
                    fig.className = 'photo-card';
                    fig.dataset.type = category;
                    const img = document.createElement('img');
                    img.src = item.file;
                    img.alt = item.name;
                    img.loading = 'lazy';
                    const cap = document.createElement('figcaption');
                    cap.textContent = item.name;
                    fig.appendChild(img);
                    fig.appendChild(cap);
                    grid.appendChild(fig);
                    // click opens modal
                    fig.addEventListener('click', () => openModalWithImage(item.file, item.name));
                });
            });
            // refresh photoCards and filter bindings
            // add basic filter support: bind existing buttons
        } catch (err) {
            // no gallery json available
            // console.log('No gallery.json found', err);
        }
    }
    loadGalleryJson();

    modal.addEventListener('click', function(e) {
        if (e.target.matches('[data-close], .video-modal__backdrop')) closeModal();
    });
    modalClose.addEventListener('click', closeModal);
    const modalPrev = modal.querySelector('.video-modal__prev');
    const modalNext = modal.querySelector('.video-modal__next');
    if (modalPrev) modalPrev.addEventListener('click', function(e) { e.stopPropagation(); if (currentIndex > 0) openModalWithImageByIndex(currentIndex - 1); else openModalWithImageByIndex(galleryItems.length - 1); });
    if (modalNext) modalNext.addEventListener('click', function(e) { e.stopPropagation(); if (currentIndex < galleryItems.length - 1) openModalWithImageByIndex(currentIndex + 1); else openModalWithImageByIndex(0); });
    window.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') closeModal();
        if (modal.getAttribute('aria-hidden') === 'false') {
            if (e.key === 'ArrowLeft') {
                if (currentIndex > 0) openModalWithImageByIndex(currentIndex - 1);
            }
            if (e.key === 'ArrowRight') {
                if (currentIndex < galleryItems.length - 1) openModalWithImageByIndex(currentIndex + 1);
            }
        }
    });

    // Basic touch swipe support for modal (left/right)
    let touchStartX = 0;
    modal.addEventListener('touchstart', function(e) { touchStartX = e.changedTouches[0].screenX; }, {passive: true});
    modal.addEventListener('touchend', function(e) {
        const dx = e.changedTouches[0].screenX - touchStartX;
        if (Math.abs(dx) > 50 && galleryItems.length > 0 && modal.getAttribute('aria-hidden') === 'false') {
            if (dx > 0) { // swipe right
                if (currentIndex > 0) openModalWithImageByIndex(currentIndex - 1);
            } else { // swipe left
                if (currentIndex < galleryItems.length - 1) openModalWithImageByIndex(currentIndex + 1);
            }
        }
    }, {passive: true});

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

    // Observe all card elements for entrance animations
    const gridItems = document.querySelectorAll('.card, .featured-item');
    gridItems.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(30px)';
        item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(item);
    });

    // Add click tracking for analytics (optional) on cards
    document.querySelectorAll('.card, .featured-item').forEach(item => {
        item.addEventListener('click', function() {
            const itemName = this.querySelector('.card-title, h3, figcaption')?.textContent || 'Unknown';
            console.log(`User clicked on: ${itemName}`);
            // You can add analytics tracking here
        });
    });

    // Make featured video card activate the Videos tab when clicked (any youtube-lazy inside)
    document.querySelectorAll('.featured-item').forEach(item => {
        const ph = item.querySelector('.youtube-lazy');
        if (ph) {
            item.style.cursor = 'pointer';
            item.addEventListener('click', function(e) {
                // Activate the Videos tab
                const videosLink = document.querySelector('.nav-link[data-tab="videos"]');
                if (videosLink) videosLink.click();

                // After tab activates, scroll to the first video and focus the thumbnail
                setTimeout(() => {
                    const firstVideo = document.querySelector('#videos .video-item');
                    if (firstVideo) {
                        firstVideo.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        const vPh = firstVideo.querySelector('.youtube-lazy');
                        if (vPh) vPh.focus();
                    }
                }, 300);
            });
        }
    });

    // --- Scrollspy: highlight nav as sections intersect ---
    const sections = document.querySelectorAll('main section[id]');
    const spyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                const link = document.querySelector(`.nav-link[data-tab="${id}"]`);
                if (link) {
                    navLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }
            }
        });
    }, { threshold: 0.6 });
    sections.forEach(s => spyObserver.observe(s));
});

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
