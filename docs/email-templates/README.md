# AQBuddy Email Templates

This folder contains branded HTML email templates for use with Supabase Auth.

## Templates

### 1. OTP Verification Email (`supabase-otp-template.html`)
Used for email-based authentication with 6-digit codes.

**Variables:**
- `{{ .Token }}` - The 6-digit verification code

### 2. Full Featured OTP Email (`otp-email.html`)
A more comprehensive template with better mobile support and professional styling.

**Variables:**
- `{{ .Token }}` - The 6-digit verification code
- `{{ .UnsubscribeLink }}` - Unsubscribe URL (if applicable)

### 3. Welcome Email (`welcome-email.html`)
Welcome new users to AQBuddy with feature highlights.

**Variables:**
- `{{ .UserMetadata.name }}` - User's name
- `{{ .SiteURL }}` - Link to open the app

## How to Use in Supabase

### Step 1: Access Email Templates
1. Go to your Supabase project dashboard
2. Navigate to **Authentication > Email Templates**

### Step 2: Update Templates
1. Select the template you want to customize:
   - **Magic Link** (use `supabase-otp-template.html`)
   - **Confirm signup** (use `welcome-email.html`)
   - **Invite user** (use `welcome-email.html`)
   - **Reset password** (use `supabase-otp-template.html`)

2. Replace the default content with the HTML from the appropriate template file

3. Customize the subject line:
   - OTP: "Your AQBuddy verification code"
   - Welcome: "Welcome to AQBuddy!"
   - Invite: "You're invited to join AQBuddy"
   - Reset: "Reset your AQBuddy password"

### Step 3: Test Templates
1. Use the "Send test email" feature in Supabase
2. Check how the email looks on both desktop and mobile

## Design Features

- **Responsive design** that works on mobile and desktop
- **AQBuddy branding** with consistent colors and typography
- **Professional layout** with proper spacing and hierarchy
- **Accessibility** with good color contrast and semantic HTML
- **Email client compatibility** tested across major providers

## Color Palette

- Primary: `#491124` (Deep burgundy)
- Secondary: `#667EEA` to `#764BA2` (Purple gradient)
- Text: `#374151` (Dark gray)
- Muted text: `#6B7280` (Medium gray)
- Light text: `#9CA3AF` (Light gray)
- Background: `#F9FAFB` (Very light gray)

## Customization Tips

1. **Logo**: Replace the emoji 🌬️ with an actual logo image if available
2. **Colors**: Update the CSS color values to match any brand changes
3. **Content**: Modify the messaging to match your tone of voice
4. **Links**: Update support email and website URLs
5. **Legal**: Add proper unsubscribe links and legal footer text

## Testing Checklist

- [ ] Test in Gmail (web and mobile app)
- [ ] Test in Outlook (web and desktop)
- [ ] Test in Apple Mail (macOS and iOS)
- [ ] Check dark mode appearance
- [ ] Verify all links work correctly
- [ ] Confirm variables are replaced properly
- [ ] Test with long and short email addresses
- [ ] Validate HTML with W3C validator

## Support

For questions about implementing these templates, contact the development team or refer to the [Supabase email template documentation](https://supabase.com/docs/guides/auth/auth-email-templates).