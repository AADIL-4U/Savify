import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request Interceptor: Attach JWT token if it exists
api.interceptors.request.use(
    (config) => {
        const user = JSON.parse(localStorage.getItem('savify_user'));
        if (user && user.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Do not force logout for endpoints where 401 can mean
            // an expected validation failure rather than an invalid session.
            const isPasswordUpdate = error.config?.url?.includes('/auth/password');

            const isPasswordRecovery =
                error.config?.url?.includes('/auth/forgot-password') ||
                error.config?.url?.includes('/auth/reset-password');

            const isAccountDeletion =
                error.config?.url?.includes('/auth/account');

            // Trigger global logout only for genuine authentication/session failures.
            if (
                !isPasswordUpdate &&
                !isPasswordRecovery &&
                !isAccountDeletion &&
                window.location.pathname !== '/login' &&
                window.location.pathname !== '/register'
            ) {
                localStorage.removeItem('savify_user');
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default api;