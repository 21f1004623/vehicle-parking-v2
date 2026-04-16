window.UserAnalytics = {
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
          <a href="#" class="active"><span class="nav-icon"><i class="fas fa-chart-line"></i></span>Analytics</a>
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
            <div class="top-bar-title">My Analytics</div>
            <div class="top-bar-subtitle">Your parking activity overview</div>
          </div>
        </div>

        <div class="page-content">

          <div v-if="loading" style="text-align:center;padding:4rem;">
            <div class="spinner spinner-dark spinner-lg" style="margin:0 auto 1rem;"></div>
            <p class="text-muted text-sm">Loading stats…</p>
          </div>

          <div v-else-if="!hasData" class="empty-state" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);">
            <i class="fas fa-chart-line"></i>
            <h6>No data yet</h6>
            <p>Start parking to see your stats!</p>
            <router-link to="/dashboard" class="btn btn-primary btn-sm"><i class="fas fa-parking"></i> Find Parking</router-link>
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
            <div style="display:grid;grid-template-columns:2fr 1fr;gap:1.25rem;margin-bottom:1.25rem;">
              <div class="card">
                <div class="card-header"><span class="card-title"><i class="fas fa-chart-line" style="color:var(--primary);margin-right:.4rem;"></i>Monthly Spending</span></div>
                <div class="card-body"><canvas id="spending" height="180"></canvas></div>
              </div>
              <div class="card">
                <div class="card-header"><span class="card-title"><i class="fas fa-lightbulb" style="color:var(--warning);margin-right:.4rem;"></i>Quick Facts</span></div>
                <div class="card-body">
                  <div v-for="f in quickFacts" :key="f.label" style="margin-bottom:1.1rem;">
                    <div class="text-xs text-muted" style="margin-bottom:.2rem;text-transform:uppercase;letter-spacing:.06em;font-weight:700;">{{ f.label }}</div>
                    <div style="font-size:1.2rem;font-weight:800;" :style="'color:'+f.color">{{ f.value }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-header"><span class="card-title"><i class="fas fa-chart-bar" style="color:var(--success);margin-right:.4rem;"></i>Weekly Usage Pattern</span></div>
              <div class="card-body"><canvas id="weekly" height="120"></canvas></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,

  data() { return { bookings: [], loading: true, charts: {} }; },

  computed: {
    hasData() { return this.bookings.length > 0; },
    totalSpent() { return this.bookings.reduce((s,b) => s+(b.parking_cost||0), 0); },
    avgDuration() {
      const done = this.bookings.filter(b=>b.leaving_timestamp);
      if (!done.length) return 0;
      return (done.reduce((s,b) => s+((new Date(b.leaving_timestamp)-new Date(b.parking_timestamp))/3600000), 0)/done.length).toFixed(1);
    },
    favoriteLocation() {
      if (!this.hasData) return '—';
      const locs = {}; this.bookings.forEach(b => { const l=b.parking_lot_name||'Unknown'; locs[l]=(locs[l]||0)+1; });
      const fav = Object.keys(locs).reduce((a,b)=>locs[a]>locs[b]?a:b);
      return fav.length > 14 ? fav.slice(0,14)+'…' : fav;
    },
    preferredDay() {
      if (!this.hasData) return '—';
      const days = {}; this.bookings.forEach(b => { const d=new Date(b.parking_timestamp).toLocaleDateString('en',{weekday:'long'}); days[d]=(days[d]||0)+1; });
      return Object.keys(days).reduce((a,b)=>days[a]>days[b]?a:b);
    },
    thisMonthSpending() {
      const now = new Date();
      return this.bookings.filter(b=>{ const d=new Date(b.parking_timestamp); return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear(); }).reduce((s,b)=>s+(b.parking_cost||0),0);
    },
    statsCards() {
      return [
        { title:'Total Bookings', value:this.bookings.length,                                            icon:'fas fa-parking',         iconClass:'indigo' },
        { title:'Total Spent',    value:`₹${Math.round(this.totalSpent)}`,                               icon:'fas fa-rupee-sign',       iconClass:'amber'  },
        { title:'Avg Duration',   value:`${this.avgDuration}h`,                                          icon:'fas fa-clock',            iconClass:'blue'   },
        { title:'This Month',     value:`₹${Math.round(this.thisMonthSpending)}`,                        icon:'fas fa-calendar',         iconClass:'green'  }
      ];
    },
    quickFacts() {
      return [
        { label:'Top Day',       value:this.preferredDay,                                                color:'var(--primary)' },
        { label:'Favourite Lot', value:this.favoriteLocation,                                            color:'var(--success)' },
        { label:'Avg/Booking',   value:`₹${this.hasData ? Math.round(this.totalSpent/this.bookings.length) : 0}`, color:'var(--warning)' }
      ];
    }
  },

  methods: {
    async fetchBookings() {
      const token = localStorage.getItem('token');
      if (!token) return this.$router.push('/login');
      try {
        const res = await fetch('/api/bookings', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const d = await res.json();
          this.bookings = (d.bookings||[]).map(b => ({
            id: b.id, parking_timestamp: b.started_at, leaving_timestamp: b.ended_at,
            parking_cost: parseFloat(b.cost.replace('₹','').replace(',',''))||0,
            vehicle_number: b.vehicle_number, parking_lot_name: b.location.name, status: b.status
          }));
        } else if (res.status===401) { localStorage.removeItem('token'); this.$router.push('/login'); }
      } catch {}
      finally { this.loading = false; }
    },

    initCharts() {
      if (!this.hasData) return;
      this.destroyCharts();
      this.$nextTick(() => { this.createSpendingChart(); this.createWeeklyChart(); });
    },

    createSpendingChart() {
      const canvas = document.getElementById('spending'); if (!canvas) return;
      const months = Array.from({length:6},(_,i)=>{ const d=new Date(); d.setMonth(d.getMonth()-(5-i)); return d; });
      this.charts.spending = new Chart(canvas, {
        type:'line',
        data: {
          labels: months.map(m=>m.toLocaleDateString('en',{month:'short'})),
          datasets:[{ data:months.map(m=>this.bookings.filter(b=>{ const d=new Date(b.parking_timestamp); return d.getMonth()===m.getMonth()&&d.getFullYear()===m.getFullYear(); }).reduce((s,b)=>s+(b.parking_cost||0),0)),
            borderColor:'#6366f1', backgroundColor:'rgba(99,102,241,.1)', fill:true, tension:0.4 }]
        },
        options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } } }
      });
    },

    createWeeklyChart() {
      const canvas = document.getElementById('weekly'); if (!canvas) return;
      const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      this.charts.weekly = new Chart(canvas, {
        type:'bar',
        data: { labels:days, datasets:[{ data:days.map((_,i)=>this.bookings.filter(b=>new Date(b.parking_timestamp).getDay()===i).length), backgroundColor:'rgba(16,185,129,.7)', borderColor:'#10b981', borderWidth:1 }] },
        options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } } }
      });
    },

    destroyCharts() { Object.values(this.charts).forEach(c=>c?.destroy()); this.charts={}; },
    logout() { localStorage.removeItem('token'); localStorage.removeItem('isAdmin'); this.$router.push('/login'); }
  },

  async mounted() { await this.fetchBookings(); this.initCharts(); },
  beforeDestroy() { this.destroyCharts(); }
};
