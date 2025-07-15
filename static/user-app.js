const { createApp } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

// Simple auth guard
const requireAuth = (to, from, next) => {
    if (localStorage.getItem('token')) {
        next();
    } else {
        next('/login');
    }
};

const routes = [
    { path: '/login', component: window.UserLogin },
    { path: '/register', component: window.UserRegister },
    { path: '/dashboard', component: window.UserDashboard, beforeEnter: requireAuth },
    { path: '/bookings', component: window.UserBookings, beforeEnter: requireAuth },
    { path: '/analytics', component: window.UserAnalytics, beforeEnter: requireAuth },
    { path: '/profile', component: window.UserProfile, beforeEnter: requireAuth },
        { path: '/book-parking/:id', component: window.BookParking, beforeEnter: requireAuth },
    { path: '/', redirect: '/login' }
];

try {
    const router = createRouter({
        history: createWebHashHistory(),
        routes
    });
    
    const app = createApp({});
    app.use(router);
    app.mount('#app');
    
} catch (error) {
    // Vue app initialization failed
    
    // Fallback: show error message
    document.getElementById('app').innerHTML = `
        <div class="alert alert-danger m-4">
            <h4>Application Error</h4>
            <p>Unable to load the application. Please refresh the page.</p>
        </div>
    `;
}