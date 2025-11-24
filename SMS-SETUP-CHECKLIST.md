# SMS Scam Detection - Setup Checklist

## ✅ Pre-Setup Checklist

Before you begin, ensure you have:

- [ ] Supabase account and project created
- [ ] Groq AI API key (from https://console.groq.com)
- [ ] Node.js and npm installed
- [ ] VS Code or your preferred editor
- [ ] Git (optional, for version control)

---

## 📋 Step-by-Step Setup

### 1. Database Setup

- [ ] Open Supabase dashboard
- [ ] Navigate to **SQL Editor**
- [ ] Open `supabase-setup.sql` from your project
- [ ] **Run the entire SQL file** (or run the SMS section if you already have the rest)
- [ ] Verify table created: Go to **Table Editor** → Check for `sms_messages`

### 2. Enable Realtime

- [ ] In Supabase, go to **Database** → **Replication**
- [ ] Find `sms_messages` in the table list
- [ ] **Toggle ON** the replication switch
- [ ] Click **Save** (if required)
- [ ] Status should show as "Enabled"

### 3. Environment Variables

- [ ] Open your `.env` file (create if it doesn't exist)
- [ ] Add/verify these variables:
  ```env
  VITE_GROQ_API_KEY=gsk_your_groq_api_key_here
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
  ```
- [ ] Save the file
- [ ] Restart dev server if it's running

### 4. Install Dependencies

- [ ] Open terminal in project directory
- [ ] Run: `npm install`
- [ ] Wait for installation to complete
- [ ] Check for any error messages

### 5. Start Development Server

- [ ] Run: `npm run dev`
- [ ] Check console output for URL (usually http://localhost:5173)
- [ ] Open browser to the provided URL
- [ ] Verify app loads without errors

---

## 🧪 Testing Checklist

### Test 1: Basic Navigation

- [ ] Login to the application
- [ ] Navigate to Home page
- [ ] Verify 4 new SMS feature cards are visible:
  - [ ] SMS Inbox (green)
  - [ ] Flagged SMS (red)
  - [ ] Scammer Console (orange)
  - [ ] AI Safety Coach (purple - existing)

### Test 2: Scammer Console

- [ ] Click on "Scammer Console" or go to `/scammer`
- [ ] Verify page loads with:
  - [ ] Form with 3 input fields
  - [ ] 6 scam templates on the right
- [ ] Enter test data:
  - [ ] Sender: `+91-9999999999`
  - [ ] Target: `+91-1234567890` (your test number)
  - [ ] Message: Click "Bank Alert" template
- [ ] Click "Send SMS"
- [ ] Verify success notification appears
- [ ] Check browser console for any errors

### Test 3: SMS Inbox

- [ ] Navigate to `/inbox` or click "SMS Inbox"
- [ ] Enter your test phone number: `+91-1234567890`
- [ ] Verify page loads with:
  - [ ] Phone number displayed in header
  - [ ] Navigation buttons (Safe/Flagged)
  - [ ] Empty state or existing messages
- [ ] Keep this tab open

### Test 4: Real-time Detection

- [ ] Open a **new tab** with `/scammer`
- [ ] Send a **SAFE message**:
  - [ ] Sender: `+91-8888888888`
  - [ ] Target: `+91-1234567890` (same as before)
  - [ ] Message: "Hey, how are you doing?"
- [ ] Switch to Inbox tab
- [ ] **Watch**: Message should appear with green "SAFE" badge
- [ ] Verify: Timestamp shows "Just now"

### Test 5: Scam Detection

- [ ] In Scammer tab, send a **DANGEROUS message**:
  - [ ] Use "Bank Alert" or "OTP Fraud" template
  - [ ] Target: Same test number
- [ ] Switch to Inbox tab
- [ ] **Message should NOT appear** (it's dangerous)
- [ ] Navigate to `/flagged`
- [ ] **Verify**: Message appears with red "DANGEROUS" badge
- [ ] Check: AI explanation is present
- [ ] Verify: Grouped under "DANGEROUS MESSAGES"

### Test 6: Suspicious Detection

- [ ] Send a promotional message:
  - [ ] Message: "Limited time offer! 50% off on all items!"
  - [ ] Target: Your test number
- [ ] Navigate to `/flagged`
- [ ] **Verify**: Message appears with yellow "SUSPICIOUS" badge
- [ ] Check: Grouped separately from dangerous messages

### Test 7: Filtering

- [ ] On `/flagged` page:
  - [ ] Click "All" filter → See all messages
  - [ ] Click "Suspicious" → See only yellow badges
  - [ ] Click "Dangerous" → See only red badges
  - [ ] Verify counts in each filter button

### Test 8: Delete Functionality

- [ ] In Inbox or Flagged:
  - [ ] Click trash icon (🗑️) on a message
  - [ ] Confirm deletion
  - [ ] Verify message disappears
  - [ ] Check count updates

### Test 9: Phone Number Management

- [ ] Click "Change Number" button
- [ ] Enter a different number
- [ ] Verify messages reload for new number
- [ ] Refresh page
- [ ] Verify number is remembered (localStorage)

---

## 🔍 Verification Checklist

### Visual Checks

- [ ] All pages use consistent color scheme
- [ ] Animations are smooth (no lag)
- [ ] Cards have proper shadows and gradients
- [ ] Badges pulse correctly
- [ ] Hover effects work
- [ ] Mobile responsive (test on narrow window)

### Functional Checks

- [ ] Messages deliver instantly (< 2 seconds)
- [ ] AI classification works (check explanations)
- [ ] Real-time subscription is active
- [ ] No console errors
- [ ] Navigation works between all pages
- [ ] Back buttons work correctly

### Data Checks

- [ ] Messages saved in Supabase
- [ ] Risk levels stored correctly
- [ ] Timestamps accurate
- [ ] AI explanations saved
- [ ] Phone numbers stored

---

## 🐛 Troubleshooting Checklist

If something doesn't work, check:

### Messages Not Appearing?

- [ ] Supabase Realtime enabled for `sms_messages`?
- [ ] Browser console shows subscription active?
- [ ] Phone numbers match exactly?
- [ ] No ad blockers interfering?
- [ ] Network requests succeeding (check Network tab)?

### AI Not Working?

- [ ] `VITE_GROQ_API_KEY` set in `.env`?
- [ ] API key valid (check Groq console)?
- [ ] Not exceeded free tier quota?
- [ ] Browser console shows API errors?
- [ ] Restart dev server after adding env vars?

### Real-time Not Working?

- [ ] Replication enabled in Supabase?
- [ ] Subscription code in browser console?
- [ ] WebSocket connection established?
- [ ] Firewall not blocking WebSocket?
- [ ] Try hard refresh (Ctrl+Shift+R)?

### Styling Issues?

- [ ] Tailwind CSS properly configured?
- [ ] `index.css` animations present?
- [ ] Browser cache cleared?
- [ ] CSS classes matching Tailwind syntax?
- [ ] Custom styles not conflicting?

---

## 📊 Success Criteria

Your setup is successful if:

- ✅ Scammer Console sends messages
- ✅ Messages appear in real-time
- ✅ AI classifies correctly (3 levels)
- ✅ Safe messages → Inbox (green)
- ✅ Risky messages → Flagged (yellow/red)
- ✅ UI matches existing app style
- ✅ Animations smooth and consistent
- ✅ No errors in console
- ✅ Navigation works perfectly
- ✅ Phone number persists

---

## 🎯 Quick Test Script

Run this complete test in 5 minutes:

1. **Setup** (30 seconds)

   - Verify Supabase Realtime enabled
   - Check environment variables

2. **Send Safe** (1 minute)

   - Scammer Console → "Hey, how are you?"
   - Check Inbox → Green badge

3. **Send Scam** (1 minute)

   - Scammer Console → Bank Alert template
   - Check Flagged → Red badge + AI explanation

4. **Real-time Test** (2 minutes)

   - Open 2 tabs (Scammer + Inbox)
   - Send message from tab 1
   - Watch appear in tab 2 instantly

5. **Verify** (30 seconds)
   - Check all badges correct
   - Verify AI explanations present
   - Test delete functionality

**If all 5 pass → You're ready to go! 🚀**

---

## 📝 Final Checklist

Before considering setup complete:

- [ ] SQL schema deployed
- [ ] Realtime enabled
- [ ] Environment variables set
- [ ] App starts without errors
- [ ] All 9 tests passed
- [ ] No console errors
- [ ] Real-time works
- [ ] AI classifications accurate
- [ ] UI looks great
- [ ] Documentation read

---

## 🎉 You're Done!

If all boxes are checked, your SMS Scam Detection System is **fully operational**!

### Next Steps:

1. Explore the features
2. Test with different scam scenarios
3. Customize templates if needed
4. Add more scam patterns
5. Share with team for testing

### Need Help?

- Check `SMS-DETECTION-README.md` for detailed docs
- See `SMS-QUICK-START.md` for troubleshooting
- Review `SMS-VISUAL-GUIDE.md` for UI reference
- Check browser console for errors
- Verify Supabase dashboard for data

---

**Happy scam detecting! 🛡️**
