# Social OAuth Setup Guide

Complete setup instructions for Google, Facebook, and X (Twitter) OAuth in LOLTracker.

---

## Google OAuth Setup

### 1. Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 2. Create or Select Project
- Create a new project or select existing LOLTracker project

### 3. Enable Google+ API
- Go to **APIs & Services** → **Library**
- Search for "Google+ API"
- Click **Enable**

### 4. Configure OAuth Consent Screen
- Go to **APIs & Services** → **OAuth consent screen**
- Choose **External**
- Fill in:
  - **App name**: LOLTracker
  - **User support email**: Your email
  - **Developer contact email**: Your email

### 5. Create OAuth Credentials
- Go to **APIs & Services** → **Credentials**
- Click **+ CREATE CREDENTIALS** → **OAuth client ID**
- Choose **Web application**
- Configure:
  - **Authorized JavaScript origins**: `http://localhost:3000`
  - **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`

### 6. Add to .env.local
```env
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

---

## Facebook OAuth Setup

### 1. Go to Meta for Developers
Visit: https://developers.facebook.com/

### 2. Create an App
- Click **Create App**
- Choose **Consumer** or **Business**
- Fill in app details:
  - **App Name**: LOLTracker
  - **Contact Email**: Your email

### 3. Add Facebook Login Product
- In your app dashboard, click **Add Product**
- Find **Facebook Login** and click **Set Up**

### 4. Configure OAuth Settings
- Go to **Facebook Login** → **Settings**
- Add to **Valid OAuth Redirect URIs**:
  - `http://localhost:3000/api/auth/callback/facebook`
  - Add production URL later

### 5. Get App Credentials
- Go to **Settings** → **Basic**
- Copy:
  - **App ID** (this is your Client ID)
  - **App Secret** (click Show, this is your Client Secret)

### 6. Make App Live (for production)
- In **App Mode** toggle, switch from Development to Live
- You may need to provide privacy policy URL

### 7. Add to .env.local
```env
FACEBOOK_CLIENT_ID=your-app-id-here
FACEBOOK_CLIENT_SECRET=your-app-secret-here
```

---

## X (Twitter) OAuth Setup

### 1. Go to Twitter Developer Portal
Visit: https://developer.twitter.com/en/portal/dashboard

### 2. Create a Project and App
- Click **+ Create Project**
- Fill in project details
- Create an app within the project

### 3. Configure App Settings
- Go to your app settings
- Under **User authentication settings**, click **Set up**

### 4. Configure OAuth 2.0
- **App permissions**: Read
- **Type of App**: Web App
- **App info**:
  - **Callback URI**: `http://localhost:3000/api/auth/callback/twitter`
  - **Website URL**: `http://localhost:3000`

### 5. Get Credentials
- After setup, you'll see:
  - **Client ID**
  - **Client Secret** (save this immediately, you won't see it again)

### 6. Add to .env.local
```env
TWITTER_CLIENT_ID=your-client-id-here
TWITTER_CLIENT_SECRET=your-client-secret-here
```

---

## Testing Your OAuth Setup

After configuring all providers:

1. **Restart dev server**:
   ```bash
   npm run dev
   ```

2. **Visit sign-in page**:
   ```
   http://localhost:3000/auth/signin
   ```

3. **Test each provider**:
   - Click "Continue with Google"
   - Click "Continue with Facebook"
   - Click "Continue with X"

4. **Verify**:
   - You should be redirected to the provider's login
   - After auth, redirected back to LOLTracker
   - User automatically created in MongoDB
   - Session established

---

## Production Deployment

When deploying to production (e.g., Vercel):

### 1. Update OAuth Redirect URIs
For each provider, add production URLs:

**Google**:
- Authorized JavaScript origins: `https://yourdomain.com`
- Redirect URI: `https://yourdomain.com/api/auth/callback/google`

**Facebook**:
- Valid OAuth Redirect URIs: `https://yourdomain.com/api/auth/callback/facebook`

**Twitter**:
- Callback URI: `https://yourdomain.com/api/auth/callback/twitter`
- Website URL: `https://yourdomain.com`

### 2. Set Environment Variables
In your hosting platform (Vercel, Railway, etc.):
```env
NEXTAUTH_URL=https://yourdomain.com
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
FACEBOOK_CLIENT_ID=xxx
FACEBOOK_CLIENT_SECRET=xxx
TWITTER_CLIENT_ID=xxx
TWITTER_CLIENT_SECRET=xxx
```

---

## Troubleshooting

### Google Errors

**redirect_uri_mismatch**:
- Check redirect URI exactly matches: `/api/auth/callback/google`
- Ensure protocol (http/https) matches

**Access blocked**:
- Add test users in OAuth consent screen
- Verify app is published (or use test users)

### Facebook Errors

**URL Blocked**:
- Check redirect URI in Facebook Login settings
- Ensure app is in correct mode (Development/Live)

**Invalid OAuth access token**:
- Verify App ID and Secret are correct
- Check app hasn't been rate limited

### Twitter/X Errors

**Callback URL not approved**:
- Ensure callback URL exactly matches in Twitter settings
- Check you're using OAuth 2.0 (not 1.0a)

**unauthorized_client**:
- Verify Client ID and Secret
- Check app permissions include user data access

---

## Security Notes

- Never commit `.env.local` to version control
- Rotate secrets if they're ever exposed
- Use different credentials for dev/production
- Monitor OAuth usage in each platform's dashboard
- Enable 2FA on all developer accounts

---

## Support Links

- **Google**: https://console.cloud.google.com/apis/credentials
- **Facebook**: https://developers.facebook.com/apps/
- **Twitter**: https://developer.twitter.com/en/portal/dashboard
