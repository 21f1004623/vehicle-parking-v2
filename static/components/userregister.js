window.UserRegister = {
    template: `
        <div>
            <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
                <div class="container">
                    <a class="navbar-brand" href="/">
                        <i class="fas fa-car"></i> Vehicle Parking App
                    </a>
                    <div class="navbar-nav ms-auto">
                        <a class="nav-link" href="/">Home</a>
                        <a class="nav-link active" href="/user">User Portal</a>
                        <a class="nav-link" href="/admin">Admin Portal</a>
                    </div>
                </div>
            </nav>
            <div class="container mt-5">
                <div class="row justify-content-center">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header text-center py-2">
                                <h5>User Registration</h5>
                            </div>
                        <div class="card-body p-3">
                            <div v-if="errors.length > 0" class="alert alert-danger">
                                <ul class="mb-0">
                                    <li v-for="error in errors" :key="error">{{ error }}</li>
                                </ul>
                            </div>
                            <form @submit.prevent="register">
                                <div class="form-group mb-3">
                                    <label for="name">Name <span class="text-danger">*</span></label>
                                    <input 
                                        type="text" 
                                        class="form-control" 
                                        :class="{ 'is-invalid': validationErrors.name }"
                                        id="name" 
                                        v-model="name" 
                                        required
                                        placeholder="Enter your full name"
                                    >
                                    <div v-if="validationErrors.name" class="invalid-feedback">
                                        {{ validationErrors.name }}
                                    </div>
                                </div>
                                <div class="form-group mb-3">
                                    <label for="username">Username <span class="text-danger">*</span></label>
                                    <input 
                                        type="text" 
                                        class="form-control" 
                                        :class="{ 'is-invalid': validationErrors.username }"
                                        id="username" 
                                        v-model="username" 
                                        required
                                        placeholder="Choose a unique username"
                                    >
                                    <div v-if="validationErrors.username" class="invalid-feedback">
                                        {{ validationErrors.username }}
                                    </div>
                                </div>
                                <div class="form-group mb-3">
                                    <label for="email">Email <span class="text-danger">*</span></label>
                                    <input 
                                        type="email" 
                                        class="form-control" 
                                        :class="{ 'is-invalid': validationErrors.email }"
                                        id="email" 
                                        v-model="email" 
                                        required
                                        placeholder="Enter your email address"
                                    >
                                    <div v-if="validationErrors.email" class="invalid-feedback">
                                        {{ validationErrors.email }}
                                    </div>
                                </div>
                                <div class="form-group mb-3">
                                    <label for="password">Password <span class="text-danger">*</span></label>
                                    <input 
                                        type="password" 
                                        class="form-control" 
                                        :class="{ 'is-invalid': validationErrors.password }"
                                        id="password" 
                                        v-model="password" 
                                        required
                                        placeholder="Enter a strong password"
                                    >
                                    <div v-if="validationErrors.password" class="invalid-feedback">
                                        {{ validationErrors.password }}
                                    </div>
                                    <small class="form-text text-muted">Password must be at least 6 characters long</small>
                                </div>
                                <div class="text-center">
                                    <button type="submit" class="btn btn-primary" :disabled="registering">
                                        <span v-if="registering" class="spinner-border spinner-border-sm me-2"></span>
                                        {{ registering ? 'Creating Account...' : 'Register' }}
                                    </button>
                                </div>
                            </form>
                            <div class="text-center mt-3">
                                <router-link to="/login">Already have an account? Login</router-link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            name: '',
            username: '',
            email: '',
            password: '',
            registering: false,
            errors: [],
            validationErrors: {}
        }
    },
    methods: {
        validateForm() {
            this.errors = [];
            this.validationErrors = {};
            
            // Name validation
            if (!this.name || this.name.trim().length === 0) {
                this.validationErrors.name = 'Name is required';
                this.errors.push('Name is required');
            } else if (this.name.trim().length < 2) {
                this.validationErrors.name = 'Name must be at least 2 characters long';
                this.errors.push('Name must be at least 2 characters long');
            }
            
            // Username validation
            if (!this.username || this.username.trim().length === 0) {
                this.validationErrors.username = 'Username is required';
                this.errors.push('Username is required');
            } else if (this.username.trim().length < 3) {
                this.validationErrors.username = 'Username must be at least 3 characters long';
                this.errors.push('Username must be at least 3 characters long');
            } else if (!/^[a-zA-Z0-9_]+$/.test(this.username)) {
                this.validationErrors.username = 'Username can only contain letters, numbers, and underscores';
                this.errors.push('Username can only contain letters, numbers, and underscores');
            }
            
            // Email validation
            if (!this.email || this.email.trim().length === 0) {
                this.validationErrors.email = 'Email is required';
                this.errors.push('Email is required');
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
                this.validationErrors.email = 'Please enter a valid email address';
                this.errors.push('Please enter a valid email address');
            }
            
            // Password validation
            if (!this.password || this.password.length === 0) {
                this.validationErrors.password = 'Password is required';
                this.errors.push('Password is required');
            } else if (this.password.length < 6) {
                this.validationErrors.password = 'Password must be at least 6 characters long';
                this.errors.push('Password must be at least 6 characters long');
            }
            
            return this.errors.length === 0;
        },
        
        async register() {
            // Clear previous errors
            this.errors = [];
            this.validationErrors = {};
            
            // Validate form
            if (!this.validateForm()) {
                return;
            }
            
            this.registering = true;
            
            try {
                const response = await fetch('/api/user/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: this.name.trim(),
                        username: this.username.trim(),
                        email: this.email.trim(),
                        password: this.password
                    })
                });
                const data = await response.json();
                if (response.ok && data.success) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('isAdmin', 'false');
                    localStorage.setItem('user', JSON.stringify(data.user));
                    alert('Registration successful!');
                    this.$router.push('/dashboard');
                } else {
                    if (data.message) {
                        this.errors = [data.message];
                    } else {
                        this.errors = ['Registration failed. Please try again.'];
                    }
                }
            } catch (error) {
                console.error('Registration error:', error);
                this.errors = ['Network error. Please check your connection and try again.'];
            } finally {
                this.registering = false;
            }
        }
    }
}; 