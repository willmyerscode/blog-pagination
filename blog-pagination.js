(function() {
  
  // Default settings
  const defaultSettings = {
    // Labels
    prevLabel: 'Previous',
    nextLabel: 'Next',
    
    // Content options
    showThumbnails: true,
    
    // Image options
    thumbnailFormat: '300w',
    thumbnailFilename: 'thumbnail.jpg',
    
    // Icons (SVG markup)
    prevIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`,
    nextIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`,
    
    // CSS classes
    containerClass: 'blog-nav-container',
    arrowClass: 'blog-nav-arrow',
    linkClass: 'blog-nav-link',
    iconClass: 'blog-nav-arrow-icon',
    contentClass: 'blog-nav-content',
    thumbnailClass: 'blog-nav-thumbnail',
    textClass: 'blog-nav-text',
    labelClass: 'blog-nav-label',
    lableTag: 'p',
    titleClass: 'blog-nav-title',
    titleTag: 'h3',
    
    // Insertion options
    appendTo: '#sections',
    insertPosition: 'append', // 'append', 'prepend', or 'before'
    
    // Theme options
    sectionTheme: null, // Set to override auto-detection, falls back to page section theme or 'white'
  };
  
  // Merge user settings with defaults
  function mergeSettings(userSettings) {
    return Object.assign({}, defaultSettings, userSettings || {});
  }
  
  // Get settings from window object if available
  const settings = mergeSettings(window.blogNavSettings);
  
  // Get section theme with priority: user setting > page section theme > 'white'
  function getSectionTheme() {
    // 1. Check user settings first
    if (settings.sectionTheme) {
      return settings.sectionTheme;
    }
    
    // 2. Try to get theme from current page's section element
    const pageSection = document.querySelector('#sections > section');
    if (pageSection && pageSection.dataset.sectionTheme) {
      return pageSection.dataset.sectionTheme;
    }
    
    // 3. Fall back to 'white'
    return 'white';
  }
  
  // Get current URL and clean it
  function getCleanUrl() {
    let url = window.location.href;
    // Remove any existing query params
    url = url.split('?')[0];
    // Remove hash
    url = url.split('#')[0];
    // Add format=json
    return url + '?format=json';
  }

  // Extract thumbnail from item data
  function getThumbnail(item) {
    if (!settings.showThumbnails) {
      return null;
    }
    
    // Try to get assetUrl with common image name patterns
    if (item.assetUrl) {
      return item.assetUrl + settings.thumbnailFilename;
    }
    
    // Parse body HTML to find first image
    if (item.body) {
      const imgMatch = item.body.match(/data-src="([^"]+)"|src="([^"]+)"/);
      if (imgMatch) {
        const imgUrl = imgMatch[1] || imgMatch[2];
        // Add format parameter for smaller size
        return imgUrl.includes('?') ? imgUrl + '&format=' + settings.thumbnailFormat : imgUrl + '?format=' + settings.thumbnailFormat;
      }
    }
    
    // Fallback to a placeholder or null
    return null;
  }

  // Create navigation arrow element
  function createNavArrow(item, direction) {
    const arrow = document.createElement('div');
    arrow.className = `${settings.arrowClass} ${settings.arrowClass}-${direction}`;
    
    const thumbnail = getThumbnail(item);
    const title = item.title || 'Untitled';
    
    const icon = direction === 'prev' ? settings.prevIcon : settings.nextIcon;
    const label = direction === 'prev' ? settings.prevLabel : settings.nextLabel;
    
    arrow.innerHTML = `
      <a href="${item.fullUrl}" class="${settings.linkClass}">
        <div class="${settings.iconClass}">
          ${icon}
        </div>
        <div class="${settings.contentClass}">
          ${thumbnail ? `<div class="${settings.thumbnailClass}"><img src="${thumbnail}" alt="${title}" loading="lazy" /></div>` : ''}
          <div class="${settings.textClass}">
            <${settings.lableTag} class="${settings.labelClass}">${label}</${settings.lableTag}>
            <${settings.titleTag} class="${settings.titleClass}">${title}</${settings.titleTag}>
          </div>
        </div>
      </a>
    `;
    
    return arrow;
  }

  // Main function
  async function initBlogNavigation() {
    try {
      const jsonUrl = getCleanUrl();
      const response = await fetch(jsonUrl);
      
      if (!response.ok) {
        console.error('Failed to fetch blog data');
        return;
      }
      
      const data = await response.json();
      
      if (!data.pagination) {
        console.log('No pagination data available');
        return;
      }
      
      const { prevItem, nextItem } = data.pagination;
      
      // Create container for navigation
      const navContainer = document.createElement('div');
      navContainer.className = settings.containerClass;
      navContainer.dataset.sectionTheme = getSectionTheme();
      
      // Add prev arrow if prevItem exists and has data
      if (prevItem && Object.keys(prevItem).length > 0 && prevItem.fullUrl) {
        const prevArrow = createNavArrow(prevItem, 'prev');
        navContainer.appendChild(prevArrow);
      }
      
      // Add next arrow if nextItem exists and has data
      if (nextItem && Object.keys(nextItem).length > 0 && nextItem.fullUrl) {
        const nextArrow = createNavArrow(nextItem, 'next');
        navContainer.appendChild(nextArrow);
      }
      
      // Add to page if we have any arrows
      if (navContainer.children.length > 0) {
        const targetElement = settings.appendTo instanceof Element ? settings.appendTo : document.querySelector(settings.appendTo) || document.body;
        
        if (settings.insertPosition === 'prepend') {
          targetElement.insertBefore(navContainer, targetElement.firstChild);
        } else if (settings.insertPosition === 'before') {
          targetElement.parentNode.insertBefore(navContainer, targetElement);
        } else {
          // Default to 'append'
          targetElement.appendChild(navContainer);
        }
      }
      
    } catch (error) {
      console.error('Error initializing blog navigation:', error);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBlogNavigation);
  } else {
    initBlogNavigation();
  }
  
})();