
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fs = require('fs/promises');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('./authMiddleware');
const { GoogleGenAI } = require('@google/genai');
const { sendSignupEmail } = require('./emailService');

const app = express();
const PORT = 3001;
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
        
        sendNotification(newUser, 'Welcome to Wells Fargo! Your new accounts are ready.');
        sendNotification(newUser, `A confirmation email has been sent to ${newUser.email}. Please check your inbox.`);
        
        db.transactions = db.transactions || {};
        newUser.accounts.forEach(acc => {
            db.transactions[acc.id] = [];
        });

        db.users.push(newUser);
        await writeDb(db);
        
        // Send a real email confirmation asynchronously using the centralized service
        sendSignupEmail(newUser);
        
        const { password: _, ...userToReturn } = newUser;
        
        res.status(201).json({ message: 'User created successfully.', user: userToReturn });
    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ message: 'Server error during signup.' });
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

        const { password: _, ...userToReturn } = user;
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
        
        const { password, ...userToReturn } = user;
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
        const { username, fullName, password, email, phone, dob } = req.body;
        const db = await readDb();
        const userIndex = db.users.findIndex(u => u.id === req.params.id);

        if (userIndex === -1) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const currentUser = db.users[userIndex];

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
        const { password: _, ...updatedUser } = currentUser;
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
    await writeDb(db);
    res.status(201).json(db.users[userIndex].notifications[0]);
});

