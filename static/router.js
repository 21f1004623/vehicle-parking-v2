import Vue from 'vue';
import VueRouter from 'vue-router';
import UserDashboard from './components/userdashboard';
import UserProfile from './components/userprofile';
import AdminDashboard from './components/admindashboard';
import AdminAnalytics from './components/adminanalytics';
import UserLogin from './components/userlogin';
import UserRegister from './components/userregister';
import UserBookings from './components/userbookings';
import UserAnalytics from './components/useranalytics';
import BookParking from './components/bookparking';

Vue.use(VueRouter);

const routes = [
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/login',
        name: 'login',
        component: UserLogin
    },
    {
        path: '/register',
        name: 'register',
        component: UserRegister
    },
    {
        path: '/user/dashboard',
        name: 'user-dashboard',
        component: UserDashboard,
        meta: { requiresAuth: true, requiresUser: true }
    },
    {
        path: '/user/profile',
        name: 'user-profile',
        component: UserProfile,
        meta: { requiresAuth: true, requiresUser: true }
    },
    {
        path: '/admin/dashboard',
        name: 'admin-dashboard',
        component: AdminDashboard,
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/admin/analytics',
        name: 'admin-analytics',
        component: AdminAnalytics,
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/dashboard',
        component: UserDashboard,
        beforeEnter: (to, from, next) => {
            const token = localStorage.getItem('token');
            const isAdmin = localStorage.getItem('isAdmin') === 'true';
            
            if (!token) {
                next('/login');
            } else if (isAdmin) {
                window.location.href = '/admin';
            } else {
                next();
            }
        }
    },
    {
        path: '/bookings',
        component: UserBookings,
        beforeEnter: (to, from, next) => {
            const token = localStorage.getItem('token');
            const isAdmin = localStorage.getItem('isAdmin') === 'true';
            
            if (!token) {
                next('/login');
            } else if (isAdmin) {
                window.location.href = '/admin';
            } else {
                next();
            }
        }
    },
    {
        path: '/analytics',
        component: UserAnalytics,
        beforeEnter: (to, from, next) => {
            const token = localStorage.getItem('token');
            const isAdmin = localStorage.getItem('isAdmin') === 'true';
            
            if (!token) {
                next('/login');
            } else if (isAdmin) {
                window.location.href = '/admin';
            } else {
                next();
            }
        }
    },
    {
        path: '/profile',
        component: UserProfile,
        beforeEnter: (to, from, next) => {
            const token = localStorage.getItem('token');
            const isAdmin = localStorage.getItem('isAdmin') === 'true';
            
            if (!token) {
                next('/login');
            } else if (isAdmin) {
                window.location.href = '/admin';
            } else {
                next();
            }
        }
    },
    {
        path: '/book-parking/:id',
        component: BookParking,
        beforeEnter: (to, from, next) => {
            const token = localStorage.getItem('token');
            const isAdmin = localStorage.getItem('isAdmin') === 'true';
            
            if (!token) {
                next('/login');
            } else if (isAdmin) {
                window.location.href = '/admin';
            } else {
                next();
            }
        }
    },
    {
        path: '*',
        redirect: '/login'
    }
];

const router = new VueRouter({
    mode: 'history',
    routes
});

router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    if (to.matched.some(record => record.meta.requiresAuth)) {
        if (!token) {
            next({ name: 'login' });
        } else if (to.matched.some(record => record.meta.requiresAdmin) && !isAdmin) {
            next({ name: 'user-dashboard' });
        } else if (to.matched.some(record => record.meta.requiresUser) && isAdmin) {
            next({ name: 'admin-dashboard' });
        } else {
            next();
        }
    } else {
        next();
    }
});

export default router; 