const { supabase } = require('./supabaseClient.js');
const fs = require('fs/promises');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.json');

async function migrate() {
  console.log('Starting migration to Supabase...');

  try {
    const data = JSON.parse(await fs.readFile(DB_PATH, 'utf-8'));

    // 1. Migrate Admins
    console.log('Migrating admins...');
    for (const admin of data.admins) {
      const { error } = await supabase.from('admins').upsert(admin);
      if (error) console.error(`Error migrating admin ${admin.username}:`, error);
    }

    // 2. Migrate Users
    console.log('Migrating users...');
    for (const user of data.users) {
      const { accounts, notifications, rewards, ...userData } = user;
      
      // Add rewards balance to user record
      const userToInsert = {
        ...userData,
        rewards_balance: rewards?.balance || 0
      };

      const { error: userError } = await supabase.from('users').upsert(userToInsert);
      if (userError) {
        console.error(`Error migrating user ${user.username}:`, userError);
        continue;
      }

      // 3. Migrate Accounts
      console.log(`Migrating accounts for user ${user.username}...`);
      for (const account of accounts) {
        const { error: accountError } = await supabase.from('accounts').upsert({
          ...account,
          user_id: user.id
        });
        if (accountError) console.error(`Error migrating account ${account.id}:`, accountError);
      }

      // 4. Migrate Notifications
      console.log(`Migrating notifications for user ${user.username}...`);
      for (const notification of notifications) {
        const { error: notifError } = await supabase.from('notifications').upsert({
          ...notification,
          user_id: user.id
        });
        if (notifError) console.error(`Error migrating notification ${notification.id}:`, notifError);
      }

      // 5. Migrate Rewards Activity
      if (rewards?.activity) {
        console.log(`Migrating rewards activity for user ${user.username}...`);
        for (const activity of rewards.activity) {
          const { error: rewardError } = await supabase.from('rewards_activity').insert({
            ...activity,
            user_id: user.id
          });
          if (rewardError) console.error(`Error migrating reward activity:`, rewardError);
        }
      }
    }

    // 6. Migrate Transactions
    console.log('Migrating transactions...');
    for (const [accountId, transactions] of Object.entries(data.transactions)) {
      console.log(`Migrating transactions for account ${accountId}...`);
      for (const tx of transactions) {
        const { error: txError } = await supabase.from('transactions').upsert({
          ...tx,
          account_id: accountId
        });
        if (txError) console.error(`Error migrating transaction ${tx.id}:`, txError);
      }
    }

    // 7. Migrate Verifications
    console.log('Migrating verifications...');
    for (const verification of data.verifications) {
      const { error: vError } = await supabase.from('verifications').upsert(verification);
      if (vError) console.error(`Error migrating verification ${verification.id}:`, vError);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrate();
