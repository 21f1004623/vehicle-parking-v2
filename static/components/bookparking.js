window.BookParking = {
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
          <router-link to="/profile"><span class="nav-icon"><i class="fas fa-user"></i></span>Profile</router-link>
        </div>
        <div class="sidebar-footer">
          <button @click="logout"><i class="fas fa-sign-out-alt"></i> Sign Out</button>
        </div>
      </aside>

      <!-- Main -->
      <div class="main-content">
        <div class="top-bar">
          <div>
            <div class="top-bar-title">Book a Spot</div>
            <div class="top-bar-subtitle">Select a lot and enter your vehicle number</div>
          </div>
          <router-link to="/dashboard" class="btn btn-ghost btn-sm"><i class="fas fa-arrow-left"></i> Back</router-link>
        </div>

        <div class="page-content">
          <div style="max-width:540px;">

            <div class="card">
              <div class="card-header">
                <span class="card-title"><i class="fas fa-parking" style="color:var(--primary);margin-right:.4rem;"></i>New Reservation</span>
              </div>
              <div class="card-body">

                <!-- Loading -->
                <div v-if="loading" style="text-align:center;padding:3rem;">
                  <div class="spinner spinner-dark spinner-lg" style="margin:0 auto 1rem;"></div>
                  <p class="text-muted text-sm">Loading lots…</p>
                </div>

                <!-- Error -->
                <div v-else-if="error" class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> {{ error }}</div>

                <!-- Form -->
                <form v-else @submit.prevent="bookParking">
                  <div class="form-group">
                    <label class="form-label">Parking Lot</label>
                    <select class="form-select" v-model="selectedLotId" required>
                      <option value="">Choose a parking lot…</option>
                      <option v-for="lot in availableLots" :key="lot.id" :value="lot.id" :disabled="lot.spots_available === 0">
                        {{ lot.name }} — ₹{{ Math.round(lot.hourly_rate) }}/hr
                        ({{ lot.spots_available > 0 ? lot.spots_available + ' spots free' : 'Full' }})
                      </option>
                    </select>
                  </div>

                  <!-- Selected lot preview -->
                  <div v-if="selectedLot" class="card" style="margin-bottom:1rem;background:#fafbff;">
                    <div class="card-body" style="padding:.875rem 1rem;">
                      <div style="font-weight:700;margin-bottom:.25rem;">{{ selectedLot.name }}</div>
                      <div class="text-sm text-muted" style="margin-bottom:.4rem;"><i class="fas fa-map-marker-alt" style="margin-right:.3rem;"></i>{{ selectedLot.address }}</div>
                      <div class="flex gap-2" style="flex-wrap:wrap;">
                        <span class="badge badge-indigo"><i class="fas fa-tag"></i> ₹{{ Math.round(selectedLot.hourly_rate) }}/hr</span>
                        <span class="badge badge-green"><i class="fas fa-parking"></i> {{ selectedLot.spots_available }} spots free</span>
                      </div>
                    </div>
                  </div>

                  <div class="form-group" style="margin-bottom:1.5rem;">
                    <label class="form-label">Vehicle Number</label>
                    <input class="form-control" type="text" v-model="vehicleNumber"
                      placeholder="e.g. MH 01 AB 1234" required style="text-transform:uppercase;">
                    <p class="form-hint">Enter your registration plate number</p>
                  </div>

                  <div style="display:flex;gap:.75rem;">
                    <button type="submit" class="btn btn-primary" style="flex:1;"
                      :disabled="!selectedLotId || !vehicleNumber || booking || (selectedLot && selectedLot.spots_available === 0)">
                      <span v-if="booking" class="spinner"></span>
                      <i v-else class="fas fa-check"></i>
                      {{ booking ? 'Booking…' : 'Confirm Booking' }}
                    </button>
                    <router-link to="/dashboard" class="btn btn-ghost">Cancel</router-link>
                  </div>
                </form>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,

  data() { return { availableLots: [], selectedLotId: '', vehicleNumber: '', loading: true, error: null, booking: false }; },

  computed: {
    selectedLot() { return this.availableLots.find(l => l.id === parseInt(this.selectedLotId)); }
  },

  methods: {
    async fetchAvailableLots() {
      this.loading = true; this.error = null;
      try {
        const res = await fetch('/api/parking-lots', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        if (res.ok) {
          const d = await res.json();
          if (d.locations) { this.availableLots = d.locations; const id = this.$route.params.id; if (id) this.selectedLotId = parseInt(id); }
        } else this.error = 'Failed to load parking lots';
      } catch { this.error = 'Network error'; }
      finally { this.loading = false; }
    },
    async bookParking() {
      if (!this.selectedLotId || !this.vehicleNumber) return;
      this.booking = true;
      try {
        const res = await fetch('/api/reservations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ lot_id: parseInt(this.selectedLotId), vehicle_number: this.vehicleNumber.toUpperCase() })
        });
        if (res.ok) {
          Toast.success('Parking booked successfully!');
          setTimeout(() => this.$router.push('/bookings'), 1200);
        } else {
          const e = await res.json();
          Toast.error(e.message || 'Booking failed');
        }
      } catch { Toast.error('Booking failed. Please try again.'); }
      finally { this.booking = false; }
    },
    logout() { localStorage.removeItem('token'); localStorage.removeItem('isAdmin'); this.$router.push('/login'); }
  },

  mounted() { this.fetchAvailableLots(); }
};
