/**
 * VoucherManager - Handles all voucher-related operations
 * Manages voucher CRUD operations, search, and display
 */

export class VoucherManager {
    constructor(firebaseService, errorHandler) {
        this.firebaseService = firebaseService;
        this.errorHandler = errorHandler;
        this.voucherCache = new Map();
        this.searchDebounceTimer = null;
        this.allVouchersCache = null;
        this.searchResults = [];
        this.isSearchMode = false;
        this.currentUserId = null;
    }

    /**
     * Initialize the voucher manager
     */
    async initialize(userId) {
        this.currentUserId = userId;
        await this.setupEventListeners();
    }

    /**
     * Setup all event listeners for voucher operations
     */
    async setupEventListeners() {
        const voucherSearchInput = document.getElementById('voucherSearchInput');
        const addVoucherForm = document.getElementById('addVoucherForm');
        const takenStatusFilter = document.getElementById('takenStatusFilter');

        // Search input with debouncing
        if (voucherSearchInput) {
            voucherSearchInput.addEventListener('input', (e) => {
                this.handleSearchInput(e);
            });

            voucherSearchInput.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (this.searchDebounceTimer) {
                        clearTimeout(this.searchDebounceTimer);
                    }
                    await this.performVoucherSearch();
                }
            });
        }

        // Add voucher form
        if (addVoucherForm) {
            addVoucherForm.addEventListener('submit', async (event) => {
                await this.handleAddVoucher(event);
            });
        }

        // Taken status filter
        if (takenStatusFilter) {
            takenStatusFilter.addEventListener('change', () => {
                this.filterVouchersByTakenStatus();
            });
        }
    }

    /**
     * Handle search input with debouncing
     */
    handleSearchInput(e) {
        const voucherSearchQuery = e.target.value.trim();
        
        // Clear previous debounce timer
        if (this.searchDebounceTimer) {
            clearTimeout(this.searchDebounceTimer);
        }
        
        if (!voucherSearchQuery) {
            // Clear search mode when input is empty
            this.isSearchMode = false;
            this.searchResults = [];
            this.renderDailyVouchers();
        } else {
            // Debounce search - wait 300ms after user stops typing
            this.searchDebounceTimer = setTimeout(async () => {
                await this.performVoucherSearch();
            }, 300);
        }
    }

    /**
     * Load all vouchers into cache (called once)
     */
    async loadAllVouchersCache() {
        if (this.allVouchersCache !== null) {
            return; // Already cached
        }

        try {
            this.showMessage("Voucher ဒေတာ မှတ်သားနေပါသည်...", false);
            
            const vouchersCollection = this.firebaseService.collection(`artifacts/${this.firebaseService.appId}/users/${this.currentUserId}/vouchers`);
            const querySnapshot = await this.firebaseService.getDocs(vouchersCollection);
            
            this.allVouchersCache = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                this.allVouchersCache.push({ id: doc.id, ...data });
            });
            
            this.showMessage("Voucher ဒေတာ ပြင်ဆင်ပြီးပါပြီ", false);
        } catch (error) {
            this.errorHandler.handleError(error, 'Failed to load voucher cache');
            this.allVouchersCache = [];
        }
    }

    /**
     * Perform fast voucher search using cached data
     */
    async performVoucherSearch() {
        const voucherSearchInput = document.getElementById('voucherSearchInput');
        const voucherSearchQuery = voucherSearchInput ? voucherSearchInput.value.trim() : '';
        
        if (!voucherSearchQuery || !this.currentUserId) {
            return;
        }

        try {
            // Load cache if not already loaded
            if (this.allVouchersCache === null) {
                await this.loadAllVouchersCache();
            }
            
            // Show loading indicator
            this.showMessage("Voucher ရှာနေပါသည်...", false);
            
            const searchQuery = voucherSearchQuery.toLowerCase();
            this.searchResults = [];
            
            // Fast client-side search through cached data
            for (let i = 0; i < this.allVouchersCache.length; i++) {
                const voucher = this.allVouchersCache[i];
                const voucherNumber = (voucher.voucherNumber || '').toString().toLowerCase();
                
                if (voucherNumber.includes(searchQuery)) {
                    this.searchResults.push(voucher);
                    
                    // Limit results for better performance (show first 100 matches)
                    if (this.searchResults.length >= 100) {
                        break;
                    }
                }
            }

            if (this.searchResults.length === 0) {
                this.showMessage(`Voucher Number "${voucherSearchQuery}" ကို မတွေ့ပါ`, true);
                this.isSearchMode = false;
            } else {
                this.isSearchMode = true;
                const message = this.searchResults.length >= 100 ? 
                    `100+ ခု Voucher တွေ့ပါသည် (ပထမ 100 ခုသာြသပါသည်)` :
                    `${this.searchResults.length} ခု Voucher တွေ့ပါသည်`;
                this.showMessage(message, false);
                this.displaySearchResults();
            }
        } catch (error) {
            this.errorHandler.handleError(error, 'Failed to search vouchers');
        }
    }

    /**
     * Display search results in the table
     */
    displaySearchResults() {
        const voucherTableBody = document.getElementById('voucherTableBody');
        const dailyTotalDisplay = document.getElementById('dailyTotal');
        const actionHeader = document.getElementById('actionHeader');
        
        if (actionHeader) {
            actionHeader.textContent = 'Technician & Date';
        }
        
        if (voucherTableBody) {
            voucherTableBody.innerHTML = '';
            
            if (this.searchResults.length === 0) {
                voucherTableBody.innerHTML = '<tr><td colspan="9" class="py-3 text-center text-gray-400">ရှာဖွေမှုရလဒ် မရှိပါ</td></tr>';
                return;
            }

            this.searchResults.forEach((voucher, index) => {
                const row = this.createVoucherRow(voucher, index);
                voucherTableBody.appendChild(row);
            });
        }

        // Update daily total to show search results total
        if (dailyTotalDisplay) {
            const totalAmount = this.searchResults.reduce((sum, v) => sum + (Number(v.amount) || 0), 0);
            dailyTotalDisplay.textContent = `Search Total: ${totalAmount.toLocaleString()} ¥`;
        }
    }

    /**
     * Create a voucher row element
     */
    createVoucherRow(voucher, index) {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-700 hover:bg-gray-700 transition-colors duration-150';
        
        // Determine taken status
        const takenStatus = voucher.takenByCustomer ? 
            '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900 text-green-300">Taken</span>' :
            '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900 text-red-300">Not Taken</span>';
        
        row.innerHTML = `
            <td class="py-3 px-6 text-left whitespace-nowrap">${index + 1}</td>
            <td class="py-3 px-6 text-left whitespace-nowrap">${voucher.customerName || 'Unknown'}</td>
            <td class="py-3 px-6 text-left whitespace-nowrap">${voucher.phoneModel || 'Unknown'}</td>
            <td class="py-3 px-6 text-left whitespace-nowrap">${voucher.phoneColor || 'Unknown'}</td>
            <td class="py-3 px-6 text-left whitespace-nowrap font-semibold text-green-400">${voucher.voucherNumber || 'N/A'}</td>
            <td class="py-3 px-6 text-left whitespace-nowrap">${(Number(voucher.amount) || 0).toLocaleString()} ¥</td>
            <td class="py-3 px-6 text-left whitespace-nowrap">${takenStatus}</td>
            <td class="py-3 px-6 text-left">
                <span class="text-sm text-gray-300 font-semibold">${voucher.technicianName || 'Unknown'}</span>
                <br>
                <span class="text-xs text-gray-400">${voucher.date || 'No Date'}</span>
            </td>
        `;
        
        return row;
    }

    /**
     * Handle adding a new voucher
     */
    async handleAddVoucher(event) {
        event.preventDefault();
        
        if (!this.currentUserId) {
            this.showMessage("ကျေးဇူးပြု၍ အကောင့်ဝင်ပါ", true);
            return;
        }

        try {
            const formData = new FormData(event.target);
            const voucherData = {
                customerName: formData.get('customerName'),
                phoneModel: formData.get('phoneModel'),
                phoneColor: formData.get('phoneColor'),
                voucherNumber: formData.get('voucherNumber'),
                amount: formData.get('amount'),
                date: formData.get('date'),
                technicianName: formData.get('technicianName'),
                takenByCustomer: formData.get('takenByCustomer') === 'on',
                timestamp: new Date()
            };

            const vouchersCollection = this.firebaseService.collection(`artifacts/${this.firebaseService.appId}/users/${this.currentUserId}/vouchers`);
            await this.firebaseService.addDoc(vouchersCollection, voucherData);
            
            // Invalidate cache so search includes new voucher
            this.invalidateVoucherCache();
            
            this.showMessage("Voucher ထည့်သွင်းပြီးပါပြီ။");
            
            // Clear form
            event.target.reset();
            
        } catch (error) {
            this.errorHandler.handleError(error, 'Failed to add voucher');
        }
    }

    /**
     * Filter vouchers by taken status
     */
    filterVouchersByTakenStatus() {
        const takenStatusFilter = document.getElementById('takenStatusFilter');
        if (!takenStatusFilter) return;

        const filterValue = takenStatusFilter.value;
        // Implementation for filtering vouchers by taken status
        this.renderDailyVouchers();
    }

    /**
     * Render daily vouchers (placeholder - will be implemented with virtual scrolling)
     */
    renderDailyVouchers() {
        // If in search mode, don't render daily vouchers
        if (this.isSearchMode) {
            return;
        }
        
        // Implementation will be added with virtual scrolling
        console.log('Rendering daily vouchers...');
    }

    /**
     * Invalidate voucher cache
     */
    invalidateVoucherCache() {
        this.allVouchersCache = null;
        this.voucherCache.clear();
    }

    /**
     * Show message to user
     */
    showMessage(message, isError = false) {
        const messageBox = document.getElementById('messageBox');
        if (messageBox) {
            messageBox.textContent = message;
            messageBox.className = `text-sm font-semibold mt-2 md:mt-0 ${isError ? 'text-red-400' : 'text-green-400'}`;
        }
    }
}
