/**
 * VirtualScrollingManager - Handles virtual scrolling for large lists
 * Provides smooth scrolling performance for thousands of items
 */

export class VirtualScrollingManager {
    constructor(containerSelector, itemHeight = 60, bufferSize = 5) {
        this.container = document.querySelector(containerSelector);
        this.itemHeight = itemHeight;
        this.bufferSize = bufferSize; // Extra items to render outside viewport
        this.data = [];
        this.visibleItems = [];
        this.scrollTop = 0;
        this.containerHeight = 0;
        this.totalHeight = 0;
        this.startIndex = 0;
        this.endIndex = 0;
        this.renderFunction = null;
        
        if (!this.container) {
            throw new Error(`Container with selector "${containerSelector}" not found`);
        }
        
        this.initialize();
    }

    /**
     * Initialize virtual scrolling
     */
    initialize() {
        this.setupContainer();
        this.setupEventListeners();
        this.updateContainerHeight();
    }

    /**
     * Setup container styles for virtual scrolling
     */
    setupContainer() {
        this.container.style.position = 'relative';
        this.container.style.overflowY = 'auto';
        this.container.style.overflowX = 'hidden';
        
        // Create virtual content container
        this.virtualContent = document.createElement('div');
        this.virtualContent.style.position = 'relative';
        this.container.appendChild(this.virtualContent);
        
        // Create visible items container
        this.visibleContainer = document.createElement('div');
        this.visibleContainer.style.position = 'absolute';
        this.visibleContainer.style.top = '0';
        this.visibleContainer.style.left = '0';
        this.visibleContainer.style.width = '100%';
        this.virtualContent.appendChild(this.visibleContainer);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.container.addEventListener('scroll', () => {
            this.handleScroll();
        });
        
        window.addEventListener('resize', () => {
            this.updateContainerHeight();
            this.updateVisibleItems();
        });
    }

    /**
     * Set data and render function
     */
    setData(data, renderFunction) {
        this.data = data;
        this.renderFunction = renderFunction;
        this.totalHeight = data.length * this.itemHeight;
        this.virtualContent.style.height = `${this.totalHeight}px`;
        this.updateVisibleItems();
    }

    /**
     * Handle scroll events
     */
    handleScroll() {
        const newScrollTop = this.container.scrollTop;
        if (Math.abs(newScrollTop - this.scrollTop) > this.itemHeight / 2) {
            this.scrollTop = newScrollTop;
            this.updateVisibleItems();
        }
    }

    /**
     * Update container height
     */
    updateContainerHeight() {
        this.containerHeight = this.container.clientHeight;
    }

    /**
     * Calculate visible range
     */
    calculateVisibleRange() {
        this.startIndex = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - this.bufferSize);
        this.endIndex = Math.min(
            this.data.length - 1,
            Math.ceil((this.scrollTop + this.containerHeight) / this.itemHeight) + this.bufferSize
        );
    }

    /**
     * Update visible items
     */
    updateVisibleItems() {
        this.calculateVisibleRange();
        
        // Clear existing items
        this.visibleContainer.innerHTML = '';
        
        // Create and render visible items
        for (let i = this.startIndex; i <= this.endIndex; i++) {
            if (this.data[i]) {
                const item = this.createItem(this.data[i], i);
                this.visibleContainer.appendChild(item);
            }
        }
        
        // Update container position
        this.visibleContainer.style.transform = `translateY(${this.startIndex * this.itemHeight}px)`;
    }

    /**
     * Create a single item element
     */
    createItem(data, index) {
        const item = document.createElement('div');
        item.style.height = `${this.itemHeight}px`;
        item.style.position = 'relative';
        item.style.borderBottom = '1px solid #374151';
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.padding = '0 1rem';
        item.className = 'virtual-item hover:bg-gray-700 transition-colors duration-150';
        
        // Set data attributes for easy access
        item.dataset.index = index;
        item.dataset.voucherId = data.id || index;
        
        // Render content using provided render function
        if (this.renderFunction) {
            this.renderFunction(item, data, index);
        } else {
            // Default rendering
            item.innerHTML = `
                <div class="flex-1 text-white">${data.customerName || 'Unknown'}</div>
                <div class="flex-1 text-gray-300">${data.voucherNumber || 'N/A'}</div>
                <div class="flex-1 text-green-400">${data.amount ? Number(data.amount).toLocaleString() + ' ¥' : '0 ¥'}</div>
            `;
        }
        
        return item;
    }

    /**
     * Scroll to specific item
     */
    scrollToIndex(index) {
        if (index >= 0 && index < this.data.length) {
            const scrollTop = index * this.itemHeight;
            this.container.scrollTop = scrollTop;
        }
    }

    /**
     * Scroll to top
     */
    scrollToTop() {
        this.container.scrollTop = 0;
    }

    /**
     * Scroll to bottom
     */
    scrollToBottom() {
        this.container.scrollTop = this.totalHeight;
    }

    /**
     * Get visible items data
     */
    getVisibleItems() {
        return this.data.slice(this.startIndex, this.endIndex + 1);
    }

    /**
     * Update single item
     */
    updateItem(index, newData) {
        if (index >= 0 && index < this.data.length) {
            this.data[index] = { ...this.data[index], ...newData };
            
            // Update in DOM if visible
            const itemElement = this.visibleContainer.querySelector(`[data-index="${index}"]`);
            if (itemElement && this.renderFunction) {
                this.renderFunction(itemElement, this.data[index], index);
            }
        }
    }

    /**
     * Add new item
     */
    addItem(item, index = -1) {
        if (index === -1) {
            this.data.push(item);
        } else {
            this.data.splice(index, 0, item);
        }
        
        this.totalHeight = this.data.length * this.itemHeight;
        this.virtualContent.style.height = `${this.totalHeight}px`;
        this.updateVisibleItems();
    }

    /**
     * Remove item
     */
    removeItem(index) {
        if (index >= 0 && index < this.data.length) {
            this.data.splice(index, 1);
            this.totalHeight = this.data.length * this.itemHeight;
            this.virtualContent.style.height = `${this.totalHeight}px`;
            this.updateVisibleItems();
        }
    }

    /**
     * Clear all items
     */
    clear() {
        this.data = [];
        this.totalHeight = 0;
        this.virtualContent.style.height = '0px';
        this.visibleContainer.innerHTML = '';
    }

    /**
     * Get scroll position
     */
    getScrollPosition() {
        return {
            scrollTop: this.scrollTop,
            scrollPercentage: this.totalHeight > 0 ? (this.scrollTop / this.totalHeight) * 100 : 0
        };
    }

    /**
     * Set item height dynamically
     */
    setItemHeight(newHeight) {
        this.itemHeight = newHeight;
        this.totalHeight = this.data.length * this.itemHeight;
        this.virtualContent.style.height = `${this.totalHeight}px`;
        this.updateVisibleItems();
    }

    /**
     * Destroy virtual scrolling instance
     */
    destroy() {
        if (this.container) {
            this.container.removeEventListener('scroll', this.handleScroll);
        }
        window.removeEventListener('resize', this.updateContainerHeight);
        
        if (this.virtualContent && this.virtualContent.parentNode) {
            this.virtualContent.parentNode.removeChild(this.virtualContent);
        }
    }
}
