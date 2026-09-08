/**
 * VeriScan Authentication Engine & Session Manager
 * Universal local session management, simulated OAuth, SMS OTP,
 * and sleek top-bar profile integration.
 */

const VeriScanAuth = (function () {
    const STORAGE_KEY = 'veriscan_auth_user';
    const REGISTERED_USERS_KEY = 'veriscan_registered_users';

    // Built-in Demo Accounts
    const DUMMY_CREDENTIALS = [
        {
            email: 'analyst@veriscan.io',
            password: 'Password@123',
            name: 'Dr. Evelyn Reed',
            role: 'Lead Forensic Investigator',
            tier: 'Enterprise Pro',
            handle: '@evelyn_threatlab',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            scansCount: 142
        },
        {
            email: 'threatlab@agency.gov',
            password: 'VeriScan#2026',
            name: 'Marcus Vance',
            role: 'OSINT Specialist',
            tier: 'Verified Security',
            handle: '@marcus_v',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
            scansCount: 89
        },
        {
            email: 'demo@veriscan.com',
            password: 'DemoUser@2026',
            name: 'Alex Morgan',
            role: 'Cyber Risk Analyst',
            tier: 'Pro Investigator',
            handle: '@alex_m',
            avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
            scansCount: 47
        }
    ];

    function getRegisteredUsers() {
        try {
            const raw = localStorage.getItem(REGISTERED_USERS_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) {
            console.warn('Error reading registered users:', e);
        }
        return [...DUMMY_CREDENTIALS];
    }

    function registerUser(userData) {
        try {
            const list = getRegisteredUsers();
            const existingIdx = list.findIndex(u => u.email && userData.email && u.email.toLowerCase() === userData.email.toLowerCase());
            if (existingIdx >= 0) {
                list[existingIdx] = { ...list[existingIdx], ...userData };
            } else {
                list.unshift(userData);
            }
            localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(list));
        } catch (e) {
            console.warn('Error saving user:', e);
        }
    }

    function getCurrentUser() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) return JSON.parse(data);
        } catch (e) {
            console.warn('Error reading user session:', e);
        }
        return null;
    }

    function setCurrentUser(user) {
        try {
            if (!user) {
                localStorage.removeItem(STORAGE_KEY);
            } else {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
            }
            window.dispatchEvent(new CustomEvent('veriscan_auth_changed', { detail: user }));
        } catch (e) {
            console.warn('Error saving session:', e);
        }
    }

    function requireAuth(redirectUrl = 'login.html') {
        const user = getCurrentUser();
        const path = window.location.pathname.toLowerCase();
        const isAuthPage = path.endsWith('login.html');
        if (!user && !isAuthPage) {
            const redirectParam = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.replace(redirectUrl + (redirectUrl.includes('?') ? '&' : '?') + 'redirect=' + redirectParam);
            return false;
        }
        return true;
    }

    function logout(redirectUrl = 'login.html') {
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new CustomEvent('veriscan_auth_changed', { detail: null }));
        window.location.href = redirectUrl;
    }

    function loginWithEmail(email, password, name = null) {
        const cleanEmail = email.trim().toLowerCase();
        const registered = getRegisteredUsers();
        const found = registered.find(u => u.email && u.email.toLowerCase() === cleanEmail);

        const userName = name || (found && found.name) || cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        const user = {
            id: (found && found.id) || 'usr_' + Date.now().toString(36),
            name: userName,
            email: cleanEmail,
            password: password,
            handle: '@' + cleanEmail.split('@')[0],
            role: (found && found.role) || 'Forensic Analyst',
            tier: (found && found.tier) || 'Enterprise Pro',
            avatar: (found && found.avatar) || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`,
            provider: 'email',
            verified: true,
            scansCount: (found && found.scansCount) || 12,
            joinedDate: (found && found.joinedDate) || 'Aug 2026',
            loginTime: new Date().toISOString()
        };

        registerUser(user);
        setCurrentUser(user);
        return user;
    }

    function loginWithGoogle(googleData) {
        const cleanEmail = (googleData.email || 'user@gmail.com').toLowerCase();
        const user = {
            id: 'usr_goog_' + Date.now().toString(36),
            name: googleData.name || 'Google Analyst',
            email: cleanEmail,
            handle: '@' + cleanEmail.split('@')[0],
            role: googleData.role || 'Senior Risk Analyst',
            tier: 'Enterprise Pro',
            avatar: googleData.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanEmail)}`,
            provider: 'google',
            verified: true,
            scansCount: googleData.scansCount || 47,
            joinedDate: 'Aug 2026',
            loginTime: new Date().toISOString()
        };
        registerUser(user);
        setCurrentUser(user);
        return user;
    }

    function loginWithPhone(phoneData) {
        const phoneClean = phoneData.phone.trim();
        const user = {
            id: 'usr_phone_' + Date.now().toString(36),
            name: phoneData.name || 'Verified Mobile Analyst',
            phone: phoneClean,
            email: phoneData.email || `${phoneClean.replace(/[^0-9]/g, '')}@sms.veriscan.io`,
            handle: '@user_' + phoneClean.slice(-4),
            role: 'OSINT Specialist',
            tier: 'Verified Mobile',
            avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(phoneClean)}`,
            provider: 'phone',
            verified: true,
            scansCount: 34,
            joinedDate: 'Aug 2026',
            loginTime: new Date().toISOString()
        };
        registerUser(user);
        setCurrentUser(user);
        return user;
    }

    function injectAuthStyles() {
        if (document.getElementById('veriscan-auth-styles')) return;

        const style = document.createElement('style');
        style.id = 'veriscan-auth-styles';
        style.textContent = `
            .auth-header-widget {
                position: relative;
                display: inline-flex;
                align-items: center;
                margin-left: 6px;
                vertical-align: middle;
            }

            .auth-guest-cluster {
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }

            .auth-login-btn, .auth-signup-btn {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 14px;
                border-radius: 9999px;
                font-size: 12.5px;
                font-weight: 600;
                text-decoration: none;
                transition: all 0.2s ease;
                cursor: pointer;
            }

            .auth-login-btn {
                background: rgba(0, 140, 255, 0.12);
                border: 1px solid rgba(0, 180, 255, 0.3);
                color: #38bdf8;
            }
            .auth-login-btn:hover {
                background: rgba(0, 140, 255, 0.25);
                border-color: #00d2ff;
                color: #ffffff;
                transform: translateY(-1px);
            }

            .auth-signup-btn {
                background: linear-gradient(135deg, #0066ff 0%, #00d2ff 100%);
                border: 1px solid rgba(0, 240, 255, 0.4);
                color: #ffffff;
                box-shadow: 0 4px 12px rgba(0, 119, 255, 0.3);
            }
            .auth-signup-btn:hover {
                box-shadow: 0 6px 18px rgba(0, 119, 255, 0.45);
                transform: translateY(-1px);
            }

            /* Logged-In User Profile Badge */
            .user-profile-badge {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 4px 10px 4px 4px;
                background: rgba(6, 24, 48, 0.85);
                border: 1.5px solid rgba(0, 180, 255, 0.35);
                border-radius: 9999px;
                cursor: pointer;
                transition: all 0.2s ease;
                user-select: none;
            }

            html.light-mode .user-profile-badge,
            body.light-mode .user-profile-badge {
                background: #ffffff;
                border-color: rgba(0, 119, 255, 0.25);
                box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
            }

            .user-profile-badge:hover {
                border-color: #00f0ff;
                box-shadow: 0 0 12px rgba(0, 210, 255, 0.3);
            }

            .user-avatar-wrap {
                position: relative;
                width: 28px;
                height: 28px;
                border-radius: 50%;
            }

            .user-avatar-img {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                object-fit: cover;
                border: 1.5px solid #00d2ff;
            }

            .user-avatar-fallback {
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: linear-gradient(135deg, #0066ff, #00d2ff);
                color: white;
                font-weight: 700;
                font-size: 11px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .user-info-text {
                display: flex;
                flex-direction: column;
                text-align: left;
                line-height: 1.15;
            }

            .user-name {
                font-size: 12px;
                font-weight: 700;
                color: #f8fafc;
                white-space: nowrap;
                max-width: 95px;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            html.light-mode .user-name,
            body.light-mode .user-name {
                color: #0f172a;
            }

            .user-tier-badge {
                font-size: 9.5px;
                font-weight: 600;
                color: #00f0ff;
                display: flex;
                align-items: center;
                gap: 3px;
            }

            html.light-mode .user-tier-badge,
            body.light-mode .user-tier-badge {
                color: #0284c7;
            }

            .user-dropdown-arrow {
                font-size: 9px;
                color: #94a3b8;
                margin-left: 2px;
            }

            /* Dropdown Menu Container (strictly closed by default, non-blocking) */
            .auth-dropdown-menu {
                display: none !important;
                pointer-events: none !important;
                position: absolute;
                top: calc(100% + 8px);
                right: 0;
                width: 260px;
                background: #04142a;
                border: 1px solid rgba(0, 180, 255, 0.4);
                border-radius: 14px;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 25px rgba(0, 119, 255, 0.25);
                backdrop-filter: blur(20px);
                padding: 14px;
                z-index: 10000;
            }

            html.light-mode .auth-dropdown-menu,
            body.light-mode .auth-dropdown-menu {
                background: #ffffff;
                border-color: rgba(0, 119, 255, 0.25);
                box-shadow: 0 15px 40px rgba(15, 23, 42, 0.15);
            }

            .auth-dropdown-menu.active {
                display: block !important;
                pointer-events: auto !important;
                animation: dropFadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            }

            @keyframes dropFadeIn {
                from { opacity: 0; transform: translateY(-6px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .dropdown-user-card {
                display: flex;
                align-items: center;
                gap: 10px;
                padding-bottom: 10px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                margin-bottom: 10px;
            }

            html.light-mode .dropdown-user-card,
            body.light-mode .dropdown-user-card {
                border-bottom-color: rgba(0, 0, 0, 0.08);
            }

            .dropdown-user-name {
                font-size: 13.5px;
                font-weight: 700;
                color: #ffffff;
            }
            html.light-mode .dropdown-user-name,
            body.light-mode .dropdown-user-name {
                color: #0f172a;
            }

            .dropdown-user-email {
                font-size: 11px;
                color: #94a3b8;
                word-break: break-all;
            }

            .dropdown-nav-list {
                list-style: none;
                padding: 0;
                margin: 0;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .dropdown-nav-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 7px 10px;
                border-radius: 8px;
                color: #cbd5e1;
                font-size: 12px;
                font-weight: 500;
                text-decoration: none;
                transition: all 0.15s ease;
                cursor: pointer;
            }

            html.light-mode .dropdown-nav-item,
            body.light-mode .dropdown-nav-item {
                color: #334155;
            }

            .dropdown-nav-item:hover {
                background: rgba(0, 119, 255, 0.15);
                color: #ffffff;
            }

            html.light-mode .dropdown-nav-item:hover,
            body.light-mode .dropdown-nav-item:hover {
                background: #e0f2fe;
                color: #0284c7;
            }

            .dropdown-nav-item i {
                width: 16px;
                color: #00d2ff;
                text-align: center;
            }

            .dropdown-logout-btn {
                width: 100%;
                margin-top: 8px;
                padding: 7px;
                border-radius: 8px;
                background: rgba(239, 68, 68, 0.12);
                border: 1px solid rgba(239, 68, 68, 0.3);
                color: #f87171;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
            }

            .dropdown-logout-btn:hover {
                background: rgba(239, 68, 68, 0.25);
                color: #ffffff;
            }

            /* Toast container */
            .auth-toast-container {
                position: fixed;
                bottom: 24px;
                right: 24px;
                z-index: 100000;
                display: flex;
                flex-direction: column;
                gap: 8px;
                pointer-events: none !important;
            }

            .auth-toast {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 10px 16px;
                background: rgba(4, 18, 38, 0.96);
                border: 1px solid rgba(0, 210, 255, 0.4);
                border-radius: 10px;
                color: #ffffff;
                font-size: 12.5px;
                font-weight: 500;
                box-shadow: 0 10px 25px rgba(0,0,0,0.5);
                backdrop-filter: blur(12px);
                pointer-events: auto;
                animation: toastSlide 0.25s ease;
            }

            html.light-mode .auth-toast,
            body.light-mode .auth-toast {
                background: #ffffff;
                color: #0f172a;
                border-color: rgba(0, 119, 255, 0.3);
                box-shadow: 0 10px 25px rgba(15, 23, 42, 0.12);
            }

            @keyframes toastSlide {
                from { transform: translateY(10px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    function renderHeaderAuth(targetSelector = '.top-actions, .header-actions') {
        const containers = document.querySelectorAll(targetSelector);
        if (!containers || containers.length === 0) return;

        injectAuthStyles();
        const user = getCurrentUser();

        containers.forEach(container => {
            const existingWidget = container.querySelector('.auth-header-widget');
            if (existingWidget) existingWidget.remove();

            const widget = document.createElement('div');
            widget.className = 'auth-header-widget';

            if (user) {
                const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'VS';
                const providerIcon = user.provider === 'google' ? '<i class="fab fa-google" style="color:#4285F4;"></i>' :
                                    user.provider === 'phone' ? '<i class="fas fa-phone" style="color:#00f5a0;"></i>' :
                                    '<i class="fas fa-shield" style="color:#00d2ff;"></i>';

                widget.innerHTML = `
                    <div class="user-profile-badge" id="userProfileBadge" onclick="VeriScanAuth.toggleDropdown(event)">
                        <div class="user-avatar-wrap">
                            <img src="${user.avatar}" alt="${user.name}" class="user-avatar-img" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'user-avatar-fallback\\'>${initials}</div>';">
                        </div>
                        <div class="user-info-text">
                            <span class="user-name">${user.name}</span>
                            <span class="user-tier-badge">${providerIcon} ${user.tier ? user.tier.split(' ')[0] : 'Pro'}</span>
                        </div>
                        <i class="fas fa-chevron-down user-dropdown-arrow"></i>
                    </div>

                    <div class="auth-dropdown-menu" id="authDropdownMenu">
                        <div class="dropdown-user-card">
                            <div class="user-avatar-wrap" style="width:34px; height:34px;">
                                <img src="${user.avatar}" alt="${user.name}" class="user-avatar-img" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'user-avatar-fallback\\'>${initials}</div>';">
                            </div>
                            <div style="overflow:hidden; text-align:left;">
                                <div class="dropdown-user-name">${user.name}</div>
                                <div class="dropdown-user-email">${user.email || user.phone || user.handle}</div>
                            </div>
                        </div>

                        <ul class="dropdown-nav-list">
                            <li>
                                <a href="index.html" class="dropdown-nav-item">
                                    <i class="fas fa-shield-halved"></i>
                                    <span>Profile Scanner</span>
                                </a>
                            </li>
                            <li>
                                <a href="live-analytics.html" class="dropdown-nav-item">
                                    <i class="fas fa-chart-line"></i>
                                    <span>Audit History</span>
                                </a>
                            </li>
                            <li>
                                <a href="login.html" class="dropdown-nav-item">
                                    <i class="fas fa-user-plus"></i>
                                    <span>Switch / New Account</span>
                                </a>
                            </li>
                        </ul>

                        <button class="dropdown-logout-btn" onclick="VeriScanAuth.logout()">
                            <i class="fas fa-arrow-right-from-bracket"></i>
                            <span>Sign Out</span>
                        </button>
                    </div>
                `;
            } else {
                widget.innerHTML = `
                    <div class="auth-guest-cluster">
                        <a href="login.html" class="auth-login-btn">
                            <i class="fas fa-arrow-right-to-bracket"></i>
                            <span>Sign In</span>
                        </a>
                        <a href="login.html?mode=signup" class="auth-signup-btn">
                            <i class="fas fa-user-plus"></i>
                            <span>Sign Up</span>
                        </a>
                    </div>
                `;
            }

            container.appendChild(widget);
        });
    }

    function toggleDropdown(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const menu = document.getElementById('authDropdownMenu');
        if (menu) {
            menu.classList.toggle('active');
        }
    }

    // Global listener to close dropdown on click outside
    document.addEventListener('click', function (e) {
        const menu = document.getElementById('authDropdownMenu');
        const badge = document.getElementById('userProfileBadge');
        if (menu && menu.classList.contains('active')) {
            if (!menu.contains(e.target) && (!badge || !badge.contains(e.target))) {
                menu.classList.remove('active');
            }
        }
    });

    function showAuthToast(msg, type = 'success') {
        let container = document.querySelector('.auth-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'auth-toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'auth-toast';
        const icon = type === 'success' ? '<i class="fas fa-circle-check" style="color:#00f5a0;"></i>' :
                     type === 'error' ? '<i class="fas fa-triangle-exclamation" style="color:#ef4444;"></i>' :
                     '<i class="fas fa-circle-info" style="color:#00d2ff;"></i>';

        toast.innerHTML = `${icon} <span>${msg}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(8px)';
            toast.style.transition = 'all 0.25s ease';
            setTimeout(() => toast.remove(), 250);
        }, 3000);
    }

    // Enforce authentication gate immediately
    requireAuth();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => renderHeaderAuth());
    } else {
        renderHeaderAuth();
    }

    window.addEventListener('veriscan_auth_changed', () => {
        renderHeaderAuth();
    });

    return {
        getCurrentUser,
        setCurrentUser,
        getRegisteredUsers,
        registerUser,
        loginWithEmail,
        loginWithGoogle,
        loginWithPhone,
        logout,
        requireAuth,
        renderHeaderAuth,
        toggleDropdown,
        showAuthToast,
        DUMMY_CREDENTIALS
    };
})();
