# SMS Scam Detection - Quick Setup Guide

## 🚀 Quick Start

### Step 1: Update Supabase Database

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Run the updated `supabase-setup.sql` file

The SQL will create:

- `sms_messages` table
- Indexes for performance
- Row Level Security policies
- Enable Realtime for the table

### Step 2: Enable Realtime in Supabase

1. Go to **Database** → **Replication**
2. Find `sms_messages` in the list
3. **Toggle ON** the replication for this table
4. Click **Save**

### Step 3: Verify Environment Variables

Make sure your `.env` file has:

```env
VITE_GROQ_API_KEY=your_groq_api_key_here
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 4: Install Dependencies (if needed)

```bash
npm install
```

### Step 5: Run the Application

```bash
npm run dev
```

## 🧪 Testing the System

### Test 1: Send Your First Scam Message

1. Open the app in your browser
2. Login to your account
3. Navigate to **Scammer Console** (from Home page or `/scammer`)
4. Enter:
   - **Sender**: `+91-9999999999` (any fake number)
   - **Target**: Your test phone number (e.g., `+91-9876543210`)
   - **Message**: Click on a scam template or write your own
5. Click **Send SMS**

### Test 2: View in Real-time

1. Open a **new browser tab**
2. Navigate to **SMS Inbox** (`/inbox`)
3. Enter your test phone number when prompted
4. Go back to the first tab (Scammer Console)
5. Send an SMS
6. **Watch the second tab** - the message appears instantly!

### Test 3: Check AI Detection

1. Send a **safe message**: "Hey, how are you?"
   - Should appear in **Inbox** with green badge
2. Send a **scam message**: "Your bank account is compromised! Click here: http://fake-bank.com"
   - Should appear in **Flagged Messages** with red badge
3. Check the AI explanation in the flagged message

## 📱 Available Routes

| Route               | Description                     |
| ------------------- | ------------------------------- |
| `/home`             | Dashboard with all features     |
| `/scammer`          | Scammer Console (send test SMS) |
| `/inbox`            | Safe messages inbox             |
| `/flagged`          | Suspicious & dangerous messages |
| `/activity-monitor` | URL scanning                    |
| `/dashboard`        | Activity dashboard              |
| `/safety-coach`     | AI safety advice                |

## 🎨 Features You'll See

### Scammer Console

- ✅ Quick scam templates
- ✅ Live form validation
- ✅ Success notifications
- ✅ Beautiful dark theme

### Inbox

- ✅ Real-time message updates
- ✅ Safe messages only (green badges)
- ✅ Relative timestamps
- ✅ Delete functionality
- ✅ Phone number management

### Flagged Messages

- ✅ Grouped by severity (suspicious/dangerous)
- ✅ Color-coded badges (yellow/red)
- ✅ AI explanations
- ✅ Filter by risk level
- ✅ Statistics dashboard

## 🤖 AI Classification Examples

### ✅ Safe Messages

- "Hey, are you free for coffee tomorrow?"
- "Meeting at 3 PM in Conference Room B"
- "Happy Birthday! 🎉"

### 🟡 Suspicious Messages

- "You've won a gift voucher! Call us to claim."
- "Limited time offer! 50% off on everything!"
- "Your package delivery needs confirmation"

### 🔴 Dangerous Messages

- "URGENT: Your bank account will be blocked. Click here to verify."
- "Share your OTP: 849372 to complete transaction"
- "Congratulations! You won ₹50,00,000. Pay processing fee."
- "Your UPI PIN is required to reactivate your account"

## 🛠️ Troubleshooting

### Messages not appearing?

**Check Realtime:**

1. Supabase Dashboard → Database → Replication
2. Ensure `sms_messages` is enabled

**Check Console:**

1. Open browser DevTools (F12)
2. Look for errors in Console tab
3. Verify subscription is active

### AI not classifying messages?

**Check API Key:**

```bash
# Verify in .env file
VITE_GROQ_API_KEY=gsk_...
```

**Check API Quota:**

- Go to Groq Console
- Verify you haven't exceeded free tier limits

### Phone number not persisting?

Phone numbers are stored in `localStorage`:

```javascript
localStorage.getItem("userPhoneNumber");
```

To change:

1. Click "Change Number" button in Inbox/Flagged
2. Or clear browser storage

## 📊 Database Structure

```
sms_messages
├── id (UUID)
├── sender_number (TEXT)
├── receiver_number (TEXT)
├── message_text (TEXT)
├── risk_level (TEXT) - 'pending' | 'safe' | 'suspicious' | 'dangerous'
├── ai_explanation (TEXT)
├── sent_at (TIMESTAMP)
└── analyzed_at (TIMESTAMP)
```

## 🔐 Security Notes

### Current Setup (Demo)

- ⚠️ Open RLS policies (anyone can read/write)
- ⚠️ No authentication on SMS operations
- ✅ Perfect for MVP and testing

### For Production

1. Restrict RLS policies to authenticated users
2. Add phone number verification (OTP)
3. Implement rate limiting
4. Add sender verification
5. Encrypt message content
6. Add audit logging

## 🎯 Next Steps

1. ✅ Run SQL setup in Supabase
2. ✅ Enable Realtime replication
3. ✅ Test with Scammer Console
4. ✅ Watch real-time updates
5. ✅ Check AI classifications
6. 🚀 Customize and extend!

## 💡 Tips

- **Use realistic phone numbers** for testing (format: +91-XXXXXXXXXX)
- **Open multiple tabs** to see real-time updates
- **Check browser console** for debugging info
- **Try different scam templates** to see AI in action
- **Clear localStorage** if you need to reset phone number

## 🐛 Common Issues

### "Groq API key is not configured"

→ Add `VITE_GROQ_API_KEY` to `.env` file

### "Failed to subscribe to realtime"

→ Enable replication for `sms_messages` in Supabase

### "Messages appear but no AI analysis"

→ Check Groq API quota and key validity

### "Real-time not working"

→ Verify Supabase Realtime is enabled for your project

---

**Ready to test?** Open `/scammer` and send your first SMS! 🚀
