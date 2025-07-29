

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
const fetch = require('node-fetch'); // Make sure to have node-fetch or similar if not in a native fetch env

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = path.join(__dirname, 'database.json');
const DB_TEMPLATE_PATH = path.join(__dirname, 'database.template.json');
const JWT_SECRET = 'your-super-secret-jwt-key-that-should-be-in-an-env-file';
const SYSTEM_INSTRUCTION = "You are Fargo, a helpful AI assistant for Wells Fargo bank. Your responses must be concise and professional. **Do not repeat information or greet the user if a greeting is already in the conversation history.** Stick to banking-related topics. Use markdown for bolding like **this**.";


// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for image uploads


// --- Helper Functions ---
const readDb = async () => JSON.parse(await fs.readFile(DB_PATH, 'utf-8'));
const writeDb = async (data) => fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));

const assembleUserObject = (user, transactions) => {
    if (!user || 'accounts' in user === false) {
        return user;
    }
    const userTransactions = {};
    user.accounts.forEach(account => {
        userTransactions[account.id] = transactions[account.id] || [];
    });
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

        const db = await readDb();
        if (db.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
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
        
        db.transactions = db.transactions || {};
        db.users.push(newUser);
        
        newUser.accounts.forEach(acc => {
            db.transactions[acc.id] = [];
        });

        sendNotification(newUser, 'Welcome to Wells Fargo! Your new accounts are ready.');
        sendNotification(newUser, `A confirmation email has been sent to ${newUser.email}. Please check your inbox.`);

        await writeDb(db);
        
        // Send a real email confirmation asynchronously using the centralized service
        sendSignupEmail(newUser);
        
        const userWithTransactions = assembleUserObject(newUser, db.transactions);
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

        const db = await readDb();
        if (db.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
            return res.status(400).json({ message: 'Username already exists.' });
        }
        
        const templateDb = JSON.parse(await fs.readFile(DB_TEMPLATE_PATH, 'utf-8'));
        const alexTemplate = templateDb.users.find(u => u.id === 'user-1');
        
        const newUser = JSON.parse(JSON.stringify(alexTemplate)); // Deep clone
        const newUserId = `user-${uuidv4()}`;

        // Overwrite personal details
        newUser.id = newUserId;
        newUser.username = username;
        newUser.password = password;
        newUser.fullName = fullName;
        newUser.email = email;
        newUser.phone = phone;
        newUser.ssn = ssn;
        newUser.dob = dob;
        newUser.customerSince = new Date().getFullYear();
        
        const newAccountIds = {};
        // Create new IDs for accounts to avoid conflicts
        newUser.accounts.forEach(account => {
            const newAccountId = `${account.type.split(' ')[0].toLowerCase()}-${newUserId}`;
            newAccountIds[account.id] = newAccountId;
            account.id = newAccountId;
        });
        
        // Add new user to the database
        db.users.push(newUser);

        // Copy transactions from template to the new account IDs
        Object.entries(newAccountIds).forEach(([oldId, newId]) => {
            db.transactions[newId] = (templateDb.transactions[oldId] || []).map(tx => ({
                ...tx,
                accountId: newId, // Ensure transaction knows its new parent account
            }));
        });
        
        // Save the updated database
        await writeDb(db);
        
        const userWithTransactions = assembleUserObject(newUser, db.transactions);
        const { password: _, ...userToReturn } = userWithTransactions;
        const token = jwt.sign({ id: userToReturn.id }, JWT_SECRET, { expiresIn: '8h' });
        
        res.status(201).json({ token, user: userToReturn });

    } catch (error) {
        console.error('Create Instant Account Error:', error);
        res.status(500).json({ message: 'Server error during instant account creation.' });
    }
});


