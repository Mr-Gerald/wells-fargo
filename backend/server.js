

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt =require('jsonwebtoken');
const fs = require('fs/promises');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('./authMiddleware');
const { GoogleGenAI } = require('@google/genai');
const { sendSignupEmail } = require('./emailService');
const fetch = require('node-fetch');
const dbService = require('./dbService');

const app = express();
const PORT = process.env.PORT || 3001;
const DB_TEMPLATE_PATH = path.join(__dirname, 'database.template.json');
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-that-should-be-in-an-env-file';
const SYSTEM_INSTRUCTION = "You are Fargo, a helpful AI assistant for Wells Fargo bank. Your responses must be concise and professional. **Do not repeat information or greet the user if a greeting is already in the conversation history.** Stick to banking-related topics. Use markdown for bolding like **this**.";

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- Helper Functions ---
const assembleUserObject = async (user) => {
    if (!user || !user.accounts) {
        return user;
    }
    const userTransactions = {};
    for (const account of user.accounts) {
        userTransactions[account.id] = await dbService.getTransactions(account.id);
    }
    return { ...user, transactions: userTransactions };
};

const sendNotification = (user, message) => {
    if (!user.notifications) {
        user.notifications = [];
    }
    user.notifications.unshift({ id: `n-${uuidv4()}`, message, date: new Date().toISOString(), isRead: false });
};


// --- API Routes ---

// Chat Route
app.post('/api/chat/stream', authMiddleware, async (req, res) => {
    try {
        const { history } = req.body;

        if (!history || !Array.isArray(history) || history.length === 0) {
            return res.status(400).json({ message: 'History is required.' });
        }

        if (!process.env.API_KEY) {
            console.error("API_KEY environment variable not set on the server.");
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.status(500).send("I'm sorry, I encountered an error: API key not configured on the server.");
            return;
        }
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        const result = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: history, // Use history directly from the client
            config: {
                systemInstruction: SYSTEM_INSTRUCTION
            }
        });

        for await (const chunk of result) {
            const chunkText = chunk.text;
            if (chunkText) {
                res.write(chunkText);
            }
        }
        
        res.end();

    } catch (error) {
        console.error('Chat Stream Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error processing chat stream.' });
        } else {
            res.end();
        }
    }
});


// Authentication Routes
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { username, password, fullName, email, phone, ssn } = req.body;
        if (!username || !password || !fullName || !email || !phone || !ssn) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const existingUser = await dbService.getUserByUsername(username);
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists.' });
        }

        const newUserId = `user-${uuidv4()}`;
        const newUser = {
            id: newUserId,
            username,
            password: password,
            fullName,
            email,
            phone,
            ssn,
            dob: '',
            customerSince: new Date().getFullYear(),
            accounts: [
                 { id: `checking-${newUserId}`, type: "Everyday Checking", name: "Everyday Checking", numberSuffix: Math.floor(1000 + Math.random() * 9000).toString(), balance: 0, subText: "Available balance" },
                 { id: `savings-${newUserId}`, type: "WAY2SAVE", name: "WAY2SAVE", numberSuffix: Math.floor(1000 + Math.random() * 9000).toString(), balance: 0, subText: "Available balance" }
            ],
            notifications: [],
            rewards: { balance: 0, activity: [] }
        };
        
        await dbService.createUser(newUser);
        
        await dbService.addNotification(newUserId, 'Welcome to Wells Fargo! Your new accounts are ready.');
        await dbService.addNotification(newUserId, `A confirmation email has been sent to ${newUser.email}. Please check your inbox.`);

        // Send a real email confirmation asynchronously using the centralized service
        sendSignupEmail(newUser);
        
        const userWithTransactions = await assembleUserObject(newUser);
        const { password: _, ...userToReturn } = userWithTransactions;
        
        res.status(201).json({ message: 'User created successfully.', user: userToReturn });
    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ message: 'Server error during signup.' });
    }
});

