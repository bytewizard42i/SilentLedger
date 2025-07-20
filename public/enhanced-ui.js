/**
 * SilentLedger Enhanced UI Components
 * Provides better loading states, error handling, and user feedback
 * Safe, non-breaking enhancements to improve user experience
 */

class EnhancedUI {
  constructor() {
    this.loadingStates = new Map();
    this.init();
  }

  init() {
    this.createLoadingOverlay();
    this.enhanceNotifications();
    this.addKeyboardShortcuts();
    this.improveFormValidation();
  }

  // Enhanced Loading States
  createLoadingOverlay() {
    if (!document.getElementById('loading-overlay')) {
      const overlayHTML = `
        <div id="loading-overlay" class="loading-overlay hidden">
          <div class="loading-content">
            <div class="loading-spinner"></div>
            <div class="loading-text">Processing...</div>
            <div class="loading-details"></div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', overlayHTML);
    }
  }

  showLoading(message = 'Processing...', details = '') {
    const overlay = document.getElementById('loading-overlay');
    const text = document.querySelector('.loading-text');
    const detailsEl = document.querySelector('.loading-details');
    
    if (overlay && text) {
      text.textContent = message;
      detailsEl.textContent = details;
      overlay.classList.remove('hidden');
    }
  }

  hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }
  }

  // Enhanced Notifications
  enhanceNotifications() {
    // Create notification container if it doesn't exist
    if (!document.getElementById('notification-container')) {
      const containerHTML = `
        <div id="notification-container" class="notification-container"></div>
      `;
      document.body.insertAdjacentHTML('beforeend', containerHTML);
    }
  }

  showEnhancedNotification(message, type = 'info', duration = 5000, actions = []) {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const notificationId = `notification-${Date.now()}`;
    const actionsHTML = actions.map(action => 
      `<button class="notification-action" data-action="${action.id}">${action.label}</button>`
    ).join('');

    const notificationHTML = `
      <div id="${notificationId}" class="enhanced-notification ${type}">
        <div class="notification-icon">${this.getNotificationIcon(type)}</div>
        <div class="notification-content">
          <div class="notification-message">${message}</div>
          <div class="notification-timestamp">${new Date().toLocaleTimeString()}</div>
        </div>
        <div class="notification-actions">
          ${actionsHTML}
          <button class="notification-close">×</button>
        </div>
      </div>
    `;

    container.insertAdjacentHTML('afterbegin', notificationHTML);

    const notification = document.getElementById(notificationId);
    
    // Bind action handlers
    actions.forEach(action => {
      const button = notification.querySelector(`[data-action="${action.id}"]`);
      if (button) {
        button.addEventListener('click', () => {
          action.handler();
          this.removeNotification(notificationId);
        });
      }
    });

    // Bind close handler
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.removeNotification(notificationId));
    }

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => this.removeNotification(notificationId), duration);
    }

    return notificationId;
  }

  removeNotification(notificationId) {
    const notification = document.getElementById(notificationId);
    if (notification) {
      notification.classList.add('notification-exit');
      setTimeout(() => notification.remove(), 300);
    }
  }

  getNotificationIcon(type) {
    const icons = {
      success: '✓',
      error: '✗',
      warning: '⚠',
      info: 'ℹ',
      loading: '⏳'
    };
    return icons[type] || icons.info;
  }

  // Keyboard Shortcuts
  addKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Only activate shortcuts when not typing in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case 'c':
          if (e.ctrlKey || e.metaKey) return; // Don't interfere with copy
          this.focusConnectWallet();
          break;
        case 'v':
          this.focusVerificationForm();
          break;
        case 'o':
          this.focusOrderForm();
          break;
        case 'd':
          this.toggleDashboard();
          break;
        case 'h':
          this.showKeyboardHelp();
          break;
        case 'escape':
          this.closeModals();
          break;
      }
    });
  }

  focusConnectWallet() {
    const connectBtn = document.getElementById('connect-wallet');
    if (connectBtn && !connectBtn.disabled) {
      connectBtn.focus();
      this.showEnhancedNotification('Press Enter to connect wallet', 'info', 2000);
    }
  }

  focusVerificationForm() {
    const assetSelect = document.getElementById('asset-select-private');
    if (assetSelect) {
      assetSelect.focus();
      this.showEnhancedNotification('Verification form focused. Use Tab to navigate', 'info', 2000);
    }
  }

  focusOrderForm() {
    const orderAssetSelect = document.getElementById('order-asset-select-private');
    if (orderAssetSelect) {
      orderAssetSelect.focus();
      this.showEnhancedNotification('Order form focused. Use Tab to navigate', 'info', 2000);
    }
  }

  toggleDashboard() {
    if (window.tradingDashboard) {
      window.tradingDashboard.toggleDashboard();
    }
  }

  showKeyboardHelp() {
    const helpHTML = `
      <div class="keyboard-help-modal">
        <div class="keyboard-help-content">
          <h3>⌨️ Keyboard Shortcuts</h3>
          <div class="shortcut-list">
            <div class="shortcut-item"><kbd>C</kbd> Focus Connect Wallet</div>
            <div class="shortcut-item"><kbd>V</kbd> Focus Verification Form</div>
            <div class="shortcut-item"><kbd>O</kbd> Focus Order Form</div>
            <div class="shortcut-item"><kbd>D</kbd> Toggle Dashboard</div>
            <div class="shortcut-item"><kbd>H</kbd> Show This Help</div>
            <div class="shortcut-item"><kbd>Esc</kbd> Close Modals</div>
          </div>
          <button class="close-help">Close</button>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', helpHTML);
    
    const modal = document.querySelector('.keyboard-help-modal');
    const closeBtn = modal.querySelector('.close-help');
    
    closeBtn.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  closeModals() {
    // Close any open modals
    const modals = document.querySelectorAll('.keyboard-help-modal, .loading-overlay:not(.hidden)');
    modals.forEach(modal => {
      if (modal.classList.contains('loading-overlay')) {
        modal.classList.add('hidden');
      } else {
        modal.remove();
      }
    });
  }

  // Enhanced Form Validation
  improveFormValidation() {
    // Add real-time validation to forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => this.enhanceForm(form));
  }

  enhanceForm(form) {
    const inputs = form.querySelectorAll('input, select');
    
    inputs.forEach(input => {
      // Add validation styling
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => this.clearFieldError(input));
    });
  }

  validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    // Basic validation rules
    if (field.hasAttribute('required') && !value) {
      isValid = false;
      errorMessage = 'This field is required';
    } else if (field.type === 'number' && value && (isNaN(value) || parseFloat(value) <= 0)) {
      isValid = false;
      errorMessage = 'Please enter a valid positive number';
    }

    this.showFieldValidation(field, isValid, errorMessage);
    return isValid;
  }

