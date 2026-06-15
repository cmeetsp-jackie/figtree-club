(function () {
    'use strict';

    const CART_KEY = 'ft-cart';
    const WISH_KEY = 'ft-wish';

    // ==================== CART ====================
    const Cart = window.Cart = {
        get() { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); },
        save(c) { localStorage.setItem(CART_KEY, JSON.stringify(c)); updateCartBadges(); },
        add(item) {
            const c = this.get();
            const e = c.find(i => i.id === item.id);
            if (e) e.qty++; else c.push({ ...item, qty: 1 });
            this.save(c);
            toast(item.name + ' 장바구니에 추가됨');
        },
        remove(id) { this.save(this.get().filter(i => i.id !== id)); },
        updateQty(id, delta) {
            const c = this.get();
            const it = c.find(i => i.id === id);
            if (it) it.qty = Math.max(1, it.qty + delta);
            this.save(c);
        },
        count() { return this.get().reduce((s, i) => s + i.qty, 0); },
        clear() { this.save([]); }
    };

    // ==================== WISHLIST ====================
    const Wish = window.Wish = {
        get() { return JSON.parse(localStorage.getItem(WISH_KEY) || '[]'); },
        has(id) { return this.get().includes(id); },
        toggle(id) {
            let l = this.get();
            const has = l.includes(id);
            l = has ? l.filter(i => i !== id) : [...l, id];
            localStorage.setItem(WISH_KEY, JSON.stringify(l));
            toast(has ? '찜 목록에서 제거됨' : '찜 목록에 추가됨');
            return !has;
        }
    };

    // ==================== TOAST ====================
    function toast(msg) {
        const el = document.createElement('div');
        el.textContent = msg;
        Object.assign(el.style, {
            position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
            background: '#313030', color: '#f3f0ef', padding: '12px 24px', borderRadius: '999px',
            fontSize: '14px', zIndex: '9999', boxShadow: '0 4px 12px rgba(0,0,0,.15)',
            transition: 'opacity .3s', fontFamily: 'Inter,sans-serif', whiteSpace: 'nowrap'
        });
        document.body.appendChild(el);
        setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 2000);
    }
    window.toast = toast;

    // ==================== HELPERS ====================
    const isSubdir = false;
    const base = '';
    function link(page) { return base + page; }

    function updateCartBadges() {
        const n = Cart.count();
        document.querySelectorAll('.cart-badge').forEach(el => {
            el.textContent = n;
            el.style.display = n > 0 ? 'flex' : 'none';
        });
    }

    function setupCartIcon() {
        document.querySelectorAll('span.material-symbols-outlined').forEach(icon => {
            if (icon.textContent.trim() !== 'shopping_cart') return;
            const btn = icon.closest('button');
            if (!btn || btn.dataset.init) return;
            btn.dataset.init = '1';
            btn.style.position = 'relative';
            btn.style.cursor = 'pointer';
            const badge = document.createElement('span');
            badge.className = 'cart-badge';
            Object.assign(badge.style, {
                position: 'absolute', top: '-6px', right: '-6px', background: '#ba1a1a', color: '#fff',
                fontSize: '10px', minWidth: '16px', height: '16px', borderRadius: '50%', display: 'none',
                alignItems: 'center', justifyContent: 'center', fontWeight: '700', lineHeight: '16px', textAlign: 'center'
            });
            btn.appendChild(badge);
            btn.addEventListener('click', () => window.location.href = link('cart.html'));
        });
        updateCartBadges();
    }

    function setupFavBtn(btn, id) {
        const icon = btn.querySelector('.material-symbols-outlined');
        if (!icon) return;
        const update = (liked) => {
            icon.style.fontVariationSettings = liked ? "'FILL' 1" : "'FILL' 0";
            icon.style.color = liked ? '#ba1a1a' : '';
        };
        update(Wish.has(id));
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            update(Wish.toggle(id));
        });
    }

    function setupNavLinks() {
        document.querySelectorAll('a').forEach(a => {
            if (a.href && !a.href.endsWith('#')) return;
            const t = a.textContent.trim();
            if (t.includes('Figtree Club')) a.href = link('index.html');
            else if (t === '카테고리' || t === '브랜드') a.href = link('index.html') + '#inventory';
            else if (t === '공급업체') a.href = link('suppliers.html');
        });
        // 로그인/회원가입 버튼은 auth.js에서 처리
    }

    // ==================== MAIN PAGE ====================
    function initMain() {
        // Helper to create a bundle card element
        function createBundleCard(b) {
            const perPiece = b.quantity > 0 ? Math.round(b.price / b.quantity) : 0;
            const photo = b.photos && b.photos[0] ? b.photos[0] : 'https://placehold.co/400x500/f5f5f5/999?text=No+Image';
            const supplier = b.sellers ? b.sellers.business_name : '';
            const card = document.createElement('article');
            card.className = 'bundle-card flex flex-col gap-stack-sm bg-surface rounded-xl overflow-hidden border border-outline-variant transition-shadow cursor-pointer relative group';
            card.onclick = () => { window.location.href = link('bundleinfo.html') + '?id=' + b.id; };
            card.innerHTML =
                '<div class="relative aspect-[4/5] bg-surface-container-low overflow-hidden">' +
                '<img alt="' + b.name + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="' + photo + '" onerror="this.src=\'https://placehold.co/400x500/f5f5f5/999?text=No+Image\'">' +
                (b.grade ? '<div class="absolute top-3 left-3 bg-accent text-on-accent px-2.5 py-1 rounded-full text-xs font-label-caps tracking-wider">' + b.grade + '</div>' : '') +
                '<button class="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface/80 backdrop-blur flex items-center justify-center text-primary hover:bg-surface transition-colors">' +
                '<span class="material-symbols-outlined text-[18px]">favorite</span></button></div>' +
                '<div class="p-stack-md flex flex-col gap-1">' +
                '<div class="flex justify-between items-start">' +
                '<h4 class="font-title-md text-title-md text-primary truncate pr-2">' + b.name + '</h4></div>' +
                '<p class="font-body-sm text-body-sm text-secondary">' + supplier + '</p>' +
                '<div class="mt-2 flex items-baseline gap-2">' +
                '<span class="font-headline-lg-mobile text-headline-lg-mobile text-primary">₩' + b.price.toLocaleString('ko-KR') + '</span></div>' +
                '<span class="text-xs text-secondary mt-1">개당 ₩' + perPiece.toLocaleString('ko-KR') + ' · ' + b.quantity + '개</span></div>';
            const favBtn = card.querySelector('button');
            if (favBtn) setupFavBtn(favBtn, b.id);
            return card;
        }

        // Load all bundles from DB
        if (typeof DB !== 'undefined') {
            DB.getAllBundles({ limit: 30 }).then(bundles => {
                if (!bundles || bundles.length === 0) return;

                // Latest Drops carousel
                const latestTrack = document.getElementById('latestDropsTrack');
                if (latestTrack) {
                    bundles.slice(0, 10).forEach(b => {
                        const card = createBundleCard(b);
                        card.style.cssText = 'flex:0 0 280px;min-width:280px';
                        latestTrack.appendChild(card);
                    });
                }

                // Product grid
                const grid = document.getElementById('productGrid');
                if (grid) {
                    const promo = grid.querySelector('[class*="col-span"]');
                    bundles.forEach(b => {
                        const card = createBundleCard(b);
                        if (promo) grid.insertBefore(card, promo);
                        else grid.appendChild(card);
                    });
                }
            }).catch(e => console.log('Bundle fetch:', e));
        }

        // Search
        const searchInput = document.querySelector('input[placeholder*="검색"]');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const q = e.target.value.toLowerCase();
                cards.forEach((card, i) => {
                    if (!products[i]) return;
                    card.style.display = (!q || products[i].name.toLowerCase().includes(q)) ? '' : 'none';
                });
            });
        }

        // Sidebar
        const sideButtons = document.querySelectorAll('aside button');
        let saleOnly = false;
        sideButtons.forEach(btn => {
            const t = btn.textContent.trim();

            if (t.includes('정렬 기준')) {
                const modes = ['기본', '가격 낮은순', '가격 높은순'];
                let idx = 0;
                btn.addEventListener('click', () => {
                    idx = (idx + 1) % modes.length;
                    const spans = btn.querySelectorAll('span:not(.material-symbols-outlined)');
                    const label = [...spans].find(s => s.closest('.flex.items-center.gap-stack-sm'));
                    if (label) label.textContent = '정렬: ' + modes[idx];

                    const grid = cards[0]?.parentElement;
                    const promo = grid?.querySelector('[class*="col-span-2"], [class*="col-span-3"]');
                    [...cards].sort((a, b) => {
                        const ai = [...cards].indexOf(a), bi = [...cards].indexOf(b);
                        if (idx === 1) return products[ai].price - products[bi].price;
                        if (idx === 2) return products[bi].price - products[ai].price;
                        return ai - bi;
                    }).forEach(c => grid.insertBefore(c, promo));
                });
            }

            if (t.includes('할인 중')) {
                const track = btn.querySelector('[class*="w-8"]');
                const thumb = btn.querySelector('[class*="w-4"][class*="h-4"]');
                btn.addEventListener('click', () => {
                    saleOnly = !saleOnly;
                    if (track) { track.classList.toggle('bg-primary', saleOnly); track.classList.toggle('bg-outline-variant', !saleOnly); }
                    if (thumb) { thumb.style.transform = saleOnly ? 'translateX(16px)' : ''; thumb.style.transition = 'transform .2s'; }
                    cards.forEach((card, i) => {
                        if (!products[i]) return;
                        card.style.display = (saleOnly && products[i].price >= products[i].original) ? 'none' : '';
                    });
                });
            }

            if (t.includes('모두 초기화')) {
                btn.addEventListener('click', () => {
                    saleOnly = false;
                    cards.forEach(c => c.style.display = '');
                    if (searchInput) searchInput.value = '';
                    const track = document.querySelector('aside [class*="w-8"][class*="bg-"]');
                    const thumb = document.querySelector('aside [class*="w-4"][class*="h-4"]');
                    if (track) { track.classList.remove('bg-primary'); track.classList.add('bg-outline-variant'); }
                    if (thumb) thumb.style.transform = '';
                    toast('필터가 초기화되었습니다');
                });
            }

            if (t.includes('품질 점수') || t.includes('부서') || t.includes('번들 유형')) {
                const arrow = [...btn.querySelectorAll('.material-symbols-outlined')].pop();
                let open = false;
                btn.addEventListener('click', () => {
                    open = !open;
                    if (arrow) arrow.textContent = open ? 'expand_less' : 'expand_more';
                    let sub = btn.nextElementSibling;
                    if (sub?.classList.contains('filter-sub')) { sub.style.display = open ? '' : 'none'; return; }
                    if (open) {
                        sub = document.createElement('div');
                        sub.className = 'filter-sub pl-12 py-2 flex flex-col gap-1';
                        sub.innerHTML = '<span class="text-sm text-secondary py-1">옵션 준비 중...</span>';
                        btn.after(sub);
                    }
                });
            }
        });

        // Mobile filter
        const mobileBtn = document.querySelector('[class*="md:hidden"][class*="flex"][class*="items-center"]');
        const sidebar = document.querySelector('aside');
        if (mobileBtn && sidebar) {
            const overlay = document.createElement('div');
            Object.assign(overlay.style, { position: 'fixed', inset: '0', background: 'rgba(0,0,0,.5)', zIndex: '40', display: 'none' });
            document.body.appendChild(overlay);
            mobileBtn.addEventListener('click', () => {
                sidebar.classList.remove('hidden');
                Object.assign(sidebar.style, { position: 'fixed', left: '0', top: '0', height: '100vh', zIndex: '50', background: '#fcf9f8', padding: '24px', boxShadow: '4px 0 20px rgba(0,0,0,.1)', overflowY: 'auto', width: '280px', display: 'block' });
                overlay.style.display = '';
            });
            overlay.addEventListener('click', () => {
                sidebar.removeAttribute('style');
                sidebar.classList.add('hidden', 'md:block');
                overlay.style.display = 'none';
            });
        }

        // Hero scroll
        const cta = document.querySelector('a[href="#inventory"]');
        if (cta) cta.addEventListener('click', (e) => { e.preventDefault(); document.getElementById('inventory')?.scrollIntoView({ behavior: 'smooth' }); });

        // Load vendors from DB
        if (typeof DB !== 'undefined') {
            db.from('sellers').select('*').order('rating', { ascending: false }).limit(10).then(({ data }) => {
                const carousel = document.getElementById('vendorCarousel');
                if (!carousel || !data || data.length === 0) return;
                data.forEach(s => {
                    const initials = s.business_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                    const cats = (s.categories || []).slice(0, 3);
                    const card = document.createElement('div');
                    card.className = 'vendor-card';
                    card.onclick = () => location.href = link('supplyprofile.html') + '?id=' + s.id;
                    card.innerHTML =
                        '<div class="flex items-center gap-3 mb-4">' +
                        '<div class="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-lg">' + initials + '</div>' +
                        '<div><div class="flex items-center gap-1">' +
                        '<span class="font-title-md text-title-md font-bold">' + s.business_name + '</span>' +
                        (s.verified ? '<span class="material-symbols-outlined text-[16px] text-primary" style="font-variation-settings:\'FILL\' 1">verified</span>' : '') +
                        '</div><span class="text-secondary text-sm">' + (s.country || '') + '</span></div></div>' +
                        '<div class="flex items-center gap-4 text-sm text-secondary mb-3">' +
                        '<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px] text-primary" style="font-variation-settings:\'FILL\' 1">star</span> ' + (s.rating || '0') + '</span>' +
                        '<span>' + (s.review_count || 0) + ' 리뷰</span>' +
                        '<span>' + (s.response_time || '-') + '</span></div>' +
                        '<p class="text-sm text-secondary mb-3">' + (s.description || '등록된 소개가 없습니다.') + '</p>' +
                        '<div class="flex gap-2">' + cats.map(c => '<span class="text-xs px-2 py-1 bg-surface-container-low rounded-full">' + c + '</span>').join('') + '</div>';
                    carousel.appendChild(card);
                });
            }).catch(e => console.log('Vendor fetch:', e));
        }

        // Category chips
        document.querySelectorAll('.cat-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
            });
        });
    }

    // ==================== CHAT WIDGET ====================
    function initChat() {
        const panel = document.getElementById('chatPanel');
        const toggleBtn = document.getElementById('chatToggleBtn');
        const header = document.getElementById('chatHeader');
        const minimize = document.getElementById('chatMinimize');
        const input = document.getElementById('chatInput');
        const sendBtn = document.getElementById('chatSendBtn');
        const body = document.getElementById('chatBody');

        if (!panel || !toggleBtn) return;

        function openChat() { panel.classList.add('open'); input?.focus(); }
        function closeChat() { panel.classList.remove('open'); }

        toggleBtn.addEventListener('click', openChat);
        if (minimize) minimize.addEventListener('click', closeChat);
        if (header) header.addEventListener('click', (e) => {
            if (e.target === minimize || e.target.closest('#chatMinimize')) return;
            panel.classList.contains('open') ? closeChat() : openChat();
        });

        function sendMessage() {
            const text = input?.value?.trim();
            if (!text) return;
            const bubble = document.createElement('div');
            bubble.className = 'chat-bubble user';
            bubble.textContent = text;
            body.appendChild(bubble);
            input.value = '';
            body.scrollTop = body.scrollHeight;

            // Simulate supplier auto-reply
            setTimeout(() => {
                const replies = [
                    '감사합니다! 해당 번들에 대해 자세히 알려드릴게요.',
                    '네, 수량 조정도 가능합니다. 원하시는 수량을 알려주세요.',
                    '현재 재고가 충분합니다. 추가 사진이 필요하시면 말씀해주세요.',
                    '대량 주문 시 추가 할인도 가능합니다. 몇 벌 정도 생각하고 계신가요?',
                    '배송은 주문 확인 후 24시간 이내에 발송됩니다.'
                ];
                const reply = document.createElement('div');
                reply.className = 'chat-bubble supplier';
                reply.textContent = replies[Math.floor(Math.random() * replies.length)];
                body.appendChild(reply);
                body.scrollTop = body.scrollHeight;
            }, 1200);
        }

        if (sendBtn) sendBtn.addEventListener('click', sendMessage);
        if (input) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });
    }

    // ==================== BUNDLE INFO PAGE ====================
    function initBundle() {
        const product = { id: 'vintage-leather', name: '프리미엄 빈티지 가죽 자켓', price: 765000 };

        // Load real bundle data if ?id= present
        const bundleId = new URLSearchParams(location.search).get('id');
        if (bundleId && typeof DB !== 'undefined') {
            DB.getBundleById(bundleId).then(b => {
                if (!b) return;
                product.id = b.id;
                product.name = b.name;
                product.price = b.price;

                // Update title
                const titleEl = document.querySelector('h1');
                if (titleEl) titleEl.textContent = b.name;

                // Update price
                const priceEl = document.querySelector('[class*="display-lg"][class*="text-primary"]');
                if (priceEl && priceEl.closest('.flex.items-baseline')) {
                    priceEl.textContent = '₩' + b.price.toLocaleString('ko-KR');
                }
                const perPiece = b.quantity > 0 ? Math.round(b.price / b.quantity) : 0;
                const perPieceEl = priceEl?.closest('.flex')?.querySelector('[class*="body-lg"]');
                if (perPieceEl) perPieceEl.textContent = '개당 ₩' + perPiece.toLocaleString('ko-KR');

                // Update buy button
                const buyBtn = [...document.querySelectorAll('button')].find(btn => btn.textContent.includes('지금 구매'));
                if (buyBtn) buyBtn.innerHTML = '<span class="material-symbols-outlined">lock</span> 지금 구매 - ₩' + b.price.toLocaleString('ko-KR');

                // Update main image
                const mainImg = document.querySelector('[class*="aspect-"][class*="4"] img');
                if (mainImg) {
                    mainImg.alt = b.name;
                    mainImg.onerror = () => { mainImg.src = 'https://placehold.co/800x600/f5f5f5/999?text=No+Image'; };
                    if (b.photos && b.photos[0]) mainImg.src = b.photos[0];
                }

                // Update thumbnail strip with real photos
                const thumbGrid = document.querySelector('[class*="grid-cols-5"]');
                if (thumbGrid && b.photos && b.photos.length > 0) {
                    thumbGrid.innerHTML = '';
                    b.photos.slice(0, 5).forEach((url, i) => {
                        const div = document.createElement('div');
                        div.className = 'aspect-square bg-surface-container border rounded-lg overflow-hidden cursor-pointer ' + (i === 0 ? 'border-2 border-primary opacity-100' : 'border-outline-variant opacity-70 hover:opacity-100 transition-opacity');
                        div.innerHTML = '<img alt="Photo ' + (i+1) + '" class="w-full h-full object-cover" src="' + url + '">';
                        div.addEventListener('click', () => {
                            if (mainImg) mainImg.src = url;
                            [...thumbGrid.children].forEach(t => { t.className = 'aspect-square bg-surface-container border border-outline-variant rounded-lg overflow-hidden cursor-pointer opacity-70 hover:opacity-100 transition-opacity'; });
                            div.className = 'aspect-square bg-surface-container border-2 border-primary rounded-lg overflow-hidden cursor-pointer opacity-100';
                        });
                        thumbGrid.appendChild(div);
                    });
                    if (b.photos.length > 5) {
                        const more = document.createElement('div');
                        more.className = 'aspect-square bg-surface-container border border-outline-variant rounded-lg overflow-hidden flex items-center justify-center cursor-pointer hover:bg-surface-container-high transition-colors text-sm text-secondary';
                        more.textContent = '+' + (b.photos.length - 5) + '개 더보기';
                        thumbGrid.appendChild(more);
                    }
                }

                // Update video if exists
                if (b.videos && b.videos[0] && mainImg) {
                    const videoBtn = document.createElement('button');
                    videoBtn.className = 'absolute bottom-4 left-4 bg-surface/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-outline-variant flex items-center gap-1 text-sm font-semibold';
                    videoBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">play_circle</span> 동영상 보기';
                    mainImg.closest('.relative')?.appendChild(videoBtn);
                }

                // Update category & bundle ID
                document.querySelectorAll('.flex.items-center.gap-4.text-body-sm span').forEach(el => {
                    if (el.textContent.includes('VJ-')) el.innerHTML = '<span class="material-symbols-outlined text-[18px]">inventory_2</span> ' + (b.category || '');
                });

                // Update grade
                const gradeTag = document.querySelector('[class*="bg-primary"][class*="uppercase"]');
                if (gradeTag && b.grade) gradeTag.textContent = b.grade;

                // Update key metrics
                const metricEls = document.querySelectorAll('.grid.grid-cols-2 .p-4');
                metricEls.forEach(el => {
                    const label = el.querySelector('[class*="label-caps"]')?.textContent || '';
                    const val = el.querySelector('[class*="title-md"]');
                    if (!val) return;
                    if (label.includes('상태') && b.grade) val.textContent = b.grade;
                    if (label.includes('사이즈') && b.size_range) val.textContent = b.size_range;
                    if (label.includes('배송')) val.textContent = b.dispatch_time || '24시간 이내';
                    if (label.includes('위치') && b.sellers) val.textContent = b.sellers.country || '-';
                });

                // Update supplier info
                if (b.sellers) {
                    const supplierName = document.querySelector('.flex.items-center.justify-between h3');
                    if (supplierName) supplierName.innerHTML = b.sellers.business_name + (b.sellers.verified ? ' <span class="material-symbols-outlined text-primary text-[16px]" style="font-variation-settings:\'FILL\' 1">verified</span>' : '');
                    const supplierAvatar = document.querySelector('.w-12.h-12.rounded-full img');
                    if (supplierAvatar && b.sellers.avatar_url) supplierAvatar.src = b.sellers.avatar_url;
                    const profileLink = [...document.querySelectorAll('a')].find(a => a.textContent.includes('프로필 보기'));
                    if (profileLink) profileLink.href = link('supplyprofile.html') + '?id=' + b.seller_id;
                }

                // Update description
                const descSection = document.querySelector('.prose');
                if (descSection && b.description) {
                    descSection.innerHTML = '<p>' + b.description.replace(/\n/g, '</p><p>') + '</p>';
                }
            }).catch(e => console.error('Bundle load error:', e));
        }

        // Gallery thumbnails
        const mainImgWrap = document.querySelector('[class*="aspect-"][class*="4"]');
        const mainImg = mainImgWrap?.querySelector('img');
        const thumbGrid = document.querySelector('[class*="grid-cols-5"]');
        const thumbs = thumbGrid?.children ? [...thumbGrid.children] : [];

        thumbs.forEach((thumb) => {
            const img = thumb.querySelector('img');
            if (img && mainImg) {
                thumb.addEventListener('click', () => {
                    mainImg.src = img.src;
                    thumbs.forEach(t => {
                        t.classList.remove('border-primary', 'border-2');
                        t.classList.add('border-outline-variant');
                        t.style.opacity = t === thumb ? '1' : '0.7';
                    });
                    thumb.classList.add('border-primary', 'border-2');
                    thumb.classList.remove('border-outline-variant');
                });
            } else if (!img) {
                // "+6개 더보기"
                thumb.addEventListener('click', () => toast('더 많은 이미지를 준비 중입니다'));
            }
        });

        // Fullscreen
        document.querySelectorAll('.material-symbols-outlined').forEach(icon => {
            if (icon.textContent.trim() !== 'fullscreen') return;
            const wrap = icon.closest('div');
            if (!wrap) return;
            wrap.style.cursor = 'pointer';
            wrap.addEventListener('click', () => {
                if (!mainImg) return;
                const ov = document.createElement('div');
                Object.assign(ov.style, { position: 'fixed', inset: '0', background: 'rgba(0,0,0,.92)', zIndex: '9999', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' });
                const big = document.createElement('img');
                big.src = mainImg.src;
                Object.assign(big.style, { maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' });
                ov.appendChild(big);
                ov.addEventListener('click', () => ov.remove());
                document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { ov.remove(); document.removeEventListener('keydown', esc); } });
                document.body.appendChild(ov);
            });
        });

        // Favorite
        document.querySelectorAll('button').forEach(btn => {
            const icon = btn.querySelector('.material-symbols-outlined');
            if (icon && (icon.textContent.trim() === 'favorite_border' || icon.textContent.trim() === 'favorite')) {
                if (icon.closest('header') || icon.closest('[class*="aspect"]')) return; // skip non-main fav
                const update = (liked) => {
                    icon.textContent = liked ? 'favorite' : 'favorite_border';
                    icon.style.fontVariationSettings = liked ? "'FILL' 1" : "'FILL' 0";
                    icon.style.color = liked ? '#ba1a1a' : '';
                };
                update(Wish.has(product.id));
                btn.addEventListener('click', () => update(Wish.toggle(product.id)));
            }
        });

        // Buy now
        const buyBtn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('지금 구매'));
        if (buyBtn) {
            product.img = mainImg?.src || '';
            buyBtn.addEventListener('click', () => {
                Cart.add(product);
                setTimeout(() => window.location.href = link('cart.html'), 500);
            });
        }

        // Make offer
        const offerBtn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('가격 제안'));
        if (offerBtn) {
            offerBtn.addEventListener('click', () => {
                const price = prompt('제안 가격을 입력하세요 (₩):', '700000');
                if (price) toast('₩' + price + ' 가격 제안이 공급업체에게 전송되었습니다');
            });
        }

        // Breadcrumbs
        document.querySelectorAll('nav a').forEach(a => {
            const t = a.textContent.trim();
            if (t === '홈') a.href = link('index.html');
            if (t === '카테고리') a.href = link('index.html') + '#inventory';
            if (t.includes('빈티지 아우터')) a.href = link('index.html') + '#inventory';
        });

        // Supplier link
        document.querySelectorAll('a').forEach(a => {
            if (a.textContent.includes('프로필 보기')) a.href = link('supplyprofile.html');
        });

        // Init chat widget
        initChat();
    }

    // ==================== SUPPLIER PROFILE PAGE ====================
    function initSupplier() {
        const products = [
            { id: 'vintage-hoodies', name: '빈티지 90년대 헤비웨이트 후디 번들', price: 595000 },
            { id: 'graphic-tees', name: '다양한 프로 스포츠 그래픽 티셔츠', price: 306000 },
            { id: 'denim-jackets', name: '클래식 리바이스 데님 재킷 믹스', price: 714000 },
            { id: 'crewneck-sweat', name: '어스 톤 크루넥 스웨트셔츠', price: 476000 }
        ];
        const cards = document.querySelectorAll('article');

        cards.forEach((card, i) => {
            if (!products[i]) return;
            const p = products[i];
            p.img = card.querySelector('img')?.src || '';

            card.addEventListener('click', (e) => {
                if (e.target.closest('button')) return;
                window.location.href = link('bundleinfo.html');
            });

            const favBtn = card.querySelector('button');
            if (favBtn) setupFavBtn(favBtn, p.id);
        });

        // Load real seller data if ?id= present
        const sellerId = new URLSearchParams(location.search).get('id');
        if (sellerId && typeof DB !== 'undefined') {
            (async () => {
                try {
                    const seller = await DB.getSellerProfile(sellerId);
                    if (!seller) return;

                    // Update profile header
                    const nameEl = document.querySelector('h1');
                    if (nameEl) nameEl.textContent = seller.business_name;

                    const descEl = document.querySelector('h1')?.closest('section')?.querySelector('p');
                    if (descEl) descEl.textContent = seller.description || '등록된 소개가 없습니다.';

                    // Avatar
                    const avatarImg = document.querySelector('[class*="rounded-full"] img');
                    if (avatarImg && seller.avatar_url) {
                        avatarImg.src = seller.avatar_url;
                    } else if (avatarImg && !seller.avatar_url) {
                        const initials = seller.business_name.split(' ').map(w => w[0]).join('').slice(0, 2);
                        avatarImg.parentElement.innerHTML = '<span class="text-4xl font-bold">' + initials + '</span>';
                    }

                    // Stats
                    const statEls = document.querySelectorAll('[class*="font-title-md"][class*="text-primary"]');
                    statEls.forEach(el => {
                        const label = el.closest('.flex.flex-col')?.querySelector('[class*="label-caps"]')?.textContent || '';
                        if (label.includes('평점')) el.textContent = seller.rating > 0 ? seller.rating : '-';
                        if (label.includes('응답')) el.textContent = seller.response_time || '-';
                        if (label.includes('위치')) el.textContent = seller.country || '-';
                    });
                    const ratingCount = document.querySelector('.font-body-sm.text-body-sm.text-secondary');
                    if (ratingCount && ratingCount.textContent.includes('(')) ratingCount.textContent = '(' + (seller.review_count || 0) + ')';

                    // Load seller's bundles
                    const bundles = await DB.getSellerBundles(sellerId);
                    if (bundles.length > 0) {
                        const grid = document.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2');
                        if (grid) {
                            grid.innerHTML = '';
                            bundles.forEach(b => {
                                const photo = b.photos && b.photos[0] ? b.photos[0] : 'https://placehold.co/400x500/f5f5f5/999?text=No+Image';
                                const perPiece = b.quantity > 0 ? Math.round(b.price / b.quantity) : 0;
                                const card = document.createElement('article');
                                card.className = 'bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden cursor-pointer group flex flex-col';
                                card.style.cssText = 'transition:transform .2s,box-shadow .2s';
                                card.onmouseenter = () => { card.style.transform = 'translateY(-3px)'; card.style.boxShadow = '0 8px 24px rgba(0,0,0,.1)'; };
                                card.onmouseleave = () => { card.style.transform = ''; card.style.boxShadow = ''; };
                                card.onclick = () => location.href = link('bundleinfo.html') + '?id=' + b.id;
                                card.innerHTML =
                                    '<div class="relative aspect-[4/5] bg-surface-variant overflow-hidden">' +
                                    '<img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="' + photo + '" alt="' + b.name + '">' +
                                    (b.grade ? '<div class="absolute top-3 left-3 bg-primary text-on-primary px-2.5 py-1 rounded-full text-xs font-semibold">' + b.grade + '</div>' : '') +
                                    '</div>' +
                                    '<div class="p-4 flex flex-col flex-1 gap-2">' +
                                    '<h3 class="font-semibold text-primary">' + b.name + '</h3>' +
                                    '<div class="flex items-end justify-between mt-auto">' +
                                    '<div><span class="text-xl font-bold text-primary">₩' + b.price.toLocaleString('ko-KR') + '</span>' +
                                    '<span class="text-sm text-secondary ml-1">/ ' + b.quantity + '개</span></div>' +
                                    '<span class="text-sm text-secondary">개당 ₩' + perPiece.toLocaleString('ko-KR') + '</span></div></div>';
                                grid.appendChild(card);
                            });
                        }
                    }
                } catch (e) { console.error('Supplier load error:', e); }
            })();
        }

        // Sort
        const sortSelect = document.querySelector('select');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                const v = sortSelect.value;
                const grid = cards[0]?.parentElement;
                if (!grid) return;
                [...cards].sort((a, b) => {
                    const ai = [...cards].indexOf(a), bi = [...cards].indexOf(b);
                    if (v.includes('낮은')) return (products[ai]?.price || 0) - (products[bi]?.price || 0);
                    if (v.includes('높은')) return (products[bi]?.price || 0) - (products[ai]?.price || 0);
                    return ai - bi;
                }).forEach(c => grid.appendChild(c));
            });
        }

        // Pagination
        document.querySelectorAll('.flex.justify-center button').forEach(btn => {
            if (!btn.textContent.match(/^\d+$/)) return;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.flex.justify-center button').forEach(b => {
                    if (!b.textContent.match(/^\d+$/)) return;
                    b.classList.remove('bg-primary', 'text-on-primary');
                    b.classList.add('text-primary');
                });
                btn.classList.add('bg-primary', 'text-on-primary');
                btn.classList.remove('text-primary');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                toast('페이지 ' + btn.textContent);
            });
        });

        // Contact
        const contactBtn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('문의하기'));
        if (contactBtn) contactBtn.addEventListener('click', () => toast('문의 기능이 곧 추가됩니다'));

        // Search
        const searchInput = document.querySelector('input[placeholder*="검색"]');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const q = e.target.value.toLowerCase();
                cards.forEach((card, i) => {
                    if (!products[i]) return;
                    card.style.display = (!q || products[i].name.toLowerCase().includes(q)) ? '' : 'none';
                });
            });
        }
    }

    // ==================== CART / CHECKOUT PAGE ====================
    function initCart() {
        // Quantity buttons
        document.querySelectorAll('[aria-label="수량 감소"], [aria-label="수량 증가"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const row = btn.closest('[class*="py-4"]');
                const qtySpan = row?.querySelector('.px-4');
                if (!qtySpan) return;
                const delta = btn.getAttribute('aria-label').includes('증가') ? 1 : -1;
                qtySpan.textContent = Math.max(1, parseInt(qtySpan.textContent) + delta);
                recalc();
            });
        });

        // Delete
        document.querySelectorAll('[aria-label="상품 삭제"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const row = btn.closest('[class*="py-4"]');
                if (!row) return;
                row.style.transition = 'opacity .3s, max-height .3s, padding .3s, margin .3s';
                row.style.opacity = '0';
                row.style.overflow = 'hidden';
                row.style.maxHeight = '0';
                row.style.paddingTop = '0';
                row.style.paddingBottom = '0';
                setTimeout(() => { row.remove(); recalc(); updateCount(); }, 300);
            });
        });

        function getItems() {
            return document.querySelectorAll('.flex.flex-col.md\\:flex-row.gap-stack-md');
        }

        function recalc() {
            let subtotal = 0, discount = 0;
            getItems().forEach(item => {
                const qtyEl = item.querySelector('.px-4');
                const priceBlock = item.querySelector('.text-right.min-w-\\[80px\\]') || item.querySelector('.text-right');
                const priceEl = priceBlock?.querySelector('.font-title-md');
                const origEl = priceBlock?.querySelector('.line-through');

                const qty = parseInt(qtyEl?.textContent) || 1;
                const priceText = priceEl?.dataset.unit || priceEl?.textContent || '0';
                const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;

                if (priceEl && !priceEl.dataset.unit) priceEl.dataset.unit = priceEl.textContent;
                if (priceEl) priceEl.textContent = '₩' + (price * qty);

                const orig = origEl ? parseFloat(origEl.textContent.replace(/[^0-9.]/g, '')) || price : price;
                subtotal += price * qty;
                discount += (orig - price) * qty;
            });

            const shipping = getItems().length > 0 ? 42000 : 0;
            const total = subtotal + shipping;

            document.querySelectorAll('.flex.justify-between.items-center').forEach(row => {
                const lbl = row.children[0]?.textContent || '';
                const val = row.children[1];
                if (!val) return;
                if (lbl.includes('소계')) { val.textContent = '₩' + subtotal.toLocaleString('ko-KR'); row.children[0].textContent = '소계 (' + getItems().length + '개 번들)'; }
                if (lbl.includes('할인')) val.textContent = '-₩' + discount.toLocaleString('ko-KR');
                if (lbl.includes('배송')) val.textContent = '₩' + shipping.toLocaleString('ko-KR');
            });

            const totalEl = document.querySelector('.font-headline-lg.text-headline-lg.text-primary');
            if (totalEl?.closest('.flex.justify-between')) totalEl.textContent = '₩' + total.toLocaleString('ko-KR');
        }

        function updateCount() {
            const n = getItems().length;
            document.querySelectorAll('h2').forEach(h => {
                if (h.textContent.includes('주문 요약')) h.textContent = '주문 요약 (' + n + '개 상품)';
            });
            if (n === 0) {
                const section = document.querySelector('section');
                if (section) section.innerHTML = '<div class="text-center py-16"><span class="material-symbols-outlined text-[64px] text-secondary" style="display:block;margin:0 auto 16px">shopping_cart</span><h2 class="font-headline-lg text-headline-lg text-primary mb-2">장바구니가 비어있습니다</h2><p class="text-secondary mb-6">번들을 추가해보세요</p><a href="' + link('index.html') + '" class="bg-primary text-on-primary px-6 py-3 rounded-full font-title-md text-title-md inline-block">쇼핑 계속하기</a></div>';
            }
        }

        // Promo
        const promoInput = document.querySelector('#promo');
        const promoBtn = promoInput?.closest('div')?.querySelector('button');
        let promoApplied = false;
        if (promoBtn) {
            promoBtn.addEventListener('click', () => {
                if (promoApplied) { toast('이미 프로모션이 적용되었습니다'); return; }
                const code = promoInput?.value?.trim();
                if (!code) { toast('프로모션 코드를 입력하세요'); return; }
                if (code.toUpperCase() === 'FIGTREE10') {
                    promoApplied = true;
                    toast('10% 할인이 적용되었습니다!');
                    const totalEl = document.querySelector('.font-headline-lg.text-headline-lg.text-primary');
                    if (totalEl?.closest('.flex.justify-between')) {
                        const cur = parseFloat(totalEl.textContent.replace(/[^0-9.]/g, ''));
                        totalEl.textContent = '₩' + (cur * 0.9).toLocaleString('ko-KR');
                    }
                    promoBtn.disabled = true;
                    promoBtn.textContent = '적용됨';
                    promoInput.disabled = true;
                } else { toast('유효하지 않은 프로모션 코드입니다'); }
            });
        }

        // Place order
        const orderBtn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('주문하기'));
        if (orderBtn) {
            orderBtn.addEventListener('click', () => {
                if (getItems().length === 0) { toast('장바구니가 비어있습니다'); return; }
                orderBtn.disabled = true;
                orderBtn.innerHTML = '<span class="material-symbols-outlined" style="animation:spin 1s linear infinite">progress_activity</span> 처리 중...';
                setTimeout(() => {
                    Cart.clear();
                    const orderId = 'FT-' + Date.now().toString(36).toUpperCase();
                    document.querySelector('main').innerHTML =
                        '<div class="text-center py-24 px-4">' +
                        '<span class="material-symbols-outlined text-[80px] text-primary mb-4" style="font-variation-settings:\'FILL\' 1;display:block">check_circle</span>' +
                        '<h1 class="font-display-lg text-display-lg text-primary mb-4">주문이 완료되었습니다!</h1>' +
                        '<p class="font-body-lg text-body-lg text-secondary mb-2">주문번호: ' + orderId + '</p>' +
                        '<p class="font-body-lg text-body-lg text-secondary mb-8">확인 이메일을 보내드렸습니다.</p>' +
                        '<a href="' + link('index.html') + '" class="bg-primary text-on-primary px-8 py-4 rounded-full font-title-md text-title-md inline-block">쇼핑 계속하기</a>' +
                        '</div>';
                    updateCartBadges();
                }, 1500);
            });
        }

        // Shipping & payment radio styling
        ['address', 'payment'].forEach(name => {
            document.querySelectorAll('input[name="' + name + '"]').forEach(radio => {
                radio.addEventListener('change', () => {
                    document.querySelectorAll('input[name="' + name + '"]').forEach(r => {
                        const label = r.closest('label');
                        if (!label) return;
                        label.classList.toggle('border-primary', r.checked);
                        label.classList.toggle('bg-surface-container-low', r.checked);
                        label.classList.toggle('border-outline-variant', !r.checked);
                    });
                });
            });
        });

        // Logo link
        document.querySelectorAll('a').forEach(a => {
            if (a.textContent.includes('Figtree')) a.href = link('index.html');
        });
    }

    // ==================== BOOT ====================
    document.addEventListener('DOMContentLoaded', () => {
        setupCartIcon();
        setupNavLinks();

        // Add spin animation
        const style = document.createElement('style');
        style.textContent = '@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}';
        document.head.appendChild(style);

        const path = decodeURIComponent(location.pathname);
        if (path.includes('bundleinfo')) initBundle();
        else if (path.includes('supplyprofile')) initSupplier();
        else if (path.includes('cart') || path.includes('check-in')) initCart();
        else initMain();
    });
})();
