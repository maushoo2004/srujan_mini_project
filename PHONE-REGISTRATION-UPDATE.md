# Phone Number Registration - Update Guide

## 📝 What Changed

Users now register with their phone number during signup, which is automatically stored and used for SMS features.

## 🔄 Database Migration

### For Existing Supabase Setup

If you've already run the initial setup, run this SQL to add phone_number to existing users table:

```sql
-- Add phone_number column to existing users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Update the trigger function to store phone number
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, phone_number)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'phone_number');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### For Fresh Setup

Simply run the updated `supabase-setup.sql` file - it already includes the phone_number field.

## ✨ New Features

### 1. Registration Flow

- Users now provide:
  - ✅ Email
  - ✅ Phone Number (new!)
  - ✅ Password
  - ✅ Confirm Password

### 2. Phone Number Storage

- Stored in **user metadata** during auth signup
- Copied to **users table** via trigger
- Saved to **localStorage** for SMS features
- Format: `+91-9876543210` (or any format)

### 3. SMS Features Integration

- Phone number automatically available in Inbox
- No need to prompt users again
- Still allows manual change if needed
- Persists across sessions via localStorage

## 🧪 Testing the Update

### Test Registration

1. Navigate to `/register`
2. Fill in:
   - Email: `test@example.com`
   - Phone: `+91-9876543210`
   - Password: `password123`
   - Confirm: `password123`
3. Click "Sign Up"
4. Check localStorage: `userPhoneNumber` should be set
5. Check Supabase users table: phone_number should be stored

### Test SMS Features

1. Navigate to `/inbox` after registration
2. Should automatically use registered phone number
3. No prompt should appear
4. Can still change number manually via "Change Number" button

## 🔍 Data Flow

```
Registration Form
    ↓
User enters phone number
    ↓
Passed to signUp(email, password, phoneNumber)
    ↓
Stored in auth.users.raw_user_meta_data
    ↓
Trigger copies to users.phone_number
    ↓
Also saved to localStorage
    ↓
SMS features read from localStorage
```

## 📋 Checklist

- [ ] Run migration SQL (if updating existing DB)
- [ ] Verify trigger function updated
- [ ] Test new user registration with phone
- [ ] Check users table has phone_number column
- [ ] Verify localStorage stores phone after signup
- [ ] Test SMS Inbox uses phone automatically
- [ ] Test Flagged SMS uses phone automatically

## 🎯 Benefits

### Before

- ❌ Users prompted for phone every time
- ❌ Phone number not linked to account
- ❌ Had to remember/re-enter phone number

### After

- ✅ Phone collected during registration
- ✅ Stored in user profile
- ✅ Automatically available in SMS features
- ✅ Seamless user experience
- ✅ Still allows manual updates

## 💡 User Experience

### Registration Screen Now Shows:

```
┌─────────────────────────────────────┐
│  Email                              │
│  [you@example.com______________]    │
│                                     │
│  Phone Number                       │
│  [+91-9876543210_______________]    │
│  Used for SMS scam detection        │
│                                     │
│  Password                           │
│  [••••••••••••••••••••••••••••]    │
│                                     │
│  Confirm Password                   │
│  [••••••••••••••••••••••••••••]    │
│                                     │
│  [Sign Up]                          │
└─────────────────────────────────────┘
```

### First-Time SMS Feature Access:

- **Before**: Prompt "Enter your phone number"
- **After**: Automatically loads with registered number ✨

## 🔒 Security Notes

- Phone number stored securely in Supabase
- Also in user metadata (auth.users)
- localStorage used for convenience only
- Users can change number anytime
- No SMS verification (can be added later)

## 🚀 Future Enhancements

Consider adding:

- [ ] Phone number verification (OTP)
- [ ] Format validation (international formats)
- [ ] Phone number change confirmation
- [ ] SMS notification preferences
- [ ] Multiple phone numbers per user

---

**All set! New users will now register with their phone number automatically.** 📱
