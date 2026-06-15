// Figtree Club Database Helper (Supabase)
const DB = {
    // ==================== AUTH ====================
    async signUpSeller(email, password, meta) {
        const { data, error } = await db.auth.signUp({
            email, password,
            options: { data: { role: 'seller', business_name: meta.business_name } }
        });
        if (error) throw error;
        // Create seller profile
        if (data.user) {
            const { error: profileError } = await db.from('sellers').insert({
                id: data.user.id,
                business_name: meta.business_name,
                contact_name: meta.contact_name,
                phone: meta.phone,
                country: meta.country,
                categories: meta.categories || []
            });
            if (profileError) console.error('Profile creation error:', profileError);
        }
        return data;
    },

    async signIn(email, password) {
        const { data, error } = await db.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    },

    async signOut() {
        await db.auth.signOut();
    },

    async getUser() {
        const { data: { user } } = await db.auth.getUser();
        return user;
    },

    async getSellerProfile(userId) {
        const { data, error } = await db.from('sellers').select('*').eq('id', userId).single();
        if (error) return null;
        return data;
    },

    // ==================== BUNDLES ====================
    async createBundle(bundle) {
        const { data, error } = await db.from('bundles').insert(bundle).select().single();
        if (error) throw error;
        return data;
    },

    async updateBundle(id, updates) {
        const { data, error } = await db.from('bundles').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async deleteBundle(id) {
        const { error } = await db.from('bundles').delete().eq('id', id);
        if (error) throw error;
    },

    async getSellerBundles(sellerId) {
        const { data, error } = await db.from('bundles').select('*').eq('seller_id', sellerId).order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async getAllBundles(filters = {}) {
        let query = db.from('bundles').select('*, sellers(business_name, rating, verified, country)').eq('status', 'active');
        if (filters.category) query = query.eq('category', filters.category);
        if (filters.search) query = query.ilike('name', '%' + filters.search + '%');
        if (filters.sort === 'price_asc') query = query.order('price', { ascending: true });
        else if (filters.sort === 'price_desc') query = query.order('price', { ascending: false });
        else query = query.order('created_at', { ascending: false });
        if (filters.limit) query = query.limit(filters.limit);
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    async getBundleById(id) {
        const { data, error } = await db.from('bundles').select('*, sellers(*)').eq('id', id).single();
        if (error) throw error;
        // Increment views
        db.from('bundles').update({ views: (data.views || 0) + 1 }).eq('id', id).then();
        return data;
    },

    // ==================== ORDERS ====================
    async createOrder(order) {
        order.order_number = 'FT-' + Date.now().toString(36).toUpperCase();
        const { data, error } = await db.from('orders').insert(order).select().single();
        if (error) throw error;
        return data;
    },

    async getSellerOrders(sellerId, status) {
        let query = db.from('orders').select('*, bundles(name, photos, grade, size_range)').eq('seller_id', sellerId).order('created_at', { ascending: false });
        if (status && status !== 'all') query = query.eq('status', status);
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    async updateOrderStatus(orderId, status, extra = {}) {
        const { data, error } = await db.from('orders').update({ status, ...extra, updated_at: new Date().toISOString() }).eq('id', orderId).select().single();
        if (error) throw error;
        return data;
    },

    // ==================== MESSAGES ====================
    async sendMessage(receiverId, content, bundleId) {
        const user = await this.getUser();
        if (!user) throw new Error('Not authenticated');
        const { data, error } = await db.from('messages').insert({
            sender_id: user.id, receiver_id: receiverId, content, bundle_id: bundleId || null
        }).select().single();
        if (error) throw error;
        return data;
    },

    async getConversations(userId) {
        // Get unique conversation partners
        const { data, error } = await db.from('messages')
            .select('*, sender:sender_id(id, raw_user_meta_data), receiver:receiver_id(id, raw_user_meta_data)')
            .or('sender_id.eq.' + userId + ',receiver_id.eq.' + userId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        // Group by partner
        const convMap = {};
        (data || []).forEach(msg => {
            const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
            if (!convMap[partnerId]) convMap[partnerId] = { partnerId, messages: [], unread: 0, lastMessage: msg };
            convMap[partnerId].messages.push(msg);
            if (!msg.read && msg.receiver_id === userId) convMap[partnerId].unread++;
        });
        return Object.values(convMap);
    },

    async getMessagesWith(userId, partnerId) {
        const { data, error } = await db.from('messages')
            .select('*')
            .or('and(sender_id.eq.' + userId + ',receiver_id.eq.' + partnerId + '),and(sender_id.eq.' + partnerId + ',receiver_id.eq.' + userId + ')')
            .order('created_at', { ascending: true });
        if (error) throw error;
        // Mark as read
        db.from('messages').update({ read: true }).eq('receiver_id', userId).eq('sender_id', partnerId).eq('read', false).then();
        return data || [];
    },

    // ==================== REVIEWS ====================
    async getReviews(sellerId) {
        const { data, error } = await db.from('reviews').select('*').eq('seller_id', sellerId).order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    // ==================== STORAGE ====================
    async uploadMedia(file, folder) {
        const ext = file.name.split('.').pop();
        const path = folder + '/' + Date.now() + '_' + Math.random().toString(36).slice(2) + '.' + ext;
        const { data, error } = await db.storage.from('bundle-media').upload(path, file);
        if (error) throw error;
        const { data: urlData } = db.storage.from('bundle-media').getPublicUrl(path);
        return urlData.publicUrl;
    },

    async uploadBundleMedia(files, videoFiles, sellerId) {
        const folder = 'sellers/' + sellerId;
        const photoUrls = [];
        const videoUrls = [];
        for (const file of files) {
            const url = await this.uploadMedia(file, folder + '/photos');
            photoUrls.push(url);
        }
        for (const file of videoFiles) {
            const url = await this.uploadMedia(file, folder + '/videos');
            videoUrls.push(url);
        }
        return { photoUrls, videoUrls };
    },

    // ==================== STATS ====================
    async getSellerStats(sellerId) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const [ordersRes, bundlesRes, reviewsRes] = await Promise.all([
            db.from('orders').select('total_price, status').eq('seller_id', sellerId).gte('created_at', monthStart),
            db.from('bundles').select('id, status').eq('seller_id', sellerId),
            db.from('reviews').select('rating').eq('seller_id', sellerId)
        ]);

        const orders = ordersRes.data || [];
        const bundles = bundlesRes.data || [];
        const reviews = reviewsRes.data || [];

        const revenue = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + o.total_price, 0);
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '-';

        return {
            revenue,
            totalOrders: orders.length,
            pendingOrders,
            activeBundles: bundles.filter(b => b.status === 'active').length,
            avgRating,
            reviewCount: reviews.length
        };
    }
};
