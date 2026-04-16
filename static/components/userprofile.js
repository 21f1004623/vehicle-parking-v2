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
            <div class="top-bar-title">My Profile</div>
            <div class="top-bar-subtitle">Manage your account details</div>
          </div>
        </div>

        <div class="page-content">

          <!-- Profile banner -->
          <div style="background:linear-gradient(135deg,#1e1b4b,#4338ca,#6366f1);border-radius:var(--radius);padding:2rem;margin-bottom:1.5rem;display:flex;align-items:center;gap:1.5rem;flex-wrap:wrap;">
            <div style="width:80px;height:80px;background:rgba(255,255,255,.15);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2rem;color:#fff;flex-shrink:0;border:3px solid rgba(255,255,255,.25);">
              <i class="fas fa-user"></i>
            </div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:1.5rem;font-weight:800;color:#fff;margin-bottom:.25rem;">{{ profile.name || profile.username || 'User' }}</div>
              <div style="color:rgba(255,255,255,.7);font-size:.9rem;display:flex;gap:1.25rem;flex-wrap:wrap;">
                <span><i class="fas fa-at" style="margin-right:.35rem;opacity:.7;"></i>{{ profile.username }}</span>
                <span v-if="profile.email"><i class="fas fa-envelope" style="margin-right:.35rem;opacity:.7;"></i>{{ profile.email }}</span>
              </div>
            </div>
            <div style="display:flex;gap:1rem;flex-wrap:wrap;">
              <div style="background:rgba(255,255,255,.1);border-radius:10px;padding:.75rem 1.25rem;text-align:center;border:1px solid rgba(255,255,255,.15);">
                <div style="font-size:1.4rem;font-weight:800;color:#fff;">{{ stats.totalBookings }}</div>
                <div style="font-size:.72rem;color:rgba(255,255,255,.65);font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Bookings</div>
              </div>
              <div style="background:rgba(255,255,255,.1);border-radius:10px;padding:.75rem 1.25rem;text-align:center;border:1px solid rgba(255,255,255,.15);">
                <div style="font-size:1.4rem;font-weight:800;color:#fff;">₹{{ stats.totalSpent }}</div>
                <div style="font-size:.72rem;color:rgba(255,255,255,.65);font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Total Spent</div>
              </div>
            </div>
          </div>

          <!-- Two-column forms -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;">

            <!-- Edit profile -->
            <div class="card">
              <div class="card-header">
                <span class="card-title"><i class="fas fa-id-card" style="color:var(--primary);margin-right:.5rem;"></i>Personal Information</span>
              </div>
              <div class="card-body">
                <div v-if="successMessage" class="alert alert-success"><i class="fas fa-check-circle"></i> {{ successMessage }}</div>
                <div v-if="errorMessage"   class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> {{ errorMessage }}</div>
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
                <span class="card-title"><i class="fas fa-lock" style="color:var(--danger);margin-right:.5rem;"></i>Change Password</span>
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
                    <input class="form-control"
                      :class="pwForm.confirm && pwForm.confirm !== pwForm.newPw ? 'is-invalid' : ''"
                      type="password" v-model="pwForm.confirm" placeholder="Re-enter new password" required>
                    <div v-if="pwForm.confirm && pwForm.confirm !== pwForm.newPw" class="invalid-feedback">Passwords do not match</div>
                  </div>
                  <button type="submit" class="btn btn-block"
                    style="background:var(--danger);color:#fff;"
                    :disabled="changingPw || pwForm.newPw !== pwForm.confirm">
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
      stats: { totalBookings: 0, totalSpent: 0 },
      updating: false, successMessage: '', errorMessage: '',
      pwForm: { current: '', newPw: '', confirm: '' },
      changingPw: false, pwSuccess: '', pwError: ''
    };
  },

  methods: {
    async fetchProfile() {
      try {
        const res = await fetch('/api/profile', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        if (res.ok) {
          const d = await res.json();
          if (d.profile) {
            this.profile = { name: d.profile.name||'', username: d.profile.username||'', email: d.profile.email===('Not provided') ? '' : (d.profile.email||'') };
            this.stats.totalBookings = d.parking_stats?.total_bookings || 0;
            this.stats.totalSpent    = Math.round(parseFloat((d.parking_stats?.total_spent||'0').replace(/[₹,]/g,''))||0);
          }
        } else { this.errorMessage = 'Failed to load profile'; }
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
        if (res.ok) {
          this.successMessage = r.message || 'Profile updated!';
          await this.fetchProfile();
          setTimeout(() => { this.successMessage = ''; }, 4000);
        } else { this.errorMessage = r.message || 'Failed to update'; }
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
        if (res.ok && r.success) {
          this.pwSuccess = r.message || 'Password changed!';
          this.pwForm = { current:'', newPw:'', confirm:'' };
          setTimeout(() => { this.pwSuccess = ''; }, 4000);
        } else { this.pwError = r.message || 'Failed'; }
      } catch { this.pwError = 'Network error'; }
      finally { this.changingPw = false; }
    },

    logout() { localStorage.removeItem('token'); localStorage.removeItem('isAdmin'); this.$router.push('/login'); }
  },

  mounted() { this.fetchProfile(); }
};
