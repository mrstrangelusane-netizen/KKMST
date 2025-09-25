/**
 * AutoSaveManager - Handles automatic saving and restoration of form data
 * Prevents data loss when users accidentally refresh or close the browser
 */

export class AutoSaveManager {
    constructor(storageKey = 'voucher_autosave', saveInterval = 2000) {
        this.storageKey = storageKey;
        this.saveInterval = saveInterval; // Save every 2 seconds
        this.saveTimer = null;
        this.isEnabled = true;
        this.formSelectors = {
            voucherForm: '#addVoucherForm',
            searchInput: '#voucherSearchInput',
            datePicker: '#datePicker',
            technicianSelect: '#technicianSelect',
            takenStatusFilter: '#takenStatusFilter'
        };
        
        this.initialize();
    }

    /**
     * Initialize auto-save functionality
     */
    initialize() {
        this.setupEventListeners();
        this.restoreSavedData();
        this.showAutoSaveIndicator();
    }

    /**
     * Setup event listeners for form inputs
     */
    setupEventListeners() {
        // Listen for input changes on all form elements
        Object.values(this.formSelectors).forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (element) {
                    element.addEventListener('input', () => this.scheduleAutoSave());
                    element.addEventListener('change', () => this.scheduleAutoSave());
                }
            });
        });

        // Listen for form submission to clear saved data
        const voucherForm = document.querySelector(this.formSelectors.voucherForm);
        if (voucherForm) {
            voucherForm.addEventListener('submit', () => {
                this.clearSavedData();
                this.showMessage('Form submitted successfully!', false);
            });
        }

        // Listen for page unload to save data
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                this.saveFormData();
                // Show warning for unsaved changes
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        });

        // Listen for visibility change (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.saveFormData();
            }
        });
    }

    /**
     * Schedule auto-save with debouncing
     */
    scheduleAutoSave() {
        if (!this.isEnabled) return;

        // Clear existing timer
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
        }

        // Schedule new save
        this.saveTimer = setTimeout(() => {
            this.saveFormData();
        }, this.saveInterval);

        this.updateAutoSaveIndicator('saving');
    }

    /**
     * Save current form data to localStorage
     */
    saveFormData() {
        try {
            const formData = this.collectFormData();
            
            // Only save if there's actual data
            if (this.hasFormData(formData)) {
                const saveData = {
                    data: formData,
                    timestamp: new Date().toISOString(),
                    version: '1.0'
                };
                
                localStorage.setItem(this.storageKey, JSON.stringify(saveData));
                this.updateAutoSaveIndicator('saved');
                
                console.log('📝 Auto-saved form data:', formData);
            }
        } catch (error) {
            console.error('Failed to auto-save form data:', error);
            this.updateAutoSaveIndicator('error');
        }
    }

    /**
     * Collect data from all tracked form elements
     */
    collectFormData() {
        const formData = {};

        // Voucher form data
        const voucherForm = document.querySelector(this.formSelectors.voucherForm);
        if (voucherForm) {
            const inputs = voucherForm.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                if (input.name) {
                    if (input.type === 'checkbox') {
                        formData[input.name] = input.checked;
                    } else {
                        formData[input.name] = input.value;
                    }
                }
            });
        }

        // Other form elements
        Object.entries(this.formSelectors).forEach(([key, selector]) => {
            if (key !== 'voucherForm') {
                const element = document.querySelector(selector);
                if (element && element.value) {
                    formData[key] = element.value;
                }
            }
        });

        return formData;
    }

    /**
     * Check if form data exists and has meaningful content
     */
    hasFormData(formData) {
        return Object.values(formData).some(value => 
            value !== '' && value !== null && value !== undefined
        );
    }

    /**
     * Check if there are unsaved changes
     */
    hasUnsavedChanges() {
        const formData = this.collectFormData();
        return this.hasFormData(formData);
    }

    /**
     * Restore saved data from localStorage
     */
    restoreSavedData() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                const parsed = JSON.parse(savedData);
                const timeDiff = new Date() - new Date(parsed.timestamp);
                
                // Only restore if saved within last 24 hours
                if (timeDiff < 24 * 60 * 60 * 1000) {
                    this.populateFormData(parsed.data);
                    this.showRestoreNotification();
                    this.updateAutoSaveIndicator('restored');
                } else {
                    // Clear old data
                    this.clearSavedData();
                }
            }
        } catch (error) {
            console.error('Failed to restore saved data:', error);
            this.clearSavedData();
        }
    }

    /**
     * Populate form with saved data
     */
    populateFormData(formData) {
        // Restore voucher form data
        const voucherForm = document.querySelector(this.formSelectors.voucherForm);
        if (voucherForm) {
            Object.entries(formData).forEach(([name, value]) => {
                const element = voucherForm.querySelector(`[name="${name}"]`);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = value;
                    } else {
                        element.value = value;
                    }
                }
            });
        }

        // Restore other form elements
        Object.entries(this.formSelectors).forEach(([key, selector]) => {
            if (key !== 'voucherForm' && formData[key]) {
                const element = document.querySelector(selector);
                if (element) {
                    element.value = formData[key];
                }
            }
        });
    }

    /**
     * Clear saved data from localStorage
     */
    clearSavedData() {
        localStorage.removeItem(this.storageKey);
        this.updateAutoSaveIndicator('cleared');
    }

    /**
     * Show auto-save indicator
     */
    showAutoSaveIndicator() {
        // Create auto-save indicator
        let indicator = document.getElementById('autoSaveIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'autoSaveIndicator';
            indicator.className = 'fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm z-50 transition-all duration-300';
            indicator.innerHTML = `
                <div class="flex items-center space-x-2">
                    <div class="auto-save-icon w-2 h-2 rounded-full bg-gray-500"></div>
                    <span class="auto-save-text">Auto-save enabled</span>
                </div>
            `;
            document.body.appendChild(indicator);
        }

        // Add click to dismiss
        indicator.addEventListener('click', () => {
            indicator.style.display = 'none';
            setTimeout(() => {
                indicator.style.display = 'block';
            }, 3000);
        });
    }

    /**
     * Update auto-save indicator status
     */
    updateAutoSaveIndicator(status) {
        const indicator = document.getElementById('autoSaveIndicator');
        if (!indicator) return;

        const icon = indicator.querySelector('.auto-save-icon');
        const text = indicator.querySelector('.auto-save-text');

        switch (status) {
            case 'saving':
                icon.className = 'auto-save-icon w-2 h-2 rounded-full bg-yellow-500 animate-pulse';
                text.textContent = 'Saving...';
                break;
            case 'saved':
                icon.className = 'auto-save-icon w-2 h-2 rounded-full bg-green-500';
                text.textContent = 'Auto-saved';
                break;
            case 'restored':
                icon.className = 'auto-save-icon w-2 h-2 rounded-full bg-blue-500';
                text.textContent = 'Data restored';
                break;
            case 'cleared':
                icon.className = 'auto-save-icon w-2 h-2 rounded-full bg-gray-500';
                text.textContent = 'Auto-save enabled';
                break;
            case 'error':
                icon.className = 'auto-save-icon w-2 h-2 rounded-full bg-red-500';
                text.textContent = 'Save error';
                break;
        }

        // Auto-hide after 2 seconds
        setTimeout(() => {
            if (status === 'saved' || status === 'restored') {
                indicator.style.opacity = '0.7';
            }
        }, 2000);
    }

    /**
     * Show restore notification
     */
    showRestoreNotification() {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm';
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="text-sm font-medium">Form data restored</span>
                </div>
                <button class="restore-dismiss ml-2 text-white hover:text-gray-200">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Dismiss button
        const dismissBtn = notification.querySelector('.restore-dismiss');
        dismissBtn.addEventListener('click', () => {
            notification.remove();
        });

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    /**
     * Show message to user
     */
    showMessage(message, isError = false) {
        const messageBox = document.getElementById('messageBox');
        if (messageBox) {
            messageBox.textContent = message;
            messageBox.className = `text-sm font-semibold mt-2 md:mt-0 ${isError ? 'text-red-400' : 'text-green-400'}`;
            
            setTimeout(() => {
                messageBox.textContent = '';
            }, 3000);
        }
    }

    /**
     * Enable/disable auto-save
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        const indicator = document.getElementById('autoSaveIndicator');
        if (indicator) {
            indicator.style.display = enabled ? 'block' : 'none';
        }
    }

    /**
     * Get auto-save status
     */
    getStatus() {
        return {
            enabled: this.isEnabled,
            hasSavedData: !!localStorage.getItem(this.storageKey),
            saveInterval: this.saveInterval
        };
    }

    /**
     * Manual save trigger
     */
    saveNow() {
        this.saveFormData();
    }

    /**
     * Clear all saved data manually
     */
    clearAllSavedData() {
        this.clearSavedData();
        this.showMessage('Auto-saved data cleared', false);
    }
}
