window.UserProfile = {
  template: `
    <div class="app-shell">

      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-brand">
          <a href="/"><div class="brand-icon"><i class="fas fa-car"></i></div>ParkEase</a>
        </div>
        <div class="sidebar-nav" style="padding-top:.5rem;">
          <span class="sidebar-section">Menu</span>
          <router-link to="/dashboard"><span class="nav-icon"><i class="fas fa-home"></i></span>Dashboard</router-link>
          <router-link to="/bookings"><span class="nav-icon"><i class="fas fa-calendar-check"></i></span>My Bookings</router-link>
          <router-link to="/analytics"><span class="nav-icon"><i class="fas fa-chart-line"></i></span>Analytics</router-link>
          <a href="#" class="active"><span class="nav-icon"><i class="fas fa-user"></i></span>Profile</a>
        </div>
        <div class="sidebar-footer">
          <button @click="logout"><i class="fas fa-sign-out-alt"></i> Sign Out</button>
        </div>
      </aside>

      <!-- Main -->
      <div class="main-content">
        <div class="top-bar">
          <div>
            <div class="top-bar-title">Profile</div>
            <div class="top-bar-subtitle">Manage your account</div>
          </div>
        </div>

        <div class="page-content">
          <div style="max-width:480px;">

            <!-- Avatar card -->
            <div class="card" style="margin-bottom:1.25rem;">
              <div style="background:linear-gradient(135deg,#4338ca,#6366f1);padding:1.5rem;text-align:center;border-radius:var(--radius) var(--radius) 0 0;">
                <div style="width:64px;height:64px;background:rgba(255,255,255,.15);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto .875rem;font-size:1.5rem;color:#fff;backdrop-filter:blur(10px);">
                  <i class="fas fa-user"></i>
                </div>
                <div style="font-size:1.1rem;font-weight:700;color:#fff;">{{ profile.name || profile.username || 'User' }}</div>
                <div style="font-size:.8rem;color:rgba(255,255,255,.7);">{{ profile.email || 'No email set' }}</div>
              </div>
              <div class="card-body">
                <div v-if="successMessage" class="alert alert-success"><i class="fas fa-check-circle"></i> {{ successMessage }}</div>
                <div v-if="errorMessage" class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> {{ errorMessage }}</div>
                <form @submit.prevent="updateProfile">
                  <div class="form-group">
                    <label class="form-label">Full Name</label>
                    <input class="form-control" type="text" v-model="profile.name" placeholder="Your display name">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Username</label>
                    <input class="form-control" type="text" v-model="profile.username" required placeholder="username">
                  </div>
                  <div class="form-group" style="margin-bottom:1.25rem;">
                    <label class="form-label">Email Address</label>
                    <input class="form-control" type="email" v-model="profile.email" placeholder="you@example.com">
                  </div>
                  <button type="submit" class="btn btn-primary btn-block" :disabled="updating">
                    <span v-if="updating" class="spinner"></span>
                    <i v-else class="fas fa-save"></i>
                    {{ updating ? 'Saving…' : 'Save Changes' }}
                  </button>
                </form>
              </div>
            </div>

            <!-- Change password -->
            <div class="card">
              <div class="card-header">
                <span class="card-title"><i class="fas fa-lock" style="color:var(--primary);margin-right:.4rem;"></i>Change Password</span>
              </div>
              <div class="card-body">
                <div v-if="pwSuccess" class="alert alert-success"><i class="fas fa-check-circle"></i> {{ pwSuccess }}</div>
                <div v-if="pwError"   class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> {{ pwError }}</div>
                <form @submit.prevent="changePassword">
                  <div class="form-group">
                    <label class="form-label">Current Password</label>
                    <input class="form-control" type="password" v-model="pwForm.current" placeholder="••••••••" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label">New Password</label>
                    <input class="form-control" type="password" v-model="pwForm.newPw" placeholder="Min 6 characters" required minlength="6">
                  </div>
                  <div class="form-group" style="margin-bottom:1.25rem;">
                    <label class="form-label">Confirm New Password</label>
                    <input class="form-control" :class="pwForm.confirm && pwForm.confirm !== pwForm.newPw ? 'is-invalid' : ''"
                      type="password" v-model="pwForm.confirm" placeholder="Re-enter new password" required>
                    <div v-if="pwForm.confirm && pwForm.confirm !== pwForm.newPw" class="invalid-feedback">Passwords do not match</div>
                  </div>
                  <button type="submit" class="btn btn-danger btn-block" :disabled="changingPw || pwForm.newPw !== pwForm.confirm">
                    <span v-if="changingPw" class="spinner"></span>
                    <i v-else class="fas fa-key"></i>
                    {{ changingPw ? 'Updating…' : 'Change Password' }}
                  </button>
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
      profile: { name: '', username: '', email: '' },
      updating: false, successMessage: '', errorMessage: '',
      pwForm: { current: '', newPw: '', confirm: '' },
      changingPw: false, pwSuccess: '', pwError: ''
    };
  },

  methods: {
    async fetchProfile() {
      try {
        const res = await fetch('/api/profile', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        if (res.ok) { const d = await res.json(); if (d.profile) this.profile = { name: d.profile.name||'', username: d.profile.username||'', email: d.profile.email||'' }; }
        else this.errorMessage = 'Failed to load profile';
      } catch { this.errorMessage = 'Network error'; }
    },
    async updateProfile() {
      this.updating = true; this.successMessage = ''; this.errorMessage = '';
      try {
        const res = await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ name: this.profile.name, username: this.profile.username, email: this.profile.email })
        });
        const r = await res.json();
        if (res.ok) { this.successMessage = r.message || 'Profile updated!'; await this.fetchProfile(); setTimeout(() => { this.successMessage = ''; }, 5000); }
        else this.errorMessage = r.message || 'Failed to update';
      } catch { this.errorMessage = 'Network error'; }
      finally { this.updating = false; }
    },
    async changePassword() {
      if (this.pwForm.newPw !== this.pwForm.confirm) { this.pwError = 'Passwords do not match'; return; }
      this.changingPw = true; this.pwError = ''; this.pwSuccess = '';
      try {
        const res = await fetch('/api/user/change-password', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ current_password: this.pwForm.current, new_password: this.pwForm.newPw })
        });
        const r = await res.json();
        if (res.ok && r.success) { this.pwSuccess = r.message || 'Password changed!'; this.pwForm = { current:'', newPw:'', confirm:'' }; setTimeout(() => { this.pwSuccess = ''; }, 5000); }
        else this.pwError = r.message || 'Failed';
      } catch { this.pwError = 'Network error'; }
      finally { this.changingPw = false; }
    },
    logout() { localStorage.removeItem('token'); localStorage.removeItem('isAdmin'); this.$router.push('/login'); }
  },

  mounted() { this.fetchProfile(); }
};
