# Quick Start: Demo Account for Google Play Review

## 🚀 Fast Setup (5 minutes)

### Step 1: Create Demo Account in Database

Run this script on your server:

```bash
cd /Users/mac/Projects/ZeusODX-server
node scripts/createDemoAccount.js
```

This will create/update a demo account with:
- **Phone**: `+2348000000001`
- **Email**: `demo@zeusodx.com`
- **PIN**: `123456`
- **Balance**: ₦10,000 + various crypto balances
- **Features**: All enabled, no 2FA, never locks

### Step 2: Test Login

1. Open the ZeusODX app
2. Enter phone: `+2348000000001`
3. Enter PIN: `123456`
4. Verify you can access the dashboard

### Step 3: Add to Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app: **ZeusODX**
3. Navigate to: **Policy** → **App content** → **App access**
4. Answer: **"Yes, some features require signing in"**
5. Copy and paste from: `PLAY_CONSOLE_CREDENTIALS_COPY_PASTE.txt`

### Step 4: Submit for Review

1. Go to **Publishing overview**
2. Click **Send for review**
3. Monitor review status

## ✅ Verification Checklist

Before submitting, verify:

- [ ] Demo account exists (run script)
- [ ] Can login with phone `+2348000000001` and PIN `123456`
- [ ] No OTP required
- [ ] No 2FA required
- [ ] Account never locks
- [ ] Can access all features
- [ ] Test balance visible

## 📋 Credentials Summary

```
Phone: +2348000000001
PIN: 123456
Email: demo@zeusodx.com
```

## 📚 Full Documentation

- **Setup Guide**: `DEMO_ACCOUNT_SETUP.md`
- **Play Console Instructions**: `PLAY_CONSOLE_DEMO_CREDENTIALS.md`
- **Copy-Paste Text**: `PLAY_CONSOLE_CREDENTIALS_COPY_PASTE.txt`

## 🆘 Troubleshooting

**Account doesn't exist?**
- Run: `node scripts/createDemoAccount.js`

**Can't login?**
- Check phone number format: `+2348000000001` (with +)
- Check PIN: `123456` (6 digits)
- Verify account exists in database

**Account locked?**
- Demo accounts should never lock
- Check `isDemoAccount: true` in database
- Re-run the create script

**Need help?**
- Check full docs in `DEMO_ACCOUNT_SETUP.md`
- Contact backend team to verify account setup

---

**Status**: Ready to use  
**Last Updated**: 2025-11-12




