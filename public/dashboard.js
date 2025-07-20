/**
 * SilentLedger Enhanced Trading Dashboard
 * Provides real-time analytics, trading statistics, and performance metrics
 * Safe, non-breaking enhancement to the existing protocol
 */

class TradingDashboard {
  constructor() {
    this.stats = {
      totalVolume: 0,
      totalTrades: 0,
      successfulTrades: 0,
      frontRunningAttempts: 0,
      frontRunningPrevented: 0,
      privacyScore: 100,
      activeOrders: 0,
      completedOrders: 0
    };
    
    this.chartData = {
      volumeHistory: [],
      priceHistory: {},
      privacyMetrics: []
    };
    
    this.init();
  }

  init() {
    this.createDashboardElements();
    this.startRealTimeUpdates();
    this.bindEvents();
  }

  createDashboardElements() {
    // Create dashboard container if it doesn't exist
    if (!document.getElementById('trading-dashboard')) {
      const dashboardHTML = `
        <section id="trading-dashboard" class="card dashboard">
          <div class="dashboard-header">
            <h2>📊 Trading Analytics Dashboard</h2>
            <div class="dashboard-controls">
              <button id="toggle-dashboard" class="btn-secondary">Hide Dashboard</button>
              <button id="export-stats" class="btn-secondary">Export Stats</button>
            </div>
          </div>
          
          <div class="dashboard-grid">
            <!-- Trading Statistics -->
            <div class="stat-card">
              <div class="stat-header">
                <h3>Trading Volume</h3>
                <span class="stat-period">24h</span>
              </div>
              <div class="stat-value" id="total-volume">0</div>
              <div class="stat-change positive" id="volume-change">+0%</div>
            </div>
            
            <div class="stat-card">
              <div class="stat-header">
                <h3>Total Trades</h3>
                <span class="stat-period">All Time</span>
              </div>
              <div class="stat-value" id="total-trades">0</div>
              <div class="stat-change" id="trades-change">0 today</div>
            </div>
            
            <div class="stat-card">
              <div class="stat-header">
                <h3>Success Rate</h3>
                <span class="stat-period">Success/Total</span>
              </div>
              <div class="stat-value" id="success-rate">100%</div>
              <div class="stat-change positive" id="success-change">Perfect</div>
            </div>
            
            <!-- Privacy Metrics -->
            <div class="stat-card privacy-card">
              <div class="stat-header">
                <h3>🛡️ Privacy Score</h3>
                <span class="stat-period">Protection Level</span>
              </div>
              <div class="stat-value privacy-score" id="privacy-score">100</div>
              <div class="stat-change positive">Maximum Privacy</div>
            </div>
            
            <div class="stat-card">
              <div class="stat-header">
                <h3>🚫 Front-Running</h3>
                <span class="stat-period">Attempts Blocked</span>
              </div>
              <div class="stat-value" id="frontrun-blocked">0</div>
              <div class="stat-change positive" id="frontrun-rate">100% Blocked</div>
            </div>
            
            <div class="stat-card">
              <div class="stat-header">
                <h3>⚡ Active Orders</h3>
                <span class="stat-period">Currently Open</span>
              </div>
              <div class="stat-value" id="active-orders">0</div>
              <div class="stat-change" id="orders-change">0 pending</div>
            </div>
          </div>
          
          <!-- Real-time Activity Feed -->
          <div class="activity-section">
            <h3>🔄 Recent Activity</h3>
            <div class="activity-feed" id="activity-feed">
              <div class="activity-item">
                <span class="activity-time">Just now</span>
                <span class="activity-text">Dashboard initialized</span>
                <span class="activity-status success">✓</span>
              </div>
            </div>
          </div>
          
          <!-- Privacy Comparison Chart -->
          <div class="chart-section">
            <h3>📈 Privacy vs Traditional Comparison</h3>
            <div class="comparison-chart">
              <div class="chart-bar">
                <div class="chart-label">SilentLedger (Private)</div>
                <div class="chart-progress">
                  <div class="progress-bar private" style="width: 100%"></div>
                  <span class="progress-text">100% Privacy Protected</span>
                </div>
              </div>
              <div class="chart-bar">
                <div class="chart-label">Traditional DEX</div>
                <div class="chart-progress">
                  <div class="progress-bar public" style="width: 15%"></div>
                  <span class="progress-text">15% Privacy (Address Only)</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      `;
      
      // Insert dashboard after the header
      const header = document.querySelector('header');
      header.insertAdjacentHTML('afterend', dashboardHTML);
    }
  }

