/**
 * Shared nav behavior across all pages.
 * Linked via <script src="/nav.js"></script> injected by scripts/build-nav.js.
 *
 * Provides:
 *   - toggleNav() / closeNav()        — mobile hamburger open/close
 *   - toggleResourcesMenu(e)          — Resources submenu open/close (mobile + desktop)
 *   - document click → close desktop dropdown when clicking outside
 *   - mark current page link as .active (skipping submenu items)
 *   - mark Resources wrap as .active when on a resource subpage
 */

function toggleNav() {
    document.querySelector('.nav-toggle').classList.toggle('open');
    document.querySelector('.nav-links').classList.toggle('open');
}

function closeNav() {
    document.querySelector('.nav-toggle').classList.remove('open');
    document.querySelector('.nav-links').classList.remove('open');
}

function toggleResourcesMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    var wrap = e.currentTarget.closest('.nav-dropdown-wrap');
    if (window.innerWidth <= 768) {
        wrap.classList.toggle('collapsed');
    } else {
        wrap.classList.toggle('open');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.nav-links a:not(.nav-dropdown-trigger)').forEach(function(link) {
        link.addEventListener('click', closeNav);
    });

    document.addEventListener('click', function(e) {
        if (window.innerWidth > 768 && !e.target.closest('.nav-dropdown-wrap')) {
            document.querySelectorAll('.nav-dropdown-wrap').forEach(function(el) {
                el.classList.remove('open');
            });
        }
    });

    var path = window.location.pathname.replace(/\/$/, '') || '/';
    document.querySelectorAll('.nav-links a').forEach(function(link) {
        if (link.closest('.nav-submenu')) return;
        var href = (link.getAttribute('href') || '').replace(/\/$/, '') || '/';
        if (href === path || (href !== '/' && href !== '/#join' && path.startsWith(href))) {
            link.classList.add('active');
        }
    });

    var resourcePaths = ['/explain', '/filing-your-birt', '/calculator', '/hearings', '/petition'];
    var rawPath = window.location.pathname;
    if (resourcePaths.some(function(p) { return rawPath.startsWith(p); })) {
        var wrap = document.querySelector('.nav-dropdown-wrap');
        if (wrap) wrap.classList.add('active');
    }
});
