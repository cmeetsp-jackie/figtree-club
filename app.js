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
            else if (t === '공급업체') a.href = link('supplyprofile.html');
        });
        // 로그인/회원가입 버튼은 auth.js에서 처리
    }

    // ==================== MAIN PAGE ====================
    function initMain() {
        const products = [
            { id: 'ralph-polo', name: '랄프 로렌 폴로', price: 239000, original: 383000 },
            { id: 'nike-jacket', name: '나이키 자켓 #1', price: 780000, original: 780000 },
            { id: 'ua-shorts', name: '언더아머 반바지', price: 79000, original: 107000 }
        ];
        const cards = document.querySelectorAll('article.bundle-card');

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
    }

    // ==================== BUNDLE INFO PAGE ====================
    function initBundle() {
        const product = { id: 'vintage-leather', name: '프리미엄 빈티지 가죽 자켓', price: 765000 };

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
        if (path.includes('main')) initMain();
        else if (path.includes('bundleinfo')) initBundle();
        else if (path.includes('supplyprofile')) initSupplier();
        else if (path.includes('cart') || path.includes('check-in')) initCart();
    });
})();
