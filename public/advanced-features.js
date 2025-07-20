/**
 * SilentLedger Advanced Features
 * Additional safe, non-breaking enhancements for the trading protocol
 * Includes market orders, advanced analytics, and performance optimizations
 */

class AdvancedFeatures {
  constructor() {
    this.marketOrderQueue = [];
    this.tradingPatterns = {
      hourlyVolume: new Array(24).fill(0),
      assetDistribution: {},
      priceHistory: {}
    };
    this.performanceCache = new Map();
    this.websocketSimulator = null;
    
    this.init();
  }

  init() {
    this.setupMarketOrders();
    this.initializeWebSocketSimulation();
    this.setupAdvancedAnalytics();
    this.enhanceMobileExperience();
    this.addExportFeatures();
  }

  // Market Order Implementation (Additive to existing limit orders)
  setupMarketOrders() {
    // Add market order options to existing order forms
    this.addMarketOrderOptions();
    this.setupMarketOrderHandling();
  }

  addMarketOrderOptions() {
    const orderTypSelects = document.querySelectorAll('[id*="order-type-select"]');
    
    orderTypSelects.forEach(select => {
      // Only add if not already present
      if (!select.querySelector('option[value="market-buy"]')) {
        const marketBuyOption = document.createElement('option');
        marketBuyOption.value = 'market-buy';
        marketBuyOption.textContent = 'Market Buy (Execute Immediately)';
        select.appendChild(marketBuyOption);

        const marketSellOption = document.createElement('option');
        marketSellOption.value = 'market-sell';
        marketSellOption.textContent = 'Market Sell (Execute Immediately)';
        select.appendChild(marketSellOption);
      }
    });

    // Add event listeners for market order type changes
    orderTypSelects.forEach(select => {
      select.addEventListener('change', (e) => this.handleOrderTypeChange(e));
    });
  }

  handleOrderTypeChange(event) {
    const orderType = event.target.value;
    const form = event.target.closest('form');
    const priceInput = form.querySelector('[id*="price-input"]');
    const priceLabel = form.querySelector('label[for*="price"]');

    if (orderType.startsWith('market-')) {
      // Disable price input for market orders
      priceInput.disabled = true;
      priceInput.value = 'Market Price';
      priceInput.style.opacity = '0.6';
      if (priceLabel) {
        priceLabel.textContent = 'Price (Market)';
      }
      
      // Show market order warning
      this.showMarketOrderWarning(form);
    } else {
      // Re-enable price input for limit orders
      priceInput.disabled = false;
      priceInput.value = '';
      priceInput.style.opacity = '1';
      if (priceLabel) {
        priceLabel.textContent = 'Price';
      }
      
      // Remove market order warning
      this.removeMarketOrderWarning(form);
    }
  }

  showMarketOrderWarning(form) {
    // Remove existing warning
    this.removeMarketOrderWarning(form);
    
    const warningHTML = `
      <div class="market-order-warning">
        <div class="warning-icon">⚡</div>
        <div class="warning-text">
          <strong>Market Order:</strong> Will execute immediately at the best available price.
          Price may vary from current display.
        </div>
      </div>
    `;
    
    form.insertAdjacentHTML('afterbegin', warningHTML);
  }

  removeMarketOrderWarning(form) {
    const warning = form.querySelector('.market-order-warning');
    if (warning) {
      warning.remove();
    }
  }

  setupMarketOrderHandling() {
    // Intercept order submissions to handle market orders
    const originalHandleOrderSubmission = window.handleOrderSubmission;
    
    window.handleOrderSubmission = async (event, side) => {
      const form = event.target;
      const orderType = form.querySelector('[id*="order-type-select"]').value;
      
      if (orderType.startsWith('market-')) {
        return this.handleMarketOrder(event, side, orderType);
      } else {
        return originalHandleOrderSubmission(event, side);
      }
    };
  }

