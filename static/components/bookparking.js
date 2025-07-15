window.BookParking = {
    template: `
        <div class="min-vh-100 bg-light">
            <!-- Header -->
            <nav class="navbar navbar-expand-lg" style="background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);">
                <div class="container-fluid px-4">
                    <a class="navbar-brand text-white fw-bold" href="#">
                        <i class="fas fa-car me-2"></i> Vehicle Parking App
                    </a>
                    <div class="navbar-nav mx-auto">
                        <span class="navbar-text text-white">
                            <i class="fas fa-ticket-alt me-2"></i> Book Parking
                        </span>
                    </div>
                    <div class="navbar-nav ms-auto">
                        <router-link class="btn btn-outline-light me-2" to="/dashboard">
                            <i class="fas fa-arrow-left me-1"></i> Back
                        </router-link>
                        <button class="btn btn-outline-light" @click="logout">
                            <i class="fas fa-sign-out-alt me-1"></i> Logout
                        </button>
                    </div>
                </div>
            </nav>

            <div class="container py-4">
                <div class="row justify-content-center">
                    <div class="col-md-8">
                        <div class="card border-0 shadow-sm">
                            <div class="card-header bg-primary text-white py-2">
                                <h6 class="mb-0">
                                    <i class="fas fa-parking me-2"></i>Book Parking Spot
                                </h6>
                            </div>
                            <div class="card-body p-3">
                                <!-- Loading state -->
                                <div v-if="loading" class="text-center py-4">
                                    <div class="spinner-border text-primary"></div>
                                    <p class="mt-2 text-muted">Loading parking lots...</p>
                                </div>

                                <!-- Error state -->
                                <div v-else-if="error" class="alert alert-danger">
                                    <i class="fas fa-exclamation-triangle me-2"></i>{{ error }}
                                </div>

                                <!-- Booking form -->
                                <div v-else>
                                    <form @submit.prevent="bookParking">
                                        <div class="mb-3">
                                            <label for="lot" class="form-label fw-bold">
                                                <i class="fas fa-map-marker-alt me-2 text-primary"></i>Select Parking Lot
                                            </label>
                                            <select class="form-select" id="lot" v-model="selectedLotId" required>
                                                <option value="">Choose a parking lot...</option>
                                                                                <option v-for="lot in availableLots" :key="lot.id" :value="lot.id" :disabled="lot.spots_available === 0">
                                    {{ lot.name }} - ₹{{ Math.round(lot.hourly_rate) }}/hour 
                                    ({{ lot.spots_available > 0 ? lot.spots_available + ' spots available' : 'Full' }})
                                </option>
                                            </select>
                                        </div>
                                        
                                        <div class="mb-3">
                                            <label for="vehicle" class="form-label fw-bold">
                                                <i class="fas fa-car me-2 text-primary"></i>Vehicle Number
                                            </label>
                                            <input 
                                                type="text" 
                                                class="form-control" 
                                                id="vehicle" 
                                                v-model="vehicleNumber" 
                                                placeholder="Enter your vehicle number (e.g., MH 01 AB 1234)" 
                                                required
                                                style="text-transform: uppercase;"
                                            >
                                        </div>

                                        <!-- Selected lot details -->
                                        <div v-if="selectedLot" class="mb-3">
                                            <div class="card bg-light">
                                                <div class="card-body p-2">
                                                    <h6 class="card-title">Selected Location</h6>
                                                    <p class="mb-1"><strong>{{ selectedLot.name }}</strong></p>
                                                    <p class="mb-1 text-muted">{{ selectedLot.address }}</p>
                                                    <p class="mb-0"><strong>Rate:</strong> ₹{{ Math.round(selectedLot.hourly_rate) }}/hour</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="d-grid">
                                            <button 
                                                type="submit" 
                                                class="btn btn-primary" 
                                                :disabled="!selectedLotId || !vehicleNumber || booking || (selectedLot && selectedLot.spots_available === 0)"
                                            >
                                                <span v-if="booking" class="spinner-border spinner-border-sm me-2"></span>
                                                <i v-else class="fas fa-check me-2"></i>
                                                {{ booking ? 'Booking...' : 'Confirm Booking' }}
                                            </button>
                                            <router-link to="/dashboard" class="btn btn-outline-secondary">
                                                <i class="fas fa-times me-2"></i>Cancel
                                            </router-link>
                                        </div>
                                    </form>
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
            availableLots: [],
            selectedLotId: '',
            vehicleNumber: '',
            userName: '',
            loading: true,
            error: null,
            booking: false
        };
    },
    computed: {
        selectedLot() {
            return this.availableLots.find(lot => lot.id === parseInt(this.selectedLotId));
        }
    },
    methods: {
        async fetchAvailableLots() {
            try {
                this.loading = true;
                this.error = null;
                
                const response = await fetch('/api/parking-lots', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    
                    // Use API response directly - no transformation needed
                    if (data.locations) {
                        this.availableLots = data.locations;
                    }
                    
                    // Pre-select lot if passed via route parameter
                    const lotId = this.$route.params.id;
                    if (lotId) {
                        this.selectedLotId = parseInt(lotId);
                    }
                } else {
                    this.error = 'Failed to load parking lots';
                }
            } catch (error) {
                console.error('Error fetching parking lots:', error);
                this.error = 'Network error while loading parking lots';
            } finally {
                this.loading = false;
            }
        },

        async bookParking() {
            if (!this.selectedLotId || !this.vehicleNumber) {
                alert('Please select a parking lot and enter vehicle number');
                return;
            }

            try {
                this.booking = true;
                const response = await fetch('/api/reservations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        lot_id: parseInt(this.selectedLotId),
                        vehicle_number: this.vehicleNumber.toUpperCase()
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    alert('Parking booked successfully!');
                    // Refresh parent dashboard data if available
                    if (this.$parent && this.$parent.fetchParkingLots) {
                        this.$parent.fetchParkingLots();
                    }
                    this.$router.push('/dashboard');
                } else {
                    const error = await response.json();
                    alert(error.message || 'Booking failed');
                }
            } catch (error) {
                console.error('Error booking parking:', error);
                alert('Booking failed');
            } finally {
                this.booking = false;
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
                    const userData = await response.json();
                    this.userName = userData.name || userData.username;
                }
            } catch (error) {
                console.error('Error fetching user name:', error);
                this.userName = 'User';
            }
        },

        logout() {
            localStorage.removeItem('token');
            localStorage.removeItem('isAdmin');
            this.$router.push('/login');
        }
    },
    mounted() {
        this.fetchAvailableLots();
        this.fetchUserName();
    }
}; 