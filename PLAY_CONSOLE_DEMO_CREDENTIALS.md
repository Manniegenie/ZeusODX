# Google Play Console - Demo Account Setup Guide

## Issue
Google Play rejected the app because demo/guest account credentials were not provided for app review.

## Solution
You need to create a demo account and provide the credentials in Play Console so Google can review all app features.

## Step 1: Create Demo Account

### Option A: Create a Real Demo Account (Recommended)
1. **Create a test account in your system:**
   - Phone Number: Use a test number (e.g., `+2348000000001`)
   - Email: `demo@zeusodx.com` or `review@zeusodx.com`
   - Username: `demo_user` or `play_review`
   - PIN: `123456` (simple, easy to remember)

2. **Pre-configure the account:**
   - ✅ Complete KYC Level 1 (basic verification)
   - ✅ Add a small test balance (e.g., ₦10,000 or $10)
   - ✅ Enable all features (2FA optional, but make it accessible)
   - ✅ Add test bank account if needed
   - ✅ Complete profile setup

3. **Disable 2FA for demo account:**
   - If your app uses 2FA, create a bypass or disable it for this specific account
   - OR provide a static 2FA backup code that never expires

### Option B: Create a Guest/Demo Mode (If Applicable)
If your app supports guest mode, document how to access it.

## Step 2: Document Credentials

Create a document with the following information:

```
DEMO ACCOUNT CREDENTIALS FOR GOOGLE PLAY REVIEW

Account Type: Full Access Demo Account

Login Method 1: Phone Number
- Phone: +2348000000001
- PIN: 123456

Login Method 2: Email
- Email: demo@zeusodx.com
- PIN: 123456

Login Method 3: Username (if applicable)
- Username: demo_user
- PIN: 123456

Account Status:
- KYC Level: 1 (Basic)
- Balance: ₦10,000.00 (NGN) / $10.00 (USD)
- 2FA: Disabled for this account
- Features: All features enabled

Important Notes:
- This account is pre-configured with test data
- All transactions are test transactions
- Account credentials are valid indefinitely
- No 2FA or OTP required for this account
- Account works from any location
```

## Step 3: Add Credentials to Play Console

1. **Go to Google Play Console:**
   - Navigate to: `https://play.google.com/console`
   - Select your app: **ZeusODX**

2. **Access App Access Declaration:**
   - Go to: **Policy** → **App content** → **App access**
   - Or: **Store presence** → **App access**

3. **Fill in the form:**
   - **Question**: "Does your app require users to sign in or create an account to access any features?"
   - **Answer**: Select **"Yes, some features require signing in"**

4. **Provide Login Credentials:**
   - **Login method**: Select "Phone number" or "Email"
   - **Username/Phone/Email**: Enter the demo account identifier
   - **Password/PIN**: Enter the PIN (e.g., `123456`)
   - **Additional instructions**: Add the following:

```
DEMO ACCOUNT INSTRUCTIONS:

1. Login Method: Use phone number +2348000000001 or email demo@zeusodx.com
2. PIN: 123456
3. Account is pre-configured with test balance and all features enabled
4. No 2FA or OTP verification required for this account
5. All transactions are test transactions
6. Account works from any location worldwide

FEATURES TO TEST:
- View dashboard and portfolio
- Deposit cryptocurrency (test mode)
- Withdraw to bank account (test mode)
- Swap between tokens (test mode)
- Purchase airtime/data (test mode)
- Pay utility bills (test mode)
- Gift card trading (test mode)
- KYC verification (can test camera flow)
- Profile management
- Transaction history

If you encounter any issues accessing the account, please contact support@zeusodx.com
```

5. **Save and Submit:**
   - Click **Save**
   - Go to **Publishing overview**
   - Click **Send for review**

## Step 4: Create the Demo Account in Your System

### Backend Setup (If you have access)
Create a script or use your admin panel to:

```javascript
// Example: Create demo account
{
  phone: "+2348000000001",
  email: "demo@zeusodx.com",
  username: "demo_user",
  pin: "123456", // Hashed in production
  kycLevel: 1,
  balance: {
    ngn: 10000,
    usd: 10
  },
  twoFactorEnabled: false,
  isDemoAccount: true,
  createdAt: new Date(),
  // ... other required fields
}
```

### Frontend Considerations
If needed, you can add a demo mode toggle in development:

```typescript
// app/login/login-phone.tsx (development only)
const DEMO_ACCOUNT = {
  phone: "+2348000000001",
  pin: "123456",
  // Only show in development builds
};
```

## Step 5: Verify Account Works

Before submitting, test the demo account:

1. ✅ Can log in with phone number
2. ✅ Can log in with email
3. ✅ PIN works correctly
4. ✅ No 2FA prompt appears
5. ✅ Can access all main features
6. ✅ Can view transaction history
7. ✅ Can test deposit/withdrawal flows (test mode)
8. ✅ Works from different locations (if geo-restricted)

## Step 6: Alternative: Provide Instructions

If you cannot create a demo account, provide detailed instructions:

```
INSTRUCTIONS FOR APP REVIEW:

1. Download and install the app
2. On the login screen, tap "Create Account" or "Sign Up"
3. Enter any valid phone number (format: +234XXXXXXXXXX)
4. Complete phone verification (OTP will be sent)
5. Set a PIN (any 6-digit PIN works)
6. Complete basic profile setup
7. You will start with ₦0 balance
8. To test transactions, you can:
   - Use the "Add Test Funds" option (if available in dev mode)
   - Or contact support@zeusodx.com for test account setup

Note: Some features require KYC verification. You can test the KYC flow, but verification may take time.

For full access, please contact: support@zeusodx.com
```

## Important Requirements

✅ **Credentials must be:**
- Accessible at all times
- Reusable (not one-time use)
- Valid from any location
- In English
- Never expire
- Bypass 2FA/OTP if normally required

❌ **Do NOT:**
- Use real user accounts
- Provide credentials that expire
- Require location-specific access
- Use credentials that require SMS/email verification during review

## Troubleshooting

### If account gets locked:
- Create a new demo account
- Update credentials in Play Console
- Ensure account never expires or gets suspended

### If 2FA is required:
- Disable 2FA for the demo account specifically
- Or provide a static backup code
- Or create a bypass mechanism for demo accounts

### If OTP is required:
- Create a demo account that bypasses OTP
- Or provide a test phone number that auto-verifies
- Or use email verification with a test email service

## Next Steps

1. ✅ Create demo account in your system
2. ✅ Test the account works from multiple locations
3. ✅ Add credentials to Play Console
4. ✅ Add detailed instructions
5. ✅ Submit for review
6. ✅ Monitor review status

## Contact

If you need help setting up the demo account:
- Backend team: Create account in database
- Support: support@zeusodx.com
- Admin panel: Use admin tools to create test account

---

**Last Updated**: 2025-11-12  
**Status**: Ready for Play Console submission