app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const db = await readDb();
        
        const user = db.users.find(u => u.username === username) || db.admins.find(a => a.username === username);

        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const userWithData = assembleUserObject(user, db.transactions);
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
        const db = await readDb();
        const user = db.users.find(u => u.id === req.user.id) || db.admins.find(a => a.id === req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        const userWithData = assembleUserObject(user, db.transactions);
        const { password, ...userToReturn } = userWithData;
        res.json(userToReturn);
    } catch (error) {
        console.error('Auth Me Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// User & Admin Routes
app.get('/api/users', authMiddleware, async (req, res) => {
    const db = await readDb();
    const admin = db.admins.find(a => a.id === req.user.id);
    if (!admin) return res.status(403).json({ message: 'Access denied' });

    const users = db.users.map(({ password, ...user }) => user);
    res.json(users);
});

app.get('/api/users/search', authMiddleware, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.json([]);
        }
        const db = await readDb();
        const results = db.users
            .filter(u => u.username.toLowerCase().includes(String(q).toLowerCase()) && u.id !== req.user.id)
            .map(({ id, username, fullName, accounts }) => ({ id, username, fullName, accounts: accounts.map(({id, name, numberSuffix}) => ({id, name, numberSuffix})) }));
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
        const db = await readDb();
        const userIndex = db.users.findIndex(u => u.id === req.params.id);

        if (userIndex === -1) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const currentUser = db.users[userIndex];
        
        // For the demo user, we don't persist changes. 
        if (req.user.id === 'user-1') {
            const updatedLocalUser = { ...currentUser, ...req.body };
            const userWithData = assembleUserObject(updatedLocalUser, db.transactions);
            const { password: _, ...userToReturn } = userWithData;
            return res.json(userToReturn);
        }

        const { username, fullName, password, email, phone, dob } = req.body;

        if (username && username !== currentUser.username) {
             const isTaken = db.users.some(u => u.id !== currentUser.id && u.username.toLowerCase() === username.toLowerCase());
             if (isTaken) {
                return res.status(400).json({ message: 'Username is already taken.' });
             }
             currentUser.username = username;
        }

        if (fullName) currentUser.fullName = fullName;
        if (password) currentUser.password = password;
        if (email) currentUser.email = email;
        if (phone) currentUser.phone = phone;
        if (dob) currentUser.dob = dob;

        await writeDb(db);
        const userWithData = assembleUserObject(currentUser, db.transactions);
        const { password: _, ...updatedUser } = userWithData;
        res.json(updatedUser);
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
        const db = await readDb();
        const userIdToDelete = req.params.id;

        const userIndex = db.users.findIndex(u => u.id === userIdToDelete);
        if (userIndex === -1) {
            return res.status(404).json({ message: 'User not found.' });
        }
        
        const userToDelete = db.users[userIndex];
        const accountIdsToDelete = userToDelete.accounts.map(a => a.id);

        // 1. Delete user
        db.users.splice(userIndex, 1);

        // 2. Delete associated transactions
        accountIdsToDelete.forEach(accountId => {
            if (db.transactions[accountId]) {
                delete db.transactions[accountId];
            }
        });

        // 3. Delete associated verifications
        db.verifications = db.verifications.filter(v => v.userId !== userIdToDelete);

        await writeDb(db);
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
        const db = await readDb();
        const templateDb = JSON.parse(await fs.readFile(DB_TEMPLATE_PATH, 'utf-8'));
        
        const userIndex = db.users.findIndex(u => u.id === req.params.id);
        if (userIndex === -1) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const userToReset = db.users[userIndex];
        const alexTemplate = templateDb.users.find(u => u.id === 'user-1');

        // Reset financial and notification data
        userToReset.accounts = JSON.parse(JSON.stringify(alexTemplate.accounts));
        userToReset.rewards = JSON.parse(JSON.stringify(alexTemplate.rewards));
        userToReset.notifications = JSON.parse(JSON.stringify(alexTemplate.notifications));
        
        // Give new account IDs to prevent conflicts, mapping old to new
        const newAccountIdsMap = {};
        userToReset.accounts.forEach(account => {
            const oldId = account.id;
            const newId = `${account.type.split(' ')[0].toLowerCase()}-${userToReset.id}-${uuidv4().slice(0, 4)}`;
            account.id = newId;
            newAccountIdsMap[oldId] = newId;
        });

        // Copy template transactions to the new account IDs
        Object.entries(newAccountIdsMap).forEach(([templateAccountId, newAccountId]) => {
            const templateTransactions = templateDb.transactions[templateAccountId] || [];
            db.transactions[newAccountId] = templateTransactions.map(tx => ({
                ...tx,
                accountId: newAccountId,
            }));
        });
        
        sendNotification(userToReset, "Your account data has been successfully reset to its default state.");
        
        await writeDb(db);
        res.status(200).json({ message: 'Account reset successfully.' });

    } catch (error) {
        console.error('Reset User Error:', error);
        res.status(500).json({ message: 'Server error while resetting account.' });
    }
});


