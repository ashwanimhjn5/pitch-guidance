# Supabase Setup Instructions

## Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Sign up / Log in
3. Click "New Project"
4. Fill in:
   - **Name**: pitch-guidance
   - **Database Password**: (generate a strong password - save it!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free
5. Click "Create new project"
6. Wait 2-3 minutes for setup to complete

---

## Step 2: Run Database Migration

1. In your Supabase project, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Copy the entire contents of `supabase-schema.sql`
4. Paste into the SQL editor
5. Click **"Run"** (or press Cmd/Ctrl + Enter)
6. You should see: ✅ "Success. No rows returned"

---

## Step 3: Enable Email Authentication

1. Go to **Authentication** > **Providers** in the left sidebar
2. Find **Email** provider
3. Make sure it's **enabled** (should be enabled by default)
4. **Optional**: Enable "Confirm email" if you want email verification
   - For testing, you can leave this OFF
   - For production, turn this ON

---

## Step 4: (Optional) Enable Social Auth

### Google OAuth:
1. Go to **Authentication** > **Providers**
2. Find **Google** and click to expand
3. Enable it
4. Follow the instructions to:
   - Create Google OAuth credentials
   - Add authorized redirect URIs
   - Copy Client ID and Secret to Supabase

### GitHub OAuth:
1. Go to **Authentication** > **Providers**
2. Find **GitHub** and click to expand
3. Enable it
4. Follow the instructions to:
   - Create GitHub OAuth App
   - Add callback URL
   - Copy Client ID and Secret to Supabase

---

## Step 5: Get Your Supabase Credentials

1. Go to **Settings** > **API** in the left sidebar
2. Copy these values:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public key: eyJhbGc....(long key)
```

---

## Step 6: Update Your .env File

Add these to your `.env` file:

```env
# Existing
ANTHROPIC_API_KEY=your_existing_key

# Add these new ones
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc....your_anon_key
SUPABASE_SERVICE_KEY=eyJhbGc....your_service_role_key
```

**Note:** The service role key is in Settings > API > service_role key (secret)

---

## Step 7: Install Dependencies

```bash
npm install @supabase/supabase-js
```

---

## Step 8: Test Your Setup

1. Start your server: `npm start`
2. The server should connect to Supabase without errors
3. You're ready to go! 🚀

---

## Verification Checklist

- [ ] Supabase project created
- [ ] Database schema deployed (SQL ran successfully)
- [ ] Email auth enabled
- [ ] Environment variables added to .env
- [ ] Dependencies installed
- [ ] Server starts without errors

---

## Troubleshooting

**"relation does not exist" error:**
- Make sure you ran the SQL migration in Step 2

**"JWT expired" or auth errors:**
- Check that your SUPABASE_URL and keys are correct
- Make sure there are no extra spaces in .env file

**Can't enable social auth:**
- Social auth setup can be done later
- Email auth is enough to get started

---

## Next Steps

Once setup is complete, we'll:
1. Update server.js with Supabase client
2. Add auth middleware
3. Create new API endpoints
4. Update frontend with login UI

Ready? Let me know when setup is complete!
