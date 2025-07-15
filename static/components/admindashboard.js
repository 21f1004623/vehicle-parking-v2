window.AdminDashboard = {
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
                    <button class="nav-link" :class="{ active: activeSection === 'parking' }" @click="setActiveSection('parking')">
                        <i class="fas fa-parking"></i> Parking Lot Details
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" :class="{ active: activeSection === 'users' }" @click="setActiveSection('users')">
                        <i class="fas fa-users"></i> Users
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" :class="{ active: activeSection === 'reservations' }" @click="setActiveSection('reservations')">
                        <i class="fas fa-calendar-check"></i> Reservations
                    </button>
                </li>
                <li class="nav-item">
                    <button class="nav-link" @click="$router.push('/analytics')">
                        <i class="fas fa-chart-bar"></i> Analytics & Charts
                    </button>
                </li>
            </ul>

            <!-- Error Message -->
            <div v-if="error" class="alert alert-danger">
                <i class="fas fa-exclamation-triangle"></i> {{ error }}
                <button class="btn btn-sm btn-outline-danger ms-2" @click="retryLoad">
                    <i class="fas fa-redo"></i> Retry
                </button>
            </div>

            <!-- Success Message -->
            <div v-if="successMessage" class="alert alert-success">
                <i class="fas fa-check-circle"></i> {{ successMessage }}
            </div>

            <!-- Loading -->
            <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;"></div>
                <p class="mt-3">Loading...</p>
            </div>

            <!-- Parking Lots Section -->
            <div v-if="activeSection === 'parking' && !loading">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4>Parking Lot Details</h4>
                    <button class="btn btn-primary" @click="showAddModal">
                        <i class="fas fa-plus"></i> Add New Parking Lot
                    </button>
                </div>
                <div class="row">
                    <div v-for="lot in parkingLots" :key="lot.id" class="col-md-6 col-lg-4 mb-3">
                        <div class="card">
                            <div class="card-header bg-primary text-white py-2">
                                <h6 class="mb-0">{{ lot.prime_location_name }}</h6>
                            </div>
                            <div class="card-body p-3">
                                <p class="card-text">{{ lot.address }}</p>
                                <p><strong>Price:</strong> ₹{{ Math.round(lot.price) }}/hour</p>
                                <p><strong>Available:</strong> {{ lot.available_spots }}/{{ lot.number_of_spots }} spots</p>
                                <div class="btn-group w-100">
                                    <button class="btn btn-sm btn-outline-primary" @click="editLot(lot)">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" @click="deleteLot(lot.id)">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-if="!parkingLots || parkingLots.length === 0" class="col-12">
                        <div class="text-center py-5">
                            <i class="fas fa-parking fa-3x text-muted mb-3"></i>
                            <h5>No parking lots found</h5>
                            <p>Click "Add New Parking Lot" to get started.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Users Section -->
            <div v-if="activeSection === 'users' && !loading">
                <h4 class="mb-3">Users</h4>
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead class="table-dark">
                            <tr>
                                <th>Name</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Total Reservations</th>
                                <th>Total Spent</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="user in users" :key="user.id">
                                <td>{{ user.name || user.username }}</td>
                                <td>{{ user.username }}</td>
                                <td>{{ user.email || 'N/A' }}</td>
                                <td>{{ user.total_reservations || 0 }}</td>
                                <td>₹{{ Math.round(user.total_revenue || 0) }}</td>
                                <td>
                                    <span v-if="user.current_spot" class="badge bg-success">Active</span>
                                    <span v-else class="badge bg-secondary">Inactive</span>
                                </td>
                            </tr>
                            <tr v-if="!users || users.length === 0">
                                <td colspan="6" class="text-center py-4">
                                    <i class="fas fa-users fa-2x text-muted mb-2"></i>
                                    <p class="text-muted mb-0">No users found</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Reservations Section -->
            <div v-if="activeSection === 'reservations' && !loading">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h4>Reservations</h4>
                    <div class="btn-group">
                        <button class="btn btn-sm" :class="reservationFilter === 'all' ? 'btn-primary' : 'btn-outline-primary'" @click="reservationFilter = 'all'">All</button>
                        <button class="btn btn-sm" :class="reservationFilter === 'active' ? 'btn-success' : 'btn-outline-success'" @click="reservationFilter = 'active'">Active</button>
                        <button class="btn btn-sm" :class="reservationFilter === 'completed' ? 'btn-secondary' : 'btn-outline-secondary'" @click="reservationFilter = 'completed'">Completed</button>
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead class="table-dark">
                            <tr>
                                <th>User</th>
                                <th>Location</th>
                                <th>Vehicle</th>
                                <th>Start Time</th>
                                <th>Duration</th>
                                <th>Cost</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="reservation in filteredReservations" :key="reservation.id">
                                <td><strong>{{ reservation.username }}</strong></td>
                                <td>{{ reservation.parking_lot_name }}</td>
                                <td><span class="badge bg-info">{{ reservation.vehicle_number }}</span></td>
                                <td>{{ formatDateTime(reservation.parking_timestamp) }}</td>
                                <td>{{ reservation.duration_hours }}h</td>
                                <td><strong class="text-success">₹{{ Math.round(reservation.parking_cost || 0) }}</strong></td>
                                <td>
                                    <span v-if="reservation.status === 'active'" class="badge bg-success">
                                        <i class="fas fa-clock"></i> Active
                                    </span>
                                    <span v-else class="badge bg-secondary">
                                        <i class="fas fa-check"></i> Completed
                                    </span>
                                </td>
                                <td>
                                    <button v-if="reservation.status === 'active'" class="btn btn-sm btn-outline-danger" @click="cancelReservation(reservation.id)">
                                        <i class="fas fa-times"></i> Cancel
                                    </button>
                                    <button v-else class="btn btn-sm btn-outline-info" disabled>
                                        <i class="fas fa-check"></i> Done
                                    </button>
                                </td>
                            </tr>
                            <tr v-if="!filteredReservations || filteredReservations.length === 0">
                                <td colspan="8" class="text-center py-4">
                                    <i class="fas fa-calendar-check fa-2x text-muted mb-2"></i>
                                    <p class="text-muted mb-0">No reservations found</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>



            <!-- Add/Edit Modal -->
            <div v-if="showModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1050;">
                <div style="max-width: 500px; width: 90%;">
                    <div style="background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <div style="padding: 1rem; border-bottom: 1px solid #dee2e6; display: flex; justify-content: space-between; align-items: center;">
                            <h5 class="modal-title">{{ editingLot ? 'Edit Parking Lot' : 'Add New Parking Lot' }}</h5>
                            <button type="button" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;" @click="hideModal">&times;</button>
                        </div>
                        <div style="padding: 1rem;">
                            <div v-if="validationErrors.length" class="alert alert-danger">
                                <ul class="mb-0">
                                    <li v-for="error in validationErrors" :key="error">{{ error }}</li>
                                </ul>
                            </div>
                            <form @submit.prevent="submitForm">
                                <div class="mb-3">
                                    <label class="form-label">Location Name</label>
                                    <input type="text" class="form-control" v-model="form.prime_location_name" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Address</label>
                                    <textarea class="form-control" v-model="form.address" required></textarea>
                                </div>
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Price per Hour (₹)</label>
                                        <input type="number" class="form-control" v-model="form.price" required min="1">
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">PIN Code</label>
                                        <input type="text" class="form-control" v-model="form.pin_code" required>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Number of Spots</label>
                                    <input type="number" class="form-control" v-model="form.number_of_spots" required min="1">
                                </div>
                            </form>
                        </div>
                        <div style="padding: 1rem; border-top: 1px solid #dee2e6; display: flex; justify-content: flex-end; gap: 0.5rem;">
                            <button type="button" class="btn btn-secondary" @click="hideModal">Cancel</button>
                            <button type="button" class="btn btn-primary" @click="submitForm" :disabled="submitting">
                                <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
                                {{ editingLot ? 'Update' : 'Create' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    
    data() {
        return {
            activeSection: 'parking',
            loading: false,
            error: null,
            successMessage: null,
            
            // Data
            parkingLots: [],
            users: [],
            reservations: [],
            

            
            // Modal
            showModal: false,
            editingLot: false,
            editingLotId: null,
            submitting: false,
            validationErrors: [],
            
            // Form
            form: {
                prime_location_name: '',
                address: '',
                price: '',
                pin_code: '',
                number_of_spots: ''
            },
            
            // Filters
            reservationFilter: 'all'
        };
    },
    
    computed: {
        filteredReservations() {
            if (!this.reservations) return [];
            
            let filtered = [...this.reservations];
            
            if (this.reservationFilter === 'active') {
                filtered = filtered.filter(r => r.status === 'active');
            } else if (this.reservationFilter === 'completed') {
                filtered = filtered.filter(r => r.status === 'completed');
            }
            
            return filtered;
        },
        

    },
    
    methods: {
        async setActiveSection(section) {
            this.activeSection = section;
            this.clearMessages();
            await this.loadData();
        },
        
        async loadData() {
            this.loading = true;
            this.error = null;
            
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    this.error = 'Please login again';
                    this.$router.push('/login');
                    return;
                }
                
                const endpoints = {
                    parking: '/api/admin/parking-lots',
                    users: '/api/admin/users',
                    reservations: '/api/admin/reservations'
                };
                
                const response = await fetch(endpoints[this.activeSection], {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (this.activeSection === 'parking') {
                        this.parkingLots = data.lots || [];
                    } else if (this.activeSection === 'users') {
                        this.users = data.users || [];
                    } else if (this.activeSection === 'reservations') {
                        this.reservations = data.reservations || [];
                    } else {
                        this[this.activeSection] = data;
                    }
                } else if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('token');
                    this.$router.push('/login');
                } else {
                    this.error = `Failed to load ${this.activeSection} data`;
                }
            } catch (error) {
                this.error = `Network error loading ${this.activeSection} data`;
            } finally {
                this.loading = false;
            }
        },
        

        
        retryLoad() {
            this.loadData();
        },
        
        // Modal methods
        showAddModal() {
            this.resetForm();
            this.showModal = true;
        },
        
        editLot(lot) {
            this.editingLot = true;
            this.editingLotId = lot.id;
            Object.assign(this.form, lot);
            this.showModal = true;
        },
        
        hideModal() {
            this.showModal = false;
            this.resetForm();
        },
        
        resetForm() {
            this.editingLot = false;
            this.editingLotId = null;
            this.validationErrors = [];
            this.form = {
                prime_location_name: '',
                address: '',
                price: '',
                pin_code: '',
                number_of_spots: ''
            };
        },
        
        async submitForm() {
            this.submitting = true;
            this.validationErrors = [];
            
            try {
                const url = this.editingLot ? `/api/admin/parking-lots/${this.editingLotId}` : '/api/admin/parking-lots';
                const method = this.editingLot ? 'PUT' : 'POST';
                
                const response = await fetch(url, {
                    method,
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        prime_location_name: this.form.prime_location_name,
                        price: parseFloat(this.form.price),
                        address: this.form.address,
                        pin_code: this.form.pin_code,
                        number_of_spots: parseInt(this.form.number_of_spots)
                    })
                });
                
                if (response.ok) {
                    this.successMessage = `Parking lot ${this.editingLot ? 'updated' : 'created'} successfully`;
                    this.hideModal();
                    await this.loadData();
                } else {
                    const result = await response.json();
                    this.validationErrors = [result.message || 'Failed to save parking lot'];
                }
            } catch (error) {
                this.validationErrors = ['Network error saving parking lot'];
            } finally {
                this.submitting = false;
            }
        },
        
        async deleteLot(id) {
            if (!confirm('Are you sure you want to delete this parking lot?')) return;
            
            try {
                const response = await fetch(`/api/admin/parking-lots/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                
                if (response.ok) {
                    this.successMessage = 'Parking lot deleted successfully';
                    await this.loadData();
                } else {
                    this.error = 'Failed to delete parking lot';
                }
            } catch (error) {
                this.error = 'Network error deleting parking lot';
            }
        },
        
        async cancelReservation(id) {
            if (!confirm('Are you sure you want to cancel this reservation?')) return;
            
            try {
                const response = await fetch(`/api/admin/cancel-booking/${id}`, {
                    method: 'PUT',
                    headers: { 
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    this.successMessage = 'Reservation cancelled successfully';
                    await this.loadData();
                } else {
                    this.error = 'Failed to cancel reservation';
                }
            } catch (error) {
                this.error = 'Network error cancelling reservation';
            }
        },
        
        // Utility methods
        formatDateTime(dateString) {
            if (!dateString) return 'N/A';
            return new Date(dateString).toLocaleString();
        },
        
        clearMessages() {
            this.error = null;
            this.successMessage = null;
        },
        
        logout() {
            localStorage.removeItem('token');
            this.$router.push('/login');
        }
    },
    
    async mounted() {
        // Check if there's a section specified in query parameters
        const section = this.$route.query.section;
        if (section && ['users', 'reservations', 'parking'].includes(section)) {
            this.activeSection = section;
        }
        await this.loadData();
    }
}; 