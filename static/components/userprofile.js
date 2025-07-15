window.UserProfile = {
    template: `
        <div class="min-vh-100" style="background: linear-gradient(135deg, #f8fafc 0%, #e3f2fd 100%);">
            <!-- Header -->
            <nav class="navbar navbar-expand-lg" style="background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%); box-shadow: 0 4px 20px rgba(25, 118, 210, 0.3);">
                <div class="container-fluid px-4">
                    <a class="navbar-brand text-white fw-bold" href="#" style="font-size: 1.4rem;">
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
                        <router-link to="/bookings" class="btn btn-outline-primary">
                            <i class="fas fa-calendar-check me-2"></i>My Bookings
                        </router-link>
                        <router-link to="/analytics" class="btn btn-outline-primary">
                            <i class="fas fa-chart-line me-2"></i>Analytics
                        </router-link>
                        <button type="button" class="btn btn-primary">
                            <i class="fas fa-user me-2"></i>Profile
                        </button>
                    </div>
                </div>
            </div>

            <div class="container py-4">
                <!-- Page Title -->
                <div class="text-center mb-3">
                    <h3 class="fw-bold text-dark mb-2">
                        <i class="fas fa-user text-primary me-2"></i>User Profile
                    </h3>
                    <p class="text-muted mb-0">Manage your personal information and account settings</p>
                </div>

                <div class="row justify-content-center">
                    <div class="col-lg-4 col-md-6 col-sm-8">
                        <!-- Profile Card -->
                        <div class="card border-0 shadow">
                            <div class="card-header text-center" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                                <div class="py-2">
                                    <div class="avatar-circle mx-auto mb-2" style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                        <i class="fas fa-user fa-lg text-white"></i>
                                    </div>
                                    <h5 class="text-white mb-1">{{ profile.name || profile.username || 'User' }}</h5>
                                    <small class="text-white opacity-75">{{ profile.email || 'No email provided' }}</small>
                                </div>
                            </div>
                            <div class="card-body p-3">
                                <!-- Success Message -->
                                <div v-if="successMessage" class="alert alert-success alert-dismissible fade show" role="alert">
                                    <i class="fas fa-check-circle me-2"></i>{{ successMessage }}
                                    <button type="button" class="btn-close" @click="successMessage = ''" aria-label="Close"></button>
                                </div>

                                <!-- Error Message -->
                                <div v-if="errorMessage" class="alert alert-danger alert-dismissible fade show" role="alert">
                                    <i class="fas fa-exclamation-triangle me-2"></i>{{ errorMessage }}
                                    <button type="button" class="btn-close" @click="errorMessage = ''" aria-label="Close"></button>
                                </div>

                                <form @submit.prevent="updateProfile">
                                    <div class="mb-3">
                                        <label for="name" class="form-label fw-bold">
                                            <i class="fas fa-user me-2 text-primary"></i>Full Name
                                        </label>
                                        <input 
                                            type="text" 
                                            class="form-control" 
                                            id="name" 
                                            v-model="profile.name"
                                            placeholder="Enter your full name"
                                        >
                                        <small class="form-text text-muted">Your display name for the application</small>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="username" class="form-label fw-bold">
                                            <i class="fas fa-at me-2 text-primary"></i>Username
                                        </label>
                                        <input 
                                            type="text" 
                                            class="form-control" 
                                            id="username" 
                                            v-model="profile.username" 
                                            required
                                            placeholder="Enter your username"
                                        >
                                        <small class="form-text text-muted">Unique identifier for your account</small>
                                    </div>
                                    
                                    <div class="mb-3">
                                        <label for="email" class="form-label fw-bold">
                                            <i class="fas fa-envelope me-2 text-primary"></i>Email Address
                                        </label>
                                        <input 
                                            type="email" 
                                            class="form-control" 
                                            id="email" 
                                            v-model="profile.email"
                                            placeholder="Enter your email address"
                                        >
                                        <small class="form-text text-muted">For notifications and account recovery</small>
                                    </div>
                                    
                                    <div class="d-grid">
                                        <button 
                                            type="submit" 
                                            class="btn btn-primary"
                                            :disabled="updating"
                                            style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none;"
                                        >
                                            <span v-if="updating" class="spinner-border spinner-border-sm me-2"></span>
                                            <i v-else class="fas fa-save me-2"></i>
                                            {{ updating ? 'Updating...' : 'Update Profile' }}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>


                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            profile: {
                name: '',
                username: '',
                email: '',
                created_at: null
            },
            updating: false,
            successMessage: '',
            errorMessage: ''
        };
    },
    methods: {
        async fetchProfile() {
            try {
                const response = await fetch('/api/profile', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.profile) {
                        this.profile = {
                            name: data.profile.name || '',
                            username: data.profile.username || '',
                            email: data.profile.email || '',
                            created_at: data.profile.member_since || null
                        };
                    }
                } else {
                    this.errorMessage = 'Failed to load profile data';
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                this.errorMessage = 'Network error while loading profile';
            }
        },

        async updateProfile() {
            this.updating = true;
            this.errorMessage = '';
            this.successMessage = '';

            try {
                const response = await fetch('/api/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        name: this.profile.name,
                        username: this.profile.username,
                        email: this.profile.email
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    this.successMessage = result.message || 'Profile updated successfully!';
                    // Refresh profile data
                    await this.fetchProfile();
                    setTimeout(() => {
                        this.successMessage = '';
                    }, 5000);
                } else {
                    const errorData = await response.json();
                    this.errorMessage = errorData.message || 'Failed to update profile';
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                this.errorMessage = 'Network error while updating profile';
            } finally {
                this.updating = false;
            }
        },

        formatDate(dateString) {
            if (!dateString) return null;
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        },

        logout() {
            localStorage.removeItem('token');
            localStorage.removeItem('isAdmin');
            this.$router.push('/login');
        }
    },
    mounted() {
        this.fetchProfile();
    }
};
  