// Notification Routes for Admin
app.post('/api/users/:id/notifications', authMiddleware, async(req, res) => {
    const db = await readDb();
    const admin = db.admins.find(a => a.id === req.user.id);
    if (!admin) return res.status(403).json({ message: 'Access denied' });
    
    const { message } = req.body;
    const userId = req.params.id;

    const userIndex = db.users.findIndex(u => u.id === userId);
    if(userIndex === -1) return res.status(404).json({ message: 'User not found' });
    
    sendNotification(db.users[userIndex], message);
    if (userId !== 'user-1') {
        await writeDb(db);
    }
    res.status(201).json(db.users[userIndex].notifications[0]);
});

// Notification Routes for User
app.post('/api/notifications/:notificationId/read', authMiddleware, async (req, res) => {
    const db = await readDb();
    const user = db.users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const notification = user.notifications.find(n => n.id === req.params.notificationId);
    if (notification) {
        notification.isRead = true;
    }
    
    if (user.id !== 'user-1') {
        await writeDb(db);
    }
    const userWithData = assembleUserObject(user, db.transactions);
    const { password, ...userToReturn } = userWithData;
    res.json(userToReturn); // Return updated user for local state management
});

app.delete('/api/notifications/:notificationId', authMiddleware, async (req, res) => {
    const db = await readDb();
    const user = db.users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.notifications = user.notifications.filter(n => n.id !== req.params.notificationId);
    
    if (user.id !== 'user-1') {
        await writeDb(db);
    }
    
    const userWithData = assembleUserObject(user, db.transactions);
    const { password, ...userToReturn } = userWithData;
    res.json(userToReturn);
});


