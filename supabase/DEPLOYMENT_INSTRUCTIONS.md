# Supabase Subscription Backend Deployment Instructions

## Prerequisites

1. Supabase CLI installed: `npm install -g supabase`
2. Supabase project created at [supabase.com](https://supabase.com)
3. Apple Shared Secret from App Store Connect

---

## Step 1: Link Your Supabase Project

```bash
# Login to Supabase
supabase login

# Link to your project (get project ref from Supabase dashboard)
supabase link --project-ref YOUR_PROJECT_REF
```

---

## Step 2: Run Database Migration

```bash
# Apply the migration to create the subscriptions table
supabase db push

# Alternatively, if you want to use migrations:
# supabase migration up
```

### Manual Migration (if needed):

If you prefer to run the migration manually:

1. Go to your Supabase Dashboard
2. Navigate to "SQL Editor"
3. Copy and paste the contents of `supabase/migrations/20250103000001_create_subscriptions_table.sql`
4. Click "Run"

---

## Step 3: Get Your Apple Shared Secret

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app
3. Go to "App Information" → "App-Specific Shared Secret"
4. Generate a new shared secret (or use existing one)
5. Copy the secret - you'll need it in the next step

---

## Step 4: Set Environment Secrets

```bash
# Set your Apple Shared Secret
supabase secrets set APPLE_SHARED_SECRET=your_actual_shared_secret_here

# Verify secrets are set
supabase secrets list
```

---

## Step 5: Deploy Edge Function

```bash
# Deploy the validate-subscription function
supabase functions deploy validate-subscription

# The function will be available at:
# https://YOUR_PROJECT_REF.supabase.co/functions/v1/validate-subscription
```

---

## Step 6: Get Your Supabase URL

```bash
# Get your project details
supabase status
```

Your Supabase URL will be: `https://YOUR_PROJECT_REF.supabase.co`

---

## Step 7: Update Mobile App Configuration

Create a `.env` file in your mobile app root (if you don't have one):

```bash
# File: .env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Then update `lib/services/subscription-validation.ts`:

1. Uncomment the validation code (currently commented out)
2. Replace `YOUR_SUPABASE_URL` with your actual Supabase URL
3. Import supabase client to get the session token

---

## Step 8: Test the Backend

### Test with curl:

```bash
# Get a user token from your app (you'll see this in console logs)
export USER_TOKEN="your_user_token_here"

# Test the endpoint
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/validate-subscription \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "receipt": "test_receipt_data",
    "platform": "ios",
    "productId": "AQ_Buddy_Monthly_Subscription",
    "transactionId": "test_transaction_123"
  }'
```

---

## Step 9: Test with Sandbox Subscription

1. Create a sandbox test account in App Store Connect
2. Build and run your app on a physical device (not simulator)
3. Sign out of App Store on the device
4. Purchase a subscription in your app
5. Sign in with your sandbox test account when prompted
6. Check Supabase Dashboard → Table Editor → subscriptions table
7. You should see a new row with your subscription data

---

## Verify Everything is Working

### Check Database:

1. Go to Supabase Dashboard → Table Editor
2. Select `subscriptions` table
3. You should see subscription records after purchases

### Check Function Logs:

```bash
# View real-time logs for your function
supabase functions logs validate-subscription --tail
```

Or in Supabase Dashboard:
1. Go to "Edge Functions"
2. Click "validate-subscription"
3. View "Invocations" and "Logs"

---

## Troubleshooting

### Issue: "APPLE_SHARED_SECRET not found"

**Solution:** Make sure you set the secret:
```bash
supabase secrets set APPLE_SHARED_SECRET=your_secret
```

### Issue: "Unauthorized" error

**Solution:**
- Check that the user is properly authenticated
- Verify the Authorization header includes the Bearer token
- Make sure the token hasn't expired

### Issue: Apple validation returns status code 21007

**Solution:** This is normal! It means you're using a sandbox receipt. The function automatically retries with the sandbox URL.

### Issue: Subscription not showing in database

**Solution:**
- Check Edge Function logs for errors
- Verify RLS policies are correct
- Make sure the service role key is set in function environment

---

## Security Notes

⚠️ **IMPORTANT:**

1. **Never commit secrets to git** - Use environment variables
2. **Keep your service role key secure** - It has admin access
3. **Enable RLS** - Already configured in migration
4. **Validate all receipts** - Never trust client-side data
5. **Use HTTPS only** - Already handled by Supabase

---

## Production Checklist

Before going live:

- [ ] Database migration applied
- [ ] Apple Shared Secret configured
- [ ] Edge Function deployed successfully
- [ ] Tested with sandbox subscriptions
- [ ] Verified data appears in database
- [ ] Checked Edge Function logs
- [ ] Updated mobile app with production URLs
- [ ] Enabled validation in mobile app (uncomment code)
- [ ] Tested restore purchases
- [ ] Set up monitoring/alerts for failed validations
- [ ] Privacy policy updated
- [ ] Terms of service include subscription terms

---

## Next Steps

1. Run through this deployment guide
2. Test with sandbox subscriptions
3. Verify data in Supabase dashboard
4. Enable backend validation in mobile app (currently returns `true` temporarily)
5. Test production subscriptions with TestFlight

---

## Need Help?

- Check Supabase logs: `supabase functions logs validate-subscription`
- Review Edge Function code: `supabase/functions/validate-subscription/index.ts`
- Check database: Supabase Dashboard → Table Editor → subscriptions
- Apple docs: https://developer.apple.com/documentation/appstorereceipts
