const Storage = {
    saveSession: (token, user) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('user_profile', JSON.stringify(user));
    },

    getToken: () => {
        return localStorage.getItem('auth_token');
    },

    getUser: () => {
        const user = localStorage.getItem('user_profile');
        return user ? JSON.parse(user) : null;
    },

    clearSession: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_profile');
    }
};

export default Storage;