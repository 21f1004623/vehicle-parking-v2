window.UserBookings = {
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
          <a href="#" class="active"><span class="nav-icon"><i class="fas fa-calendar-check"></i></span>My Bookings</a>
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
            <div class="top-bar-title">My Bookings</div>
            <div class="top-bar-subtitle">Active &amp; completed reservations</div>
          </div>
          <button class="btn btn-success btn-sm" @click="exportToCSV">
            <i class="fas fa-download"></i> Export CSV
          </button>
        </div>

        <div class="page-content">

          <!-- Active Bookings -->
          <div style="margin-bottom:2rem;">
            <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1rem;">
              <span class="badge badge-green"><i class="fas fa-circle" style="font-size:.45rem;"></i> Live</span>
              <h5 style="margin:0;font-weight:700;">Current Bookings</h5>
            </div>

            <div v-if="activeBookings.length === 0" class="empty-state" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);">
              <i class="fas fa-calendar-plus"></i>
              <h6>No active bookings</h6>
              <p>You're not currently parked anywhere.</p>
              <router-link to="/dashboard" class="btn btn-primary btn-sm"><i class="fas fa-plus"></i> Book Parking</router-link>
            </div>

            <div class="grid-3">
              <div v-for="b in activeBookings" :key="b.id" class="booking-card">
                <div class="booking-card-top">
                  <div>
                    <div style="font-size:.95rem;font-weight:700;">{{ b.parking_lot.prime_location_name }}</div>
                    <div class="text-sm text-muted">{{ b.parking_lot.address }}</div>
                  </div>
                  <span class="badge badge-green"><i class="fas fa-circle" style="font-size:.45rem;"></i> Live</span>
                </div>
                <div class="booking-card-body">
                  <div style="display:flex;gap:.5rem;margin-bottom:.75rem;flex-wrap:wrap;">
                    <span class="badge badge-indigo"><i class="fas fa-car"></i> {{ b.vehicle_number }}</span>
                    <span class="badge badge-gray"><i class="fas fa-clock"></i> {{ formatDate(b.parking_timestamp) }}</span>
                  </div>
                  <div class="booking-timer">
                    <div>
                      <div class="timer-label">Elapsed</div>
                      <div class="timer-value">{{ getLiveDuration(b.parking_timestamp) }}</div>
                    </div>
                    <div style="text-align:right;">
                      <div class="timer-label">Est. Cost</div>
                      <div class="timer-cost">₹{{ getLiveEstimatedCost(b) }}</div>
                    </div>
                  </div>
                  <button class="btn btn-block" style="background:var(--warning-light);color:#92400e;" @click="endBooking(b.id)">
                    <i class="fas fa-stop-circle"></i> End Booking
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- History -->
          <div>
            <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1rem;">
              <span class="badge badge-gray"><i class="fas fa-history"></i> History</span>
              <h5 style="margin:0;font-weight:700;">Past Bookings</h5>
            </div>

            <div v-if="bookingHistory.length === 0" class="empty-state" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);">
              <i class="fas fa-history"></i>
              <h6>No booking history</h6>
              <p>Your completed bookings will appear here.</p>
            </div>

            <div v-else class="card">
              <div class="card-body" style="padding:0;overflow-x:auto;">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Location</th><th>Address</th><th>Vehicle</th>
                      <th>Check-in</th><th>Check-out</th><th>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="b in bookingHistory" :key="b.id">
                      <td class="fw-600">{{ b.parking_lot.prime_location_name }}</td>
                      <td class="text-sm text-muted">{{ b.parking_lot.address }}</td>
                      <td><span class="badge badge-indigo">{{ b.vehicle_number }}</span></td>
                      <td class="text-sm">{{ formatDate(b.parking_timestamp) }}</td>
                      <td class="text-sm">{{ formatDate(b.leaving_timestamp) }}</td>
                      <td><span class="badge badge-green">₹{{ Math.round(b.parking_cost) }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,

  data() {
    return { activeBookings: [], bookingHistory: [], currentTime: new Date(), timerInterval: null };
  },

  methods: {
    getLiveDuration(t) {
      const diff = this.currentTime - new Date(t);
      if (diff < 0) return '0m';
      const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000);
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    },
    getLiveEstimatedCost(b) {
      const hours = Math.max((this.currentTime - new Date(b.parking_timestamp)) / 3600000, 1);
      return Math.round(hours * (b.hourly_rate || 0));
    },
    formatDate(s) { return s ? new Date(s).toLocaleString() : '—'; },
    async fetchBookings() {
      try {
        const res = await fetch('/api/bookings', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        if (res.ok) {
          const data = await res.json();
          if (data.bookings) {
            const mapped = data.bookings.map(b => ({
              id: b.id,
              parking_timestamp: b.started_at,
              leaving_timestamp: b.ended_at,
              parking_cost: parseFloat(b.cost.replace(/[₹,]/g,'')) || 0,
              vehicle_number: b.vehicle_number,
              hourly_rate: parseFloat((b.hourly_rate||'0').toString().replace(/[₹,/hour]/g,'')) || 0,
              parking_lot: { prime_location_name: b.location.name, address: b.location.address },
              status: b.status
            }));
            this.activeBookings = mapped.filter(b => b.status === 'active');
            this.bookingHistory = mapped.filter(b => b.status === 'completed');
          }
        }
      } catch {}
    },
    async endBooking(id) {
      if (!confirm('End this booking?')) return;
      try {
        const res = await fetch(`/api/reservations/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        if (res.ok) { const r = await res.json(); alert(`Booking ended. Cost: ${r.bill_summary?.total_cost ?? 'N/A'}`); this.fetchBookings(); }
        else { const e = await res.json(); alert(e.message || 'Failed'); }
      } catch { alert('Failed to end booking'); }
    },
    async exportToCSV() {
      try {
        const res = await fetch('/api/user/export-csv', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        if (res.ok) {
          const a = document.createElement('a'); a.href = URL.createObjectURL(await res.blob());
          a.download = `my_parking_${new Date().toISOString().slice(0,10)}.csv`; a.click();
        }
      } catch {}
    },
    logout() { localStorage.removeItem('token'); localStorage.removeItem('isAdmin'); this.$router.push('/login'); }
  },

  mounted() {
    this.fetchBookings();
    this.timerInterval = setInterval(() => { this.currentTime = new Date(); }, 30000);
  },
  beforeDestroy() { if (this.timerInterval) clearInterval(this.timerInterval); }
};
