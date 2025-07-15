window.AdminLogin = {
    template: `
        <div>
            <nav class="navbar navbar-expand-lg navbar-dark navbar-gradient-blue">
                <div class="container">
                    <a class="navbar-brand" href="/">
                        <i class="fas fa-car"></i> Vehicle Parking App
                    </a>
                    <div class="navbar-nav ms-auto">
                        <a class="nav-link" href="/">Home</a>
                        <a class="nav-link" href="/user">User Portal</a>
                        <a class="nav-link active" href="/admin">Admin Portal</a>
                    </div>
                </div>
            </nav>
            <div class="container mt-5">
                <div class="row justify-content-center">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header text-center py-2">
                                <h5>Admin Login</h5>
                            </div>
                            <div class="card-body p-3">
                                <form @submit.prevent="login">
                                    <div class="form-group mb-3">
                                        <label for="username">Username</label>
                                        <input type="text" class="form-control" id="username" v-model="username" required>
                                    </div>
                                    <div class="form-group mb-3">
                                        <label for="password">Password</label>
                                        <input type="password" class="form-control" id="password" v-model="password" required>
                                    </div>
                                    <div class="text-center">
                                        <button type="submit" class="btn btn-primary">Login</button>
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
            username: '',
            password: ''
        }
    },
    methods: {
        async login() {
            try {
                const response = await fetch('/api/admin/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: this.username,
                        password: this.password
                    })
                });
                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('isAdmin', 'true');
                    localStorage.setItem('user', JSON.stringify(data.user));
                    this.$router.push('/dashboard');
                } else {
                    alert(data.message || 'Login failed');
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('Login failed');
            }
        }
    }
}; 