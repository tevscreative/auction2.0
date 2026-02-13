# Quick Start Guide - Supabase Integration

## 🚀 Getting Started

Follow these steps to connect your Silent Auction app to Supabase:

### 1. Install Dependencies

```bash
npm install
```

This will install `@supabase/supabase-js` which was added to your `package.json`.

### 2. Set Up Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait for the project to be ready (~2 minutes)

### 3. Get Your API Keys

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key

### 4. Create Environment File

Create a `.env` file in the project root:

```env
REACT_APP_SUPABASE_URL=your_project_url_here
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

### 5. Set Up Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Copy and run the SQL from `SUPABASE_SETUP.md` (Step 4)
3. This creates the `items` and `attendees` tables

### 6. Start the App

```bash
npm start
```

The app will now use Supabase instead of localStorage!

## 📋 What Changed?

- ✅ All data is now stored in Supabase (cloud database)
- ✅ Real-time updates across multiple browser tabs/devices
- ✅ Data persists even if you clear browser storage
- ✅ Automatic fallback to localStorage if Supabase connection fails

## 🔄 Migrating Existing Data

If you have existing data in localStorage:

1. Open your app in the browser
2. Open the browser console (F12)
3. Run:

```javascript
// Import the migration function (you may need to expose it temporarily)
// Or use the browser console with the app running:
// The app will automatically try to load from localStorage if Supabase fails
// Then you can manually migrate by adding items/attendees through the UI
```

Alternatively, you can temporarily add a migration button to your component.

## 🐛 Troubleshooting

**"Supabase environment variables are not set"**
- Make sure `.env` file exists in the project root
- Restart your dev server after creating `.env`
- Check that variable names are exactly: `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`

**"relation does not exist"**
- Make sure you ran the SQL scripts to create the tables
- Check the table names: `items` and `attendees`

**Connection errors**
- Verify your Supabase URL and API key are correct
- Check your internet connection
- The app will fallback to localStorage if Supabase is unavailable

## 📚 Next Steps

- Read `SUPABASE_SETUP.md` for detailed setup instructions
- Consider adding authentication for multi-user support
- Set up proper Row Level Security (RLS) policies for production
