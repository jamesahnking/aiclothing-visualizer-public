# Setting Up Email Authentication in Supabase

This guide provides step-by-step instructions for configuring email authentication in Supabase for the AI Clothing Visualizer project.

## Prerequisites

- A Supabase project (see [supabase-setup-guide.md](./supabase-setup-guide.md) for project setup)
- Access to the Supabase dashboard

## 1. Configure Email Provider in Supabase Dashboard

1. Log in to the [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to "Authentication" > "Providers" in the sidebar
4. Find the "Email" provider and ensure it's enabled

## 2. Email Authentication Settings

Configure the following settings for email authentication:

1. **Choose Authentication Method**:
   - **Email + Password**: Traditional email and password authentication (recommended)
   - **Email (passwordless)**: Magic link authentication (optional)

2. **Security Settings**:
   - Set minimum password length (recommended: 8 characters)
   - Enable/disable "Confirm email" option based on your security requirements
   - If "Confirm email" is enabled, users will need to verify their email before signing in

## 3. Customize Email Templates

Customize the email templates to match your brand:

1. Go to "Authentication" > "Email Templates"
2. Customize the following templates:
   - **Confirmation email**: Sent when a user signs up and needs to confirm their email
   - **Invitation email**: Sent when you invite a user to your project
   - **Magic link email**: Sent when a user requests a magic link (if using passwordless auth)
   - **Reset password email**: Sent when a user requests a password reset

For each template, you can customize:
- Subject line
- Content (HTML supported)
- Sender name
- Add your logo and brand colors

## 4. Configure SMTP Settings (Recommended for Production)

By default, Supabase uses its own SMTP server to send emails. For production, it's recommended to use your own SMTP server:

1. Go to "Authentication" > "SMTP Settings"
2. Enter your SMTP server details:
   - Host (e.g., smtp.gmail.com)
   - Port (typically 587 for TLS)
   - Username and password
   - Sender name and email

Using your own SMTP server improves deliverability and prevents emails from going to spam folders.

## 5. Configure Site URL for Redirects

Set the site URL to ensure proper redirection after email confirmation and password resets:

1. Go to "Authentication" > "URL Configuration"
2. Set the Site URL to your application's URL:
   - For development: `http://localhost:3000`
   - For production: `https://your-production-domain.com`

## 6. Testing Email Authentication

After configuration, test the email authentication flow:

1. **Sign Up Test**:
   - Navigate to your application's `/auth` page
   - Fill in the sign-up form and submit
   - Check for the confirmation email (if enabled)
   - Verify the email by clicking the link

2. **Sign In Test**:
   - Navigate to your application's `/auth` page
   - Enter the email and password used during sign-up
   - Verify successful login

3. **Password Reset Test**:
   - Navigate to your application's `/auth` page
   - Click "Forgot password?"
   - Enter the email address
   - Check for the password reset email
   - Follow the link and set a new password
   - Verify you can sign in with the new password

## 7. Monitoring Authentication Activity

Monitor authentication activity in the Supabase dashboard:

1. Go to "Authentication" > "Users" to view all registered users
2. Go to "Authentication" > "Logs" to view authentication events, such as:
   - Sign-ups
   - Sign-ins
   - Password resets
   - Email confirmations

## 8. Troubleshooting

If you encounter issues with email authentication:

1. **Emails not being received**:
   - Check spam/junk folders
   - Verify the email address is correct
   - Check Supabase logs for email sending errors
   - If using custom SMTP, verify your SMTP settings

2. **Sign-up errors**:
   - Check browser console for errors
   - Verify that the password meets the minimum requirements
   - Check Supabase logs for detailed error messages

3. **Sign-in errors**:
   - Ensure the user has confirmed their email (if required)
   - Verify the correct email and password are being used
   - Check Supabase logs for authentication errors

## Next Steps

After setting up email authentication, consider implementing:

1. **Social Authentication**: Add Google, GitHub, or other social providers
2. **Multi-factor Authentication (MFA)**: Add an extra layer of security
3. **Custom Claims and Roles**: Implement role-based access control

For more information, refer to the [Supabase Authentication documentation](https://supabase.com/docs/guides/auth).
