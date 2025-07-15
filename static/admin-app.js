const { createApp } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

// Simple auth guard
const requireAuth = (to, from, next) => {
    const token = localStorage.getItem('token');
    
    if (token) {
        next();
    } else {
        next('/login');
    }
};

const routes = [
    { path: '/login', component: window.AdminLogin },
    { path: '/dashboard', component: window.AdminDashboard, beforeEnter: requireAuth },
    { path: '/analytics', component: window.AdminAnalytics, beforeEnter: requireAuth },
    { path: '/', redirect: '/login' }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

const app = createApp({});
app.use(router);
app.mount('#admin-app');
  