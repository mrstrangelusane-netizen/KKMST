/**
 * AnalyticsManager - Handles analytics, reporting, and data visualization
 * Provides insights into voucher data, technician performance, and business metrics
 */

export class AnalyticsManager {
    constructor(firebaseService, errorHandler) {
        this.firebaseService = firebaseService;
        this.errorHandler = errorHandler;
        this.charts = {};
        this.analyticsData = {
            vouchers: [],
            technicians: [],
            dailyTotals: {},
            monthlyTotals: {}
        };
    }

    /**
     * Initialize analytics manager
     */
    async initialize(userId) {
        this.currentUserId = userId;
        await this.loadAnalyticsData();
        this.setupEventListeners();
    }

    /**
     * Setup event listeners for analytics
     */
    setupEventListeners() {
        const toggleAnalyticsBtn = document.getElementById('toggleAnalyticsBtn');
        const analyticsSection = document.getElementById('analyticsSection');

        if (toggleAnalyticsBtn) {
            toggleAnalyticsBtn.addEventListener('click', () => {
                this.toggleAnalytics();
            });
        }
    }

    /**
     * Load analytics data
     */
    async loadAnalyticsData() {
        try {
            this.showMessage("Analytics ဒေတာ ရယူနေပါသည်...", false);
            
            // Get all vouchers for analytics
            const vouchersCollection = this.firebaseService.collection(`artifacts/${this.firebaseService.appId}/users/${this.currentUserId}/vouchers`);
            const querySnapshot = await this.firebaseService.getDocs(vouchersCollection);
            
            this.analyticsData.vouchers = [];
            querySnapshot.forEach((doc) => {
                this.analyticsData.vouchers.push({ id: doc.id, ...doc.data() });
            });

            // Calculate analytics
            this.calculateRevenueSummaries();
            this.createCharts();
            
            this.showMessage("Analytics ဒေတာ ပြင်ဆင်ပြီးပါပြီ", false);
        } catch (error) {
            this.errorHandler.handleError(error, 'Failed to load analytics data');
        }
    }

    /**
     * Calculate revenue summaries
     */
    calculateRevenueSummaries() {
        const vouchers = this.analyticsData.vouchers;
        
        // Daily totals
        this.analyticsData.dailyTotals = {};
        vouchers.forEach(voucher => {
            const date = voucher.date;
            if (!this.analyticsData.dailyTotals[date]) {
                this.analyticsData.dailyTotals[date] = {
                    count: 0,
                    total: 0,
                    technicians: new Set()
                };
            }
            
            this.analyticsData.dailyTotals[date].count++;
            this.analyticsData.dailyTotals[date].total += Number(voucher.amount) || 0;
            if (voucher.technicianName) {
                this.analyticsData.dailyTotals[date].technicians.add(voucher.technicianName);
            }
        });

        // Monthly totals
        this.analyticsData.monthlyTotals = {};
        Object.keys(this.analyticsData.dailyTotals).forEach(date => {
            const month = date.substring(0, 7); // YYYY-MM
            if (!this.analyticsData.monthlyTotals[month]) {
                this.analyticsData.monthlyTotals[month] = {
                    count: 0,
                    total: 0,
                    days: new Set()
                };
            }
            
            const dailyData = this.analyticsData.dailyTotals[date];
            this.analyticsData.monthlyTotals[month].count += dailyData.count;
            this.analyticsData.monthlyTotals[month].total += dailyData.total;
            this.analyticsData.monthlyTotals[month].days.add(date);
        });

        // Technician performance
        this.analyticsData.technicianPerformance = {};
        vouchers.forEach(voucher => {
            if (voucher.technicianName) {
                if (!this.analyticsData.technicianPerformance[voucher.technicianName]) {
                    this.analyticsData.technicianPerformance[voucher.technicianName] = {
                        voucherCount: 0,
                        totalAmount: 0,
                        averageAmount: 0,
                        dates: new Set()
                    };
                }
                
                const techData = this.analyticsData.technicianPerformance[voucher.technicianName];
                techData.voucherCount++;
                techData.totalAmount += Number(voucher.amount) || 0;
                techData.averageAmount = techData.totalAmount / techData.voucherCount;
                if (voucher.date) {
                    techData.dates.add(voucher.date);
                }
            }
        });
    }

    /**
     * Create charts
     */
    createCharts() {
        this.createRevenueChart();
        this.createTechnicianChart();
        this.createDailyChart();
    }

