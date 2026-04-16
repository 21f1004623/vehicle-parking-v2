window.AdminDashboard = {
  template: `
    <div class="app-shell">

      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-brand">
          <a href="/"><div class="brand-icon"><i class="fas fa-car"></i></div>ParkEase</a>
        </div>
        <div class="sidebar-nav" style="padding-top:.75rem;">
          <span class="sidebar-section">Management</span>
          <button class="nav-btn" :class="{ active: activeSection==='parking' }" @click="setSection('parking')">
            <span class="nav-icon"><i class="fas fa-parking"></i></span>Parking Lots
          </button>
          <button class="nav-btn" :class="{ active: activeSection==='users' }" @click="setSection('users')">
            <span class="nav-icon"><i class="fas fa-users"></i></span>Users
          </button>
          <button class="nav-btn" :class="{ active: activeSection==='reservations' }" @click="setSection('reservations')">
            <span class="nav-icon"><i class="fas fa-calendar-check"></i></span>Reservations
          </button>
          <span class="sidebar-section" style="margin-top:.5rem;">Reports</span>
          <button class="nav-btn" @click="$router.push('/analytics')">
            <span class="nav-icon"><i class="fas fa-chart-bar"></i></span>Analytics
          </button>
          <button class="nav-btn" @click="exportCSV">
            <span class="nav-icon"><i class="fas fa-download"></i></span>Export CSV
          </button>
        </div>
        <div class="sidebar-footer">
          <button @click="logout"><i class="fas fa-sign-out-alt"></i> Sign Out</button>
        </div>
      </aside>

      <!-- Main -->
      <div class="main-content">
        <div class="top-bar">
          <div>
            <div class="top-bar-title">
              {{ activeSection === 'parking' ? 'Parking Lots' : activeSection === 'users' ? 'Users' : 'Reservations' }}
            </div>
            <div class="top-bar-subtitle">Admin Dashboard</div>
          </div>
          <button v-if="activeSection==='parking'" class="btn btn-primary btn-sm" @click="showAddModal">
            <i class="fas fa-plus"></i> Add Lot
          </button>
        </div>

        <div class="page-content">

          <!-- Stats -->
          <div class="stats-row" v-if="stats">
            <div class="stat-card">
              <div class="stat-icon indigo"><i class="fas fa-parking"></i></div>
              <div class="stat-body">
                <div class="stat-value">{{ stats.total_lots }}</div>
                <div class="stat-label">Parking Lots</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon blue"><i class="fas fa-users"></i></div>
              <div class="stat-body">
                <div class="stat-value">{{ stats.total_users }}</div>
                <div class="stat-label">Registered Users</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon green"><i class="fas fa-car"></i></div>
              <div class="stat-body">
                <div class="stat-value">{{ stats.active_reservations }}</div>
                <div class="stat-label">Active Now</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon amber"><i class="fas fa-rupee-sign"></i></div>
              <div class="stat-body">
                <div class="stat-value">₹{{ stats.total_revenue }}</div>
                <div class="stat-label">Total Revenue</div>
              </div>
            </div>
          </div>

          <!-- Alerts -->
          <div v-if="error" class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> {{ error }}
            <button class="btn btn-sm btn-ghost" style="margin-left:.5rem;" @click="retryLoad"><i class="fas fa-redo"></i></button>
          </div>
          <div v-if="successMessage" class="alert alert-success"><i class="fas fa-check-circle"></i> {{ successMessage }}</div>

          <!-- Loading -->
          <div v-if="loading" style="text-align:center;padding:4rem;">
            <div class="spinner spinner-dark spinner-lg" style="margin:0 auto 1rem;"></div>
            <p class="text-muted text-sm">Loading…</p>
          </div>

          <!-- ── Parking Lots ── -->
          <div v-if="activeSection==='parking' && !loading">
            <div v-if="parkingLots.length === 0" class="empty-state">
              <i class="fas fa-parking"></i>
              <h6>No parking lots yet</h6>
              <p>Add your first lot to get started.</p>
              <button class="btn btn-primary btn-sm" @click="showAddModal"><i class="fas fa-plus"></i> Add Lot</button>
            </div>
            <div v-else class="grid-3">
              <div v-for="lot in parkingLots" :key="lot.id" class="lot-card">
                <div class="lot-card-header">
                  <div class="flex items-center justify-between">
                    <h6 class="lot-name">{{ lot.prime_location_name }}</h6>
                    <span class="lot-badge" :class="lot.available_spots > 0 ? 'available' : 'full'">
                      {{ lot.available_spots > 0 ? lot.available_spots + ' free' : 'Full' }}
                    </span>
                  </div>
                </div>
                <div class="lot-card-body">
                  <div class="lot-meta">
                    <div class="lot-meta-item"><i class="fas fa-map-marker-alt"></i> {{ lot.address }}</div>
                    <div class="lot-meta-item"><i class="fas fa-map-pin"></i> PIN {{ lot.pin_code }}</div>
                  </div>
                  <div class="flex items-center justify-between mb-3">
                    <span class="lot-price">₹{{ Math.round(lot.price) }}/hr</span>
                    <span class="text-sm text-muted">{{ lot.available_spots }}/{{ lot.number_of_spots }} spots</span>
                  </div>
                  <div class="avail-bar">
                    <div class="avail-bar-fill"
                      :class="lot.available_spots/lot.number_of_spots > .5 ? 'high' : lot.available_spots/lot.number_of_spots > .2 ? 'medium' : 'low'"
                      :style="'width:' + (lot.available_spots/lot.number_of_spots*100) + '%'"></div>
                  </div>
                </div>
                <div class="lot-card-footer flex gap-2">
                  <button class="btn btn-ghost btn-sm" style="flex:1;" @click="editLot(lot)"><i class="fas fa-edit"></i> Edit</button>
                  <button class="btn btn-sm" style="flex:1;background:var(--danger-light);color:var(--danger);" @click="deleteLot(lot.id)"><i class="fas fa-trash"></i> Delete</button>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Users ── -->
          <div v-if="activeSection==='users' && !loading">
            <div class="card">
              <div class="card-body" style="padding:0;">
                <div v-if="users.length === 0" class="empty-state">
                  <i class="fas fa-users"></i><h6>No users found</h6>
                </div>
                <div v-else style="overflow-x:auto;">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>Name</th><th>Username</th><th>Email</th>
                        <th>Reservations</th><th>Total Spent</th><th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="u in users" :key="u.id">
                        <td class="fw-600">{{ u.name || u.username }}</td>
                        <td class="text-muted">@{{ u.username }}</td>
                        <td class="text-muted text-sm">{{ u.email || '—' }}</td>
                        <td>{{ u.total_reservations || 0 }}</td>
                        <td class="fw-600">₹{{ Math.round(u.total_revenue || 0) }}</td>
                        <td>
                          <span class="badge" :class="u.current_spot ? 'badge-green' : 'badge-gray'">
                            <i class="fas fa-circle" style="font-size:.45rem;"></i>
                            {{ u.current_spot ? 'Parked' : 'Inactive' }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- ── Reservations ── -->
          <div v-if="activeSection==='reservations' && !loading">
            <div class="card">
              <div class="card-header">
                <span class="card-title">All Reservations</span>
                <div class="pill-group">
                  <button class="pill" :class="reservationFilter==='all' ? 'active-all' : ''" @click="reservationFilter='all'">All</button>
                  <button class="pill" :class="reservationFilter==='active' ? 'active-avail' : ''" @click="reservationFilter='active'">Active</button>
                  <button class="pill" :class="reservationFilter==='completed' ? 'active-full' : ''" @click="reservationFilter='completed'">Completed</button>
                </div>
              </div>
              <div class="card-body" style="padding:0;">
                <div v-if="filteredReservations.length === 0" class="empty-state">
                  <i class="fas fa-calendar-check"></i><h6>No reservations found</h6>
                </div>
                <div v-else style="overflow-x:auto;">
                  <table class="data-table">
                    <thead>
                      <tr><th>User</th><th>Location</th><th>Vehicle</th><th>Check-in</th><th>Duration</th><th>Cost</th><th>Status</th><th></th></tr>
                    </thead>
                    <tbody>
                      <tr v-for="r in filteredReservations" :key="r.id">
                        <td class="fw-600">{{ r.username }}</td>
                        <td class="text-sm text-muted">{{ r.parking_lot_name }}</td>
                        <td><span class="badge badge-indigo">{{ r.vehicle_number }}</span></td>
                        <td class="text-sm">{{ formatDateTime(r.parking_timestamp) }}</td>
                        <td class="text-sm">{{ r.duration_hours }}h</td>
                        <td class="fw-600" style="color:var(--success);">₹{{ Math.round(r.parking_cost || 0) }}</td>
                        <td>
                          <span class="badge" :class="r.status==='active' ? 'badge-green' : 'badge-gray'">
                            <i class="fas fa-circle" style="font-size:.45rem;"></i>
                            {{ r.status === 'active' ? 'Active' : 'Done' }}
                          </span>
                        </td>
                        <td>
                          <button v-if="r.status==='active'" class="btn btn-sm" style="background:var(--danger-light);color:var(--danger);" @click="cancelReservation(r.id)">
                            <i class="fas fa-times"></i>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

        </div><!-- /page-content -->
      </div><!-- /main-content -->

      <!-- Add/Edit Modal -->
      <div v-if="showModal" class="modal-backdrop" @click.self="hideModal">
        <div class="modal-box">
          <div class="modal-header">
            <span class="modal-title">{{ editingLot ? 'Edit Parking Lot' : 'Add New Parking Lot' }}</span>
            <button class="modal-close" @click="hideModal"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <div v-if="validationErrors.length" class="alert alert-danger">
              <ul style="margin:0;padding-left:1.25rem;">
                <li v-for="e in validationErrors" :key="e">{{ e }}</li>
              </ul>
            </div>
            <div class="form-group">
              <label class="form-label">Location Name</label>
              <input class="form-control" v-model="form.prime_location_name" placeholder="e.g. MG Road Parking" required>
            </div>
            <div class="form-group">
              <label class="form-label">Address</label>
              <textarea class="form-control" v-model="form.address" rows="2" required></textarea>
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Price per Hour (₹)</label>
                <input class="form-control" type="number" v-model="form.price" min="1" required>
              </div>
              <div class="form-group">
                <label class="form-label">PIN Code</label>
                <input class="form-control" v-model="form.pin_code" required>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Number of Spots</label>
              <input class="form-control" type="number" v-model="form.number_of_spots" min="1" required>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" @click="hideModal">Cancel</button>
            <button class="btn btn-primary" @click="submitForm" :disabled="submitting">
              <span v-if="submitting" class="spinner"></span>
              <i v-else class="fas fa-save"></i>
              {{ editingLot ? 'Update' : 'Create' }}
            </button>
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
      parkingLots: [],
      users: [],
      reservations: [],
      stats: null,
      showModal: false,
      editingLot: false,
      editingLotId: null,
      submitting: false,
      validationErrors: [],
      form: { prime_location_name: '', address: '', price: '', pin_code: '', number_of_spots: '' },
      reservationFilter: 'all'
    };
  },

  computed: {
    filteredReservations() {
      if (!this.reservations) return [];
      if (this.reservationFilter === 'active') return this.reservations.filter(r => r.status === 'active');
      if (this.reservationFilter === 'completed') return this.reservations.filter(r => r.status === 'completed');
      return this.reservations;
    }
  },

  methods: {
    async setSection(s) { this.activeSection = s; this.clearMessages(); await this.loadData(); },
    async loadData() {
      this.loading = true; this.error = null;
      try {
        const token = localStorage.getItem('token');
        if (!token) { this.$router.push('/login'); return; }
        const endpoints = { parking: '/api/admin/parking-lots', users: '/api/admin/users', reservations: '/api/admin/reservations' };
        const res = await fetch(endpoints[this.activeSection], { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          if (this.activeSection === 'parking') this.parkingLots = data.lots || [];
          else if (this.activeSection === 'users') this.users = data.users || [];
          else this.reservations = data.reservations || [];
        } else if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token'); this.$router.push('/login');
        } else { this.error = `Failed to load ${this.activeSection} data`; }
      } catch { this.error = 'Network error'; }
      finally { this.loading = false; }
    },
    async loadStats() {
      try {
        const res = await fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        if (res.ok) this.stats = await res.json();
      } catch {}
    },
    retryLoad() { this.loadData(); },
    showAddModal() { this.resetForm(); this.showModal = true; },
    editLot(lot) { this.editingLot = true; this.editingLotId = lot.id; Object.assign(this.form, lot); this.showModal = true; },
    hideModal() { this.showModal = false; this.resetForm(); },
    resetForm() {
      this.editingLot = false; this.editingLotId = null; this.validationErrors = [];
      this.form = { prime_location_name: '', address: '', price: '', pin_code: '', number_of_spots: '' };
    },
    async submitForm() {
      this.submitting = true; this.validationErrors = [];
      try {
        const url = this.editingLot ? `/api/admin/parking-lots/${this.editingLotId}` : '/api/admin/parking-lots';
        const res = await fetch(url, {
          method: this.editingLot ? 'PUT' : 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...this.form, price: parseFloat(this.form.price), number_of_spots: parseInt(this.form.number_of_spots) })
        });
        if (res.ok) {
          this.successMessage = `Parking lot ${this.editingLot ? 'updated' : 'created'} successfully`;
          this.hideModal(); await this.loadData(); await this.loadStats();
        } else {
          const r = await res.json(); this.validationErrors = [r.message || 'Failed to save'];
        }
      } catch { this.validationErrors = ['Network error']; }
      finally { this.submitting = false; }
    },
    async deleteLot(id) {
      if (!confirm('Delete this parking lot?')) return;
      try {
        const res = await fetch(`/api/admin/parking-lots/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        if (res.ok) { this.successMessage = 'Parking lot deleted'; await this.loadData(); await this.loadStats(); }
        else this.error = 'Failed to delete';
      } catch { this.error = 'Network error'; }
    },
    async cancelReservation(id) {
      if (!confirm('Cancel this reservation?')) return;
      try {
        const res = await fetch(`/api/admin/cancel-booking/${id}`, {
          method: 'PUT', headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' }
        });
        if (res.ok) { this.successMessage = 'Reservation cancelled'; await this.loadData(); }
        else this.error = 'Failed to cancel';
      } catch { this.error = 'Network error'; }
    },
    async exportCSV() {
      try {
        const res = await fetch('/api/admin/export-csv', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        if (res.ok) {
          const blob = await res.blob();
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
          a.download = `admin_report_${new Date().toISOString().slice(0,10)}.csv`;
          a.click();
        }
      } catch {}
    },
    formatDateTime(s) { return s ? new Date(s).toLocaleString() : '—'; },
    clearMessages() { this.error = null; this.successMessage = null; },
    logout() { localStorage.removeItem('token'); this.$router.push('/login'); }
  },

  async mounted() {
    const s = this.$route.query.section;
    if (s && ['users','reservations','parking'].includes(s)) this.activeSection = s;
    await Promise.all([this.loadData(), this.loadStats()]);
  }
};
