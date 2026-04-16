window.AdminAnalytics = {
  template: `
    <div class="app-shell">

      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-brand">
          <a href="/"><div class="brand-icon"><i class="fas fa-car"></i></div>ParkEase</a>
        </div>
        <div class="sidebar-nav" style="padding-top:.75rem;">
          <span class="sidebar-section">Management</span>
          <button class="nav-btn" @click="$router.push('/dashboard')">
            <span class="nav-icon"><i class="fas fa-parking"></i></span>Parking Lots
          </button>
          <button class="nav-btn" @click="goTo('users')">
            <span class="nav-icon"><i class="fas fa-users"></i></span>Users
          </button>
          <button class="nav-btn" @click="goTo('reservations')">
            <span class="nav-icon"><i class="fas fa-calendar-check"></i></span>Reservations
          </button>
          <span class="sidebar-section" style="margin-top:.5rem;">Reports</span>
          <a href="#" class="active"><span class="nav-icon"><i class="fas fa-chart-bar"></i></span>Analytics</a>
        </div>
        <div class="sidebar-footer">
          <button @click="logout"><i class="fas fa-sign-out-alt"></i> Sign Out</button>
        </div>
      </aside>

      <!-- Main -->
      <div class="main-content">
        <div class="top-bar">
          <div>
            <div class="top-bar-title">Analytics &amp; Reports</div>
            <div class="top-bar-subtitle">Revenue, utilization and booking trends</div>
          </div>
        </div>

        <div class="page-content">

          <div v-if="error" class="alert alert-danger"><i class="fas fa-exclamation-circle"></i> {{ error }}
            <button class="btn btn-sm btn-ghost" style="margin-left:.5rem;" @click="loadData">Retry</button>
          </div>

          <div v-if="loading" style="text-align:center;padding:4rem;">
            <div class="spinner spinner-dark spinner-lg" style="margin:0 auto 1rem;"></div>
            <p class="text-muted text-sm">Loading analytics…</p>
          </div>

          <div v-else>
            <!-- Stats -->
            <div class="stats-row">
              <div class="stat-card" v-for="s in statsCards" :key="s.title">
                <div class="stat-icon" :class="s.iconClass"><i :class="s.icon"></i></div>
                <div class="stat-body">
                  <div class="stat-value">{{ s.value }}</div>
                  <div class="stat-label">{{ s.title }}</div>
                </div>
              </div>
            </div>

            <!-- Charts -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:1.25rem;">
              <div class="card">
                <div class="card-header"><span class="card-title"><i class="fas fa-chart-line" style="color:var(--primary);margin-right:.4rem;"></i>Revenue — Last 7 Days</span></div>
                <div class="card-body"><canvas id="revenue" height="200"></canvas></div>
              </div>
              <div class="card">
                <div class="card-header"><span class="card-title"><i class="fas fa-chart-pie" style="color:var(--success);margin-right:.4rem;"></i>Booking Status</span></div>
                <div class="card-body"><canvas id="status" height="200"></canvas></div>
              </div>
              <div class="card">
                <div class="card-header"><span class="card-title"><i class="fas fa-parking" style="color:var(--info);margin-right:.4rem;"></i>Lot Utilization</span></div>
                <div class="card-body"><canvas id="utilization" height="200"></canvas></div>
              </div>
              <div class="card">
                <div class="card-header"><span class="card-title"><i class="fas fa-chart-bar" style="color:var(--warning);margin-right:.4rem;"></i>Daily Bookings</span></div>
                <div class="card-body"><canvas id="daily" height="200"></canvas></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,

  data() {
    return { loading: false, error: null, data: { lots: [], users: [], bookings: [] }, chartInstances: {} };
  },

  computed: {
    stats() {
      return {
        revenue: this.data.bookings.reduce((s,b) => s + (b.parking_cost||0), 0),
        bookings: this.data.bookings.length,
        users: this.data.users.length,
        active: this.data.bookings.filter(b => b.status==='active').length
      };
    },
    statsCards() {
      return [
        { title: 'Total Revenue',  value: `₹${Math.round(this.stats.revenue)}`,  icon: 'fas fa-rupee-sign', iconClass: 'amber'  },
        { title: 'Total Bookings', value: this.stats.bookings,                    icon: 'fas fa-ticket-alt', iconClass: 'indigo' },
        { title: 'Registered Users', value: this.stats.users,                    icon: 'fas fa-users',      iconClass: 'blue'   },
        { title: 'Active Now',     value: this.stats.active,                      icon: 'fas fa-clock',      iconClass: 'green'  }
      ];
    }
  },

  methods: {
    async loadData() {
      this.loading = true; this.error = null;
      const token = localStorage.getItem('token');
      if (!token) return this.$router.push('/login');
      try {
        const [lr, ur, br] = await Promise.all([
          fetch('/api/admin/parking-lots', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/admin/reservations', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        if (lr.ok && ur.ok && br.ok) {
          const [ld, ud, bd] = await Promise.all([lr.json(), ur.json(), br.json()]);
          this.data = { lots: ld.lots||[], users: ud.users||[], bookings: bd.reservations||[] };
        } else { this.error = 'Failed to load data'; }
      } catch { this.error = 'Network error'; }
      finally { this.loading = false; }
    },

    initCharts() {
      this.destroyCharts();
      this.$nextTick(() => {
        this.createChart('revenue', 'line', this.getRevenueData(), '#6366f1');
        this.createChart('status', 'doughnut', this.getStatusData(), ['#10b981','#94a3b8']);
        this.createChart('utilization', 'pie', this.getUtilizationData(), ['#ef4444','#10b981']);
        this.createChart('daily', 'bar', this.getDailyData(), '#f59e0b');
      });
    },

    createChart(id, type, data, colors) {
      const canvas = document.getElementById(id); if (!canvas) return;
      this.chartInstances[id] = new Chart(canvas, {
        type,
        data: {
          labels: data.labels,
          datasets: [{ data: data.values, backgroundColor: Array.isArray(colors) ? colors : colors,
            borderColor: Array.isArray(colors) ? colors : colors, fill: type==='line', tension: 0.4 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: type!=='line', position: 'bottom' } } }
      });
    },

    getRevenueData() {
      const days = this.getLast7Days();
      return {
        labels: days.map(d => d.toLocaleDateString('en',{month:'short',day:'numeric'})),
        values: days.map(day => this.data.bookings.filter(b => new Date(b.parking_timestamp).toDateString()===day.toDateString()&&b.parking_cost).reduce((s,b)=>s+b.parking_cost,0))
      };
    },
    getStatusData() { return { labels:['Active','Completed'], values:[this.stats.active, this.stats.bookings-this.stats.active] }; },
    getUtilizationData() {
      const total = this.data.lots.reduce((s,l)=>s+l.number_of_spots,0);
      const occ = this.data.lots.reduce((s,l)=>s+(l.number_of_spots-l.available_spots),0);
      return { labels:['Occupied','Available'], values:[occ,total-occ] };
    },
    getDailyData() {
      const days = this.getLast7Days();
      return { labels:days.map(d=>d.toLocaleDateString('en',{weekday:'short'})), values:days.map(day=>this.data.bookings.filter(b=>new Date(b.parking_timestamp).toDateString()===day.toDateString()).length) };
    },
    getLast7Days() { return Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); return d; }); },
    destroyCharts() { Object.values(this.chartInstances).forEach(c=>c?.destroy()); this.chartInstances={}; },
    goTo(section) { this.$router.push({ path:'/dashboard', query:{ section } }); },
    logout() { localStorage.removeItem('token'); this.$router.push('/login'); }
  },

  async mounted() { await this.loadData(); this.initCharts(); },
  beforeDestroy() { this.destroyCharts(); }
};