// Notification Routes for User
app.post('/api/notifications/:notificationId/read', authMiddleware, async (req, res) => {
    try {
        const db = await readDb();
        const user = db.users.find(u => u.id === req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const notification = user.notifications.find(n => n.id === req.params.notificationId);
        if (notification) {
            notification.isRead = true;
            await writeDb(db);
        }
        const { password, ...userToReturn } = user;
        res.json(userToReturn);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/notifications/:notificationId', authMiddleware, async (req, res) => {
     try {
        const db = await readDb();
        const user = db.users.find(u => u.id === req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.notifications = user.notifications.filter(n => n.id !== req.params.notificationId);
        await writeDb(db);
        
        const { password, ...userToReturn } = user;
        res.json(userToReturn);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});


// Account & Transaction Routes
app.get('/api/accounts/:accountId/transactions', authMiddleware, async (req, res) => {
    try {
        const { accountId } = req.params;
        const page = parseInt(req.query.page || '1', 10);
        const limit = parseInt(req.query.limit || '20', 10);
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const db = await readDb();
        const user = db.users.find(u => u.id === req.user.id);

        if (!user || !user.accounts.some(acc => acc.id === accountId)) {
            return res.status(403).json({ message: "Access denied to this account's transactions." });
        }

        const allTransactions = (db.transactions[accountId] || []).sort((a,b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
        const paginatedTransactions = allTransactions.slice(startIndex, endIndex);
        
        res.json(paginatedTransactions);

    } catch (error) {
        console.error('Fetch Transactions Error:', error);
         res.status(500).json({ message: 'Server error fetching transactions' });
    }
});

app.get('/api/accounts/:accountId/transactions/:txId', authMiddleware, async (req, res) => {
     try {
        const { accountId, txId } = req.params;
        const db = await readDb();
        // Allow access if the user is an admin OR owns the account.
        const isAdmin = db.admins.some(a => a.id === req.user.id);
        const user = db.users.find(u => u.id === req.user.id);
        
        const account = user?.accounts.find(acc => acc.id === accountId);
        
        if (!isAdmin && !account) {
            return res.status(403).json({ message: "Access denied to this account." });
        }

        // If an admin is accessing, find the account from all users.
        const targetAccount = account || db.users.flatMap(u => u.accounts).find(a => a.id === accountId);
        
        const transaction = (db.transactions[accountId] || []).find(tx => tx.id === txId);
        if(!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
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
        
        fromAccount.balance -= amount;
        if (transactionStatus === 'Completed') {
            toAccount.balance += amount;
        }

        const date = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
        const isoDate = new Date().toISOString();

        const debitTx = { id: `txn-${uuidv4()}`, accountId: fromAccountId, date, description: `Transfer to ${receiver.fullName}`, amount: -amount, type: 'debit', category: 'transfer', merchant: 'Internal Transfer', status: 'Completed', postedDate: isoDate, runningBalance: fromAccount.balance };
        const creditTx = { id: `txn-${uuidv4()}`, accountId: toAccountId, date, description: `Transfer from ${sender.fullName}`, amount: amount, type: 'credit', category: 'transfer', merchant: 'Internal Transfer', status: transactionStatus, postedDate: isoDate, runningBalance: toAccount.balance };

        db.transactions[fromAccountId].unshift(debitTx);
        db.transactions[toAccountId].unshift(creditTx);

        sendNotification(sender, `You sent $${amount.toFixed(2)} to ${receiver.fullName}.`);
        if (transactionStatus === 'Completed') {
            sendNotification(receiver, `You received $${amount.toFixed(2)} from ${sender.fullName}.`);
        } else {
             sendNotification(receiver, `You have received a payment of $${amount.toFixed(2)} from ${sender.fullName}. The funds are on hold pending identity verification.`);
        }
        
        await writeDb(db);
        res.status(200).json({ message: 'Transfer successful!', transaction: debitTx });

    } catch (error) {
        console.error('Transfer Error:', error);
        res.status(500).json({ message: "Server error during transfer." });
    }
});

// External Transfer
app.post('/api/transfers/external', authMiddleware, async (req, res) => {
    try {
        const { fromAccountId, amount, recipient } = req.body;
        if (!fromAccountId || !amount || amount <= 0 || !recipient) {
            return res.status(400).json({ message: "Invalid transfer data" });
        }
        
        const db = await readDb();
        const sender = db.users.find(u => u.accounts.some(acc => acc.id === fromAccountId));
        if (!sender) return res.status(404).json({ message: "Sender not found." });

        const fromAccount = sender.accounts.find(acc => acc.id === fromAccountId);
        if (!fromAccount) return res.status(404).json({ message: "Account not found." });
        if (fromAccount.balance < amount) return res.status(400).json({ message: "Insufficient funds." });

        fromAccount.balance -= amount;

        const date = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
        const isoDate = new Date().toISOString();

        const debitTx = { 
            id: `txn-${uuidv4()}`, 
            accountId: fromAccountId,
            date, 
            description: `External Transfer to ${recipient.recipientName}`, 
            amount: -amount, 
            type: 'debit', 
            category: 'transfer', 
            merchant: 'ACH/Wire Transfer', 
            status: 'Pending', // External transfers usually take time
            postedDate: isoDate, 
            runningBalance: fromAccount.balance 
        };

        db.transactions[fromAccountId].unshift(debitTx);

        sendNotification(sender, `Your external transfer of $${amount.toFixed(2)} to ${recipient.recipientName} has been initiated.`);
        
        await writeDb(db);
        res.status(200).json({ message: 'External transfer initiated!', transaction: debitTx });

    } catch (error) {
        console.error('External Transfer Error:', error);
        res.status(500).json({ message: "Server error during external transfer." });
    }
});

// Verification Routes
app.post('/api/verifications', authMiddleware, async (req, res) => {
    try {
        const { accountId, transactionId, data } = req.body;
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
        
        // Update transaction status to Pending
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
            transaction.status = 'Completed';
            account.balance += transaction.amount;
            // A simple running balance update for demo purposes
            transaction.runningBalance = account.balance;
            sendNotification(user, `Your identity has been approved! Funds totaling $${transaction.amount.toFixed(2)} are now available in your account.`);
        } else { // decline
            verification.status = 'declined';
            transaction.status = 'On Hold'; // Revert transaction status
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
  app.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
      console.log('Serving frontend from:', FRONTEND_PATH);
  });
};

startServer();