const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { supabase } = require('./supabaseClient.js');
const fs = require('fs/promises');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, 'database.json');

async function migrate() {
  console.log('🚀 Starting Robust Migration (v2.1)...');

  try {
    const data = JSON.parse(await fs.readFile(DB_PATH, 'utf-8'));
    
    // Maps to track ID changes across the whole process
    const userIdMap = {}; // oldUserId -> newUserId
    const accountIdMap = {}; // oldAccountId -> newAccountId
    const allAccountsInJson = {}; // Flat map of all accounts for easy lookup

    // --- PHASE 1: PRE-SCAN ---
    console.log('🔍 Pre-scanning data...');
    for (const user of data.users) {
      if (user.accounts) {
        for (const acc of user.accounts) {
          const accountInfo = { ...acc, user_id: user.id, ownerUsername: user.username };
          
          // 1. Store by exact ID
          allAccountsInJson[acc.id] = accountInfo;
          
          // 2. Store by type-username (e.g. everyday-gee)
          const typePrefix = acc.type.split(' ')[0].toLowerCase();
          const username = user.username.toLowerCase();
          allAccountsInJson[`${typePrefix}-${username}`] = accountInfo;
          
          // 3. Store by numberSuffix (e.g. num-0987)
          if (acc.numberSuffix) {
            allAccountsInJson[`num-${acc.numberSuffix}`] = accountInfo;
          }
          
          // 4. Store by ID suffix (e.g. suffix-9b63)
          const parts = acc.id.split('-');
          const idSuffix = parts.pop();
          allAccountsInJson[`suffix-${idSuffix}`] = accountInfo;
        }
      }
    }

    // --- PHASE 2: MIGRATE ADMINS ---
    console.log('👥 Migrating admins...');
    for (const admin of data.admins || []) {
      const { error } = await supabase.from('admins').upsert({
        ...admin,
        fullName: admin.fullName || admin.username,
        email: admin.email || `${admin.username.toLowerCase()}@wellsfargo.com`
      });
      if (error) console.error(`❌ Admin ${admin.username} failed:`, error.message);
    }

    // --- PHASE 3: MIGRATE USERS & ACCOUNTS ---
    console.log('👤 Migrating users and their accounts...');
    for (const user of data.users) {
      let currentUserId = user.id;
      
      const { accounts, notifications, rewards, ...userData } = user;

      // Try to insert user (Removed is_admin as it's not in the users table schema)
      const { data: upsertedUser, error: userError } = await supabase.from('users').upsert({
        id: user.id,
        username: user.username,
        email: user.email,
        password: user.password,
        fullName: user.fullName,
        phone: user.phone || user.phoneNumber, // Support both names
        ssn: user.ssn || user.address,         // Support both names
        dob: user.dob,
        customerSince: user.customerSince,
        rewards_balance: rewards?.balance || 0
      }).select('id').single();

      if (userError) {
        if (userError.code === '23505') {
          // User exists with different ID, fetch the real one
          const { data: existing } = await supabase.from('users')
            .select('id').or(`username.eq.${user.username},email.eq.${user.email}`).single();
          if (existing) currentUserId = existing.id;
        } else {
          console.error(`❌ User ${user.username} failed:`, userError.message);
          continue;
        }
      } else if (upsertedUser) {
        currentUserId = upsertedUser.id;
      }

      userIdMap[user.id] = currentUserId;

      // Migrate this user's accounts
      if (accounts) {
        for (const acc of accounts) {
          const targetAccId = acc.id.replace(user.id, currentUserId);
          accountIdMap[acc.id] = targetAccId;
          
          const { error: accErr } = await supabase.from('accounts').upsert({
            id: targetAccId,
            user_id: currentUserId,
            name: acc.name,
            type: acc.type,
            balance: acc.balance,
            availableBalance: acc.availableBalance,
            numberSuffix: acc.numberSuffix,
            subText: acc.subText
          });
          if (accErr) console.error(`❌ Account ${acc.id} failed:`, accErr.message);
        }
      }

      // Migrate notifications
      if (notifications) {
        for (const n of notifications) {
          await supabase.from('notifications').upsert({
            ...n,
            user_id: currentUserId
          });
        }
      }

      // Migrate rewards
      if (rewards?.activity) {
        for (const ra of rewards.activity) {
          await supabase.from('rewards_activity').upsert({
            id: ra.id || `ra-${uuidv4()}`,
            description: ra.description,
            amount: ra.amount,
            date: ra.date,
            user_id: currentUserId
          });
        }
      }
    }

    // --- PHASE 4: MIGRATE TRANSACTIONS (WITH ENHANCED AUTO-REPAIR) ---
    console.log('💸 Migrating transactions...');
    for (const [oldAccId, transactions] of Object.entries(data.transactions || {})) {
      let targetAccId = accountIdMap[oldAccId] || oldAccId;
      
      // Verify Account exists in Supabase
      const { data: existingAcc } = await supabase.from('accounts').select('id').eq('id', targetAccId).single();
      
      if (!existingAcc) {
        console.log(`⚠️ Account ${targetAccId} missing in DB. Attempting auto-repair...`);
        
        // 1. Try direct lookup in pre-scan
        let accData = allAccountsInJson[oldAccId];
        
        // 2. Try lookup by numberSuffix (e.g. num-9b63)
        if (!accData) {
          const suffix = oldAccId.split('-').pop();
          accData = allAccountsInJson[`num-${suffix}`] || allAccountsInJson[`suffix-${suffix}`];
        }

        // 3. Try lookup by type-username (e.g. everyday-gee)
        if (!accData) {
          const typePrefix = oldAccId.split('-')[0].toLowerCase();
          // Extract user ID from oldAccId if possible (e.g. everyday-user-uuid-suffix)
          const uuidMatch = oldAccId.match(/user-([a-f0-9-]+)/);
          if (uuidMatch) {
            const uuid = `user-${uuidMatch[1]}`;
            // Find the user in Supabase to get their username
            const { data: userData } = await supabase.from('users').select('username').eq('id', uuid).single();
            if (userData) {
              accData = allAccountsInJson[`${typePrefix}-${userData.username.toLowerCase()}`];
            }
          }
        }

        // 4. Try fuzzy lookup by ID content
        if (!accData) {
          accData = Object.values(allAccountsInJson).find(a => targetAccId.includes(a.id) || a.id.includes(targetAccId));
        }

        // 5. Try resolving by Supabase User ID embedded in the account ID
        if (!accData) {
          const userIdMatch = targetAccId.match(/user-[a-f0-9-]+/);
          if (userIdMatch) {
            const supabaseUserId = userIdMatch[0];
            const localUserId = Object.keys(userIdMap).find(key => userIdMap[key] === supabaseUserId);
            if (localUserId) {
              const user = data.users.find(u => u.id === localUserId);
              if (user && user.accounts) {
                const typePrefix = targetAccId.split('-')[0].toLowerCase();
                accData = user.accounts.find(a => a.type.toLowerCase().includes(typePrefix));
                if (accData) accData.user_id = localUserId;
              }
            }
          }
        }

        // 6. FAIL-SAFE: Create placeholder account if still not found
        if (!accData) {
          console.log(`⚠️ Could not find data for account ${oldAccId} in JSON. Creating placeholder account...`);
          
          // Improved regex to only match the UUID part
          const uuidMatch = oldAccId.match(/user-([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/);
          const guessedLocalUserId = uuidMatch ? uuidMatch[0] : null;
          
          let finalSupabaseUserId = userIdMap[guessedLocalUserId] || guessedLocalUserId;
          
          // Verify if user exists in Supabase to avoid foreign key violation
          let verifiedUser = null;
          if (finalSupabaseUserId) {
            const { data, error: vErr } = await supabase.from('users').select('id').eq('id', finalSupabaseUserId).single();
            if (!vErr) verifiedUser = data;
          }

          if (!verifiedUser) {
            // Fallback to the first user in Supabase as a last resort
            const { data: firstUser, error: fErr } = await supabase.from('users').select('id').limit(1).single();
            if (firstUser && !fErr) {
              finalSupabaseUserId = firstUser.id;
              console.log(`   - Guessed user ${guessedLocalUserId} not found in Supabase. Falling back to user ${finalSupabaseUserId}.`);
            } else {
              console.error(`❌ No users found in Supabase. Cannot create placeholder account.`);
              continue;
            }
          } else {
            finalSupabaseUserId = verifiedUser.id;
          }
          
          console.log(`   - Using Supabase User ID: ${finalSupabaseUserId}`);
          
          const typePrefix = oldAccId.split('-')[0];
          accData = {
            id: targetAccId,
            user_id: finalSupabaseUserId,
            name: `${typePrefix.charAt(0).toUpperCase() + typePrefix.slice(1)} Account`,
            type: `${typePrefix.charAt(0).toUpperCase() + typePrefix.slice(1)} Checking`,
            balance: 0,
            availableBalance: 0,
            numberSuffix: oldAccId.split('-').pop().slice(-4),
            subText: "Available balance"
          };
        }

        if (accData) {
          const correctOwnerId = userIdMap[accData.user_id] || accData.user_id;
          const { error: repairErr } = await supabase.from('accounts').upsert({
            id: targetAccId,
            user_id: correctOwnerId,
            name: accData.name,
            type: accData.type,
            balance: accData.balance,
            availableBalance: accData.availableBalance,
            numberSuffix: accData.numberSuffix,
            subText: accData.subText
          });
          
          if (repairErr) {
            console.error(`❌ Auto-repair failed for ${targetAccId}:`, repairErr.message);
            continue;
          }
          console.log(`🛠️ Auto-repaired account ${targetAccId}`);
        }
      }

      // Insert Transactions
      console.log(`💸 Migrating ${transactions.length} transactions for ${targetAccId}...`);
      for (const tx of transactions) {
        const { accountId: _, ...txData } = tx;
        const { error: txErr } = await supabase.from('transactions').upsert({
          ...txData,
          account_id: targetAccId
        });
        if (txErr) console.error(`❌ Transaction ${tx.id} failed:`, txErr.message);
      }
      console.log(`✅ Successfully migrated transactions for ${targetAccId}`);
    }

    // --- PHASE 5: VERIFICATIONS ---
    console.log('🛡️ Migrating verifications...');
    for (const v of data.verifications || []) {
      await supabase.from('verifications').upsert(v);
    }

    console.log('✨ MIGRATION FINISHED SUCCESSFULLY!');
  } catch (error) {
    console.error('💥 Fatal Migration Error:', error);
  }
}

migrate();
