// ==================== AUTH ====================
const Auth = {
    async signUp(email, password, name) {
        const { data, error } = await db.auth.signUp({
            email, password,
            options: { data: { display_name: name } }
        });
        if (error) throw error;
        return data;
    },
    async signIn(email, password) {
        const { data, error } = await db.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    },
    async signOut() {
        const { error } = await db.auth.signOut();
        if (error) throw error;
    },
    async getUser() {
        const { data: { user } } = await db.auth.getUser();
        return user;
    }
};

// ==================== NAV AUTH UI ====================
async function updateNavAuth() {
    const user = await Auth.getUser();

    // Find all login/signup buttons/links across the page
    const authEls = [];
    document.querySelectorAll('a, button').forEach(el => {
        const t = el.textContent.trim();
        if (t === '로그인' || t === '회원가입' || t === '가입하기') {
            authEls.push(el);
        }
    });

    if (user) {
        // Hide login/signup buttons
        authEls.forEach(el => el.style.display = 'none');

        // Find the container of the last auth button to insert user menu
        const lastAuthEl = authEls[authEls.length - 1];
        const container = lastAuthEl?.parentElement;
        if (container && !container.querySelector('.auth-user-menu')) {
            // Hide account_circle icon too
            container.querySelectorAll('button').forEach(btn => {
                const icon = btn.querySelector('.material-symbols-outlined');
                if (icon && icon.textContent.trim() === 'account_circle') btn.style.display = 'none';
            });

            const name = user.user_metadata?.display_name || user.email.split('@')[0];
            const userMenu = document.createElement('div');
            userMenu.className = 'auth-user-menu relative';
            userMenu.innerHTML = `
                <button class="flex items-center gap-2 text-primary font-title-md text-sm cursor-pointer hover:opacity-70 transition-opacity" id="userMenuBtn">
                    <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">account_circle</span>
                    <span class="hidden md:inline">${name}</span>
                </button>
                <div id="userDropdown" class="hidden absolute right-0 top-full mt-2 w-48 bg-surface border border-outline-variant rounded-lg shadow-lg z-50 overflow-hidden">
                    <div class="px-4 py-3 border-b border-outline-variant">
                        <p class="font-title-md text-sm text-primary">${name}</p>
                        <p class="text-xs text-secondary truncate">${user.email}</p>
                    </div>
                    <button id="logoutBtn" class="w-full text-left px-4 py-3 text-sm text-secondary hover:bg-surface-container-low hover:text-primary transition-colors flex items-center gap-2">
                        <span class="material-symbols-outlined text-[18px]">logout</span> 로그아웃
                    </button>
                </div>
            `;
            if (lastAuthEl) lastAuthEl.before(userMenu);
            else container.appendChild(userMenu);

            // Toggle dropdown
            userMenu.querySelector('#userMenuBtn').addEventListener('click', (e) => {
                e.stopPropagation();
                userMenu.querySelector('#userDropdown').classList.toggle('hidden');
            });
            document.addEventListener('click', () => {
                document.querySelectorAll('#userDropdown').forEach(d => d.classList.add('hidden'));
            });

            // Logout
            userMenu.querySelector('#logoutBtn').addEventListener('click', async () => {
                await Auth.signOut();
                if (typeof toast === 'function') toast('로그아웃 되었습니다');
                setTimeout(() => window.location.reload(), 500);
            });
        }
    } else {
        // Not logged in - make buttons link to login/signup pages
        authEls.forEach(el => {
            el.style.display = '';
            const t = el.textContent.trim();
            if (t === '로그인') {
                el.style.cursor = 'pointer';
                el.addEventListener('click', (e) => { e.preventDefault(); window.location.href = 'login.html'; });
            }
            if (t === '회원가입' || t === '가입하기') {
                el.style.cursor = 'pointer';
                el.addEventListener('click', (e) => { e.preventDefault(); window.location.href = 'signup.html'; });
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateNavAuth();
});