  bindEvents() {
    // Toggle dashboard visibility
    const toggleBtn = document.getElementById('toggle-dashboard');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleDashboard());
    }
    
    // Export statistics
    const exportBtn = document.getElementById('export-stats');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportStats());
    }
  }

  toggleDashboard() {
    const dashboard = document.getElementById('trading-dashboard');
    const toggleBtn = document.getElementById('toggle-dashboard');
    
    if (dashboard.style.display === 'none') {
      dashboard.style.display = 'block';
      toggleBtn.textContent = 'Hide Dashboard';
    } else {
      dashboard.style.display = 'none';
      toggleBtn.textContent = 'Show Dashboard';
    }
  }

  updateStats(newStats) {
    // Safely update statistics without breaking existing functionality
    Object.assign(this.stats, newStats);
    this.renderStats();
  }

  renderStats() {
    // Update volume
    const volumeEl = document.getElementById('total-volume');
    if (volumeEl) {
      volumeEl.textContent = this.formatNumber(this.stats.totalVolume);
    }
    
    // Update trades
    const tradesEl = document.getElementById('total-trades');
    if (tradesEl) {
      tradesEl.textContent = this.stats.totalTrades;
    }
    
    // Update success rate
    const successRateEl = document.getElementById('success-rate');
    if (successRateEl) {
      const rate = this.stats.totalTrades > 0 
        ? Math.round((this.stats.successfulTrades / this.stats.totalTrades) * 100)
        : 100;
      successRateEl.textContent = `${rate}%`;
    }
    
    // Update privacy score
    const privacyScoreEl = document.getElementById('privacy-score');
    if (privacyScoreEl) {
      privacyScoreEl.textContent = this.stats.privacyScore;
    }
    
    // Update front-running stats
    const frontrunBlockedEl = document.getElementById('frontrun-blocked');
    if (frontrunBlockedEl) {
      frontrunBlockedEl.textContent = this.stats.frontRunningPrevented;
    }
    
    // Update active orders
    const activeOrdersEl = document.getElementById('active-orders');
    if (activeOrdersEl) {
      activeOrdersEl.textContent = this.stats.activeOrders;
    }
  }

  addActivity(activity) {
    const activityFeed = document.getElementById('activity-feed');
    if (!activityFeed) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const activityHTML = `
      <div class="activity-item">
        <span class="activity-time">${timestamp}</span>
        <span class="activity-text">${activity.text}</span>
        <span class="activity-status ${activity.status}">${activity.status === 'success' ? '✓' : activity.status === 'error' ? '✗' : '⏳'}</span>
      </div>
    `;
    
    activityFeed.insertAdjacentHTML('afterbegin', activityHTML);
    
    // Keep only last 10 activities
    const activities = activityFeed.querySelectorAll('.activity-item');
    if (activities.length > 10) {
      activities[activities.length - 1].remove();
    }
  }

  recordTrade(tradeData) {
    // Safely record trade without affecting core functionality
    this.stats.totalTrades++;
    this.stats.totalVolume += parseFloat(tradeData.amount || 0);
    
    if (tradeData.success !== false) {
      this.stats.successfulTrades++;
    }
    
    this.addActivity({
      text: `${tradeData.type || 'Trade'} order for ${tradeData.amount || 0} ${tradeData.asset || 'tokens'}`,
      status: tradeData.success !== false ? 'success' : 'error'
    });
    
    this.renderStats();
  }

  recordFrontRunAttempt(blocked = true) {
    this.stats.frontRunningAttempts++;
    if (blocked) {
      this.stats.frontRunningPrevented++;
    }
    
    this.addActivity({
      text: `Front-running attempt ${blocked ? 'blocked' : 'detected'}`,
      status: blocked ? 'success' : 'warning'
    });
    
    // Update privacy score based on protection effectiveness
    const protectionRate = this.stats.frontRunningAttempts > 0 
      ? (this.stats.frontRunningPrevented / this.stats.frontRunningAttempts) * 100
      : 100;
    this.stats.privacyScore = Math.round(protectionRate);
    
    this.renderStats();
  }

  updateOrderCount(active, completed) {
    this.stats.activeOrders = active || 0;
    this.stats.completedOrders = completed || 0;
    this.renderStats();
  }

  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  exportStats() {
    const statsData = {
      timestamp: new Date().toISOString(),
      statistics: this.stats,
      chartData: this.chartData
    };
    
    const dataStr = JSON.stringify(statsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `silentledger-stats-${Date.now()}.json`;
    link.click();
    
    this.addActivity({
      text: 'Statistics exported successfully',
      status: 'success'
    });
  }

  startRealTimeUpdates() {
    // Update dashboard every 5 seconds
    setInterval(() => {
      this.renderStats();
    }, 5000);
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.tradingDashboard = new TradingDashboard();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TradingDashboard;
}
