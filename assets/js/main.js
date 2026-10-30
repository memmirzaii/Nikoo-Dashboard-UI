/**
 * Nikoo AI Dashboard - Main JavaScript
 * Core application initialization and utilities
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize the application
  initApp();
});

/**
 * Initialize the application
 */
function initApp() {
  console.log('Nikoo AI Dashboard - Initializing...');
  
  // Initialize components
  initSidebar();
  initNavbar();
  initTheme();
  initTooltips();
  initModals();
  initDropdowns();
  
  // Load saved state
  loadSavedState();
  
  console.log('Nikoo AI Dashboard - Initialized successfully');
}

/**
 * Initialize sidebar functionality
 */
function initSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.querySelector('.main-content');
  const sidebarToggle = document.getElementById('sidebarToggle');
  
  if (!sidebar || !mainContent) return;
  
  // Mobile sidebar toggle
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function() {
      sidebar.classList.toggle('open');
      if (window.innerWidth < 1024) {
        mainContent.classList.toggle('mr-64');
      }
    });
  }
  
  // Close sidebar on mobile when clicking outside
  document.addEventListener('click', function(e) {
    if (window.innerWidth < 1024) {
      if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
        sidebar.classList.remove('open');
        mainContent.classList.remove('mr-64');
      }
    }
  });
  
  // Handle window resize
  window.addEventListener('resize', function() {
    if (window.innerWidth >= 1024) {
      sidebar.classList.remove('open');
      mainContent.classList.remove('mr-64');
    }
  });
}

/**
 * Initialize navbar functionality
 */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const userMenuButton = document.getElementById('userMenuButton');
  const userMenu = document.getElementById('userMenu');
  
  // User menu toggle
  if (userMenuButton && userMenu) {
    userMenuButton.addEventListener('click', function(e) {
      e.stopPropagation();
      userMenu.classList.toggle('hidden');
    });
    
    // Close user menu when clicking outside
    document.addEventListener('click', function(e) {
      if (!userMenuButton.contains(e.target) && !userMenu.contains(e.target)) {
        userMenu.classList.add('hidden');
      }
    });
  }
}

/**
 * Initialize theme functionality
 */
function initTheme() {
  const darkModeToggle = document.getElementById('darkModeToggle');
  const html = document.documentElement;
  
  if (!darkModeToggle) return;
  
  // Check for saved theme preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    html.classList.add(savedTheme);
  }
  
  // Toggle dark mode
  darkModeToggle.addEventListener('click', function() {
    const isDark = html.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : '');
  });
}

/**
 * Initialize tooltips
 */
function initTooltips() {
  const tooltips = document.querySelectorAll('[data-tooltip]');
  
  tooltips.forEach(tooltip => {
    const tooltipText = tooltip.getAttribute('data-tooltip');
    const tooltipElement = document.createElement('div');
    tooltipElement.className = 'tooltip';
    tooltipElement.textContent = tooltipText;
    tooltipElement.style.position = 'absolute';
    tooltipElement.style.bottom = '100%';
    tooltipElement.style.left = '50%';
    tooltipElement.style.transform = 'translateX(-50%)';
    tooltipElement.style.backgroundColor = '#1f2937';
    tooltipElement.style.color = '#fff';
    tooltipElement.style.padding = '0.25rem 0.5rem';
    tooltipElement.style.borderRadius = '0.25rem';
    tooltipElement.style.fontSize = '0.75rem';
    tooltipElement.style.whiteSpace = 'nowrap';
    tooltipElement.style.visibility = 'hidden';
    tooltipElement.style.opacity = '0';
    tooltipElement.style.transition = 'opacity 0.2s ease';
    tooltipElement.style.zIndex = '50';
    
    tooltip.style.position = 'relative';
    tooltip.appendChild(tooltipElement);
    
    tooltip.addEventListener('mouseenter', function() {
      tooltipElement.style.visibility = 'visible';
      tooltipElement.style.opacity = '1';
    });
    
    tooltip.addEventListener('mouseleave', function() {
      tooltipElement.style.visibility = 'hidden';
      tooltipElement.style.opacity = '0';
    });
  });
}

