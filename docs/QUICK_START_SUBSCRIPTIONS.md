# Quick Start: Subscriptions Setup

## What You Have Now

✅ Complete subscription system implemented
✅ Backend validation code ready
✅ Database schema ready
✅ Paywall UI built
✅ App blocks access without subscription

## What You Need To Do

### Step 1: Deploy Backend (15 minutes)

```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Deploy database and function
supabase db push
supabase secrets set APPLE_SHARED_SECRET=your_apple_secret
supabase functions deploy validate-subscription
```

📖 Detailed instructions: `supabase/DEPLOYMENT_INSTRUCTIONS.md`

### Step 2: Configure App Store Connect (10 minutes)

1. Create two subscription products:
   - `AQ_Buddy_Monthly_Subscription` - $2.99/month
   - `AQ_Buddy_Annual_Subscription` - $29.99/year

2. Get Apple Shared Secret:
   - App Store Connect → Your App → App Information
   - "App-Specific Shared Secret" → Copy

📖 Detailed instructions: `docs/SUBSCRIPTION_BACKEND_SETUP.md` → Step 2

### Step 3: Test with Sandbox (5 minutes)

1. Create sandbox test account in App Store Connect
2. Build app on physical device
3. Sign out of App Store on device
4. Purchase subscription in app
5. Verify in Supabase Dashboard → subscriptions table

📖 Testing guide: `docs/SUBSCRIPTION_IMPLEMENTATION_SUMMARY.md` → Testing

### Step 4: Production Hardening (2 minutes)

Before launch, update `lib/services/subscription-validation.ts`:

Change these three lines from `return true;` to `return false;`:
- Line 99
- Line 107
- Line 130

This enforces strict validation.

## Files to Review

1. **Overview:** `docs/SUBSCRIPTION_IMPLEMENTATION_SUMMARY.md`
2. **Backend Setup:** `docs/SUBSCRIPTION_BACKEND_SETUP.md`
3. **Deployment:** `supabase/DEPLOYMENT_INSTRUCTIONS.md`

## Quick Verification

After deployment, check:
- [ ] Supabase function deployed: Dashboard → Edge Functions
- [ ] Database table exists: Dashboard → Table Editor → subscriptions
- [ ] Secrets set: `supabase secrets list`
- [ ] Can purchase in sandbox
- [ ] Data appears in database

## Need Help?

Check the comprehensive guides:
- Implementation details → `docs/SUBSCRIPTION_IMPLEMENTATION_SUMMARY.md`
- Backend setup → `docs/SUBSCRIPTION_BACKEND_SETUP.md`
- Deployment steps → `supabase/DEPLOYMENT_INSTRUCTIONS.md`

## Summary

🎯 **Total time to deploy: ~30 minutes** 
📱 **Then test with sandbox purchases**
🚀 **Ready for production after hardening**
