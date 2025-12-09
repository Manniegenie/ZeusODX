# Demo Account Setup for Google Play Review

## Quick Setup Instructions

### For Backend Team

Create a demo account with the following specifications:

```javascript
// Demo Account Configuration
{
  phonenumber: "+2348000000001",  // Test phone number
  email: "demo@zeusodx.com",      // Test email
  username: "demo_user",          // Optional username
  passwordpin: "123456",          // Simple 6-digit PIN (will be hashed)
  
  // Account Status
  kycLevel: 1,                    // Basic KYC (allows most features)
  isVerified: true,               // Email/phone verified
  twoFactorEnabled: false,        // NO 2FA for demo account
  isDemoAccount: true,            // Flag for demo account
  
  // Test Balance
  balances: {
    ngn: 10000,                   // ₦10,000 test balance
    usd: 10,                      // $10 test balance
    btc: 0.001,                   // Small BTC balance
    eth: 0.01,                    // Small ETH balance
  },
  
  // Account Settings
  lockUntil: null,                // Never lock this account
  loginAttempts: 0,               // Reset attempts
  isActive: true,                 // Account is active
  
  // Skip OTP Verification
  phoneVerified: true,            // Pre-verified
  emailVerified: true,            // Pre-verified
  skipOTP: true,                  // Skip OTP for this account
  
  // Created Date
  createdAt: new Date(),
  updatedAt: new Date()
}
```

### Database Script (MongoDB)

```javascript
// Run this in your MongoDB shell or admin panel
db.users.insertOne({
  phonenumber: "+2348000000001",
  email: "demo@zeusodx.com",
  username: "demo_user",
  passwordpin: "$2b$10$...", // Hash of "123456" using bcrypt
  kycLevel: 1,
  isVerified: true,
  twoFactorEnabled: false,
  isDemoAccount: true,
  balances: {
    ngn: 10000,
    usd: 10,
    btc: 0.001,
    eth: 0.01
  },
  lockUntil: null,
  loginAttempts: 0,
  isActive: true,
  phoneVerified: true,
  emailVerified: true,
  skipOTP: true,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

### Backend Route Modification (Optional)

If you want to ensure the demo account always works, add a check in your signin route:

```javascript
// In routes/signin.js
if (phonenumber === "+2348000000001" || email === "demo@zeusodx.com") {
  // Skip OTP verification
  // Skip 2FA
  // Skip account lock checks
  // Always allow login
}
```

## Play Console Credentials Format

Use this exact format when submitting to Play Console:

### Login Credentials

**Method 1: Phone Number Login**
- **Phone Number**: `+2348000000001`
- **PIN**: `123456`

**Method 2: Email Login** (if supported)
- **Email**: `demo@zeusodx.com`
- **PIN**: `123456`

### Additional Instructions for Reviewers

```
DEMO ACCOUNT ACCESS INSTRUCTIONS:

1. OPEN THE APP
   - Launch ZeusODX app

2. LOGIN SCREEN
   - You will see a phone number input field
   - Enter: +2348000000001
   - Tap "Continue" or "Next"

3. PIN ENTRY SCREEN
   - Enter PIN: 123456
   - Tap "Login" or "Sign In"

4. DASHBOARD ACCESS
   - You will be taken to the main dashboard
   - Account has test balance: ₦10,000 / $10

5. FEATURES TO TEST:
   ✅ View portfolio and balances
   ✅ Deposit cryptocurrency (test mode)
   ✅ Withdraw to bank account (test mode)
   ✅ Swap between tokens (test mode)
   ✅ Purchase airtime/data (test mode)
   ✅ Pay utility bills (test mode)
   ✅ Gift card trading (test mode)
   ✅ View transaction history
   ✅ Profile management
   ✅ KYC verification flow (camera access)

6. IMPORTANT NOTES:
   - No OTP/verification code required for this account
   - No 2FA required
   - Account never expires or gets locked
   - Works from any location worldwide
   - All transactions are test transactions

7. IF YOU ENCOUNTER ISSUES:
   - Contact: support@zeusodx.com
   - Reference: Demo Account for Play Review
```

## Verification Checklist

Before submitting to Play Console, verify:

- [ ] Demo account exists in database
- [ ] Can login with phone: `+2348000000001` and PIN: `123456`
- [ ] Can login with email: `demo@zeusodx.com` and PIN: `123456` (if email login supported)
- [ ] No OTP/verification code required
- [ ] No 2FA prompt appears
- [ ] Account has test balance visible
- [ ] Can access all main features
- [ ] Account works from different locations (if geo-restricted)
- [ ] Account never gets locked
- [ ] Credentials are in English

## Alternative: Create Account via Signup Flow

If you prefer reviewers to create their own account:

### Instructions for Reviewers

```
ACCOUNT CREATION INSTRUCTIONS:

1. OPEN THE APP
   - Launch ZeusODX app

2. CREATE ACCOUNT
   - Tap "Sign Up" or "Create Account"
   - Enter any valid phone number (format: +234XXXXXXXXXX)
   - Example: +2348000000002

3. VERIFY PHONE
   - You will receive an OTP code
   - Enter the OTP code
   - If OTP doesn't arrive, contact: support@zeusodx.com

4. SET PIN
   - Create a 6-digit PIN (e.g., 123456)
   - Confirm the PIN

5. COMPLETE PROFILE
   - Enter email address
   - Enter username (optional)
   - Complete basic profile setup

6. START TESTING
   - You will start with ₦0 balance
   - To test transactions, contact support@zeusodx.com for test funds
   - Or use the "Add Test Funds" option if available

7. KYC VERIFICATION (Optional)
   - Some features require KYC verification
   - You can test the KYC camera flow
   - Verification may take time to process

FOR FULL ACCESS:
Contact support@zeusodx.com with subject: "Play Store Review Account Request"
```

## Support Contact

If reviewers need help:
- **Email**: support@zeusodx.com
- **Subject**: "Google Play Review - Demo Account Access"
- **Response Time**: Within 24 hours

## Security Notes

⚠️ **Important**: 
- Demo account should be clearly marked in your system
- Consider rate limiting or restrictions on demo account transactions
- Monitor demo account usage
- Never use real user accounts for reviews
- Demo account should be separate from production data

## Testing the Demo Account

Before submitting, test yourself:

```bash
# Test login flow
1. Open app
2. Enter phone: +2348000000001
3. Enter PIN: 123456
4. Verify you can access dashboard
5. Test key features:
   - View portfolio
   - Check transaction history
   - Try deposit flow (test mode)
   - Try withdrawal flow (test mode)
   - Test utility payments
   - Test gift card trading
```

## Next Steps

1. ✅ Create demo account in backend
2. ✅ Test login works
3. ✅ Add credentials to Play Console
4. ✅ Add instructions
5. ✅ Submit for review
6. ✅ Monitor review status

---

**Status**: Ready for implementation  
**Priority**: High (required for Play Store approval)