/**
 * Initialize modals
 */
function initModals() {
  const modalTriggers = document.querySelectorAll('[data-modal-trigger]');
  
  modalTriggers.forEach(trigger => {
    const modalId = trigger.getAttribute('data-modal-trigger');
    const modal = document.getElementById(modalId);
    const closeButton = modal.querySelector('[data-modal-close]');
    
    if (!modal) return;
    
    // Open modal
    trigger.addEventListener('click', function() {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    });
    
    // Close modal
    if (closeButton) {
      closeButton.addEventListener('click', function() {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
      });
    }
    
    // Close on backdrop click
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
      }
    });
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
      }
    });
  });
}

/**
 * Initialize dropdowns
 */
function initDropdowns() {
  const dropdownTriggers = document.querySelectorAll('[data-dropdown-trigger]');
  
  dropdownTriggers.forEach(trigger => {
    const dropdownId = trigger.getAttribute('data-dropdown-trigger');
    const dropdown = document.getElementById(dropdownId);
    
    if (!dropdown) return;
    
    // Toggle dropdown
    trigger.addEventListener('click', function(e) {
      e.stopPropagation();
      dropdown.classList.toggle('hidden');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!trigger.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });
  });
}

/**
 * Load saved state from localStorage
 */
function loadSavedState() {
  // Load theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.documentElement.classList.add(savedTheme);
  }
  
  // Load sidebar state
  const savedSidebarState = localStorage.getItem('sidebarState');
  if (savedSidebarState === 'collapsed') {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    if (sidebar && mainContent) {
      sidebar.classList.add('collapsed');
      mainContent.classList.add('mr-0');
      mainContent.classList.remove('mr-64');
    }
  }
}

/**
 * Save state to localStorage
 */
function saveState(key, value) {
  localStorage.setItem(key, value);
}

/**
 * Show notification
 */
function showNotification(message, type = 'info', duration = 3000) {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // Style the notification
  notification.style.position = 'fixed';
  notification.style.bottom = '20px';
  notification.style.right = '20px';
  notification.style.padding = '1rem';
  notification.style.borderRadius = '0.5rem';
  notification.style.zIndex = '100';
  notification.style.animation = 'slideUp 0.3s ease-out';
  
  // Set colors based on type
  switch (type) {
    case 'success':
      notification.style.backgroundColor = '#10b981';
      notification.style.color = '#fff';
      break;
    case 'error':
      notification.style.backgroundColor = '#ef4444';
      notification.style.color = '#fff';
      break;
    case 'warning':
      notification.style.backgroundColor = '#f59e0b';
      notification.style.color = '#fff';
      break;
    default:
      notification.style.backgroundColor = '#6366f1';
      notification.style.color = '#fff';
  }
  
  document.body.appendChild(notification);
  
  // Remove after duration
  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, duration);
}

/**
 * Format Persian numbers
 */
function toPersianNumber(num) {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/\d/g, digit => persianDigits[digit]);
}

/**
 * Format currency (Toman)
 */
function formatCurrency(amount) {
  const formatted = new Intl.NumberFormat('fa-IR', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount);
  
  return toPersianNumber(formatted) + ' تومان';
}

/**
 * Format date (Persian)
 */
function formatDate(date) {
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatted = new Intl.DateTimeFormat('fa-IR', options).format(date);
  return toPersianNumber(formatted);
}

/**
 * Debounce function for performance optimization
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance optimization
 */
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Check if element is in viewport
 */
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Scroll to element smoothly
 */
function scrollToElement(element, offset = 0) {
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;
  
  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
}

// Export functions for use in other modules
window.NikooApp = {
  initApp,
  initSidebar,
  initNavbar,
  initTheme,
  initTooltips,
  initModals,
  initDropdowns,
  loadSavedState,
  saveState,
  showNotification,
  toPersianNumber,
  formatCurrency,
  formatDate,
  debounce,
  throttle,
  isInViewport,
  scrollToElement,
};