// Account & Transaction Routes
app.get('/api/accounts/:accountId/transactions', authMiddleware, async (req, res) => {
    try {
        const { accountId } = req.params;
        
        const db = await readDb();
        const user = db.users.find(u => u.id === req.user.id);

        if (!user || !user.accounts.some(acc => acc.id === accountId)) {
            return res.status(403).json({ message: "Access denied to this account's transactions." });
        }
        
        const allTransactions = (db.transactions[accountId] || []).sort((a,b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
        
        res.json(allTransactions);

    } catch (error) {
        console.error('Fetch Transactions Error:', error);
         res.status(500).json({ message: 'Server error fetching transactions' });
    }
});

app.get('/api/accounts/:accountId/transactions/:txId', authMiddleware, async (req, res) => {
     try {
        const { accountId, txId } = req.params;
        const db = await readDb();
        
        const isAdmin = db.admins.some(a => a.id === req.user.id);
        const user = db.users.find(u => u.id === req.user.id);
        
        let targetAccount;
        let transaction;
        
        if (user?.id === 'user-1') {
            // This is a special case. The client manages Alex's state.
            // But for viewing a receipt, we can pull from the DB for simplicity.
            // This endpoint is read-only.
        }

        const ownsAccount = user?.accounts.some(acc => acc.id === accountId);
        if (!isAdmin && !ownsAccount) {
            return res.status(403).json({ message: "Access denied to this account." });
        }
        
        targetAccount = db.users.flatMap(u => u.accounts).find(a => a.id === accountId);
        transaction = (db.transactions[accountId] || []).find(tx => tx.id === txId);

        if(!transaction || !targetAccount) {
            return res.status(404).json({ message: 'Transaction or Account not found' });
        }

        res.json({ transaction, account: targetAccount });

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
        
        const db = await readDb();
        const sender = db.users.find(u => u.accounts.some(acc => acc.id === fromAccountId));
        const receiver = db.users.find(u => u.accounts.some(acc => acc.id === toAccountId));
        
        if (!sender || !receiver) return res.status(404).json({ message: "Sender or receiver not found." });

        const fromAccount = sender.accounts.find(acc => acc.id === fromAccountId);
        const toAccount = receiver.accounts.find(acc => acc.id === toAccountId);

        if (!fromAccount || !toAccount) return res.status(404).json({ message: "Account not found." });
        if (fromAccount.balance < amount) return res.status(400).json({ message: "Insufficient funds." });

        const receiverAccountIds = new Set(receiver.accounts.map(a => a.id));
        const receiverHasTransactions = Object.entries(db.transactions).some(([accountId, txs]) => 
            receiverAccountIds.has(accountId) && txs.length > 0
        );
        const transactionStatus = (receiver.id !== 'user-1' && !receiverHasTransactions) ? 'On Hold' : 'Completed';
        
        const date = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
        const isoDate = new Date().toISOString();

        const debitTx = { id: `txn-${uuidv4()}`, accountId: fromAccountId, date, description: `Transfer to ${receiver.fullName}`, amount: -amount, type: 'debit', category: 'transfer', merchant: 'Internal Transfer', status: 'Completed', postedDate: isoDate, runningBalance: fromAccount.balance - amount };
        const creditTx = { id: `txn-${uuidv4()}`, accountId: toAccountId, date, description: `Transfer from ${sender.fullName}`, amount: amount, type: 'credit', category: 'transfer', merchant: 'Internal Transfer', status: transactionStatus, postedDate: isoDate, runningBalance: toAccount.balance + (transactionStatus === 'Completed' ? amount : 0) };
        
        // --- Persistence Logic ---
        // For the receiver, always persist the changes.
        if (transactionStatus === 'Completed') {
            toAccount.balance += amount;
        }
        db.transactions[toAccountId].unshift(creditTx);
        sendNotification(receiver, transactionStatus === 'Completed' ? `You received $${amount.toFixed(2)} from ${sender.fullName}.` : `You have received a payment of $${amount.toFixed(2)} from ${sender.fullName}. The funds are on hold pending identity verification.`);

        // For the sender, ONLY persist if it's NOT the demo user 'Alex'.
        if (sender.id !== 'user-1') {
            fromAccount.balance -= amount;
            db.transactions[fromAccountId].unshift(debitTx);
            sendNotification(sender, `You sent $${amount.toFixed(2)} to ${receiver.fullName}.`);
        }

        await writeDb(db);
        // The transaction returned to the client should be the one from their perspective (the debit)
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
        
        const db = await readDb();
        const sender = db.users.find(u => u.id === req.user.id);
        if (!sender) return res.status(404).json({ message: "Sender not found." });

        const fromAccount = sender.accounts.find(acc => acc.id === fromAccountId);
        if (!fromAccount) return res.status(404).json({ message: "Account not found." });
        if (fromAccount.balance < parsedAmount) return res.status(400).json({ message: "Insufficient funds." });
        
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
            sendNotification(sender, notificationMessage);
        } else { // ACH
            notificationMessage = `Your external transfer of $${parsedAmount.toFixed(2)} to ${recipient.recipientName} has been initiated.`;
            sendNotification(sender, notificationMessage);
            transactionStatus = 'Completed'; // For demo, ACH is instant
        }

        const debitTx = { 
            id: txId, 
            accountId: fromAccountId,
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
            // Only debit the balance if the transaction is completed, NOT pending.
            if (transactionStatus === 'Completed') {
                fromAccount.balance -= parsedAmount;
            }
            db.transactions[fromAccountId].unshift(debitTx);
            await writeDb(db);
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

        const db = await readDb();

        const verification = {
            id: `vf-${uuidv4()}`,
            userId: req.user.id,
            accountId,
            transactionId,
            status: 'pending',
            submittedAt: new Date().toISOString(),
            data
        };

        db.verifications.unshift(verification);
        
        const transaction = db.transactions[accountId]?.find(t => t.id === transactionId);
        if (transaction && transaction.status === 'On Hold') {
            transaction.status = 'Pending';
        }

        const userToNotify = db.users.find(u => u.id === req.user.id);
        if(userToNotify) sendNotification(userToNotify, "Your identity verification has been submitted and is now under review. You will be notified of the outcome.");

        await writeDb(db);
        res.status(201).json({ message: 'Verification submitted successfully.' });

    } catch(error) {
        console.error('Submit Verification Error:', error);
        res.status(500).json({ message: 'Server error submitting verification.' });
    }
});

app.get('/api/verifications', authMiddleware, async (req, res) => {
    try {
        const db = await readDb();
        const admin = db.admins.find(a => a.id === req.user.id);
        if (!admin) return res.status(403).json({ message: 'Access denied' });
        
        const pendingVerifications = db.verifications
            .filter(v => v.status === 'pending')
            .map(v => {
                const user = db.users.find(u => u.id === v.userId);
                const tx = db.transactions[v.accountId]?.find(t => t.id === v.transactionId);
                return { ...v, user: user?.username || 'Unknown', transactionAmount: tx?.amount || 'N/A' }
            });
            
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
        
        const db = await readDb();

        const admin = db.admins.find(a => a.id === req.user.id);
        if (!admin) return res.status(403).json({ message: 'Access denied' });

        const verificationIndex = db.verifications.findIndex(v => v.id === id);
        if (verificationIndex === -1) return res.status(404).json({ message: 'Verification request not found.' });

        const verification = db.verifications[verificationIndex];
        const user = db.users.find(u => u.id === verification.userId);
        const account = user?.accounts.find(a => a.id === verification.accountId);
        const transaction = db.transactions[verification.accountId]?.find(t => t.id === verification.transactionId);
        
        if (!user || !account || !transaction) return res.status(404).json({ message: 'Associated user, account, or transaction not found.' });
        
        if (action === 'approve') {
            verification.status = 'approved';
            transaction.status = 'Processing'; // Change status to Processing
            transaction.reason = { // Add reason for fee
                title: "Action Required: Security Fee",
                message: "A security fee is required to complete this transfer. Please check your notifications for an email link to contact support and arrange payment."
            };
            
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
            sendNotification(user, feeNotification);
        } else { // decline
            verification.status = 'declined';
            transaction.status = 'On Hold'; // Revert transaction status
            transaction.reason = null; // Clear reason on decline
            sendNotification(user, `Your identity verification was declined. Please review your information and re-submit through the transaction receipt. You can click this link to go to the transaction: /#/account/${account.id}/transaction/${transaction.id}`);
        }

        await writeDb(db);
        res.json({ message: `Verification has been ${verification.status}.` });
    } catch(error) {
        console.error('Review Verification Error:', error);
        res.status(500).json({ message: 'Server error processing verification review.' });
    }
});


// --- Database Initialization ---
const initializeDatabase = async () => {
  try {
    await fs.access(DB_PATH);
    console.log('Database file already exists. Skipping initialization.');
  } catch (error) {
    // If fs.access throws, it means the file doesn't exist.
    console.log('Database file not found. Initializing from template...');
    try {
      const templateData = await fs.readFile(DB_TEMPLATE_PATH, 'utf-8');
      await fs.writeFile(DB_PATH, templateData);
      console.log('Database initialized successfully from template.');
    } catch (initError) {
      console.error('FATAL: Could not initialize database from template.', initError);
      process.exit(1); // Exit if we can't create the DB.
    }
  }
};


// --- Static File Serving ---
const FRONTEND_PATH = path.join(__dirname, '..');
app.use(express.static(FRONTEND_PATH));
app.use('/dist', express.static(path.join(FRONTEND_PATH, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, 'index.html'));
});

// --- Start Server ---
const startServer = async () => {
  await initializeDatabase();
  app.listen(PORT, '0.0.0.0', () => { // Listen on 0.0.0.0 for Render
      console.log(`Server listening on port ${PORT}`);
      console.log('Serving frontend from:', FRONTEND_PATH);

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