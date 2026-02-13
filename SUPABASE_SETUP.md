# Supabase Setup Guide for Silent Auction App

This guide will help you set up Supabase for your silent auction application.

## Step 1: Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign up or log in
2. Click "New Project"
3. Fill in your project details:
   - Name: `silent-auction` (or your preferred name)
   - Database Password: Choose a strong password (save this!)
   - Region: Choose the closest region to your users
4. Wait for the project to be created (takes a few minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

## Step 3: Create Environment Variables

1. Create a `.env` file in the root of your project (copy from `.env.example`)
2. Add your Supabase credentials:

```env
REACT_APP_SUPABASE_URL=your_project_url_here
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

**Important:** Never commit your `.env` file to git! It should already be in `.gitignore`.

## Step 4: Create Database Tables

In your Supabase dashboard, go to **SQL Editor** and run the following SQL:

### Create Items Table

```sql
-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  section TEXT NOT NULL,
  winning_bid JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_items_section ON items(section);
CREATE INDEX IF NOT EXISTS idx_items_winning_bid ON items USING GIN (winning_bid);

-- Enable Row Level Security (RLS)
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your security needs)
CREATE POLICY "Allow all operations on items" ON items
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### Create Attendees Table

```sql
-- Create attendees table
CREATE TABLE IF NOT EXISTS attendees (
  bid_num TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  won_items TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_attendees_bid_num ON attendees(bid_num);

-- Enable Row Level Security (RLS)
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your security needs)
CREATE POLICY "Allow all operations on attendees" ON attendees
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### Create Function to Update Updated_at Timestamp

```sql
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for both tables
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendees_updated_at BEFORE UPDATE ON attendees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Step 5: Install Dependencies

Run the following command in your project directory:

```bash
npm install @supabase/supabase-js
```

## Step 6: Migrate Existing Data (Optional)

If you have existing data in localStorage, you can migrate it:

1. Open your browser's developer console
2. Run this migration script (you'll need to create a temporary migration script):

```javascript
// Get data from localStorage
const items = JSON.parse(localStorage.getItem('auctionItems') || '[]');
const attendees = JSON.parse(localStorage.getItem('auctionAttendees') || '[]');

// Import your services and migrate
// This would be done in a separate migration script
```

## Step 7: Test the Connection

1. Start your development server: `npm start`
2. Open the app in your browser
3. Check the browser console for any Supabase connection errors
4. Try adding an item or attendee to verify the database connection works

## Troubleshooting

### "Supabase environment variables are not set"
- Make sure you created a `.env` file (not `.env.example`)
- Restart your development server after creating/updating `.env`
- Verify the variable names match exactly: `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`

### "relation does not exist" error
- Make sure you ran all the SQL scripts in Step 4
- Check that the table names match: `items` and `attendees`

### RLS Policy Errors
- If you get permission errors, check your Row Level Security policies
- The example policies allow all operations - adjust them based on your security needs

## Next Steps

- Consider adding authentication if you want to secure your data
- Set up proper RLS policies based on your security requirements
- Consider adding database backups
- Set up real-time subscriptions if you need live updates across multiple users
