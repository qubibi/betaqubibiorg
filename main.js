/* =============================================
   qubibi portfolio website JavaScript
   ============================================= */

// ---------------------------------------------
// Responsive Textblock Width Calculation
// ---------------------------------------------
function updateTextblockWidth() {
    const vw = window.innerWidth;
    let width;
    
    if (vw >= 1000) {
        width = '71vw';
    } else if (vw <= 768) {
        width = '88vw';
    } else {
        // Linear interpolation between 768px and 1000px
        const ratio = (vw - 768) / (1000 - 768);
        const vwValue = 80 - (ratio * 9);  // 80vw → 71vw (差分9)
        width = `${vwValue}vw`;
    }
    
    document.documentElement.style.setProperty('--textblock-width', width);
}

// ---------------------------------------------
// Auto-linkify URLs in Markdown Content
// ---------------------------------------------
function linkifyURLs() {
    const markdownElements = document.querySelectorAll('.markdown-content');
    
    markdownElements.forEach(element => {
        // URL pattern matching regex
        const urlPattern = /(https?:\/\/[^\s<]+)/g;
        
        // Create a temporary container
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = element.innerHTML;
        
        // Process only text nodes
        const walker = document.createTreeWalker(
            tempDiv,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }
        
        textNodes.forEach(textNode => {
            const text = textNode.nodeValue;
            if (urlPattern.test(text)) {
                const span = document.createElement('span');
                span.innerHTML = text.replace(urlPattern, '<a href="$1" target="_blank" rel="noopener">$1</a>');
                textNode.parentNode.replaceChild(span, textNode);
            }
        });
        
        element.innerHTML = tempDiv.innerHTML;
    });
}

// ---------------------------------------------
// Equal Area Image Layout for Home Page
// ---------------------------------------------
function equalizeImageAreas() {
    const homeMain = document.querySelector('.home-content');
    if (!homeMain) return;
    
    const projects = document.querySelectorAll('.project');
    const images = document.querySelectorAll('.project img');
    
    // Configuration removed - now using dynamic calculation
    
    // Apply equal area dimensions to all projects
    function applyDimensions() {
        
        projects.forEach((project, index) => {
            const img = project.querySelector('img');
            if (!img?.complete || !img.naturalWidth) return;
            
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            
            // For column layout, we control width percentage within the column
            // Square image = 100% width
            // Portrait image = smaller width percentage
            // Landscape image = larger width percentage (capped at 100%)
            
            // Calculate width percentage to maintain equal area
            // All images should have the same area
            // Area = width × height
            // Since height = width / aspectRatio
            // Area = width × (width / aspectRatio) = width² / aspectRatio
            // Therefore: width = √(Area × aspectRatio)
            
            // Set target area (as percentage squared)
            const targetArea = 70 * 70; // 70% width for square = 4900 area units
            
            // Calculate width to achieve target area
            const widthPercentage = Math.min(100, Math.sqrt(targetArea * aspectRatio));
            
            const imgWrapper = project.querySelector('.img-wrapper');
            if (imgWrapper) {
                imgWrapper.style.width = `${widthPercentage}%`;
                imgWrapper.style.margin = '0 auto'; // Center the wrapper
            }
            
            // Reset project width for column layout
            project.style.width = '100%';
            project.style.flexShrink = '';
            project.style.flexGrow = '';
        });
    }
    
    // Wait for all images to load
    Promise.all(
        Array.from(images).map(img => 
            img.complete ? Promise.resolve() : 
            new Promise(resolve => img.addEventListener('load', resolve))
        )
    ).then(applyDimensions);
    
    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(applyDimensions, 250);
    });
}

// ---------------------------------------------
// Randomize Images in Individual Pages
// ---------------------------------------------
function randomizeImages() {
    // Only run on individual pages (kobetu)
    const imgblock = document.querySelector('main#kobetu .imgblock');
    if (!imgblock) return;
    
    const images = Array.from(imgblock.querySelectorAll('img'));
    if (images.length <= 1) return;
    
    // Fisher-Yates shuffle algorithm
    for (let i = images.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        
        // Swap images in DOM
        const tempNextSibling = images[i].nextSibling;
        const tempParent = images[i].parentNode;
        
        images[j].parentNode.insertBefore(images[i], images[j].nextSibling);
        tempParent.insertBefore(images[j], tempNextSibling);
        
        // Update array
        [images[i], images[j]] = [images[j], images[i]];
    }
}

// ---------------------------------------------
// Center Images in Individual Pages
// ---------------------------------------------
function centerIndividualPageImages() {
    // Only run on individual pages (kobetu)
    const imgblock = document.querySelector('main#kobetu .imgblock');
    if (!imgblock) return;
    
    // Apply centering styles to imgblock
    imgblock.style.justifyContent = 'center';
    imgblock.style.alignItems = 'center';
}

// ---------------------------------------------
// Image Hover Link Effect for Home Page
// ---------------------------------------------
function setupImageHoverEffect() {
    const projects = document.querySelectorAll('.project');
    
    projects.forEach(project => {
        const imgWrapper = project.querySelector('.img-wrapper');
        const imgLink = imgWrapper ? imgWrapper.querySelector('a') : null;
        
        if (imgLink) {
            // Find the corresponding text link with the same href
            const imgHref = imgLink.getAttribute('href');
            const textLinks = project.querySelectorAll('p a');
            const matchingLink = Array.from(textLinks).find(link => 
                link.getAttribute('href') === imgHref
            );
            
            if (matchingLink) {
                // Add hover effect
                imgWrapper.addEventListener('mouseenter', () => {
                    matchingLink.classList.add('hover-active');
                });
                
                imgWrapper.addEventListener('mouseleave', () => {
                    matchingLink.classList.remove('hover-active');
                });
                
                // Touch support
                imgWrapper.addEventListener('touchstart', () => {
                    matchingLink.classList.add('hover-active');
                });
                
                imgWrapper.addEventListener('touchend', () => {
                    setTimeout(() => {
                        matchingLink.classList.remove('hover-active');
                    }, 300);
                });
            }
        }
    });
}

// ---------------------------------------------
// Event Listeners
// ---------------------------------------------

// Update textblock width on load and resize
updateTextblockWidth();
window.addEventListener('resize', updateTextblockWidth);

// Run functions on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    linkifyURLs();
    equalizeImageAreas();
    randomizeImages();
    centerIndividualPageImages();
    setupImageHoverEffect();
});