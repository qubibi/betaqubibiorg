/* =============================================
   Navigation Component
   ============================================= */

(function() {
    'use strict';
    
    function insertNavigation() {
        // Process all nav elements
        document.querySelectorAll('nav').forEach(nav => {
            if (nav.classList.contains('home-nav')) {
                // Home page navigation
                nav.innerHTML = `
                    <img src="./images/qubibilogo.png" id="logo" alt="qubibi logo">
                    <div class="nav-text">
                        <a href="#home" data-target="home">QUBIBI</a>
                        <a href="#work" data-target="work">WORK</a>
                        <a href="#about" data-target="about">ABOUT</a>
                    </div>`;
                    
                // Add click event listeners for opacity control
                setupNavigationOpacity(nav);
            } else {
                // Individual page navigation - logo only with home link
                nav.innerHTML = `
                    <a href="../" aria-label="Back to home">
                        <img src="../images/qubibilogo.png" id="logo" alt="qubibi logo">
                    </a>`;
            }
        });
    }
    
    function setupNavigationOpacity(nav) {
        const qubibibiLink = nav.querySelector('[data-target="home"]');
        const workLink = nav.querySelector('[data-target="work"]');
        const aboutLink = nav.querySelector('[data-target="about"]');
        
        // navのdata-section属性を読み取り
        const currentSection = nav.getAttribute('data-section');
        
        // セクションに応じてopacityを設定
        if (currentSection === 'home') {
            qubibibiLink.style.opacity = '1';
            workLink.style.opacity = '0.5';
            aboutLink.style.opacity = '0.5';
        } else if (currentSection === 'work') {
            qubibibiLink.style.opacity = '0.5';
            workLink.style.opacity = '1';
            aboutLink.style.opacity = '0.5';
        } else if (currentSection === 'about') {
            qubibibiLink.style.opacity = '0.5';
            workLink.style.opacity = '0.5';
            aboutLink.style.opacity = '1';
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', insertNavigation);
    } else {
        insertNavigation();
    }
})();