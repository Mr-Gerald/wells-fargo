const { supabase } = require('./supabaseClient');
const { v4: uuidv4 } = require('uuid');

/**
 * Database Service to abstract Supabase operations
 */
const dbService = {
    /**
     * Get a full user object with nested data
     */
    async getUser(userId) {
        // 1. Get user base data
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (userError || !user) return null;

        // 2. Get accounts
        const { data: accounts, error: accountsError } = await supabase
            .from('accounts')
            .select('*')
            .eq('user_id', userId);

        // 3. Get notifications
        const { data: notifications, error: notificationsError } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });

        // 4. Get rewards activity
        const { data: rewardsActivity, error: rewardsError } = await supabase
            .from('rewards_activity')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });

        return {
            ...user,
            accounts: accounts || [],
            notifications: notifications || [],
            rewards: {
                balance: user.rewards_balance || 0,
                activity: rewardsActivity || []
            }
        };
    },

    /**
     * Get user by username
     */
    async getUserByUsername(username) {
        const { data: user, error } = await supabase
            .from('users')
            .select('id')
            .ilike('username', username)
            .single();
        
        if (error || !user) return null;
        return this.getUser(user.id);
    },

    /**
     * Get admin by ID
     */
    async getAdmin(adminId) {
        const { data, error } = await supabase
            .from('admins')
            .select('*')
            .eq('id', adminId)
            .single();
        
        if (error) throw error;
        return data;
    },

    /**
     * Get admin by username
     */
    async getAdminByUsername(username) {
        const { data: admin, error } = await supabase
            .from('admins')
            .select('*')
            .ilike('username', username)
            .single();
        
        return admin;
    },

    /**
     * Create a new user
     */
    async createUser(userData) {
        const { accounts, notifications, rewards, ...userBase } = userData;
        
        // 1. Insert user
        const { error: userError } = await supabase
            .from('users')
            .insert([{
                ...userBase,
                rewards_balance: rewards?.balance || 0
            }]);

        if (userError) throw userError;

        // 2. Insert accounts
        if (accounts && accounts.length > 0) {
            const accountsToInsert = accounts.map(acc => ({ ...acc, user_id: userBase.id }));
            const { error: accError } = await supabase.from('accounts').insert(accountsToInsert);
            if (accError) throw accError;
        }

        return this.getUser(userBase.id);
    },

    /**
     * Update user base data
     */
    async updateUser(userId, updates) {
        const { error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId);
        
        if (error) throw error;
        return this.getUser(userId);
    },

    /**
     * Get transactions for an account
     */
    async getTransactions(accountId) {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('account_id', accountId)
            .order('postedDate', { ascending: false });
        
        if (error) throw error;
        return data || [];
    },

    /**
     * Get a single account
     */
    async getAccount(accountId) {
        const { data, error } = await supabase
            .from('accounts')
            .select('*')
            .eq('id', accountId)
            .single();
        
        if (error) throw error;
        return data;
    },

    /**
     * Get a single transaction with account info
     */
    async getTransaction(txId) {
        const { data, error } = await supabase
            .from('transactions')
            .select('*, accounts(*)')
            .eq('id', txId)
            .single();
        
        if (error) throw error;
        return data;
    },

    /**
     * Add a transaction and update account balance
     */
    async addTransaction(txData, updateBalance = true) {
        // 1. Insert transaction
        const { error: txError } = await supabase
            .from('transactions')
            .insert([txData]);
        
        if (txError) throw txError;

        // 2. Update account balance if needed
        if (updateBalance && txData.status === 'Completed') {
            const { data: account, error: accFetchError } = await supabase
                .from('accounts')
                .select('balance')
                .eq('id', txData.account_id)
                .single();
            
            if (accFetchError) throw accFetchError;

            const newBalance = account.balance + txData.amount;
            const { error: accUpdateError } = await supabase
                .from('accounts')
                .update({ balance: newBalance })
                .eq('id', txData.account_id);
            
            if (accUpdateError) throw accUpdateError;
        }
    },

    /**
     * Add multiple transactions
     */
    async addTransactions(txs) {
        const { error } = await supabase
            .from('transactions')
            .insert(txs);
        
        if (error) throw error;
    },

    /**
     * Add multiple accounts
     */
    async addAccounts(accounts) {
        const { error } = await supabase
            .from('accounts')
            .insert(accounts);
        
        if (error) throw error;
    },

    /**
     * Add multiple notifications
     */
    async addNotifications(notifications) {
        const { error } = await supabase
            .from('notifications')
            .insert(notifications);
        
        if (error) throw error;
    },

    /**
     * Add a notification
     */
    async addNotification(userId, message) {
        const notification = {
            id: `n-${uuidv4()}`,
            user_id: userId,
            message,
            date: new Date().toISOString(),
            isRead: false
        };

        const { error } = await supabase
            .from('notifications')
            .insert([notification]);
        
        if (error) throw error;
        return notification;
    },

    /**
     * Add multiple rewards activity
     */
    async addRewardsActivity(activities) {
        const { error } = await supabase
            .from('rewards_activity')
            .insert(activities);
        
        if (error) throw error;
    },

    /**
     * Mark notification as read
     */
    async markNotificationRead(notificationId) {
        const { error } = await supabase
            .from('notifications')
            .update({ isRead: true })
            .eq('id', notificationId);
        
        if (error) throw error;
    },

    /**
     * Delete notification
     */
    async deleteNotification(notificationId) {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId);
        
        if (error) throw error;
    },

    /**
     * Get pending verifications
     */
    async getPendingVerifications() {
        const { data, error } = await supabase
            .from('verifications')
            .select('*, users(username)')
            .eq('status', 'pending')
            .order('submittedAt', { ascending: false });
        
        if (error) throw error;
        return data || [];
    },

    /**
     * Submit verification
     */
    async submitVerification(verificationData) {
        const { error } = await supabase
            .from('verifications')
            .insert([verificationData]);
        
        if (error) throw error;
    },

    /**
     * Update verification status
     */
    async updateVerificationStatus(id, status) {
        const { error } = await supabase
            .from('verifications')
            .update({ status })
            .eq('id', id);
        
        if (error) throw error;
    },

    /**
     * Get all users (admin only)
     */
    async getUsers() {
        const { data, error } = await supabase
            .from('users')
            .select('*, accounts(*), notifications(*), rewards_activity(*)');
        
        if (error) throw error;
        return data || [];
    },

    /**
     * Get a single verification
     */
    async getVerification(id) {
        const { data, error } = await supabase
            .from('verifications')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    },

    /**
     * Update transaction status
     */
    async updateTransactionStatus(txId, status, reason = null) {
        const updates = { status };
        if (reason) updates.reason = reason;

        const { error } = await supabase
            .from('transactions')
            .update(updates)
            .eq('id', txId);
        
        if (error) throw error;
    },

    /**
     * Update account balance
     */
    async updateAccountBalance(accountId, newBalance) {
        const { error } = await supabase
            .from('accounts')
            .update({ balance: newBalance })
            .eq('id', accountId);
        
        if (error) throw error;
    },

    /**
     * Update verification status
     */
    async updateVerificationStatus(id, status) {
        const { error } = await supabase
            .from('verifications')
            .update({ status })
            .eq('id', id);
        
        if (error) throw error;
    },

    /**
     * Search users
     */
    async searchUsers(query, excludeId) {
        const { data, error } = await supabase
            .from('users')
            .select('id, username, fullName, accounts(id, name, numberSuffix)')
            .neq('id', excludeId)
            .or(`username.ilike.%${query}%,fullName.ilike.%${query}%`);
        
        if (error) throw error;
        return data || [];
    },

    /**
     * Clear all user data except the user record itself
     */
    async clearUserData(userId) {
        const { data: accounts } = await supabase.from('accounts').select('id').eq('user_id', userId);
        if (accounts && accounts.length > 0) {
            const accountIds = accounts.map(a => a.id);
            await supabase.from('transactions').delete().in('account_id', accountIds);
        }

        await supabase.from('accounts').delete().eq('user_id', userId);
        await supabase.from('notifications').delete().eq('user_id', userId);
        await supabase.from('rewards_activity').delete().eq('user_id', userId);
        await supabase.from('verifications').delete().eq('user_id', userId);
    },

    /**
     * Delete user and all associated data
     */
    async deleteUser(userId) {
        // Supabase foreign keys should handle cascade delete if set up correctly,
        // but we'll manually delete for robustness if needed.
        // 1. Delete transactions (linked to accounts)
        const { data: accounts } = await supabase.from('accounts').select('id').eq('user_id', userId);
        if (accounts && accounts.length > 0) {
            const accountIds = accounts.map(a => a.id);
            await supabase.from('transactions').delete().in('account_id', accountIds);
        }

        // 2. Delete accounts, notifications, rewards, verifications
        await supabase.from('accounts').delete().eq('user_id', userId);
        await supabase.from('notifications').delete().eq('user_id', userId);
        await supabase.from('rewards_activity').delete().eq('user_id', userId);
        await supabase.from('verifications').delete().eq('user_id', userId);

        // 3. Delete user
        const { error } = await supabase.from('users').delete().eq('id', userId);
        if (error) throw error;
    },

    /**
     * Reset user data (cloned accounts)
     */
    async resetUser(userId, templateData) {
        // This is complex, but we can delete and re-insert or update
        // 1. Delete existing accounts, notifications, rewards, transactions
        await supabase.from('accounts').delete().eq('user_id', userId);
        await supabase.from('notifications').delete().eq('user_id', userId);
        await supabase.from('rewards_activity').delete().eq('user_id', userId);
        // Transactions are linked to accounts, so they might be deleted via cascade if set up,
        // but let's be safe. Actually, transactions are linked to account_id.
        // We need to find all account IDs first.
        
        // 2. Insert template data
        const { accounts, rewards, notifications } = templateData;
        
        // Update user rewards balance
        await supabase.from('users').update({ rewards_balance: rewards.balance }).eq('id', userId);

        // Insert accounts
        for (const acc of accounts) {
            await supabase.from('accounts').insert({ ...acc, user_id: userId });
        }

        // Insert notifications
        for (const n of notifications) {
            await supabase.from('notifications').insert({ ...n, user_id: userId });
        }
    }
};

module.exports = dbService;
