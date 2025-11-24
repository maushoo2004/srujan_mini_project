# SMS Scam Detection System - Documentation

## Overview

The SMS Scam Detection System is a real-time fraud detection feature that uses AI to analyze incoming SMS messages and protect users from phishing, OTP fraud, lottery scams, bank scams, UPI fraud, and other malicious messages.

## Features

### 1. **Scammer Console** (`/scammer`)

A testing environment where you can simulate fraudulent SMS messages.

**Features:**

- Send SMS to any phone number
- Pre-built scam templates (Bank alerts, OTP fraud, Lottery scams, UPI fraud, etc.)
- Real-time message delivery
- Easy-to-use interface with quick templates

**How to Use:**

1. Navigate to `/scammer`
2. Enter sender phone number
3. Enter target user phone number
4. Write or select a message template
5. Click "Send SMS"
6. Message is instantly delivered and analyzed by AI

### 2. **Safe Inbox** (`/inbox`)

View all safe messages that passed AI security checks.

**Features:**

- Real-time message updates via Supabase Realtime
- Only shows messages classified as "safe"
- Automatic AI analysis on incoming messages
- Green badges for safe messages
- Message deletion capability
- Phone number management

**How Messages Appear Here:**

- When a new SMS arrives, it's immediately analyzed by AI
- If classified as "safe", it appears in the inbox
- If classified as "suspicious" or "dangerous", it's automatically filtered out

### 3. **Flagged Messages** (`/flagged`)

Review suspicious and dangerous messages detected by AI.

**Features:**

- Real-time flagged message monitoring
- Grouped by severity:
  - 🟡 **Suspicious**: Uncertain or potentially harmful
  - 🔴 **Dangerous**: Highly malicious (phishing, fraud, threats)
- AI explanation for each flag
- Filter by risk level
- Message statistics dashboard

**Message Categories:**

- **Suspicious**: Promotional, minor red flags, uncertain patterns
- **Dangerous**: Phishing, OTP fraud, bank scams, UPI fraud, lottery scams, threat messages

### 4. **SMS Card Component**

Reusable component for displaying SMS messages with:

- Sender information
- Message content
- Timestamp (relative time)
- Risk level badge
- AI explanation (for risky messages)
- Delete functionality
- Beautiful animations and gradients

## AI Analysis System

### How It Works

1. **Message Arrival**: When an SMS is sent via Scammer Console
2. **Instant Delivery**: Message is inserted into `sms_messages` table
3. **Real-time Trigger**: Supabase Realtime notifies subscribed clients
4. **AI Analysis**: Groq AI (llama3-8b-8192) analyzes the message
5. **Classification**: Message is classified as safe, suspicious, or dangerous
6. **Database Update**: Risk level and explanation are stored
7. **UI Update**: Message appears in appropriate inbox

### AI Classification Logic

The AI considers:

- **Phishing attempts**: Fake links, credential harvesting
- **OTP fraud**: Requests to share one-time passwords
- **Lottery scams**: Fake prize notifications
- **Bank scams**: Fraudulent bank alerts
- **UPI fraud**: Fake payment requests
- **Threat messages**: Intimidation, blackmail
- **Fake rewards**: Too-good-to-be-true offers
- **Impersonation**: Fake government/company messages

### Risk Levels

- **Safe**: Legitimate, clean messages
- **Suspicious**: Potentially harmful, uncertain
- **Dangerous**: Highly malicious, confirmed threats

## Technical Architecture

### Database Schema

```sql
CREATE TABLE sms_messages (
  id UUID PRIMARY KEY,
  sender_number TEXT NOT NULL,
  receiver_number TEXT NOT NULL,
  message_text TEXT NOT NULL,
  risk_level TEXT DEFAULT 'pending',
  ai_explanation TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  analyzed_at TIMESTAMPTZ
);
```

### Real-time Subscription

```javascript
supabase
  .channel("sms-realtime")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "sms_messages",
      filter: `receiver_number=eq.${userPhone}`,
    },
    handleIncomingSMS
  )
  .subscribe();
```

### AI Integration

```javascript
const response = await fetch(GROQ_API_URL, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${GROQ_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "llama3-8b-8192",
    messages: [
      { role: "system", content: "SMS security analyst..." },
      { role: "user", content: `Classify: ${message}` },
    ],
  }),
});
```

## Setup Instructions

### 1. Update Supabase Schema

Run the SQL in `supabase-setup.sql`:

```sql
-- Creates sms_messages table
-- Enables Row Level Security
-- Configures Realtime
-- Sets up indexes
```

