/**
 * AppController - Main application controller
 * Orchestrates all modules and manages the overall application flow
 */

import { FirebaseService } from './FirebaseService.js';
import { VoucherManager } from './VoucherManager.js';
import { VirtualScrollingManager } from './VirtualScrollingManager.js';
import { AnalyticsManager } from './AnalyticsManager.js';
import { AutoSaveManager } from './AutoSaveManager.js';

export class AppController {
    constructor() {
        this.firebaseService = null;
        this.voucherManager = null;
        this.virtualScrollingManager = null;
        this.analyticsManager = null;
        this.autoSaveManager = null;
        this.currentUserId = null;
        this.isInitialized = false;
        
        // Initialize error handler
        this.errorHandler = {
            handleError: (error, context) => {
                console.error(`[${context}] Error:`, error);
                this.showMessage(`Error in ${context}: ${error.message}`, true);
            }
        };
    }

    /**
     * Initialize the entire application
     */
    async initialize() {
        try {
            this.showMessage("Application စတင်နေပါသည်...", false);
            
            // Initialize Firebase Service
            this.firebaseService = new FirebaseService();
            
            // Initialize managers
            this.voucherManager = new VoucherManager(this.firebaseService, this.errorHandler);
            this.analyticsManager = new AnalyticsManager(this.firebaseService, this.errorHandler);
            this.autoSaveManager = new AutoSaveManager();
            
            // Setup authentication
            await this.setupAuthentication();
            
            // Initialize virtual scrolling
            this.initializeVirtualScrolling();
            
            // Setup global event listeners
            this.setupGlobalEventListeners();
            
            this.isInitialized = true;
            this.showMessage("Application စတင်ပြီးပါပြီ", false);
            
        } catch (error) {
            this.errorHandler.handleError(error, 'Application initialization');
        }
    }

