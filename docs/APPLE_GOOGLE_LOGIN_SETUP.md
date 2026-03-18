# Apple & Google Login – External Setup Guide

SportStock uses **AWS Cognito Hosted UI** with OAuth2 PKCE for Sign in with Apple and Google. The app code is ready; you need to configure Cognito, Apple, and Google externally.

---

## Prerequisites

- AWS account with a Cognito User Pool
- Apple Developer Program membership
- Google Cloud project
- Your Cognito domain (Cognito domain: `https://your-prefix.auth.region.amazoncognito.com`, or a custom domain)

---

## 1. AWS Cognito Setup

### 1.1 User Pool Domain

1. AWS Console → **Cognito** → your User Pool
2. **App integration** → **Domain name**
3. Create or confirm a domain:
   - **Cognito domain** (recommended): e.g. `sportstock-auth` → `https://sportstock-auth.auth.us-east-1.amazoncognito.com`
   - **Custom domain**: use your own (e.g. `auth.yourdomain.com`)

### 1.2 App Client (PKCE)

1. **App integration** → **App clients** → your app client (or create one)
2. **Edit** the app client:
   - **Authentication flows**: enable **ALLOW_USER_PASSWORD_AUTH** and **ALLOW_REFRESH_TOKEN_AUTH**
   - **Hosted UI**: enable
   - **Callback URL(s)** – add:
     ```
     sportstock://callback
     ```
   - For Expo development builds, you may also need:
     ```
     exp://127.0.0.1:8081/--/callback
     ```
   - **Sign out URL(s)** – add `sportstock://` or leave default
   - **Identity providers**: enable **SignInWithApple** and **Google**
   - **OAuth 2.0 grant types**: **Authorization code grant** and **Refresh token**
   - No client secret for mobile (or ensure PKCE is used without a secret)

### 1.3 Environment Variables

Ensure `.env` has:

```
EXPO_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxx
EXPO_PUBLIC_COGNITO_CLIENT_ID=your_app_client_id
EXPO_PUBLIC_COGNITO_OAUTH_DOMAIN=https://your-prefix.auth.us-east-1.amazoncognito.com
```

---

## 2. Apple Sign in with Apple Setup

### 2.1 App ID

1. [Apple Developer Portal](https://developer.apple.com/account) → **Certificates, Identifiers & Profiles** → **Identifiers**
2. Select or create an App ID with Bundle ID `com.thesportstock.app`
3. Enable **Sign in with Apple**
4. Note your **Team ID** and **Bundle ID**

### 2.2 Services ID (for web OAuth)

1. **Identifiers** → **+** → **Services IDs** → Continue
2. Set:
   - **Description**: SportStock Web Auth
   - **Identifier**: e.g. `com.thesportstock.app.signin` (must be unique)
3. Enable **Sign in with Apple** → **Configure**
4. **Primary App ID**: choose your SportStock App ID
5. **Domains and Subdomains**: use your Cognito domain, e.g. `sportstock-auth.auth.us-east-1.amazoncognito.com`  
   (no `https://`, no path)
6. **Return URLs**: add:
   ```
   https://sportstock-auth.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
   ```
   Replace with your actual Cognito domain + `/oauth2/idpresponse`
7. **Save** → **Continue** → **Register**

### 2.3 Create Sign in with Apple Key

1. **Keys** → **+** → **Sign in with Apple** → Continue
2. **Key name**: e.g. SportStock Apple Sign In
3. **Configure**: select your App ID
4. **Register** → **Download** the `.p8` key (only once)
5. Note **Key ID**

### 2.4 Add Apple as IdP in Cognito

1. AWS Cognito → User Pool → **Sign-in experience** → **Federation** → **Identity providers**
2. **Add identity provider** → **Sign in with Apple**
3. Use:
   - **Services ID**: from step 2.2
   - **Team ID**: from App ID
   - **Key ID**: from step 2.3
   - **Private key**: paste contents of the `.p8` file (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
4. **Attribute mapping**: map `email`, `name` as needed
5. **Save**

Use **SignInWithApple** as the IdP identifier (or match it in your app code).

---

## 3. Google Sign-in Setup

### 3.1 Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/) → your project or create one
2. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
3. **Application type**: **Web application**
4. **Name**: e.g. SportStock Cognito
5. **Authorized redirect URIs** → add:
   ```
   https://sportstock-auth.auth.us-east-1.amazoncognito.com/oauth2/idpresponse
   ```
   Replace with your Cognito domain + `/oauth2/idpresponse`
6. **Create** → note **Client ID** and **Client Secret**

### 3.2 Enable Google+ API (if needed)

Some projects require the People API or no extra APIs for basic OAuth. If you see scoping errors, enable **Google+ API** or **People API**.

### 3.3 Add Google as IdP in Cognito

1. AWS Cognito → User Pool → **Sign-in experience** → **Federation** → **Identity providers**
2. **Add identity provider** → **Google**
3. Enter:
   - **App ID**: Google OAuth Client ID
   - **App secret**: Google OAuth Client Secret
4. **Attribute mapping**: map `email`, `name`, `picture` as needed
5. **Save**

Use **Google** as the IdP identifier.

---

## 4. Enable IdPs on App Client

1. Cognito → User Pool → **App integration** → **App client settings**
2. Under **Identity providers**, enable **SignInWithApple** and **Google**
3. **Save changes**

---

## 5. iOS Configuration (Xcode)

1. Open `ios/SportStock.xcworkspace` in Xcode
2. Select the SportStock target → **Signing & Capabilities**
3. If “Sign in with Apple” is not listed, click **+ Capability** → **Sign in with Apple**

`SportStock.entitlements` is already configured with Sign in with Apple.

---

## 6. Android (optional)

For Android, the redirect URI `sportstock://callback` works with the `sportstock` scheme in `app.json`. No extra config unless you later add native Google Sign-In.

---

## 7. Verify

1. Cognito → User Pool → **App integration** → **App client settings** → **Launch Hosted UI**
2. You should see **Continue with Apple** and **Sign in with Google**
3. Test each provider end-to-end in the app

---

## Redirect URI Reference

| Environment      | Redirect URI             |
|------------------|--------------------------|
| Production (iOS) | `sportstock://callback`  |
| Production (And.)| `sportstock://callback`  |
| Expo dev build   | `sportstock://callback`  |
| Expo Go          | Not supported (no custom scheme) |

---

## Common Issues

- **“invalid redirect_url” (Apple)**  
  Use the Services ID (not App ID) and ensure the Return URL exactly matches `https://<cognito-domain>/oauth2/idpresponse`.

- **“invalid_client” / token exchange fails**  
  Ensure the app client uses PKCE and has no client secret, or that the token endpoint is called with the correct parameters.

- **IdP not showing in Hosted UI**  
  Enable both IdPs under App client settings → Identity providers.
