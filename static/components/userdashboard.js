window.UserDashboard = {
    template: `
        <div class="min-vh-100 bg-light">
            <!-- Header -->
            <nav class="navbar navbar-expand-lg" style="background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);">
                <div class="container-fluid px-4">
                    <a class="navbar-brand text-white fw-bold" href="#">
                        <i class="fas fa-car me-2"></i> Vehicle Parking App
                    </a>
                    <div class="navbar-nav mx-auto">
                    </div>
                    <div class="navbar-nav ms-auto">
                        <button class="btn btn-outline-light" @click="logout">
                            <i class="fas fa-sign-out-alt me-1"></i> Logout
                        </button>
                    </div>
                </div>
            </nav>

            <!-- Navigation -->
            <div class="container-fluid px-4 py-3" style="background: rgba(255,255,255,0.9); border-bottom: 1px solid rgba(0,0,0,0.1);">
                <div class="d-flex justify-content-center">
                    <div class="btn-group" role="group">
                        <button type="button" class="btn btn-primary">
                            <i class="fas fa-home me-2"></i>Dashboard
                        </button>
                        <router-link to="/bookings" class="btn btn-outline-primary">
                            <i class="fas fa-calendar-check me-2"></i>My Bookings
                        </router-link>
                        <router-link to="/analytics" class="btn btn-outline-primary">
                            <i class="fas fa-chart-line me-2"></i>Analytics
                        </router-link>
                        <router-link to="/profile" class="btn btn-outline-primary">
                            <i class="fas fa-user me-2"></i>Profile
                        </router-link>
                    </div>
                </div>
            </div>

            <!-- Main Content -->
            <div class="container mt-4">
                <!-- Available Parking Locations Section -->
                <div class="mb-5">
                    <div class="text-center mb-4">
                        <h2 class="fw-bold text-dark mb-2">
                            <i class="fas fa-parking text-primary me-2"></i>Available Parking Locations
                        </h2>
                        <p class="text-muted">Choose from {{ parkingLots.length }} available parking locations</p>
                    </div>

                    <!-- No parking lots message -->
                    <div v-if="parkingLots.length === 0" class="text-center py-3">
                        <div class="card border-0 shadow-sm">
                            <div class="card-body py-3">
                                <i class="fas fa-parking fa-2x text-muted mb-3"></i>
                                <h6 class="text-muted">No Parking Lots Available</h6>
                                <p class="text-muted">Check back later for available parking locations.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Parking lots grid -->
                    <div v-else class="row g-3 mb-4">
                        <div v-for="lot in parkingLots" :key="lot.id" class="col-lg-4 col-md-6 mb-3">
                                                    <div class="card h-100 shadow-sm">
                            <div class="card-body p-3">
                                <h6 class="card-title mb-2">{{ lot.name }}</h6>

                                    <p class="mb-2">{{ lot.address }}</p>
                                    <p class="mb-2"><strong>Rate:</strong> ₹{{ Math.round(lot.hourly_rate) }}/hour</p>

                                    <!-- Availability -->
                                    <p class="mb-3">
                                        <strong>Available:</strong> {{ lot.spots_available }} / {{ lot.total_spots }} spots
                                    </p>

                                    <button class="btn btn-primary w-100"
                                            @click="bookParking(lot.id)"
                                            :disabled="lot.spots_available === 0">
                                        {{ lot.spots_available === 0 ? 'Full' : 'Book Parking' }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            parkingLots: [],
            userName: ''
        };
    },
    methods: {
        async fetchParkingLots() {
            try {
                // Add cache-busting parameter to ensure fresh data
                const timestamp = new Date().getTime();
                const response = await fetch(`/api/parking-lots?_t=${timestamp}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        this.parkingLots = data.locations || [];
                    } else {
                        console.error('Failed to fetch parking lots:', data.message);
                    }
                }
            } catch (error) {
                console.error('Error fetching parking lots:', error);
            }
        },
        async fetchUserName() {
            try {
                const response = await fetch('/api/profile', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.profile) {
                        this.userName = data.profile.name || data.profile.username;
                    }
                }
            } catch (error) {
                console.error('Error fetching user name:', error);
            }
        },


        bookParking(lotId) {
            this.$router.push(`/book-parking/${lotId}`);
        },
        logout() {
            localStorage.removeItem('token');
            localStorage.removeItem('isAdmin');
            this.$router.push('/login');
        },

    },
    mounted() {
        this.fetchParkingLots();
        this.fetchUserName();
    },
    watch: {
        // Watch for route changes to refresh data when user comes back to dashboard
        '$route'(to, from) {
            if (to.path === '/dashboard') {
                this.fetchParkingLots();
            }
        }
    }
};
  