window.UserLogin = {
  template: `
    <div class="auth-page">
      <div class="auth-panel">
        <a href="/" class="auth-logo" style="text-decoration:none;">
          <div class="auth-logo-icon"><i class="fas fa-car"></i></div>
          <span class="auth-logo-text">ParkEase</span>
        </a>
        <h2 class="auth-heading">Welcome back</h2>
        <p class="auth-subtext">Sign in to find and book parking near you.</p>

        <div v-if="error" class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> {{ error }}</div>

        <form @submit.prevent="login">
          <div class="form-group">
            <label class="form-label">Username</label>
            <input class="form-control" type="text" v-model="username" placeholder="Enter username" required autofocus>
          </div>
          <div class="form-group" style="margin-bottom:1.5rem;">
            <label class="form-label">Password</label>
            <input class="form-control" type="password" v-model="password" placeholder="••••••••" required>
          </div>
          <button type="submit" class="btn btn-primary btn-block btn-lg" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            <i v-else class="fas fa-sign-in-alt"></i>
            {{ loading ? 'Signing in…' : 'Sign In' }}
          </button>
        </form>
        <div style="margin-top:1.25rem;text-align:center;font-size:.85rem;color:var(--text-muted);">
          No account? <router-link to="/register" style="color:var(--primary);font-weight:600;">Create one free</router-link>
        </div>
        <div style="margin-top:1.5rem;padding-top:1.5rem;border-top:1px solid var(--border);text-align:center;font-size:.82rem;color:var(--text-muted);">
          Are you an admin? <a href="/admin" style="color:var(--primary);font-weight:600;">Admin Login</a>
        </div>
      </div>

      <div class="auth-hero">
        <div class="auth-hero-content">
          <div class="auth-hero-icon"><i class="fas fa-parking"></i></div>
          <h2>Find Parking Instantly</h2>
          <p>Real-time spot availability, instant booking, and live cost tracking — all in one place.</p>
          <div style="display:flex;flex-direction:column;gap:.75rem;margin-top:2rem;text-align:left;max-width:280px;">
            <div style="display:flex;align-items:center;gap:.75rem;background:rgba(255,255,255,.08);padding:.75rem 1rem;border-radius:10px;">
              <i class="fas fa-map-marker-alt" style="color:#a5b4fc;width:18px;"></i>
              <span style="font-size:.85rem;">Browse available parking lots</span>
            </div>
            <div style="display:flex;align-items:center;gap:.75rem;background:rgba(255,255,255,.08);padding:.75rem 1rem;border-radius:10px;">
              <i class="fas fa-bolt" style="color:#a5b4fc;width:18px;"></i>
              <span style="font-size:.85rem;">Book a spot in seconds</span>
            </div>
            <div style="display:flex;align-items:center;gap:.75rem;background:rgba(255,255,255,.08);padding:.75rem 1rem;border-radius:10px;">
              <i class="fas fa-history" style="color:#a5b4fc;width:18px;"></i>
              <span style="font-size:.85rem;">View full booking history</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  data() { return { username: '', password: '', loading: false, error: '' }; },
  methods: {
    async login() {
      this.loading = true; this.error = '';
      try {
        const res = await fetch('/api/user/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: this.username, password: this.password })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('isAdmin', 'false');
          localStorage.setItem('user', JSON.stringify(data.user));
          this.$router.push('/dashboard');
        } else {
          this.error = data.message || 'Login failed';
        }
      } catch { this.error = 'Network error. Please try again.'; }
      finally { this.loading = false; }
    }
  }
};
