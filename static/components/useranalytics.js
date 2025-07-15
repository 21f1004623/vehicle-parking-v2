window.UserAnalytics = {
    template: `
        <div class="min-vh-100" style="background: linear-gradient(135deg, #f8fafc 0%, #e3f2fd 100%);">
            <!-- Header -->
            <nav class="navbar navbar-expand-lg" style="background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); box-shadow: 0 4px 20px rgba(25, 118, 210, 0.3);">
                <div class="container-fluid px-4">
                    <span class="navbar-brand text-white fw-bold"><i class="fas fa-car me-2"></i>Vehicle Parking App</span>
                    <button class="btn btn-outline-light ms-auto" @click="logout">
                        <i class="fas fa-sign-out-alt me-1"></i>Logout
                    </button>
                </div>
            </nav>

            <!-- Navigation -->
            <div class="container-fluid px-4 py-3" style="background: rgba(255,255,255,0.9);">
                <div class="d-flex justify-content-center">
                    <div class="btn-group">
                        <router-link to="/dashboard" class="btn btn-outline-primary">
                            <i class="fas fa-home me-2"></i>Dashboard
                        </router-link>
                        <router-link to="/bookings" class="btn btn-outline-primary">
                            <i class="fas fa-calendar-check me-2"></i>Bookings
                        </router-link>
                        <button class="btn btn-primary">
                            <i class="fas fa-chart-line me-2"></i>Analytics
                        </button>
                        <router-link to="/profile" class="btn btn-outline-primary">
                            <i class="fas fa-user me-2"></i>Profile
                        </router-link>
                    </div>
                </div>
            </div>

            <div class="container py-4">
                <div class="text-center mb-4">
                    <h2 class="fw-bold text-dark"><i class="fas fa-chart-bar text-primary me-2"></i>My Analytics</h2>
                    <p class="text-muted">Your parking activity overview</p>
                </div>

                <div v-if="loading" class="text-center py-5">
                    <div class="spinner-border text-primary"></div>
                    <p class="mt-3">Loading stats...</p>
                </div>

                <div v-else>
                    <!-- Stats Cards -->
                    <div class="row mb-4">
                        <div v-for="stat in statsCards" :key="stat.title" class="col-md-3 mb-3">
                            <div class="card text-center border-0 shadow-sm text-white" :style="stat.style">
                                <div class="card-body py-3">
                                    <i :class="stat.icon + ' fa-lg mb-2'"></i>
                                    <h5 class="fw-bold">{{ stat.value }}</h5>
                                    <small class="mb-0">{{ stat.title }}</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Charts & Quick Facts -->
                    <div class="row mb-4" v-if="hasData">
                        <div class="col-lg-8 mb-4">
                            <div class="card border-0 shadow-sm">
                                <div class="card-header bg-primary text-white">
                                    <h5 class="mb-0"><i class="fas fa-chart-line me-2"></i>Spending Over Time</h5>
                                </div>
                                <div class="card-body">
                                    <canvas id="spending" height="100"></canvas>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-4 mb-4">
                            <div class="card border-0 shadow-sm">
                                <div class="card-header bg-success text-white">
                                    <h5 class="mb-0"><i class="fas fa-lightbulb me-2"></i>Quick Facts</h5>
                                </div>
                                <div class="card-body">
                                    <div v-for="fact in quickFacts" :key="fact.label" class="mb-3">
                                        <h6 class="text-muted">{{ fact.label }}</h6>
                                        <p class="fw-bold h5" :class="fact.color">{{ fact.value }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Weekly Chart -->
                    <div class="row mb-4" v-if="hasData">
                        <div class="col-12">
                            <div class="card border-0 shadow-sm">
                                <div class="card-header bg-info text-white">
                                    <h5 class="mb-0"><i class="fas fa-chart-bar me-2"></i>Weekly Usage Pattern</h5>
                                </div>
                                <div class="card-body">
                                    <canvas id="weekly" height="80"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- No Data State -->
                    <div v-if="!hasData" class="text-center py-3">
                        <div class="card border-0 shadow-sm">
                            <div class="card-body py-3">
                                <i class="fas fa-chart-line fa-2x text-muted mb-3"></i>
                                <h5 class="text-muted mb-2">No Data Yet</h5>
                                <p class="text-muted mb-3">Start parking to see your stats!</p>
                                <router-link to="/dashboard" class="btn btn-primary">
                                    <i class="fas fa-parking me-2"></i>Find Parking
                                </router-link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    data() {
        return {
            bookings: [],
            loading: true,
            charts: {}
        };
    },
    
    computed: {
        hasData() { return this.bookings.length > 0; },
        
        totalSpent() { return this.bookings.reduce((sum, b) => sum + (b.parking_cost || 0), 0); },
        
        avgDuration() {
            const completed = this.bookings.filter(b => b.leaving_timestamp);
            if (!completed.length) return 0;
            const totalHours = completed.reduce((sum, b) => {
                const start = new Date(b.parking_timestamp);
                const end = new Date(b.leaving_timestamp);
                return sum + ((end - start) / (1000 * 60 * 60));
            }, 0);
            return (totalHours / completed.length).toFixed(1);
        },
        
        favoriteLocation() {
            if (!this.hasData) return 'None';
            const locations = {};
            this.bookings.forEach(b => {
                const loc = b.parking_lot_name || 'Unknown';
                locations[loc] = (locations[loc] || 0) + 1;
            });
            const favorite = Object.keys(locations).reduce((a, b) => locations[a] > locations[b] ? a : b);
            return favorite.length > 12 ? favorite.substring(0, 12) + '...' : favorite;
        },
        
        preferredDay() {
            if (!this.hasData) return 'None';
            const days = {};
            this.bookings.forEach(b => {
                const day = new Date(b.parking_timestamp).toLocaleDateString('en', { weekday: 'long' });
                days[day] = (days[day] || 0) + 1;
            });
            return Object.keys(days).reduce((a, b) => days[a] > days[b] ? a : b);
        },
        
        thisMonthSpending() {
            const now = new Date();
            return this.bookings
                .filter(b => {
                    const date = new Date(b.parking_timestamp);
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                })
                .reduce((sum, b) => sum + (b.parking_cost || 0), 0);
        },
        
        statsCards() {
            return [
                { 
                    title: 'Total Bookings', 
                    value: this.bookings.length, 
                    icon: 'fas fa-parking', 
                    style: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);' 
                },
                { 
                    title: 'Total Spent', 
                    value: `₹${Math.round(this.totalSpent)}`, 
                    icon: 'fas fa-rupee-sign', 
                    style: 'background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);' 
                },
                { 
                    title: 'Avg Duration', 
                    value: `${this.avgDuration}h`, 
                    icon: 'fas fa-clock', 
                    style: 'background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);' 
                },
                { 
                    title: 'Favorite Spot', 
                    value: this.favoriteLocation, 
                    icon: 'fas fa-map-marker-alt', 
                    style: 'background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);' 
                }
            ];
        },
        
        quickFacts() {
            return [
                { label: 'Most Used Day', value: this.preferredDay, color: 'text-primary' },
                { label: 'This Month', value: `₹${Math.round(this.thisMonthSpending)}`, color: 'text-warning' },
                { label: 'Avg per Booking', value: `₹${this.hasData ? Math.round(this.totalSpent / this.bookings.length) : '0'}`, color: 'text-info' }
            ];
        }
    },
    
    methods: {
        async fetchBookings() {
            const token = localStorage.getItem('token');
            if (!token) return this.$router.push('/login');
            
            try {
                const response = await fetch('/api/bookings', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    // Transform API response to match expected format
                    if (data.bookings) {
                        this.bookings = data.bookings.map(booking => ({
                            id: booking.id,
                            parking_timestamp: booking.started_at,
                            leaving_timestamp: booking.ended_at,
                            parking_cost: parseFloat(booking.cost.replace('₹', '').replace(',', '')) || 0,
                            vehicle_number: booking.vehicle_number,
                            parking_lot_name: booking.location.name,
                            status: booking.status
                        }));
                    } else {
                        this.bookings = [];
                    }
                } else if (response.status === 401) {
                    localStorage.removeItem('token');
                    this.$router.push('/login');
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                this.loading = false;
            }
        },
        
        initCharts() {
            if (!this.hasData) return;
            this.destroyCharts();
            this.$nextTick(() => {
                this.createSpendingChart();
                this.createWeeklyChart();
            });
        },
        
        createSpendingChart() {
            const canvas = document.getElementById('spending');
            if (!canvas) return;
            
            const months = this.getLast6Months();
            const data = months.map(month => {
                return this.bookings
                    .filter(b => {
                        const date = new Date(b.parking_timestamp);
                        return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear();
                    })
                    .reduce((sum, b) => sum + (b.parking_cost || 0), 0);
            });
            
            this.charts.spending = new Chart(canvas, {
                type: 'line',
                data: {
                    labels: months.map(m => m.toLocaleDateString('en', { month: 'short' })),
                    datasets: [{
                        data: data,
                        borderColor: '#1976d2',
                        backgroundColor: 'rgba(25, 118, 210, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
                }
            });
        },
        
        createWeeklyChart() {
            const canvas = document.getElementById('weekly');
            if (!canvas) return;
            
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const data = days.map((_, index) => 
                this.bookings.filter(b => new Date(b.parking_timestamp).getDay() === index).length
            );
            
            this.charts.weekly = new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: days,
                    datasets: [{
                        data: data,
                        backgroundColor: '#43e97b',
                        borderColor: '#38f9d7',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } }
                }
            });
        },
        
        getLast6Months() {
            return Array.from({ length: 6 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - (5 - i));
                return date;
            });
        },
        
        destroyCharts() {
            Object.values(this.charts).forEach(chart => chart?.destroy());
            this.charts = {};
        },
        
        logout() {
            localStorage.removeItem('token');
            this.$router.push('/login');
        }
    },
    
    async mounted() {
        await this.fetchBookings();
        this.initCharts();
    },
    
    beforeDestroy() {
        this.destroyCharts();
    }
}; 