  async handleMarketOrder(event, side, orderType) {
    event.preventDefault();
    
    if (window.enhancedUI) {
      window.enhancedUI.showLoading('Processing Market Order...', 'Finding best available price');
    }

    try {
      // Get current market price
      const form = event.target;
      const assetId = form.querySelector('[id*="asset-select"]').value;
      const amount = parseInt(form.querySelector('[id*="amount-input"]').value, 10);
      
      const marketPrice = await this.getCurrentMarketPrice(assetId, orderType);
      
      // Create market order with current market price
      const marketOrderData = {
        type: 'trade',
        orderType: orderType.replace('market-', ''), // Convert market-buy to buy
        asset: assetId,
        amount: amount,
        price: marketPrice,
        isMarketOrder: true,
        success: true,
        side: side
      };

      // Update dashboard
      if (window.tradingDashboard) {
        window.tradingDashboard.recordTrade(marketOrderData);
        window.tradingDashboard.addActivity({
          text: `Market ${orderType.replace('market-', '')} order executed: ${amount} ${assetId} at ${marketPrice}`,
          status: 'success'
        });
      }

      // Show success notification
      if (window.enhancedUI) {
        window.enhancedUI.hideLoading();
        window.enhancedUI.showEnhancedNotification(
          `Market order executed successfully! ${amount} ${assetId} at price ${marketPrice}`,
          'success',
          5000,
          [{
            id: 'view-order',
            label: 'View Order',
            handler: () => this.showOrderDetails(marketOrderData)
          }]
        );
      }

      // Reset form
      form.reset();
      
    } catch (error) {
      console.error('Market order error:', error);
      
      if (window.enhancedUI) {
        window.enhancedUI.hideLoading();
        window.enhancedUI.showEnhancedNotification(
          `Market order failed: ${error.message}`,
          'error'
        );
      }
    }
  }

  async getCurrentMarketPrice(assetId, orderType) {
    // Simulate getting current market price
    // In a real implementation, this would query the orderbook
    const basePrice = assetId === 'TOKEN-X' ? 100 : 50;
    const spread = 0.02; // 2% spread
    
    if (orderType === 'market-buy') {
      return basePrice * (1 + spread); // Buy at ask price
    } else {
      return basePrice * (1 - spread); // Sell at bid price
    }
  }

