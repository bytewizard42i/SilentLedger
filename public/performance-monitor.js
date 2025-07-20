/**
 * SilentLedger Performance Monitor
 * Real-time performance tracking and optimization suggestions
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoadTime: 0,
      apiResponseTimes: [],
      memoryUsage: [],
      renderTimes: [],
      errorCount: 0,
      userInteractions: 0
    };
    
    this.thresholds = {
      slowApiResponse: 1000, // 1 second
      highMemoryUsage: 50 * 1024 * 1024, // 50MB
      slowRender: 16.67 // 60fps threshold
    };
    
    this.observers = [];
    this.isMonitoring = false;
    
    this.init();
  }

  init() {
    this.measurePageLoad();
    this.setupPerformanceObservers();
    this.monitorMemoryUsage();
    this.trackUserInteractions();
    this.createPerformanceWidget();
    this.startMonitoring();
  }

  measurePageLoad() {
    if (performance.timing) {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      this.metrics.pageLoadTime = loadTime;
      
      if (loadTime > 3000) { // Slow page load
        this.showPerformanceWarning('Slow page load detected', `Page took ${(loadTime/1000).toFixed(1)}s to load`);
      }
    }
  }

  setupPerformanceObservers() {
    // Observe long tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Long task threshold
              this.recordLongTask(entry);
            }
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (e) {
        console.log('Long task observer not supported');
      }

      // Observe paint timing
      try {
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordPaintTiming(entry);
          }
        });
        paintObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(paintObserver);
      } catch (e) {
        console.log('Paint observer not supported');
      }

      // Observe navigation timing
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordNavigationTiming(entry);
          }
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);
      } catch (e) {
        console.log('Navigation observer not supported');
      }
    }
  }

  recordLongTask(entry) {
    console.warn('Long task detected:', entry.duration + 'ms');
    
    if (window.enhancedUI) {
      window.enhancedUI.showEnhancedNotification(
        `Performance: Long task detected (${entry.duration.toFixed(0)}ms)`,
        'warning',
        3000
      );
    }
    
    this.updatePerformanceWidget();
  }

  recordPaintTiming(entry) {
    this.metrics.renderTimes.push({
      name: entry.name,
      startTime: entry.startTime,
      duration: entry.duration || 0
    });
    
    if (entry.name === 'first-contentful-paint' && entry.startTime > 2000) {
      this.showPerformanceWarning('Slow first paint', `FCP: ${(entry.startTime/1000).toFixed(1)}s`);
    }
  }

  recordNavigationTiming(entry) {
    const domContentLoaded = entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart;
    const loadComplete = entry.loadEventEnd - entry.loadEventStart;
    
    if (domContentLoaded > 1000) {
      this.showPerformanceWarning('Slow DOM ready', `DOM: ${domContentLoaded.toFixed(0)}ms`);
    }
  }

  monitorMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memInfo = performance.memory;
        this.metrics.memoryUsage.push({
          used: memInfo.usedJSHeapSize,
          total: memInfo.totalJSHeapSize,
          limit: memInfo.jsHeapSizeLimit,
          timestamp: Date.now()
        });
        
        // Keep only last 50 measurements
        if (this.metrics.memoryUsage.length > 50) {
          this.metrics.memoryUsage.shift();
        }
        
        // Check for memory leaks
        if (memInfo.usedJSHeapSize > this.thresholds.highMemoryUsage) {
          this.detectMemoryLeak();
        }
        
        this.updatePerformanceWidget();
      }, 5000); // Check every 5 seconds
    }
  }

  detectMemoryLeak() {
    const recent = this.metrics.memoryUsage.slice(-10);
    if (recent.length >= 10) {
      const trend = recent.reduce((acc, curr, idx) => {
        if (idx > 0) {
          acc += curr.used - recent[idx - 1].used;
        }
        return acc;
      }, 0);
      
      if (trend > 10 * 1024 * 1024) { // 10MB increase trend
        this.showPerformanceWarning('Memory leak detected', 'Memory usage increasing rapidly');
      }
    }
  }

  trackUserInteractions() {
    const interactionEvents = ['click', 'keydown', 'scroll', 'touchstart'];
    
    interactionEvents.forEach(eventType => {
      document.addEventListener(eventType, () => {
        this.metrics.userInteractions++;
        this.measureInteractionLatency(eventType);
      }, { passive: true });
    });
  }

  measureInteractionLatency(eventType) {
    const startTime = performance.now();
    
    requestAnimationFrame(() => {
      const endTime = performance.now();
      const latency = endTime - startTime;
      
      if (latency > this.thresholds.slowRender) {
        console.warn(`Slow ${eventType} response:`, latency + 'ms');
      }
    });
  }

  createPerformanceWidget() {
    const widgetHTML = `
      <div id="performance-widget" class="performance-widget">
        <div class="widget-header">
          <span class="widget-title">⚡ Performance</span>
          <button class="widget-toggle" title="Toggle Performance Monitor">📊</button>
        </div>
        <div class="widget-content">
          <div class="metric-row">
            <span class="metric-label">Page Load:</span>
            <span class="metric-value" id="page-load-metric">${(this.metrics.pageLoadTime/1000).toFixed(1)}s</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Memory:</span>
            <span class="metric-value" id="memory-metric">--</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">API Avg:</span>
            <span class="metric-value" id="api-metric">--</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Errors:</span>
            <span class="metric-value" id="error-metric">${this.metrics.errorCount}</span>
          </div>
          <div class="performance-actions">
            <button class="perf-action" id="clear-cache-btn">Clear Cache</button>
            <button class="perf-action" id="optimize-btn">Optimize</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', widgetHTML);
    
    // Bind event listeners
    this.bindWidgetEvents();
  }

  bindWidgetEvents() {
    const widget = document.getElementById('performance-widget');
    const toggle = widget.querySelector('.widget-toggle');
    const content = widget.querySelector('.widget-content');
    
    toggle.addEventListener('click', () => {
      content.style.display = content.style.display === 'none' ? 'block' : 'none';
    });
    
    document.getElementById('clear-cache-btn').addEventListener('click', () => {
      this.clearPerformanceCache();
    });
    
    document.getElementById('optimize-btn').addEventListener('click', () => {
      this.runOptimizations();
    });
    
    // Make widget draggable
    this.makeDraggable(widget);
  }

  makeDraggable(element) {
    let isDragging = false;
    let startX, startY, startLeft, startTop;
    
    const header = element.querySelector('.widget-header');
    
    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = element.offsetLeft;
      startTop = element.offsetTop;
      
      element.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      element.style.left = (startLeft + deltaX) + 'px';
      element.style.top = (startTop + deltaY) + 'px';
    });
    
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        element.style.cursor = 'default';
      }
    });
  }

  updatePerformanceWidget() {
    const memoryMetric = document.getElementById('memory-metric');
    const apiMetric = document.getElementById('api-metric');
    const errorMetric = document.getElementById('error-metric');
    
    if (memoryMetric && this.metrics.memoryUsage.length > 0) {
      const latest = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
      const memoryMB = (latest.used / (1024 * 1024)).toFixed(1);
      memoryMetric.textContent = memoryMB + 'MB';
      
      // Color code based on usage
      if (latest.used > this.thresholds.highMemoryUsage) {
        memoryMetric.className = 'metric-value warning';
      } else {
        memoryMetric.className = 'metric-value';
      }
    }
    
    if (apiMetric && this.metrics.apiResponseTimes.length > 0) {
      const avgResponse = this.metrics.apiResponseTimes.reduce((a, b) => a + b, 0) / this.metrics.apiResponseTimes.length;
      apiMetric.textContent = avgResponse.toFixed(0) + 'ms';
      
      if (avgResponse > this.thresholds.slowApiResponse) {
        apiMetric.className = 'metric-value warning';
      } else {
        apiMetric.className = 'metric-value';
      }
    }
    
    if (errorMetric) {
      errorMetric.textContent = this.metrics.errorCount;
      if (this.metrics.errorCount > 0) {
        errorMetric.className = 'metric-value error';
      }
    }
  }

  recordApiResponse(responseTime) {
    this.metrics.apiResponseTimes.push(responseTime);
    
    // Keep only last 20 measurements
    if (this.metrics.apiResponseTimes.length > 20) {
      this.metrics.apiResponseTimes.shift();
    }
    
    this.updatePerformanceWidget();
  }

  recordError(error) {
    this.metrics.errorCount++;
    console.error('Performance Monitor - Error recorded:', error);
    this.updatePerformanceWidget();
  }

  showPerformanceWarning(title, message) {
    if (window.enhancedUI) {
      window.enhancedUI.showEnhancedNotification(
        `${title}: ${message}`,
        'warning',
        5000,
        [{
          id: 'optimize',
          label: 'Optimize',
          handler: () => this.runOptimizations()
        }]
      );
    }
  }

  clearPerformanceCache() {
    // Clear various caches
    if (window.advancedFeatures && window.advancedFeatures.performanceCache) {
      window.advancedFeatures.performanceCache.clear();
    }
    
    // Clear metrics history
    this.metrics.apiResponseTimes = [];
    this.metrics.memoryUsage = [];
    this.metrics.renderTimes = [];
    
    if (window.enhancedUI) {
      window.enhancedUI.showEnhancedNotification('Performance cache cleared', 'success', 2000);
    }
    
    this.updatePerformanceWidget();
  }

  runOptimizations() {
    if (window.enhancedUI) {
      window.enhancedUI.showLoading('Running optimizations...', 'Improving performance');
    }
    
    const optimizations = [
      () => this.optimizeImages(),
      () => this.cleanupEventListeners(),
      () => this.optimizeAnimations(),
      () => this.compactLocalStorage()
    ];
    
    let completed = 0;
    const total = optimizations.length;
    
    optimizations.forEach((optimization, index) => {
      setTimeout(() => {
        optimization();
        completed++;
        
        if (completed === total) {
          if (window.enhancedUI) {
            window.enhancedUI.hideLoading();
            window.enhancedUI.showEnhancedNotification(
              `Optimizations complete! ${total} improvements applied.`,
              'success',
              3000
            );
          }
        }
      }, index * 200);
    });
  }

  optimizeImages() {
    // Lazy load images that are not visible
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!this.isElementVisible(img) && !img.dataset.optimized) {
        img.loading = 'lazy';
        img.dataset.optimized = 'true';
      }
    });
  }

  cleanupEventListeners() {
    // Remove duplicate event listeners (simplified approach)
    const elements = document.querySelectorAll('[data-cleanup-listeners]');
    elements.forEach(el => {
      el.removeAttribute('data-cleanup-listeners');
    });
  }

  optimizeAnimations() {
    // Reduce animations on low-performance devices
    if (this.metrics.memoryUsage.length > 0) {
      const latestMemory = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
      if (latestMemory.used > this.thresholds.highMemoryUsage) {
        document.body.classList.add('reduce-animations');
      }
    }
  }

  compactLocalStorage() {
    // Clean up old localStorage entries
    const keys = Object.keys(localStorage);
    const oldKeys = keys.filter(key => {
      try {
        const item = JSON.parse(localStorage.getItem(key));
        if (item.timestamp && Date.now() - item.timestamp > 7 * 24 * 60 * 60 * 1000) { // 7 days
          return true;
        }
      } catch (e) {
        // Invalid JSON, might be old data
        return true;
      }
      return false;
    });
    
    oldKeys.forEach(key => localStorage.removeItem(key));
  }

  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

  startMonitoring() {
    this.isMonitoring = true;
    
    // Monitor API calls
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        this.recordApiResponse(endTime - startTime);
        return response;
      } catch (error) {
        this.recordError(error);
        throw error;
      }
    };
    
    // Monitor errors
    window.addEventListener('error', (event) => {
      this.recordError(event.error);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError(event.reason);
    });
  }

  stopMonitoring() {
    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  getPerformanceReport() {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      recommendations: this.generateRecommendations()
    };
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.metrics.pageLoadTime > 3000) {
      recommendations.push('Consider optimizing images and reducing bundle size');
    }
    
    if (this.metrics.apiResponseTimes.length > 0) {
      const avgApi = this.metrics.apiResponseTimes.reduce((a, b) => a + b, 0) / this.metrics.apiResponseTimes.length;
      if (avgApi > 1000) {
        recommendations.push('API responses are slow - consider caching or optimization');
      }
    }
    
    if (this.metrics.errorCount > 5) {
      recommendations.push('High error count detected - review error handling');
    }
    
    if (this.metrics.memoryUsage.length > 0) {
      const latestMemory = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
      if (latestMemory.used > this.thresholds.highMemoryUsage) {
        recommendations.push('High memory usage - check for memory leaks');
      }
    }
    
    return recommendations;
  }

  exportPerformanceData() {
    const report = this.getPerformanceReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-report-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  destroy() {
    this.stopMonitoring();
    const widget = document.getElementById('performance-widget');
    if (widget) {
      widget.remove();
    }
  }
}

// Initialize performance monitor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    window.performanceMonitor = new PerformanceMonitor();
  }, 2000); // Start after other components
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceMonitor;
}
