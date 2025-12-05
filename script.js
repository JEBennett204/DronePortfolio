// Tab Navigation
document.addEventListener('DOMContentLoaded', function() {
    // Mark that JS is active for CSS progressive enhancement
    try { document.body.classList.add('js'); } catch (_) {}
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
            navLinks.forEach(l => { l.classList.remove('active'); l.removeAttribute('aria-current'); });
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            this.setAttribute('aria-current','page');
            
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

    // Ensure a visible default tab on load
    const initialHash = window.location.hash.substring(1);
    if (initialHash) {
        activateTab(initialHash);
    } else {
        // Failsafe: if no active content, set Home active
        const anyActive = document.querySelector('.tab-content.active');
        if (!anyActive) {
            const homeLink = document.querySelector('.nav-link[data-tab="home"]');
            const homeSection = document.getElementById('home');
            if (homeLink) { homeLink.classList.add('active'); homeLink.setAttribute('aria-current','page'); }
            if (homeSection) { homeSection.classList.add('active'); }
            // Also set the URL hash to stabilize navigation state
            try { history.replaceState(null, '', '#home'); } catch (_) {}
        }
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
        const iframe = document.createElement('iframe');
        iframe.setAttribute('src', src);
        iframe.setAttribute('title', title);
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
        iframe.setAttribute('allowfullscreen', '');
        modalContent.appendChild(iframe);
        modalClose.focus();
        // enable focus trap while modal is open
        enableModalFocusTrap(modal);
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
        enableModalFocusTrap(modal);
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
        enableModalFocusTrap(modal);
    }
    function closeModal() {
        modal.setAttribute('aria-hidden', 'true');
        modalContent.innerHTML = '';
        // disable focus trap
        disableModalFocusTrap();
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

    // Wire play buttons (and thumbnail containers) to open modal and/or play
    document.querySelectorAll('[data-play-src]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const src = this.getAttribute('data-play-src');
            const poster = this.getAttribute('data-poster') || null;
            // open modal and autoplay since this is a user gesture
            openModalWithLocalVideo(src, this.getAttribute('data-title') || 'Video', poster, true);
        });
    });

    // Add thumbnail play overlay behavior and hover preview
    document.querySelectorAll('.video-thumb').forEach(th => {
        let previewTimeout = null;
        let previewVideo = null;

        function clearPreview() {
            if (previewTimeout) { clearTimeout(previewTimeout); previewTimeout = null; }
            if (previewVideo && previewVideo.parentNode) {
                try { previewVideo.pause(); } catch (e) {}
                previewVideo.remove();
            }
            previewVideo = null;
        }

        th.addEventListener('mouseenter', function(e) {
            // start a short preview after metadata loads; muted autoplay for preview
            const src = th.getAttribute('data-play-src');
            if (!src) return;
            // Prefer dedicated preview clip if provided
            const previewSrc = th.getAttribute('data-preview-src');
            const baseSrc = previewSrc || src;
            clearPreview();
            previewVideo = document.createElement('video');
            previewVideo.className = 'preview-video';
            previewVideo.muted = true;
            previewVideo.setAttribute('muted', '');
            previewVideo.setAttribute('playsinline', '');
            previewVideo.preload = 'auto';
            previewVideo.autoplay = true;
            // small preview length in ms
            const PREVIEW_MS = 3500;
            // Prefer .webm if available (graceful fallback to .mp4)
            try {
                const webmEl = document.createElement('source');
                const webmUrl = baseSrc.endsWith('.mp4') ? baseSrc.replace(/\.mp4$/i, '.webm') : baseSrc.replace(/\.mov$/i, '.webm');
                webmEl.src = encodeURI(webmUrl);
                webmEl.type = 'video/webm';
                previewVideo.appendChild(webmEl);
            } catch (e) {}
            const sEl = document.createElement('source');
            try { sEl.src = encodeURI(baseSrc); } catch (e) { sEl.src = baseSrc; }
            sEl.type = 'video/mp4';
            previewVideo.appendChild(sEl);
            th.appendChild(previewVideo);

            // Fallback start in case metadata events delay
            let fallbackKickoff = setTimeout(() => {
                startPlayback();
                scheduleCleanup();
            }, 350);

            // Force metadata load so hover preview reliably starts
            previewVideo.autoplay = true;
            try { previewVideo.load(); } catch (e) {}

            // When metadata loaded, seek to middle then play briefly
            // when metadata is ready, seek to middle and play on 'seeked'
            // Try to seek to an early frame (some servers don't support ranged seeks to the midpoint)
            let attemptPlayFallback = null;
            const startPlayback = function() {
                const playPromise = previewVideo.play();
                if (playPromise && playPromise.catch) playPromise.catch(() => {});
            };
            const scheduleCleanup = () => { previewTimeout = setTimeout(() => { clearPreview(); }, PREVIEW_MS); };
            const onLoaded = function() {
                try {
                    const dur = previewVideo.duration || 0;
                    const target = (dur && dur > 2) ? Math.min(0.8, dur * 0.1) : 0.5;
                    const thumbImg = th.querySelector('.video-thumb__img');
                    if (thumbImg && thumbImg.src) previewVideo.setAttribute('poster', thumbImg.src);
                    previewVideo.currentTime = target;
                    attemptPlayFallback = setTimeout(() => { startPlayback(); scheduleCleanup(); }, 500);
                } catch (e) {
                    startPlayback();
                    scheduleCleanup();
                }
            };

            const onSeeked = function() {
                if (attemptPlayFallback) { clearTimeout(attemptPlayFallback); attemptPlayFallback = null; }
                startPlayback();
                scheduleCleanup();
            };

            previewVideo.addEventListener('loadedmetadata', onLoaded, { once: true });
            previewVideo.addEventListener('canplay', () => { if (!previewTimeout) startPlayback(); }, { once: true });
            previewVideo.addEventListener('seeked', onSeeked, { once: true });
            // safety: remove preview if any error
            previewVideo.addEventListener('error', function() { clearPreview(); });

            // Clear fallback when we actually kick off
            previewVideo.addEventListener('play', () => { if (fallbackKickoff) { clearTimeout(fallbackKickoff); fallbackKickoff = null; } }, { once: true });
        });

        th.addEventListener('mouseleave', function() { clearPreview(); });
        th.addEventListener('blur', function() { clearPreview(); });

        // Keyboard / click on thumbnail opens modal and starts playback
        th.addEventListener('click', function(e) {
            e.stopPropagation();
            const src = th.getAttribute('data-play-src');
            const poster = th.getAttribute('data-poster') || null;
            openModalWithLocalVideo(src, th.getAttribute('aria-label') || 'Video', poster, true);
        });
        th.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); th.click(); }
        });
    });

    function openModalWithLocalVideo(src, title, poster = null, autoplay = false) {
        lastFocusedElement = document.activeElement;
        modal.setAttribute('aria-hidden', 'false');
        modalContent.innerHTML = '';
        const video = document.createElement('video');
        // ensure native controls are present and video will play inline on mobile
        video.setAttribute('controls', '');
        video.setAttribute('playsinline', '');
        video.setAttribute('preload', 'metadata');
        video.style.objectFit = 'contain';
        video.style.background = 'rgba(85,57,21,0.06)';
        video.setAttribute('aria-label', title || 'Video');
        // allow keyboard focus if desired (tabindex -1 keeps it programmatic-focusable)
        video.tabIndex = -1;

        // Primary source (MP4)
        const srcEl = document.createElement('source');
        try {
            srcEl.src = encodeURI(src);
        } catch (err) {
            srcEl.src = src;
        }
        srcEl.type = 'video/mp4';
        video.appendChild(srcEl);

        // Optional: add a webm fallback if a similarly named .webm exists on the server
        try {
            const webmUrl = src.replace(/\.mp4$/i, '.webm');
            const webmEl = document.createElement('source');
            webmEl.src = encodeURI(webmUrl);
            webmEl.type = 'video/webm';
            video.appendChild(webmEl);
        } catch (e) {
            // ignore if construction fails
        }

        // Autoplay only when requested (and allowed by browser)
        video.autoplay = !!autoplay;
        if (poster) video.setAttribute('poster', poster);
        modalContent.appendChild(video);
        const meta = modal.querySelector('.video-modal__meta');
        if (meta) meta.setAttribute('aria-hidden', 'true');
        modal.querySelector('.video-modal__dialog')?.classList.remove('with-meta');
        // Ensure the video element loads the metadata and is visible
        try { video.load(); } catch (e) {}
        // give screen-reader users and keyboard users focus to the close button first
        const closeBtn = modal.querySelector('.video-modal__close');
        if (closeBtn) closeBtn.focus();
        if (autoplay) {
            // user gesture triggered (click) — attempt to play
            setTimeout(() => {
                try { video.play().catch(() => {}); } catch (e) {}
            }, 100);
        }
        enableModalFocusTrap(modal);
    }

    // Focus trap implementation for modal
    let _modalKeydownHandler = null;
    function enableModalFocusTrap(modalEl) {
        const focusableSelector = 'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])';
        const focusable = Array.from(modalEl.querySelectorAll(focusableSelector)).filter(el => !el.hasAttribute('disabled'));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        _modalKeydownHandler = function(e) {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === first) {
                        e.preventDefault(); last.focus();
                    }
                } else {
                    if (document.activeElement === last) {
                        e.preventDefault(); first.focus();
                    }
                }
            }
            // Close modal with Escape (already handled globally but keep local guard)
            if (e.key === 'Escape') closeModal();
        };
        document.addEventListener('keydown', _modalKeydownHandler);
    }
    function disableModalFocusTrap() {
        if (_modalKeydownHandler) document.removeEventListener('keydown', _modalKeydownHandler);
        _modalKeydownHandler = null;
    }

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
