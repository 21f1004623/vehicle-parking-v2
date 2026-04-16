window.UserDashboard = {
  template: `
    <div class="app-shell">

      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-brand">
          <a href="/"><div class="brand-icon"><i class="fas fa-car"></i></div>ParkEase</a>
        </div>
        <div style="padding:.75rem .75rem .25rem;font-size:.72rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#334155;">
          Hi, {{ userName || 'User' }}
        </div>
        <div class="sidebar-nav">
          <span class="sidebar-section">Menu</span>
          <a href="#" class="active"><span class="nav-icon"><i class="fas fa-home"></i></span>Dashboard</a>
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
            <div class="top-bar-title">Available Parking</div>
            <div class="top-bar-subtitle">{{ filteredLots.length }} of {{ parkingLots.length }} locations shown</div>
          </div>
        </div>

        <div class="page-content">

          <!-- Filter bar -->
          <div class="filter-bar">
            <div class="input-wrap">
              <i class="fas fa-search"></i>
              <input class="form-control" v-model="searchQuery" placeholder="Search by name or address…">
            </div>
            <div class="pill-group">
              <button class="pill" :class="availabilityFilter==='all' ? 'active-all' : ''" @click="availabilityFilter='all'">All</button>
              <button class="pill" :class="availabilityFilter==='available' ? 'active-avail' : ''" @click="availabilityFilter='available'">Available</button>
              <button class="pill" :class="availabilityFilter==='full' ? 'active-full' : ''" @click="availabilityFilter='full'">Full</button>
            </div>
            <select class="form-select" style="width:auto;min-width:170px;" v-model="sortBy">
              <option value="default">Sort: Default</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="availability">Most Available</option>
            </select>
          </div>

          <!-- Empty / No results -->
          <div v-if="filteredLots.length === 0 && parkingLots.length > 0" class="empty-state">
            <i class="fas fa-search"></i>
            <h6>No matching locations</h6>
            <p>Try adjusting your search or filters.</p>
            <button class="btn btn-ghost btn-sm" @click="clearFilters">Clear Filters</button>
          </div>

          <div v-else-if="parkingLots.length === 0" class="empty-state">
            <i class="fas fa-parking"></i>
            <h6>No parking lots available</h6>
            <p>Check back later.</p>
          </div>

          <!-- Lots grid -->
          <div v-else class="grid-3">
            <div v-for="lot in filteredLots" :key="lot.id" class="lot-card" :class="lot.spots_available === 0 ? 'full' : ''">
              <div class="lot-card-header">
                <div class="flex items-center justify-between">
                  <h6 class="lot-name">{{ lot.name }}</h6>
                  <span class="lot-badge" :class="lot.spots_available === 0 ? 'full' : 'available'">
                    {{ lot.spots_available === 0 ? 'Full' : lot.spots_available + ' free' }}
                  </span>
                </div>
              </div>
              <div class="lot-card-body">
                <div class="lot-meta">
                  <div class="lot-meta-item"><i class="fas fa-map-marker-alt"></i> {{ lot.address }}</div>
                  <div class="lot-meta-item"><i class="fas fa-map-pin"></i> PIN {{ lot.postal_code }}</div>
                </div>
                <div class="flex items-center justify-between mb-3">
                  <span class="lot-price">₹{{ Math.round(lot.hourly_rate) }}/hr</span>
                  <span class="text-sm text-muted">{{ lot.spots_available }}/{{ lot.total_spots }}</span>
                </div>
                <div class="mb-3">
                  <div class="avail-bar">
                    <div class="avail-bar-fill"
                      :class="lot.spots_available/lot.total_spots > .5 ? 'high' : lot.spots_available/lot.total_spots > .2 ? 'medium' : 'low'"
                      :style="'width:' + (lot.spots_available/lot.total_spots*100) + '%'"></div>
                  </div>
                </div>
              </div>
              <div class="lot-card-footer">
                <button class="btn btn-block"
                  :class="lot.spots_available === 0 ? 'btn-ghost' : 'btn-primary'"
                  :disabled="lot.spots_available === 0"
                  @click="bookParking(lot.id)">
                  <i class="fas" :class="lot.spots_available === 0 ? 'fa-ban' : 'fa-parking'"></i>
                  {{ lot.spots_available === 0 ? 'No Spots Available' : 'Book This Spot' }}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,

  data() { return { parkingLots: [], userName: '', searchQuery: '', availabilityFilter: 'all', sortBy: 'default' }; },

  computed: {
    filteredLots() {
      let lots = [...this.parkingLots];
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase();
        lots = lots.filter(l => l.name.toLowerCase().includes(q) || l.address.toLowerCase().includes(q) || (l.postal_code && l.postal_code.includes(q)));
      }
      if (this.availabilityFilter === 'available') lots = lots.filter(l => l.spots_available > 0);
      else if (this.availabilityFilter === 'full') lots = lots.filter(l => l.spots_available === 0);
      if (this.sortBy === 'price_asc') lots.sort((a,b) => a.hourly_rate - b.hourly_rate);
      else if (this.sortBy === 'price_desc') lots.sort((a,b) => b.hourly_rate - a.hourly_rate);
      else if (this.sortBy === 'availability') lots.sort((a,b) => b.spots_available - a.spots_available);
      return lots;
    }
  },

  methods: {
    clearFilters() { this.searchQuery = ''; this.availabilityFilter = 'all'; this.sortBy = 'default'; },
    async fetchParkingLots() {
      try {
        const res = await fetch(`/api/parking-lots?_t=${Date.now()}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        if (res.ok) { const d = await res.json(); if (d.success) this.parkingLots = d.locations || []; }
      } catch {}
    },
    async fetchUserName() {
      try {
        const res = await fetch('/api/profile', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        if (res.ok) { const d = await res.json(); if (d.success && d.profile) this.userName = d.profile.name || d.profile.username; }
      } catch {}
    },
    bookParking(lotId) { this.$router.push(`/book-parking/${lotId}`); },
    logout() { localStorage.removeItem('token'); localStorage.removeItem('isAdmin'); this.$router.push('/login'); }
  },

  mounted() { this.fetchParkingLots(); this.fetchUserName(); },
  watch: { '$route'(to) { if (to.path === '/dashboard') this.fetchParkingLots(); } }
};