    /**
     * Setup Firebase authentication
     */
    async setupAuthentication() {
        const googleSignInBtn = document.getElementById('googleSignInBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const userInfo = document.getElementById('userInfo');
        const loginSection = document.getElementById('loginSection');

        // Listen for authentication state changes
        this.firebaseService.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUserId = user.uid;
                await this.onUserSignedIn(user);
            } else {
                this.onUserSignedOut();
            }
        });

        // Google sign in button
        if (googleSignInBtn) {
            googleSignInBtn.addEventListener('click', async () => {
                try {
                    console.log('🔄 Attempting Google sign-in...');
                    const result = await this.firebaseService.signInWithGoogle();
                    console.log('✅ Google sign-in successful:', result);
                } catch (error) {
                    console.error('❌ Google sign-in failed:', error);
                    this.errorHandler.handleError(error, 'Google sign-in');
                }
            });
        }

        // Logout button
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    await this.firebaseService.signOut();
                } catch (error) {
                    this.errorHandler.handleError(error, 'Sign out');
                }
            });
        }
    }

    /**
     * Handle user sign in
     */
    async onUserSignedIn(user) {
        try {
            // Update UI
            const userInfo = document.getElementById('userInfo');
            const loginSection = document.getElementById('loginSection');
            const appContent = document.getElementById('appContent');
            const userNameDisplay = document.getElementById('userName');
            const userEmailDisplay = document.getElementById('userEmail');

            if (userInfo) userInfo.classList.remove('hidden');
            if (loginSection) loginSection.classList.add('hidden');
            if (appContent) appContent.classList.remove('hidden');
            if (userNameDisplay) userNameDisplay.textContent = user.displayName || 'User';
            if (userEmailDisplay) userEmailDisplay.textContent = user.email || '';

            // Initialize managers with user ID
            console.log('🔄 Initializing voucher manager...');
            await this.voucherManager.initialize(this.currentUserId);
            console.log('✅ Voucher manager initialized');
            
            console.log('🔄 Initializing analytics manager...');
            await this.analyticsManager.initialize(this.currentUserId);
            console.log('✅ Analytics manager initialized');

            // Load initial data
            console.log('🔄 Loading initial data...');
            await this.loadInitialData();
            console.log('✅ Initial data loaded');

        } catch (error) {
            this.errorHandler.handleError(error, 'User sign-in handling');
        }
    }

    /**
     * Handle user sign out
     */
    onUserSignedOut() {
        // Update UI
        const userInfo = document.getElementById('userInfo');
        const loginSection = document.getElementById('loginSection');
        const appContent = document.getElementById('appContent');

        if (userInfo) userInfo.classList.add('hidden');
        if (loginSection) loginSection.classList.remove('hidden');
        if (appContent) appContent.classList.add('hidden');

        // Reset managers
        this.currentUserId = null;
        this.voucherManager = new VoucherManager(this.firebaseService, this.errorHandler);
        this.analyticsManager = new AnalyticsManager(this.firebaseService, this.errorHandler);
    }

    /**
     * Initialize virtual scrolling for voucher table
     */
    initializeVirtualScrolling() {
        try {
            const tableBody = document.getElementById('voucherTableBody');
            if (tableBody) {
                // Create container for virtual scrolling
                const virtualContainer = document.createElement('div');
                virtualContainer.id = 'virtualVoucherContainer';
                virtualContainer.className = 'h-96 overflow-hidden';
                
                // Replace table body with virtual container
                tableBody.parentNode.replaceChild(virtualContainer, tableBody);
                
                // Initialize virtual scrolling manager
                this.virtualScrollingManager = new VirtualScrollingManager(
                    '#virtualVoucherContainer',
                    60, // item height
                    5   // buffer size
                );

                // Set render function for voucher rows
                this.virtualScrollingManager.renderFunction = (item, voucher, index) => {
                    this.renderVoucherRow(item, voucher, index);
                };
            }
        } catch (error) {
            this.errorHandler.handleError(error, 'Virtual scrolling initialization');
        }
    }

    /**
     * Render voucher row for virtual scrolling
     */
    renderVoucherRow(item, voucher, index) {
        const takenStatus = voucher.takenByCustomer ? 
            '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900 text-green-300">Taken</span>' :
            '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900 text-red-300">Not Taken</span>';
        
        item.innerHTML = `
            <div class="flex items-center space-x-4 w-full">
                <div class="w-8 text-gray-400 text-sm">${index + 1}</div>
                <div class="flex-1 text-white font-medium">${voucher.customerName || 'Unknown'}</div>
                <div class="flex-1 text-gray-300">${voucher.phoneModel || 'Unknown'}</div>
                <div class="flex-1 text-gray-300">${voucher.phoneColor || 'Unknown'}</div>
                <div class="flex-1 text-green-400 font-semibold">${voucher.voucherNumber || 'N/A'}</div>
                <div class="flex-1 text-green-400 font-semibold">${(Number(voucher.amount) || 0).toLocaleString()} ¥</div>
                <div class="flex-1">${takenStatus}</div>
                <div class="flex-1">
                    <div class="text-sm text-gray-300 font-semibold">${voucher.technicianName || 'Unknown'}</div>
                    <div class="text-xs text-gray-400">${voucher.date || 'No Date'}</div>
                </div>
                <div class="w-20">
                    <button class="edit-voucher-btn bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs" data-id="${voucher.id}">
                        Edit
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Load initial application data
     */
    async loadInitialData() {
        try {
            // Load vouchers for current date
            const today = new Date().toISOString().split('T')[0];
            await this.loadVouchersForDate(today);
            
        } catch (error) {
            this.errorHandler.handleError(error, 'Initial data loading');
        }
    }

    /**
     * Load vouchers for a specific date
     */
    async loadVouchersForDate(date) {
        try {
            const querySnapshot = await this.firebaseService.getVouchersByDate(this.currentUserId, date);
            const vouchers = [];
            
            querySnapshot.forEach((doc) => {
                vouchers.push({ id: doc.id, ...doc.data() });
            });

            // Update virtual scrolling with new data
            if (this.virtualScrollingManager) {
                this.virtualScrollingManager.setData(vouchers, this.renderVoucherRow.bind(this));
            }

            // Update daily total
            const totalAmount = vouchers.reduce((sum, v) => sum + (Number(v.amount) || 0), 0);
            const dailyTotalDisplay = document.getElementById('dailyTotal');
            if (dailyTotalDisplay) {
                dailyTotalDisplay.textContent = `${totalAmount.toLocaleString()} ¥`;
            }

        } catch (error) {
            this.errorHandler.handleError(error, 'Loading vouchers for date');
        }
    }

    /**
     * Setup global event listeners
     */
    setupGlobalEventListeners() {
        // Date picker change
        const datePicker = document.getElementById('datePicker');
        if (datePicker) {
            datePicker.addEventListener('change', async (event) => {
                await this.loadVouchersForDate(event.target.value);
            });
        }

        // Technician selection change
        const technicianSelect = document.getElementById('technicianSelect');
        if (technicianSelect) {
            technicianSelect.addEventListener('change', () => {
                this.filterVouchersByTechnician();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardShortcuts(event);
        });

        // Window resize
        window.addEventListener('resize', () => {
            if (this.virtualScrollingManager) {
                this.virtualScrollingManager.updateContainerHeight();
            }
        });

        // Add voucher modal controls
        const addVoucherBtn = document.getElementById('addVoucherBtn');
        const cancelVoucherBtn = document.getElementById('cancelVoucherBtn');
        const clearAutoSaveBtn = document.getElementById('clearAutoSaveBtn');

        if (addVoucherBtn) {
            addVoucherBtn.addEventListener('click', () => {
                const modal = document.getElementById('addVoucherModal');
                if (modal) {
                    modal.classList.remove('hidden');
                    // Set today's date as default
                    const dateInput = document.querySelector('input[name="date"]');
                    if (dateInput) {
                        dateInput.value = new Date().toISOString().split('T')[0];
                    }
                }
            });
        }

        if (cancelVoucherBtn) {
            cancelVoucherBtn.addEventListener('click', () => {
                const modal = document.getElementById('addVoucherModal');
                if (modal) {
                    modal.classList.add('hidden');
                }
            });
        }

        if (clearAutoSaveBtn) {
            clearAutoSaveBtn.addEventListener('click', () => {
                if (this.autoSaveManager) {
                    this.autoSaveManager.clearAllSavedData();
                }
            });
        }
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(event) {
        // Ctrl+N - New voucher
        if (event.ctrlKey && event.key === 'n') {
            event.preventDefault();
            const addVoucherBtn = document.getElementById('addVoucherBtn');
            if (addVoucherBtn) addVoucherBtn.click();
        }

        // Ctrl+F - Focus search
        if (event.ctrlKey && event.key === 'f') {
            event.preventDefault();
            const searchInput = document.getElementById('voucherSearchInput');
            if (searchInput) searchInput.focus();
        }

        // Ctrl+A - Show analytics
        if (event.ctrlKey && event.key === 'a') {
            event.preventDefault();
            const analyticsBtn = document.getElementById('toggleAnalyticsBtn');
            if (analyticsBtn) analyticsBtn.click();
        }

        // Ctrl+S - Manual save
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            if (this.autoSaveManager) {
                this.autoSaveManager.saveNow();
                this.showMessage('Form data saved manually', false);
            }
        }
    }

    /**
     * Filter vouchers by technician
     */
    filterVouchersByTechnician() {
        const technicianSelect = document.getElementById('technicianSelect');
        if (!technicianSelect || !this.virtualScrollingManager) return;

        const selectedTechnician = technicianSelect.value;
        const allVouchers = this.voucherManager.allVouchersCache || [];
        
        const filteredVouchers = selectedTechnician ? 
            allVouchers.filter(v => v.technicianName === selectedTechnician) : 
            allVouchers;

        this.virtualScrollingManager.setData(filteredVouchers, this.renderVoucherRow.bind(this));
    }

    /**
     * Show message to user
     */
    showMessage(message, isError = false) {
        const messageBox = document.getElementById('messageBox');
        if (messageBox) {
            messageBox.textContent = message;
            messageBox.className = `text-sm font-semibold mt-2 md:mt-0 ${isError ? 'text-red-400' : 'text-green-400'}`;
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                messageBox.textContent = '';
            }, 5000);
        }
    }

    /**
     * Get application status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            currentUserId: this.currentUserId,
            hasVoucherManager: !!this.voucherManager,
            hasVirtualScrolling: !!this.virtualScrollingManager,
            hasAnalytics: !!this.analyticsManager,
            hasAutoSave: !!this.autoSaveManager,
            autoSaveStatus: this.autoSaveManager ? this.autoSaveManager.getStatus() : null
        };
    }
}