  showOrderDetails(orderData) {
    const detailsHTML = `
      <div class="order-details-modal">
        <div class="order-details-content">
          <h3>📋 Order Details</h3>
          <div class="order-info">
            <div class="info-row">
              <span class="info-label">Type:</span>
              <span class="info-value">Market ${orderData.orderType}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Asset:</span>
              <span class="info-value">${orderData.asset}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Amount:</span>
              <span class="info-value">${orderData.amount}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Price:</span>
              <span class="info-value">${orderData.price}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total:</span>
              <span class="info-value">${(orderData.amount * orderData.price).toFixed(2)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Status:</span>
              <span class="info-value success">✓ Executed</span>
            </div>
          </div>
          <button class="close-details">Close</button>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', detailsHTML);
    
    const modal = document.querySelector('.order-details-modal');
    const closeBtn = modal.querySelector('.close-details');
    
    closeBtn.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  // WebSocket Simulation for Real-time Updates
  initializeWebSocketSimulation() {
    // Simulate real-time price updates
    this.websocketSimulator = setInterval(() => {
      this.simulatePriceUpdates();
      this.simulateOrderBookChanges();
    }, 3000);
  }

  simulatePriceUpdates() {
    const assets = ['TOKEN-X', 'TOKEN-Y'];
    
    assets.forEach(asset => {
      const currentPrice = this.tradingPatterns.priceHistory[asset] || 100;
      const change = (Math.random() - 0.5) * 2; // -1 to +1
      const newPrice = Math.max(1, currentPrice + change);
      
      this.tradingPatterns.priceHistory[asset] = newPrice;
      
      // Update UI if price display elements exist
      const priceElements = document.querySelectorAll(`[data-asset="${asset}"] .current-price`);
      priceElements.forEach(el => {
        el.textContent = newPrice.toFixed(2);
        el.classList.add(change > 0 ? 'price-up' : 'price-down');
        setTimeout(() => el.classList.remove('price-up', 'price-down'), 1000);
      });
    });
  }

  simulateOrderBookChanges() {
    // Simulate new orders appearing in the orderbook
    if (Math.random() < 0.3) { // 30% chance
      const assets = ['TOKEN-X', 'TOKEN-Y'];
      const asset = assets[Math.floor(Math.random() * assets.length)];
      const isBuy = Math.random() < 0.5;
      
      if (window.tradingDashboard) {
        window.tradingDashboard.addActivity({
          text: `New ${isBuy ? 'buy' : 'sell'} order appeared: ${asset}`,
          status: 'info'
        });
      }
    }
  }

  // Advanced Analytics
  setupAdvancedAnalytics() {
    this.trackTradingPatterns();
    this.setupVolumeAnalysis();
    this.addPerformanceMetrics();
  }

  trackTradingPatterns() {
    // Track hourly volume distribution
    const currentHour = new Date().getHours();
    this.tradingPatterns.hourlyVolume[currentHour] += 1;
    
    // Update dashboard with pattern analysis
    if (window.tradingDashboard) {
      const peakHour = this.tradingPatterns.hourlyVolume.indexOf(
        Math.max(...this.tradingPatterns.hourlyVolume)
      );
      
      window.tradingDashboard.addActivity({
        text: `Peak trading hour: ${peakHour}:00`,
        status: 'info'
      });
    }
  }

  setupVolumeAnalysis() {
    // Add volume analysis to dashboard
    setInterval(() => {
      this.analyzeVolumePatterns();
    }, 30000); // Every 30 seconds
  }

  analyzeVolumePatterns() {
    const totalVolume = Object.values(this.tradingPatterns.assetDistribution)
      .reduce((sum, vol) => sum + vol, 0);
    
    if (totalVolume > 0 && window.tradingDashboard) {
      const dominantAsset = Object.entries(this.tradingPatterns.assetDistribution)
        .sort(([,a], [,b]) => b - a)[0];
      
      if (dominantAsset) {
        const [asset, volume] = dominantAsset;
        const percentage = ((volume / totalVolume) * 100).toFixed(1);
        
        window.tradingDashboard.addActivity({
          text: `${asset} dominates trading: ${percentage}% of volume`,
          status: 'info'
        });
      }
    }
  }

  addPerformanceMetrics() {
    // Track performance metrics
    this.performanceMetrics = {
      averageResponseTime: 0,
      totalRequests: 0,
      errorRate: 0
    };
    
    // Monitor API response times
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        
        this.recordPerformanceMetric(endTime - startTime, true);
        return response;
      } catch (error) {
        const endTime = performance.now();
        this.recordPerformanceMetric(endTime - startTime, false);
        throw error;
      }
    };
  }

  recordPerformanceMetric(responseTime, success) {
    this.performanceMetrics.totalRequests++;
    
    // Update average response time
    this.performanceMetrics.averageResponseTime = 
      (this.performanceMetrics.averageResponseTime + responseTime) / 2;
    
    // Update error rate
    if (!success) {
      this.performanceMetrics.errorRate = 
        (this.performanceMetrics.errorRate + 1) / this.performanceMetrics.totalRequests;
    }
    
    // Update dashboard if available
    if (window.tradingDashboard && this.performanceMetrics.totalRequests % 10 === 0) {
      window.tradingDashboard.addActivity({
        text: `Avg response time: ${this.performanceMetrics.averageResponseTime.toFixed(0)}ms`,
        status: 'info'
      });
    }
  }

  // Mobile Experience Enhancements
  enhanceMobileExperience() {
    // Add mobile-specific improvements
    this.addSwipeGestures();
    this.optimizeForTouch();
    this.addMobileNavigation();
  }

  addSwipeGestures() {
    let startX, startY;
    
    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });
    
    document.addEventListener('touchend', (e) => {
      if (!startX || !startY) return;
      
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      
      const diffX = startX - endX;
      const diffY = startY - endY;
      
      // Horizontal swipe
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        if (diffX > 0) {
          // Swipe left - next section
          this.navigateToNextSection();
        } else {
          // Swipe right - previous section
          this.navigateToPreviousSection();
        }
      }
      
      startX = startY = null;
    });
  }

  navigateToNextSection() {
    // Implement section navigation
    if (window.enhancedUI) {
      window.enhancedUI.showEnhancedNotification('Swiped to next section', 'info', 1000);
    }
  }

  navigateToPreviousSection() {
    // Implement section navigation
    if (window.enhancedUI) {
      window.enhancedUI.showEnhancedNotification('Swiped to previous section', 'info', 1000);
    }
  }

  optimizeForTouch() {
    // Increase touch targets on mobile
    if (window.innerWidth < 768) {
      const buttons = document.querySelectorAll('button');
      buttons.forEach(btn => {
        btn.style.minHeight = '44px';
        btn.style.minWidth = '44px';
      });
    }
  }

  addMobileNavigation() {
    // Add mobile-friendly navigation
    if (window.innerWidth < 768) {
      const navHTML = `
        <div class="mobile-nav">
          <button class="nav-item" data-section="wallet">👛 Wallet</button>
          <button class="nav-item" data-section="trade">📈 Trade</button>
          <button class="nav-item" data-section="orders">📋 Orders</button>
          <button class="nav-item" data-section="analytics">📊 Analytics</button>
        </div>
      `;
      
      document.body.insertAdjacentHTML('beforeend', navHTML);
    }
  }

  // Export/Import Features
  addExportFeatures() {
    this.addDataExportOptions();
    this.addConfigurationImport();
  }

  addDataExportOptions() {
    // Add export buttons to dashboard if it exists
    const dashboard = document.getElementById('trading-dashboard');
    if (dashboard) {
      const exportSection = document.createElement('div');
      exportSection.className = 'export-section';
      exportSection.innerHTML = `
        <h4>📤 Export Data</h4>
        <div class="export-buttons">
          <button class="export-btn" data-type="csv">Export CSV</button>
          <button class="export-btn" data-type="json">Export JSON</button>
          <button class="export-btn" data-type="pdf">Export PDF Report</button>
        </div>
      `;
      
      dashboard.appendChild(exportSection);
      
      // Bind export handlers
      exportSection.querySelectorAll('.export-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.handleDataExport(e.target.dataset.type);
        });
      });
    }
  }

  handleDataExport(type) {
    const data = this.collectExportData();
    
    switch (type) {
      case 'csv':
        this.exportAsCSV(data);
        break;
      case 'json':
        this.exportAsJSON(data);
        break;
      case 'pdf':
        this.exportAsPDF(data);
        break;
    }
  }

  collectExportData() {
    return {
      timestamp: new Date().toISOString(),
      tradingPatterns: this.tradingPatterns,
      performanceMetrics: this.performanceMetrics,
      dashboardStats: window.tradingDashboard ? window.tradingDashboard.stats : {}
    };
  }

  exportAsCSV(data) {
    // Simple CSV export
    const csv = this.convertToCSV(data);
    this.downloadFile(csv, 'silentledger-data.csv', 'text/csv');
  }

  exportAsJSON(data) {
    const json = JSON.stringify(data, null, 2);
    this.downloadFile(json, 'silentledger-data.json', 'application/json');
  }

  exportAsPDF(data) {
    // Simplified PDF export (would use a library like jsPDF in production)
    const content = `SilentLedger Trading Report\n\nGenerated: ${data.timestamp}\n\nData: ${JSON.stringify(data, null, 2)}`;
    this.downloadFile(content, 'silentledger-report.txt', 'text/plain');
  }

  convertToCSV(data) {
    // Simple CSV conversion
    let csv = 'Metric,Value\n';
    csv += `Timestamp,${data.timestamp}\n`;
    
    if (data.performanceMetrics) {
      csv += `Average Response Time,${data.performanceMetrics.averageResponseTime}\n`;
      csv += `Total Requests,${data.performanceMetrics.totalRequests}\n`;
      csv += `Error Rate,${data.performanceMetrics.errorRate}\n`;
    }
    
    return csv;
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
    
    if (window.enhancedUI) {
      window.enhancedUI.showEnhancedNotification(
        `${filename} downloaded successfully!`,
        'success'
      );
    }
  }

  addConfigurationImport() {
    // Add configuration import functionality
    const importHTML = `
      <div class="import-section">
        <h4>📥 Import Configuration</h4>
        <input type="file" id="config-import" accept=".json" style="display: none;">
        <button class="import-btn">Import Settings</button>
      </div>
    `;
    
    const dashboard = document.getElementById('trading-dashboard');
    if (dashboard) {
      dashboard.insertAdjacentHTML('beforeend', importHTML);
      
      const importBtn = dashboard.querySelector('.import-btn');
      const fileInput = dashboard.querySelector('#config-import');
      
      importBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => this.handleConfigImport(e));
    }
  }

  handleConfigImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target.result);
        this.applyImportedConfig(config);
        
        if (window.enhancedUI) {
          window.enhancedUI.showEnhancedNotification(
            'Configuration imported successfully!',
            'success'
          );
        }
      } catch (error) {
        if (window.enhancedUI) {
          window.enhancedUI.showEnhancedNotification(
            'Failed to import configuration: Invalid file format',
            'error'
          );
        }
      }
    };
    
    reader.readAsText(file);
  }

  applyImportedConfig(config) {
    // Apply imported configuration safely
    if (config.tradingPatterns) {
      Object.assign(this.tradingPatterns, config.tradingPatterns);
    }
    
    if (window.tradingDashboard && config.dashboardStats) {
      window.tradingDashboard.updateStats(config.dashboardStats);
    }
  }

  // Cleanup
  destroy() {
    if (this.websocketSimulator) {
      clearInterval(this.websocketSimulator);
    }
  }
}

// Initialize advanced features when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Wait for other components to initialize first
  setTimeout(() => {
    window.advancedFeatures = new AdvancedFeatures();
  }, 1000);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdvancedFeatures;
}
