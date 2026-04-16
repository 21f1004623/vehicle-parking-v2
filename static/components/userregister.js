window.UserRegister = {
  template: `
    <div class="auth-page">
      <div class="auth-panel" style="height:100vh;overflow-y:auto;padding:1.75rem 2.5rem;justify-content:flex-start;padding-top:2rem;">
        <a href="/" class="auth-logo" style="text-decoration:none;margin-bottom:1.25rem;">
          <div class="auth-logo-icon"><i class="fas fa-car"></i></div>
          <span class="auth-logo-text">ParkEase</span>
        </a>
        <h2 class="auth-heading" style="margin-bottom:.2rem;">Create account</h2>
        <p class="auth-subtext" style="margin-bottom:1.25rem;">Join thousands of drivers who park smarter.</p>

        <div v-if="errors.length" class="alert alert-danger" style="margin-bottom:.75rem;">
          <i class="fas fa-exclamation-circle"></i>
          <ul style="margin:0;padding-left:1.25rem;">
            <li v-for="e in errors" :key="e">{{ e }}</li>
          </ul>
        </div>

        <form @submit.prevent="register">
          <div style="margin-bottom:.75rem;">
            <label class="form-label">Full Name <span style="color:var(--danger)">*</span></label>
            <input class="form-control" :class="validationErrors.name ? 'is-invalid' : ''"
              type="text" v-model="name" placeholder="John Doe" required>
            <div v-if="validationErrors.name" class="invalid-feedback">{{ validationErrors.name }}</div>
          </div>
          <div style="margin-bottom:.75rem;">
            <label class="form-label">Username <span style="color:var(--danger)">*</span></label>
            <input class="form-control" :class="validationErrors.username ? 'is-invalid' : ''"
              type="text" v-model="username" placeholder="john_doe" required>
            <div v-if="validationErrors.username" class="invalid-feedback">{{ validationErrors.username }}</div>
          </div>
          <div style="margin-bottom:.75rem;">
            <label class="form-label">Email <span style="color:var(--danger)">*</span></label>
            <input class="form-control" :class="validationErrors.email ? 'is-invalid' : ''"
              type="email" v-model="email" placeholder="john@example.com" required>
            <div v-if="validationErrors.email" class="invalid-feedback">{{ validationErrors.email }}</div>
          </div>
          <div style="margin-bottom:1.25rem;">
            <label class="form-label">Password <span style="color:var(--danger)">*</span></label>
            <input class="form-control" :class="validationErrors.password ? 'is-invalid' : ''"
              type="password" v-model="password" placeholder="Min 6 characters" required>
            <div v-if="validationErrors.password" class="invalid-feedback">{{ validationErrors.password }}</div>
          </div>
          <button type="submit" class="btn btn-primary btn-block btn-lg" :disabled="registering">
            <span v-if="registering" class="spinner"></span>
            <i v-else class="fas fa-user-plus"></i>
            {{ registering ? 'Creating account…' : 'Create Account' }}
          </button>
        </form>
        <div style="margin-top:1rem;text-align:center;font-size:.85rem;color:var(--text-muted);">
          Already have an account? <router-link to="/login" style="color:var(--primary);font-weight:600;">Sign in</router-link>
        </div>
      </div>

      <div class="auth-hero">
        <div class="auth-hero-content">
          <div class="auth-hero-icon"><i class="fas fa-user-check"></i></div>
          <h2>Get Started Free</h2>
          <p>Create your account in under a minute and start finding parking right away.</p>
        </div>
      </div>
    </div>
  `,
  data() {
    return { name: '', username: '', email: '', password: '', registering: false, errors: [], validationErrors: {} };
  },
  methods: {
    validateForm() {
      this.errors = []; this.validationErrors = {};
      if (!this.name?.trim() || this.name.trim().length < 2) {
        const m = 'Name must be at least 2 characters';
        this.validationErrors.name = m; this.errors.push(m);
      }
      if (!this.username?.trim() || this.username.trim().length < 3) {
        const m = 'Username must be at least 3 characters';
        this.validationErrors.username = m; this.errors.push(m);
      } else if (!/^[a-zA-Z0-9_]+$/.test(this.username)) {
        const m = 'Username: letters, numbers and underscores only';
        this.validationErrors.username = m; this.errors.push(m);
      }
      if (!this.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
        const m = 'Enter a valid email address';
        this.validationErrors.email = m; this.errors.push(m);
      }
      if (!this.password || this.password.length < 6) {
        const m = 'Password must be at least 6 characters';
        this.validationErrors.password = m; this.errors.push(m);
      }
      return this.errors.length === 0;
    },
    async register() {
      if (!this.validateForm()) return;
      this.registering = true;
      try {
        const res = await fetch('/api/user/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: this.name.trim(), username: this.username.trim(), email: this.email.trim(), password: this.password })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('isAdmin', 'false');
          localStorage.setItem('user', JSON.stringify(data.user));
          this.$router.push('/dashboard');
        } else {
          this.errors = [data.message || 'Registration failed. Please try again.'];
        }
      } catch { this.errors = ['Network error. Please check your connection.']; }
      finally { this.registering = false; }
    }
  }
};