app.post('/api/auth/create-instant', authMiddleware, async (req, res) => {
    try {
        if (req.user.id !== 'user-1') {
            return res.status(403).json({ message: 'This feature is only available to the demo user.' });
        }

        const { username, password, fullName, email, phone, ssn, dob } = req.body;
        if (!username || !password || !fullName || !email || !phone || !ssn || !dob) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const existingUser = await dbService.getUserByUsername(username);
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists.' });
        }
        
        const templateDb = JSON.parse(await fs.readFile(DB_TEMPLATE_PATH, 'utf-8'));
        const alexTemplate = templateDb.users.find(u => u.id === 'user-1');
        
        const newUserId = `user-${uuidv4()}`;

        const newUser = {
            id: newUserId,
            username,
            password, // In real app, hash this
            fullName,
            email,
            phone,
            ssn,
            dob,
            customerSince: new Date().getFullYear(),
            rewards_balance: alexTemplate.rewards.balance,
            is_active: true,
            created_at: new Date().toISOString()
        };

        await dbService.createUser(newUser);

        const newAccountIdsMap = {};
        const accountsToInsert = alexTemplate.accounts.map(acc => {
            const newAccId = `${acc.type.split(' ')[0].toLowerCase()}-${newUserId}`;
            newAccountIdsMap[acc.id] = newAccId;
            return { ...acc, id: newAccId, user_id: newUserId };
        });
        await dbService.addAccounts(accountsToInsert);

        const allTxs = [];
        for (const [oldId, newId] of Object.entries(newAccountIdsMap)) {
            const templateTxs = templateDb.transactions[oldId] || [];
            templateTxs.forEach(tx => {
                allTxs.push({ ...tx, id: `txn-${uuidv4()}`, account_id: newId });
            });
        }
        if (allTxs.length > 0) await dbService.addTransactions(allTxs);

        const notificationsToInsert = alexTemplate.notifications.map(n => ({
            ...n,
            id: `n-${uuidv4()}`,
            user_id: newUserId,
            date: new Date().toISOString()
        }));
        await dbService.addNotifications(notificationsToInsert);

        const rewardsToInsert = alexTemplate.rewards.activity.map(a => ({
            ...a,
            id: `rw-${uuidv4()}`,
            user_id: newUserId,
            date: new Date().toISOString()
        }));
        await dbService.addRewardsActivity(rewardsToInsert);

        const userWithData = await assembleUserObject(newUser);
        const { password: _, ...userToReturn } = userWithData;
        const token = jwt.sign({ id: userToReturn.id, username: userToReturn.username }, JWT_SECRET, { expiresIn: '24h' });
        
        res.status(201).json({ token, user: userToReturn });

    } catch (error) {
        console.error('Create Instant Account Error:', error);
        res.status(500).json({ message: 'Server error during instant account creation.' });
    }
});


app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        let user = await dbService.getUserByUsername(username);
        if (!user) {
            user = await dbService.getAdminByUsername(username);
        }

        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const userWithData = await assembleUserObject(user);
        const { password: _, ...userToReturn } = userWithData;
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, user: userToReturn });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
    try {
        const user = await dbService.getUser(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        const userWithData = await assembleUserObject(user);
        const { password, ...userToReturn } = userWithData;
        res.json(userToReturn);
    } catch (error) {
        console.error('Auth Me Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// User & Admin Routes
app.get('/api/users', authMiddleware, async (req, res) => {
    try {
        const admin = await dbService.getAdmin(req.user.id);
        if (!admin) return res.status(403).json({ message: 'Access denied' });

        const users = await dbService.getUsers();
        const usersToReturn = users.map(({ password, ...user }) => user);
        res.json(usersToReturn);
    } catch (error) {
        console.error('Fetch Users Error:', error);
        res.status(500).json({ message: "Server error fetching users." });
    }
});

app.get('/api/users/search', authMiddleware, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.json([]);
        }
        const results = await dbService.searchUsers(String(q), req.user.id);
        res.json(results);
    } catch (error) {
        console.error('User Search Error:', error);
        res.status(500).json({ message: 'Error searching for users.' });
    }
});


