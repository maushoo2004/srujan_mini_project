# 🛡️ CyberShield MVP

A comprehensive cybersecurity monitoring application built with React, Supabase, and AI-powered security analysis using Groq's Llama 3 model.

## 🚀 Features

- **User Authentication** - Secure email/password authentication with Supabase
- **Activity Monitoring** - Real-time URL scanning and risk classification
- **Security Dashboard** - Visual analytics with Chart.js showing risk trends
- **AI Safety Coach** - Personalized security recommendations powered by Llama 3
- **Activity Logging** - Automatic logging of all URL scans to Supabase PostgreSQL

## 📋 Tech Stack

- **Frontend**: React 18 with Vite
- **UI Framework**: TailwindCSS
- **Authentication & Database**: Supabase (PostgreSQL)
- **AI Integration**: Groq API (Llama 3 model)
- **Charts**: Chart.js with react-chartjs-2
- **Routing**: React Router v6

## 📁 Project Structure

```
CyberShield-MVP/
├── src/
│   ├── components/        # Reusable components (future use)
│   ├── context/
│   │   └── UserContext.jsx    # Authentication context
│   ├── pages/
│   │   ├── Login.jsx          # Login page
│   │   ├── Register.jsx       # Registration page
│   │   ├── Home.jsx           # Home dashboard
│   │   ├── ActivityMonitor.jsx # URL scanning page
│   │   ├── Dashboard.jsx      # Analytics dashboard
│   │   └── SafetyCoach.jsx    # AI recommendations page
│   ├── utils/
│   │   ├── supabaseClient.js  # Supabase configuration
│   │   └── aiClient.js        # Groq API & risk classification
│   ├── App.jsx            # Main app with routing
│   ├── main.jsx           # Entry point
│   └── index.css          # Global styles with Tailwind
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── .env.example
```

## 🔧 Setup Instructions

### 1. Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- Groq API key

### 2. Clone or Navigate to Project

```bash
cd "d:\srujan project\CyberShield-MVP"
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the following SQL to create tables:

```sql
-- Create users table (if not auto-created by Supabase Auth)
-- Supabase automatically creates auth.users, but we can reference it

-- Create activity_logs table
CREATE TABLE activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp);

-- Enable Row Level Security
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policy so users can only see their own logs
CREATE POLICY "Users can view own activity logs"
  ON activity_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy so users can insert their own logs
CREATE POLICY "Users can insert own activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

3. Get your Supabase credentials:
   - Go to **Settings** → **API**
   - Copy the **Project URL**
   - Copy the **anon/public** key

### 5. Groq API Setup

1. Sign up at [console.groq.com](https://console.groq.com)
2. Generate an API key
3. Copy the API key

### 6. Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GROQ_API_KEY=your_groq_api_key
```

### 7. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 🎯 How to Use

### 1. **Register/Login**

- Create a new account or sign in with existing credentials
- Authentication is handled securely by Supabase

### 2. **Activity Monitor**

- Navigate to the Activity Monitor page
- Enter any URL to analyze
- The system will classify it as:
  - **High Risk**: Contains phishing, fraud, or malicious patterns
  - **Medium Risk**: Executable or compressed files (.exe, .zip, .apk)
  - **Low Risk**: Safe URLs
- Each scan is automatically logged to your activity history

### 3. **Dashboard**

- View all your scanned URLs in a table
- Filter by risk level (All, High, Medium, Low)
- See visual analytics with Chart.js showing risk trends over the last 7 days
- Track your security statistics

### 4. **AI Safety Coach**

- Click "Get AI Security Advice" to analyze your browsing patterns
- The AI (Llama 3) reviews your activity logs
- Receive personalized security recommendations
- Get insights on potential vulnerabilities in your browsing habits

## 🔒 Security Features

### URL Risk Classification

The app uses pattern matching to identify threats:

```javascript
// High risk patterns
- phishing, free-money, fraud, claim-prize, hack-tool, verify-account, suspended-account

// Medium risk patterns
- URLs ending with .exe, .zip, .apk

// Low risk
- Everything else
```

### Database Security

- Row Level Security (RLS) enabled on all tables
- Users can only access their own activity logs
- Automatic user ID association with all records

## 🛠️ Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📊 Database Schema

### `activity_logs` Table

| Column     | Type        | Description                |
| ---------- | ----------- | -------------------------- |
| id         | UUID        | Primary key                |
| user_id    | UUID        | Foreign key to auth.users  |
| url        | TEXT        | The scanned URL            |
| risk_level | TEXT        | 'low', 'medium', or 'high' |
| timestamp  | TIMESTAMPTZ | When the scan occurred     |

## 🤖 AI Integration

The AI Safety Coach uses the Groq API with Llama 3:

- **Model**: llama3-8b-8192
- **Purpose**: Analyze browsing patterns and provide security advice
- **Input**: Last 50 activity logs from the user
- **Output**: Personalized security recommendations

## 🎨 UI/UX Features

- Responsive design with TailwindCSS
- Gradient backgrounds for visual appeal
- Color-coded risk indicators (Red/Yellow/Green)
- Interactive charts with Chart.js
- Smooth transitions and hover effects
- Loading states for better user feedback

## 🐛 Troubleshooting

### Supabase Connection Issues

- Verify your `.env` file has correct credentials
- Check if your Supabase project is active
- Ensure RLS policies are correctly set up

### Groq API Errors

- Confirm your API key is valid
- Check your Groq account has available credits
- Verify the API key is correctly set in `.env`

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📝 Future Enhancements

- [ ] Real-time threat intelligence integration
- [ ] Browser extension for automatic URL scanning
- [ ] Email notifications for high-risk detections
- [ ] Advanced ML models for better threat detection
- [ ] Export activity reports as PDF
- [ ] Multi-factor authentication
- [ ] Dark mode support

## 📄 License

This project is for educational purposes.

## 👥 Support

For issues or questions, please check:

- Supabase Documentation: https://supabase.com/docs
- Groq API Documentation: https://console.groq.com/docs
- Vite Documentation: https://vitejs.dev

---

**Built with ❤️ for cybersecurity awareness**
