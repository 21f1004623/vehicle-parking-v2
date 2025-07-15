window.UserBookings = {
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
                        <router-link to="/dashboard" class="btn btn-outline-primary">
                            <i class="fas fa-home me-2"></i>Dashboard
                        </router-link>
                        <button type="button" class="btn btn-primary">
                            <i class="fas fa-calendar-check me-2"></i>My Bookings
                        </button>
                        <router-link to="/analytics" class="btn btn-outline-primary">
                            <i class="fas fa-chart-line me-2"></i>Analytics
                        </router-link>
                        <router-link to="/profile" class="btn btn-outline-primary">
                            <i class="fas fa-user me-2"></i>Profile
                        </router-link>
                    </div>
                </div>
            </div>

            <div class="container py-4">
                <!-- Page Title -->
                <div class="text-center mb-4">
                    <h2 class="fw-bold text-dark mb-2">My Parking Bookings</h2>
                    <p class="text-muted">Track your active reservations and booking history</p>
                    
                    <!-- Export Button -->
                    <div class="mt-3">
                        <button class="btn btn-success" @click="exportToCSV">
                            <i class="fas fa-download me-2"></i>Export My History to CSV
                        </button>
                    </div>
                    

                </div>
                
                <!-- Active Bookings Section -->
                <div class="mb-5">
                    <div class="d-flex align-items-center mb-3">
                        <span class="badge bg-success me-3">
                            <i class="fas fa-clock me-1"></i> Active
                        </span>
                        <h4 class="mb-0">Current Bookings</h4>
                    </div>
                    
                    <div v-if="activeBookings.length === 0" class="text-center py-3">
                        <div class="card border-0 shadow-sm">
                            <div class="card-body py-3">
                                <i class="fas fa-calendar-plus fa-2x text-muted mb-2"></i>
                                <h6 class="text-muted">No Active Bookings</h6>
                                <p class="text-muted">You don't have any active parking reservations at the moment.</p>
                                <router-link to="/dashboard" class="btn btn-primary btn-sm">
                                    <i class="fas fa-plus me-1"></i>Book Parking
                                </router-link>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div v-for="booking in activeBookings" :key="booking.id" class="col-md-6 col-lg-4 mb-3">
                                                    <div class="card h-100 shadow-sm">
                            <div class="card-header bg-success text-white py-2">
                                <h6 class="card-title mb-0 fw-bold">{{ booking.parking_lot.prime_location_name }}</h6>
                            </div>
                            <div class="card-body p-3">
                                    <div class="mb-2">
                                        <small class="text-muted fw-bold">ADDRESS</small>
                                        <p class="mb-0">{{ booking.parking_lot.address }}</p>
                                    </div>
                                    
                                    <div class="mb-2">
                                        <small class="text-muted fw-bold">VEHICLE</small>
                                        <p class="mb-0 fw-bold">{{ booking.vehicle_number }}</p>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <small class="text-muted fw-bold">CHECK-IN</small>
                                        <p class="mb-0">{{ formatDate(booking.parking_timestamp) }}</p>
                                    </div>
                                    
                                    <button class="btn btn-warning w-100" @click="endBooking(booking.id)">
                                        <i class="fas fa-stop-circle me-1"></i>End Booking
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Booking History Section -->
                <div>
                    <div class="d-flex align-items-center mb-3">
                        <span class="badge bg-info me-3">
                            <i class="fas fa-history me-1"></i> History
                        </span>
                        <h4 class="mb-0">Past Bookings</h4>
                    </div>
                    
                    <div v-if="bookingHistory.length === 0" class="text-center py-3">
                        <div class="card border-0 shadow-sm">
                            <div class="card-body py-3">
                                <i class="fas fa-history fa-2x text-muted mb-2"></i>
                                <h6 class="text-muted">No Booking History</h6>
                                <p class="text-muted">Your completed bookings will appear here.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div v-else class="table-responsive">
                        <table class="table table-hover table-striped">
                            <thead class="table-dark">
                                <tr>
                                    <th scope="col"><i class="fas fa-map-marker-alt me-2"></i>Location</th>
                                    <th scope="col"><i class="fas fa-home me-2"></i>Address</th>
                                    <th scope="col"><i class="fas fa-car me-2"></i>Vehicle</th>
                                    <th scope="col"><i class="fas fa-clock me-2"></i>Check-in</th>
                                    <th scope="col"><i class="fas fa-clock me-2"></i>Check-out</th>
                                    <th scope="col"><i class="fas fa-rupee-sign me-2"></i>Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="booking in bookingHistory" :key="booking.id">
                                    <td class="fw-bold">{{ booking.parking_lot.prime_location_name }}</td>
                                    <td class="text-muted">{{ booking.parking_lot.address }}</td>
                                    <td><span class="badge bg-primary">{{ booking.vehicle_number }}</span></td>
                                    <td>{{ formatDate(booking.parking_timestamp) }}</td>
                                    <td>{{ formatDate(booking.leaving_timestamp) }}</td>
                                    <td><span class="badge bg-success">₹{{ Math.round(booking.parking_cost) }}</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            activeBookings: [],
            bookingHistory: [],
            userName: ''
        };
    },
    methods: {
        async fetchBookings() {
            try {
                const response = await fetch('/api/bookings', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.bookings) {
                        // Transform API response and separate active/completed bookings
                        const transformedBookings = data.bookings.map(booking => ({
                            id: booking.id,
                            parking_timestamp: booking.started_at,
                            leaving_timestamp: booking.ended_at,
                            parking_cost: parseFloat(booking.cost.replace(/[₹,]/g, '')) || 0,
                            vehicle_number: booking.vehicle_number,
                            parking_lot: {
                                prime_location_name: booking.location.name,
                                address: booking.location.address
                            },
                            status: booking.status
                        }));
                        
                        this.activeBookings = transformedBookings.filter(booking => booking.status === 'active');
                        this.bookingHistory = transformedBookings.filter(booking => booking.status === 'completed');
                    }
                }
            } catch (error) {
                console.error('Error fetching bookings:', error);
            }
        },
        async endBooking(bookingId) {
            if (confirm('Are you sure you want to end this booking?')) {
                try {
                    const response = await fetch(`/api/reservations/${bookingId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });
                    if (response.ok) {
                        const result = await response.json();
                        const cost = result.bill_summary ? result.bill_summary.total_cost : 'N/A';
                        alert(`Booking ended. Total cost: ${cost}`);
                        this.fetchBookings();
                    } else {
                        const error = await response.json();
                        alert(error.message || 'Failed to end booking');
                    }
                } catch (error) {
                    console.error('Error ending booking:', error);
                    alert('Failed to end booking');
                }
            }
        },
        formatDate(dateString) {
            return new Date(dateString).toLocaleString();
        },
        logout() {
            localStorage.removeItem('token');
            localStorage.removeItem('isAdmin');
            this.$router.push('/login');
        },
        async fetchUserName() {
            try {
                const response = await fetch('/api/profile', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (response.ok) {
                    const profile = await response.json();
                    this.userName = profile.name || profile.username;
                }
            } catch (error) {
                console.error('Error fetching user name:', error);
            }
        },

        async exportToCSV() {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/user/export-csv', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `my_parking_history_${new Date().toISOString().slice(0,19).replace(/[:.]/g, '-')}.csv`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                } else {
                    alert('Failed to export CSV. Please try again.');
                }
            } catch (error) {
                alert('Error exporting CSV. Please try again.');
            }
        }
    },
    mounted() {
        this.fetchBookings();
        this.fetchUserName();
    }
}; 