### 2. Environment Variables

Ensure your `.env` file has:

```env
VITE_GROQ_API_KEY=your_groq_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Enable Realtime in Supabase

1. Go to Supabase Dashboard
2. Navigate to Database → Replication
3. Enable replication for `sms_messages` table

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Application

```bash
npm run dev
```

## Usage Flow

### Testing Scam Detection

1. **Open Scammer Console** (`/scammer`)
2. **Enter your phone number as target**
3. **Select a scam template** (e.g., "Bank Alert")
4. **Click "Send SMS"**
5. **Navigate to Inbox** (`/inbox`)
6. **Enter your phone number when prompted**
7. **Watch as the message is analyzed**
8. **Check Flagged Messages** (`/flagged`) to see detected scams

### Real-time Testing

Open two browser windows:

- **Window 1**: Scammer Console
- **Window 2**: Inbox or Flagged Messages

Send messages from Window 1 and watch them appear instantly in Window 2!

## API Reference

### `smsService.js`

#### `analyzeSMS(message)`

Analyzes SMS using Groq AI.

**Parameters:**

- `message`: Object with `sender_number` and `message_text`

**Returns:**

```javascript
{
  risk_level: "safe" | "suspicious" | "dangerous",
  explanation: "Reason for classification"
}
```

#### `sendSMS(senderNumber, receiverNumber, messageText)`

Sends an SMS message.

**Returns:**

```javascript
{
  success: true,
  data: { ...messageObject }
}
```

#### `fetchUserSMS(receiverNumber, riskFilter)`

Fetches SMS messages for a user.

**Parameters:**

- `receiverNumber`: User's phone number
- `riskFilter`: "safe" | ["suspicious", "dangerous"] | null

**Returns:**
Array of message objects

#### `subscribeToSMS(receiverNumber, callback)`

Subscribes to real-time SMS updates.

**Returns:**
Supabase channel object (for cleanup)

#### `updateSMSRiskLevel(messageId, riskLevel, explanation)`

Updates message classification in database.

#### `deleteSMS(messageId)`

Deletes an SMS message.

## Styling & Animations

All components use:

- **Gradient backgrounds**: Matching the app's existing design
- **Smooth animations**: Scale, translate, fade effects
- **Backdrop blur**: Modern glassmorphism style
- **Hover effects**: Interactive feedback
- **Pulse animations**: For badges and loading states
- **Color coding**:
  - Green: Safe messages
  - Yellow: Suspicious messages
  - Red: Dangerous messages

## Security Considerations

### Current Implementation (Demo/Testing)

- Open RLS policies (anyone can read/write)
- No authentication on SMS operations
- Suitable for MVP/testing

### Production Recommendations

1. **Restrict RLS policies** to authenticated users only
2. **Add phone number verification**
3. **Implement rate limiting** on SMS sending
4. **Add sender verification**
5. **Encrypt sensitive message content**
6. **Add user preferences** for notification settings

## Troubleshooting

### Messages not appearing in real-time?

- Check Supabase Realtime is enabled for `sms_messages`
- Verify subscription is active (check browser console)
- Ensure phone numbers match exactly

### AI analysis not working?

- Check `VITE_GROQ_API_KEY` is set correctly
- Verify Groq API quota isn't exceeded
- Check browser console for errors

### Messages appear but aren't classified?

- AI analysis might be slow (check analyzing indicator)
- Check for API errors in console
- Verify message format is correct

## Future Enhancements

- [ ] SMS integration with real SMS gateways
- [ ] User phone number verification
- [ ] Push notifications for incoming messages
- [ ] Message search and filtering
- [ ] Export flagged messages report
- [ ] Machine learning model training on flagged data
- [ ] Multi-language support
- [ ] WhatsApp integration
- [ ] Automated blocking of dangerous senders
- [ ] User feedback loop for AI improvement

## Demo Scam Templates

1. **Bank Alert**: Fake account compromise warning
2. **OTP Fraud**: Requesting OTP sharing
3. **Lottery Win**: Fake prize notification
4. **UPI Scam**: Fraudulent UPI PIN request
5. **Job Offer**: Work-from-home registration fee scam
6. **Threat Message**: Intimidation with payment demand

## Support

For issues or questions:

1. Check browser console for errors
2. Verify Supabase and Groq API credentials
3. Ensure Realtime is enabled
4. Review RLS policies

---

**Built with**: React, Vite, Tailwind CSS, Supabase, Groq AI (Llama 3)