  showFieldValidation(field, isValid, errorMessage) {
    // Remove existing validation
    this.clearFieldError(field);

    if (!isValid) {
      field.classList.add('field-error');
      
      const errorEl = document.createElement('div');
      errorEl.className = 'field-error-message';
      errorEl.textContent = errorMessage;
      
      field.parentNode.appendChild(errorEl);
    } else {
      field.classList.add('field-success');
    }
  }

  clearFieldError(field) {
    field.classList.remove('field-error', 'field-success');
    
    const errorEl = field.parentNode.querySelector('.field-error-message');
    if (errorEl) {
      errorEl.remove();
    }
  }

  // Progress Tracking for Multi-step Operations
  createProgressTracker(steps) {
    const trackerHTML = `
      <div class="progress-tracker">
        <div class="progress-steps">
          ${steps.map((step, index) => `
            <div class="progress-step" data-step="${index}">
              <div class="step-number">${index + 1}</div>
              <div class="step-label">${step}</div>
            </div>
          `).join('')}
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: 0%"></div>
        </div>
      </div>
    `;
    
    return trackerHTML;
  }

  updateProgress(currentStep, totalSteps) {
    const progressFill = document.querySelector('.progress-fill');
    const steps = document.querySelectorAll('.progress-step');
    
    if (progressFill) {
      const percentage = (currentStep / totalSteps) * 100;
      progressFill.style.width = `${percentage}%`;
    }
    
    steps.forEach((step, index) => {
      if (index < currentStep) {
        step.classList.add('completed');
      } else if (index === currentStep) {
        step.classList.add('active');
      } else {
        step.classList.remove('completed', 'active');
      }
    });
  }

  // Copy to Clipboard Helper
  copyToClipboard(text, successMessage = 'Copied to clipboard!') {
    navigator.clipboard.writeText(text).then(() => {
      this.showEnhancedNotification(successMessage, 'success', 2000);
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.showEnhancedNotification(successMessage, 'success', 2000);
    });
  }
}

// Initialize enhanced UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.enhancedUI = new EnhancedUI();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnhancedUI;
}