app.put('/api/users/:id', authMiddleware, async (req, res) => {
    if (req.user.id !== req.params.id) {
        return res.status(403).json({ message: 'Forbidden: You can only update your own profile.' });
    }
    
    try {
        const currentUser = await dbService.getUser(req.params.id);

        if (!currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // For the demo user, we don't persist changes. 
        if (req.user.id === 'user-1') {
            const updatedLocalUser = { ...currentUser, ...req.body };
            const userWithData = await assembleUserObject(updatedLocalUser);
            const { password: _, ...userToReturn } = userWithData;
            return res.json(userToReturn);
        }

        const { username, fullName, password, email, phone, dob } = req.body;
        const updates = {};

        if (username && username !== currentUser.username) {
             const existing = await dbService.getUserByUsername(username);
             if (existing && existing.id !== currentUser.id) {
                return res.status(400).json({ message: 'Username is already taken.' });
             }
             updates.username = username;
        }

        if (fullName) updates.fullName = fullName;
        if (password) updates.password = password;
        if (email) updates.email = email;
        if (phone) updates.phone = phone;
        if (dob) updates.dob = dob;

        const updatedUser = await dbService.updateUser(req.params.id, updates);
        const userWithData = await assembleUserObject(updatedUser);
        const { password: _, ...userToReturn } = userWithData;
        res.json(userToReturn);
    } catch (error) {
        console.error('Update User Error:', error);
        res.status(500).json({ message: 'Server error while updating user' });
    }
});

app.delete('/api/users/:id', authMiddleware, async (req, res) => {
    if (req.user.id !== req.params.id) {
        return res.status(403).json({ message: 'Forbidden: You can only delete your own account.' });
    }
    if (req.user.id === 'user-1') {
        return res.status(400).json({ message: 'The demo user cannot be deleted.' });
    }

    try {
        const userIdToDelete = req.params.id;
        const userToDelete = await dbService.getUser(userIdToDelete);
        if (!userToDelete) {
            return res.status(404).json({ message: 'User not found.' });
        }
        
        await dbService.deleteUser(userIdToDelete);
        res.status(200).json({ message: 'Account deleted successfully.' });

    } catch (error) {
        console.error('Delete User Error:', error);
        res.status(500).json({ message: 'Server error while deleting account.' });
    }
});

app.post('/api/users/:id/reset', authMiddleware, async (req, res) => {
    if (req.user.id !== req.params.id) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    if (req.user.id === 'user-1') {
        return res.status(400).json({ message: 'This endpoint is not for the main demo user.' });
    }

    try {
        const userId = req.params.id;
        const userToReset = await dbService.getUser(userId);
        if (!userToReset) return res.status(404).json({ message: 'User not found' });

        const templateDb = JSON.parse(await fs.readFile(DB_TEMPLATE_PATH, 'utf-8'));
        const alexTemplate = templateDb.users.find(u => u.id === 'user-1');

        // 1. Clear existing data
        await dbService.clearUserData(userId);

        // 2. Clone from template
        const newAccountIdsMap = {};
        const accountsToInsert = alexTemplate.accounts.map(acc => {
            const oldId = acc.id;
            const newId = `${acc.type.split(' ')[0].toLowerCase()}-${userId}-${uuidv4().slice(0, 4)}`;
            newAccountIdsMap[oldId] = newId;
            return { ...acc, id: newId, user_id: userId };
        });
        await dbService.addAccounts(accountsToInsert);

        const allTxs = [];
        for (const [oldId, newId] of Object.entries(newAccountIdsMap)) {
            const templateTxs = templateDb.transactions[oldId] || [];
            templateTxs.forEach(tx => {
                allTxs.push({ ...tx, id: `txn-${uuidv4()}`, account_id: newId });
            });
        }
        if (allTxs.length > 0) await dbService.addTransactions(allTxs);

        const notificationsToInsert = alexTemplate.notifications.map(n => ({
            ...n,
            id: `n-${uuidv4()}`,
            user_id: userId,
            date: new Date().toISOString()
        }));
        await dbService.addNotifications(notificationsToInsert);

        const rewardsToInsert = alexTemplate.rewards.activity.map(a => ({
            ...a,
            id: `rw-${uuidv4()}`,
            user_id: userId,
            date: new Date().toISOString()
        }));
        await dbService.addRewardsActivity(rewardsToInsert);

        // Update user rewards balance
        await dbService.updateUser(userId, { rewards_balance: alexTemplate.rewards.balance });

        await dbService.addNotification(userId, "Your account data has been successfully reset to its default state.");
        
        res.status(200).json({ message: 'Account reset successfully.' });

    } catch (error) {
        console.error('Reset User Error:', error);
        res.status(500).json({ message: 'Server error while resetting account.' });
    }
});


// Notification Routes for Admin
app.post('/api/users/:id/notifications', authMiddleware, async(req, res) => {
    try {
        const admin = await dbService.getAdmin(req.user.id);
        if (!admin) return res.status(403).json({ message: 'Access denied' });
        
        const { message } = req.body;
        const userId = req.params.id;

        await dbService.addNotification(userId, message);
        res.status(201).json({ message: "Notification sent successfully." });
    } catch (error) {
        console.error('Add Notification Error:', error);
        res.status(500).json({ message: "Server error adding notification." });
    }
});

// Notification Routes for User
app.post('/api/notifications/:notificationId/read', authMiddleware, async (req, res) => {
    try {
        await dbService.markNotificationRead(req.params.notificationId);
        const user = await dbService.getUser(req.user.id);
        const userWithData = await assembleUserObject(user);
        const { password, ...userToReturn } = userWithData;
        res.json(userToReturn);
    } catch (error) {
        console.error('Mark Notification Read Error:', error);
        res.status(500).json({ message: 'Server error marking notification as read.' });
    }
});

app.delete('/api/notifications/:notificationId', authMiddleware, async (req, res) => {
    try {
        await dbService.deleteNotification(req.params.notificationId);
        const user = await dbService.getUser(req.user.id);
        const userWithData = await assembleUserObject(user);
        const { password, ...userToReturn } = userWithData;
        res.json(userToReturn);
    } catch (error) {
        console.error('Delete Notification Error:', error);
        res.status(500).json({ message: 'Server error deleting notification.' });
    }
});


// Account & Transaction Routes
app.get('/api/accounts/:accountId/transactions', authMiddleware, async (req, res) => {
    try {
        const { accountId } = req.params;
        const user = await dbService.getUser(req.user.id);

        if (!user || !user.accounts.some(acc => acc.id === accountId)) {
            return res.status(403).json({ message: "Access denied to this account's transactions." });
        }
        
        const allTransactions = await dbService.getTransactions(accountId);
        res.json(allTransactions);

    } catch (error) {
        console.error('Fetch Transactions Error:', error);
         res.status(500).json({ message: 'Server error fetching transactions' });
    }
});

app.get('/api/accounts/:accountId/transactions/:txId', authMiddleware, async (req, res) => {
     try {
        const { accountId, txId } = req.params;
        const user = await dbService.getUser(req.user.id);
        const admin = await dbService.getAdminByUsername(req.user.username); // Simple check for admin
        
        const ownsAccount = user?.accounts.some(acc => acc.id === accountId);
        if (!admin && !ownsAccount) {
            return res.status(403).json({ message: "Access denied to this account." });
        }
        
        const transaction = await dbService.getTransaction(txId);
        if(!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.json({ transaction, account: transaction.accounts });

    } catch (error) {
        console.error('Fetch Transaction Detail Error:', error);
        res.status(500).json({ message: 'Server error fetching transaction details' });
    }
});

// Internal Transfer
app.post('/api/transfers', authMiddleware, async (req, res) => {
    try {
        const { fromAccountId, toAccountId, amount } = req.body;
        if (!fromAccountId || !toAccountId || !amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid transfer data" });
        }
        
        const fromAccount = await dbService.getAccount(fromAccountId);
        const toAccount = await dbService.getAccount(toAccountId);
        
        if (!fromAccount || !toAccount) return res.status(404).json({ message: "Account not found." });
        if (fromAccount.balance < amount) return res.status(400).json({ message: "Insufficient funds." });

        const sender = await dbService.getUser(fromAccount.user_id);
        const receiver = await dbService.getUser(toAccount.user_id);

        const receiverTransactions = await dbService.getTransactions(toAccountId);
        const transactionStatus = (receiver.id !== 'user-1' && receiverTransactions.length === 0) ? 'On Hold' : 'Completed';
        
        const date = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
        const isoDate = new Date().toISOString();

        const debitTx = { id: `txn-${uuidv4()}`, account_id: fromAccountId, date, description: `Transfer to ${receiver.fullName}`, amount: -amount, type: 'debit', category: 'transfer', merchant: 'Internal Transfer', status: 'Completed', postedDate: isoDate, runningBalance: fromAccount.balance - amount };
        const creditTx = { id: `txn-${uuidv4()}`, account_id: toAccountId, date, description: `Transfer from ${sender.fullName}`, amount: amount, type: 'credit', category: 'transfer', merchant: 'Internal Transfer', status: transactionStatus, postedDate: isoDate, runningBalance: toAccount.balance + (transactionStatus === 'Completed' ? amount : 0) };
        
        // For the receiver, always persist the changes.
        await dbService.addTransaction(creditTx, transactionStatus === 'Completed');
        await dbService.addNotification(receiver.id, transactionStatus === 'Completed' ? `You received $${amount.toFixed(2)} from ${sender.fullName}.` : `You have received a payment of $${amount.toFixed(2)} from ${sender.fullName}. The funds are on hold pending identity verification.`);

        // For the sender, ONLY persist if it's NOT the demo user 'Alex'.
        if (sender.id !== 'user-1') {
            await dbService.addTransaction(debitTx, true);
            await dbService.addNotification(sender.id, `You sent $${amount.toFixed(2)} to ${receiver.fullName}.`);
        }

        res.status(200).json({ message: 'Transfer successful!', transaction: debitTx, notificationMessage: `You sent $${amount.toFixed(2)} to ${receiver.fullName}.` });

    } catch (error) {
        console.error('Transfer Error:', error);
        res.status(500).json({ message: "Server error during transfer." });
    }
});

// External Transfer
app.post('/api/transfers/external', authMiddleware, async (req, res) => {
    try {
        const { fromAccountId, amount, recipient, transferDetails } = req.body;
        const parsedAmount = parseFloat(amount);
        if (!fromAccountId || !parsedAmount || parsedAmount <= 0 || !recipient || !transferDetails) {
            return res.status(400).json({ message: "Invalid transfer data" });
        }
        
        const fromAccount = await dbService.getAccount(fromAccountId);
        if (!fromAccount) return res.status(404).json({ message: "Account not found." });
        if (fromAccount.balance < parsedAmount) return res.status(400).json({ message: "Insufficient funds." });
        
        const sender = await dbService.getUser(fromAccount.user_id);
        const date = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
        const isoDate = new Date().toISOString();
        let transactionStatus = 'Pending';
        let transactionReason = null;
        let notificationMessage = '';
        const txId = `txn-${uuidv4()}`;

        if (transferDetails.type === 'wire') {
            transactionReason = {
                title: "Action Required: Security Fee",
                message: "A security verification fee is required to complete this transfer. Please check your notifications for a link to contact support and arrange payment."
            };
            const mailtoSubject = encodeURIComponent(`Wire Transfer Fee - Acct ...${fromAccount.numberSuffix} (Ref: ${txId})`);
            const mailtoBody = encodeURIComponent(
`Dear Wells Fargo Support,

I am writing to inquire about the security verification fee for a recent wire transfer.

Please provide instructions on how to proceed.

Transaction Details:
- Recipient: ${recipient.recipientName}
- Amount: $${parsedAmount.toFixed(2)}
- Transaction ID: ${txId}
- Date: ${new Date(isoDate).toLocaleString()}

Thank you,
${sender.fullName}
`
            );
            const mailtoLink = `mailto:noreply.wellsfargo.contact@gmail.com?subject=${mailtoSubject}&body=${mailtoBody}`;
            
            notificationMessage = `Your wire transfer to ${recipient.recipientName} is pending. A security fee is required to proceed. Please use this link to contact support: <a href="${mailtoLink}">Contact Support</a>.`;
            await dbService.addNotification(sender.id, notificationMessage);
        } else { // ACH
            notificationMessage = `Your external transfer of $${parsedAmount.toFixed(2)} to ${recipient.recipientName} has been initiated.`;
            await dbService.addNotification(sender.id, notificationMessage);
            transactionStatus = 'Completed'; 
        }

        const debitTx = { 
            id: txId, 
            account_id: fromAccountId,
            date, 
            description: `External Transfer to ${recipient.recipientName}`, 
            amount: -parsedAmount, 
            type: 'debit', 
            category: 'transfer', 
            merchant: transferDetails.type === 'wire' ? `${transferDetails.wireType} Wire` : 'ACH Transfer',
            status: transactionStatus,
            postedDate: isoDate, 
            runningBalance: fromAccount.balance - (transactionStatus === 'Completed' ? parsedAmount : 0),
            reason: transactionReason
        };

        // Only persist if not Alex
        if (sender.id !== 'user-1') {
            await dbService.addTransaction(debitTx, transactionStatus === 'Completed');
        }
        
        res.status(200).json({ message: 'External transfer initiated!', transaction: debitTx, notificationMessage });

    } catch (error) {
        console.error('External Transfer Error:', error);
        res.status(500).json({ message: "Server error during external transfer." });
    }
});

// Verification Routes
app.post('/api/verifications', authMiddleware, async (req, res) => {
    try {
        const { accountId, transactionId, data } = req.body;
        if(req.user.id === 'user-1') return res.status(400).json({ message: "Demo user cannot submit verification." });

        const verification = {
            id: `vf-${uuidv4()}`,
            user_id: req.user.id,
            account_id: accountId,
            transaction_id: transactionId,
            status: 'pending',
            submittedAt: new Date().toISOString(),
            data
        };

        await dbService.addVerification(verification);
        
        const transaction = await dbService.getTransaction(transactionId);
        if (transaction && transaction.status === 'On Hold') {
            await dbService.updateTransactionStatus(transactionId, 'Pending');
        }

        await dbService.addNotification(req.user.id, "Your identity verification has been submitted and is now under review. You will be notified of the outcome.");

        res.status(201).json({ message: 'Verification submitted successfully.' });

    } catch(error) {
        console.error('Submit Verification Error:', error);
        res.status(500).json({ message: 'Server error submitting verification.' });
    }
});

app.get('/api/verifications', authMiddleware, async (req, res) => {
    try {
        const admin = await dbService.getAdmin(req.user.id);
        if (!admin) return res.status(403).json({ message: 'Access denied' });
        
        const verifications = await dbService.getVerifications();
        const pendingVerifications = [];
        
        for (const v of verifications) {
            if (v.status === 'pending') {
                const user = await dbService.getUser(v.user_id);
                const tx = await dbService.getTransaction(v.transaction_id);
                pendingVerifications.push({ ...v, user: user?.username || 'Unknown', transactionAmount: tx?.amount || 'N/A' });
            }
        }
            
        res.json(pendingVerifications);
    } catch(error) {
        console.error('Fetch Verifications Error:', error);
        res.status(500).json({ message: 'Server error fetching verifications.' });
    }
});

app.post('/api/verifications/:id/review', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'approve' or 'decline'
        if (!['approve', 'decline'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action.' });
        }
        
        const admin = await dbService.getAdmin(req.user.id);
        if (!admin) return res.status(403).json({ message: 'Access denied' });

        const verification = await dbService.getVerification(id);
        if (!verification) return res.status(404).json({ message: 'Verification request not found.' });

        const user = await dbService.getUser(verification.user_id);
        const account = await dbService.getAccount(verification.account_id);
        const transaction = await dbService.getTransaction(verification.transaction_id);
        
        if (!user || !account || !transaction) return res.status(404).json({ message: 'Associated user, account, or transaction not found.' });
        
        if (action === 'approve') {
            await dbService.updateVerificationStatus(id, 'approved');
            const reason = { // Add reason for fee
                title: "Action Required: Security Fee",
                message: "A security fee is required to complete this transfer. Please check your notifications for an email link to contact support and arrange payment."
            };
            await dbService.updateTransactionStatus(verification.transaction_id, 'Processing', reason);
            
            const mailtoSubject = encodeURIComponent(`Transfer Verification Fee - Acct ...${account.numberSuffix} (Ref: ${transaction.id})`);
            const mailtoBody = encodeURIComponent(
`Dear Wells Fargo Support,

My identity has been verified and I would like to pay the security fee for my pending transfer.

Please provide instructions.

Transaction Details:
- Amount: $${transaction.amount.toFixed(2)}
- Transaction ID: ${transaction.id}
- Date: ${new Date(transaction.postedDate).toLocaleString()}
- From Account: ...${account.numberSuffix}

Thank you,
${user.fullName}`
            );
            const mailtoLink = `mailto:noreply.wellsfargo.contact@gmail.com?subject=${mailtoSubject}&body=${mailtoBody}`;
            
            const feeNotification = `Your identity is verified, but the transfer of $${transaction.amount.toFixed(2)} is now processing. A security fee is required to complete the transfer. Please contact support at <a href="${mailtoLink}">Contact Support</a> for assistance.`;
            await dbService.addNotification(user.id, feeNotification);
        } else { // decline
            await dbService.updateVerificationStatus(id, 'declined');
            await dbService.updateTransactionStatus(verification.transaction_id, 'On Hold', null);
            await dbService.addNotification(user.id, `Your identity verification was declined. Please review your information and re-submit through the transaction receipt. You can click this link to go to the transaction: /#/account/${account.id}/transaction/${transaction.id}`);
        }

        res.json({ message: `Verification has been ${action === 'approve' ? 'approved' : 'declined'}.` });
    } catch(error) {
        console.error('Review Verification Error:', error);
        res.status(500).json({ message: 'Server error processing verification review.' });
    }
});


// --- Static File Serving ---
const FRONTEND_PATH = path.join(__dirname, '..');
const DIST_PATH = path.join(FRONTEND_PATH, 'dist');

if (process.env.NODE_ENV === 'development') {
  app.use(express.static(FRONTEND_PATH));
  app.get('*', (req, res) => {
    res.sendFile(path.join(FRONTEND_PATH, 'index.html'));
  });
} else {
  app.use(express.static(DIST_PATH));
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_PATH, 'index.html'));
  });
}

// --- Start Server ---
const startServer = async () => {
  app.listen(PORT, '0.0.0.0', () => { // Listen on 0.0.0.0 for Render
      console.log(`Server listening on port ${PORT}`);
      console.log('Serving frontend from:', process.env.NODE_ENV === 'development' ? FRONTEND_PATH : DIST_PATH);

      // Self-ping to keep Render instance alive
      const PING_URL = 'https://wells-fargo-pgz8.onrender.com/';
      if (process.env.NODE_ENV === 'production' || !process.env.NODE_ENV) {
        setInterval(() => {
          console.log(`Pinging ${PING_URL} to keep alive.`);
          fetch(PING_URL).then(res => {
              if (res.ok) {
                  console.log('Ping successful.');
              } else {
                  console.error(`Ping failed with status: ${res.status}`);
              }
          }).catch(err => {
              console.error('Ping failed with error:', err.message);
          });
        }, 14 * 60 * 1000); // 14 minutes
      }
  });
};

startServer();