    /**
     * Create revenue chart
     */
    createRevenueChart() {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;

        const monthlyData = this.getMonthlyRevenueData();
        
        if (this.charts.revenue) {
            this.charts.revenue.destroy();
        }

        this.charts.revenue = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthlyData.labels,
                datasets: [{
                    label: 'Monthly Revenue (¥)',
                    data: monthlyData.data,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#ffffff',
                            callback: function(value) {
                                return value.toLocaleString() + ' ¥';
                            }
                        },
                        grid: {
                            color: '#374151'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#ffffff'
                        },
                        grid: {
                            color: '#374151'
                        }
                    }
                }
            }
        });
    }

    /**
     * Create technician performance chart
     */
    createTechnicianChart() {
        const ctx = document.getElementById('technicianChart');
        if (!ctx) return;

        const technicianData = this.getTechnicianPerformanceData();
        
        if (this.charts.technician) {
            this.charts.technician.destroy();
        }

        this.charts.technician = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: technicianData.labels,
                datasets: [{
                    label: 'Total Revenue (¥)',
                    data: technicianData.data,
                    backgroundColor: [
                        '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444',
                        '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#ffffff',
                            callback: function(value) {
                                return value.toLocaleString() + ' ¥';
                            }
                        },
                        grid: {
                            color: '#374151'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#ffffff'
                        },
                        grid: {
                            color: '#374151'
                        }
                    }
                }
            }
        });
    }

    /**
     * Create daily activity chart
     */
    createDailyChart() {
        const ctx = document.getElementById('dailyChart');
        if (!ctx) return;

        const dailyData = this.getDailyActivityData();
        
        if (this.charts.daily) {
            this.charts.daily.destroy();
        }

        this.charts.daily = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: dailyData.labels,
                datasets: [{
                    data: dailyData.data,
                    backgroundColor: [
                        '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#ffffff'
                        }
                    }
                }
            }
        });
    }

    /**
     * Get monthly revenue data for chart
     */
    getMonthlyRevenueData() {
        const monthlyData = Object.entries(this.analyticsData.monthlyTotals)
            .sort(([a], [b]) => a.localeCompare(b));
        
        return {
            labels: monthlyData.map(([month]) => month),
            data: monthlyData.map(([, data]) => data.total)
        };
    }

    /**
     * Get technician performance data for chart
     */
    getTechnicianPerformanceData() {
        const technicianData = Object.entries(this.analyticsData.technicianPerformance)
            .sort(([, a], [, b]) => b.totalAmount - a.totalAmount);
        
        return {
            labels: technicianData.map(([name]) => name),
            data: technicianData.map(([, data]) => data.totalAmount)
        };
    }

    /**
     * Get daily activity data for chart
     */
    getDailyActivityData() {
        const vouchers = this.analyticsData.vouchers;
        const takenCount = vouchers.filter(v => v.takenByCustomer).length;
        const notTakenCount = vouchers.length - takenCount;
        
        return {
            labels: ['Taken by Customer', 'Not Taken Yet'],
            data: [takenCount, notTakenCount]
        };
    }

    /**
     * Toggle analytics section visibility
     */
    toggleAnalytics() {
        const analyticsSection = document.getElementById('analyticsSection');
        const toggleBtn = document.getElementById('toggleAnalyticsBtn');
        
        if (analyticsSection && toggleBtn) {
            const isHidden = analyticsSection.classList.contains('hidden');
            
            if (isHidden) {
                analyticsSection.classList.remove('hidden');
                toggleBtn.textContent = 'Hide Analytics';
                // Resize charts when shown
                setTimeout(() => {
                    Object.values(this.charts).forEach(chart => {
                        if (chart && chart.resize) {
                            chart.resize();
                        }
                    });
                }, 100);
            } else {
                analyticsSection.classList.add('hidden');
                toggleBtn.textContent = 'Show Analytics';
            }
        }
    }

    /**
     * Export analytics data
     */
    exportAnalytics() {
        const data = {
            summary: {
                totalVouchers: this.analyticsData.vouchers.length,
                totalRevenue: this.analyticsData.vouchers.reduce((sum, v) => sum + (Number(v.amount) || 0), 0),
                averageVoucherValue: this.getAverageVoucherValue(),
                topTechnician: this.getTopTechnician(),
                dateRange: this.getDateRange()
            },
            dailyTotals: this.analyticsData.dailyTotals,
            monthlyTotals: this.analyticsData.monthlyTotals,
            technicianPerformance: this.analyticsData.technicianPerformance,
            generatedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Get average voucher value
     */
    getAverageVoucherValue() {
        const vouchers = this.analyticsData.vouchers;
        if (vouchers.length === 0) return 0;
        
        const total = vouchers.reduce((sum, v) => sum + (Number(v.amount) || 0), 0);
        return total / vouchers.length;
    }

    /**
     * Get top performing technician
     */
    getTopTechnician() {
        const performance = this.analyticsData.technicianPerformance;
        if (Object.keys(performance).length === 0) return null;
        
        return Object.entries(performance)
            .sort(([, a], [, b]) => b.totalAmount - a.totalAmount)[0][0];
    }

    /**
     * Get date range of data
     */
    getDateRange() {
        const vouchers = this.analyticsData.vouchers;
        if (vouchers.length === 0) return { start: null, end: null };
        
        const dates = vouchers.map(v => v.date).filter(Boolean).sort();
        return {
            start: dates[0],
            end: dates[dates.length - 1]
        };
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
