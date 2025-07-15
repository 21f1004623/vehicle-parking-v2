window.AdminAnalytics = {
    template: `
        <div class="container-fluid p-4">
            <!-- Header -->
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2><i class="fas fa-tachometer-alt text-primary"></i> Admin Dashboard</h2>
                <button class="btn btn-outline-danger" @click="logout">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
            </div>

            <!-- Navigation Tabs -->
            <ul class="nav nav-tabs mb-4">
                <li class="nav-item">
                    <button class="nav-link" @click="$router.push('/dashboard')">
                        <i class="fas fa-parking"></i> Parking Lot Details
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" @click="goToDashboardSection('users')">
                        <i class="fas fa-users"></i> Users
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" @click="goToDashboardSection('reservations')">
                        <i class="fas fa-calendar-check"></i> Reservations
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link active">
                        <i class="fas fa-chart-bar"></i> Analytics & Charts
                    </button>
                </li>
            </ul>

            <div v-if="error" class="alert alert-danger">
                {{ error }} <button class="btn btn-sm btn-outline-danger ms-2" @click="loadData">Retry</button>
            </div>

            <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary"></div>
                <p class="mt-3">Loading...</p>
            </div>

            <div v-else>
                <!-- Stats Cards -->
                <div class="row mb-4">
                    <div v-for="stat in statsCards" :key="stat.title" class="col-md-3 mb-3">
                        <div class="card text-white" :class="stat.color">
                            <div class="card-body text-center py-3">
                                <i :class="stat.icon + ' fa-lg mb-2'"></i>
                                <h6>{{ stat.title }}</h6>
                                <h5>{{ stat.value }}</h5>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Charts -->
                <div class="row">
                    <div v-for="chart in charts" :key="chart.id" class="col-lg-6 mb-4">
                        <div class="card shadow-sm">
                            <div class="card-header text-white" :class="chart.color">
                                <h5 class="mb-0"><i :class="chart.icon"></i> {{ chart.title }}</h5>
                            </div>
                            <div class="card-body">
                                <canvas :id="chart.id" height="200"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    data() {
        return {
            loading: false,
            error: null,
            data: { lots: [], users: [], bookings: [] },
            chartInstances: {}
        };
    },
    
    computed: {
        stats() {
            return {
                revenue: this.data.bookings.reduce((sum, b) => sum + (b.parking_cost || 0), 0),
                bookings: this.data.bookings.length,
                users: this.data.users.length,
                active: this.data.bookings.filter(b => b.status === 'active').length
            };
        },
        
        statsCards() {
            return [
                { title: 'Revenue', value: `₹${Math.round(this.stats.revenue)}`, icon: 'fas fa-rupee-sign', color: 'bg-primary' },
                { title: 'Bookings', value: this.stats.bookings, icon: 'fas fa-ticket-alt', color: 'bg-success' },
                { title: 'Users', value: this.stats.users, icon: 'fas fa-users', color: 'bg-info' },
                { title: 'Active', value: this.stats.active, icon: 'fas fa-clock', color: 'bg-warning' }
            ];
        },
        
        charts() {
            return [
                { id: 'revenue', title: 'Revenue Trend', icon: 'fas fa-chart-line', color: 'bg-primary' },
                { id: 'status', title: 'Booking Status', icon: 'fas fa-chart-pie', color: 'bg-success' },
                { id: 'utilization', title: 'Lot Utilization', icon: 'fas fa-chart-doughnut', color: 'bg-info' },
                { id: 'daily', title: 'Daily Bookings', icon: 'fas fa-chart-bar', color: 'bg-warning' }
            ];
        }
    },
    
    methods: {
        async loadData() {
            this.loading = true;
            this.error = null;
            
            const token = localStorage.getItem('token');
            if (!token) return this.$router.push('/login');
            
            try {
                const endpoints = ['parking-lots', 'users', 'reservations'];
                const responses = await Promise.all(
                    endpoints.map(ep => fetch(`/api/admin/${ep}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }))
                );
                
                if (responses.every(r => r.ok)) {
                    const [lotsResponse, usersResponse, bookingsResponse] = await Promise.all(responses.map(r => r.json()));
                    this.data = { 
                        lots: lotsResponse.lots || [], 
                        users: usersResponse.users || [], 
                        bookings: bookingsResponse.reservations || [] 
                    };
                } else {
                    this.error = 'Failed to load data';
                }
            } catch (e) {
                this.error = 'Network error';
            } finally {
                this.loading = false;
            }
        },
        
        initCharts() {
            this.destroyCharts();
            this.$nextTick(() => {
                this.createChart('revenue', 'line', this.getRevenueData(), '#4F46E5');
                this.createChart('status', 'doughnut', this.getStatusData(), ['#10B981', '#6B7280']);
                this.createChart('utilization', 'pie', this.getUtilizationData(), ['#EF4444', '#10B981']);
                this.createChart('daily', 'bar', this.getDailyData(), '#F59E0B');
            });
        },
        
        createChart(id, type, data, colors) {
            const canvas = document.getElementById(id);
            if (!canvas) return;
            
            this.chartInstances[id] = new Chart(canvas, {
                type,
                data: {
                    labels: data.labels,
                    datasets: [{
                        data: data.values,
                        backgroundColor: Array.isArray(colors) ? colors : colors,
                        borderColor: Array.isArray(colors) ? colors : colors,
                        fill: type === 'line',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: type !== 'line', position: 'bottom' } }
                }
            });
        },
        
        getRevenueData() {
            const days = this.getLast7Days();
            return {
                labels: days.map(d => d.toLocaleDateString('en', { month: 'short', day: 'numeric' })),
                values: days.map(day => 
                    this.data.bookings
                        .filter(b => new Date(b.parking_timestamp).toDateString() === day.toDateString() && b.parking_cost)
                        .reduce((sum, b) => sum + b.parking_cost, 0)
                )
            };
        },
        
        getStatusData() {
            return {
                labels: ['Active', 'Completed'],
                values: [this.stats.active, this.stats.bookings - this.stats.active]
            };
        },
        
        getUtilizationData() {
            const total = this.data.lots.reduce((sum, lot) => sum + lot.number_of_spots, 0);
            const occupied = this.data.lots.reduce((sum, lot) => sum + (lot.number_of_spots - lot.available_spots), 0);
            return {
                labels: ['Occupied', 'Available'],
                values: [occupied, total - occupied]
            };
        },
        
        getDailyData() {
            const days = this.getLast7Days();
            return {
                labels: days.map(d => d.toLocaleDateString('en', { weekday: 'short' })),
                values: days.map(day => 
                    this.data.bookings.filter(b => 
                        new Date(b.parking_timestamp).toDateString() === day.toDateString()
                    ).length
                )
            };
        },
        
        getLast7Days() {
            return Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (6 - i));
                return date;
            });
        },
        
        destroyCharts() {
            Object.values(this.chartInstances).forEach(chart => chart?.destroy());
            this.chartInstances = {};
        },
        
        goToDashboardSection(section) {
            // Navigate to dashboard with specific section
            this.$router.push({ path: '/dashboard', query: { section } });
        },

        logout() {
            localStorage.removeItem('token');
            this.$router.push('/login');
        }
    },
    
    async mounted() {
        await this.loadData();
        this.initCharts();
    },
    
    beforeDestroy() {
        this.destroyCharts();
    }
}; 