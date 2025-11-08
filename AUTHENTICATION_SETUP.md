# Authentication System Setup

## Overview

The system now uses username/password authentication with the following features:

1. **Login** - Username/email and password authentication
2. **Signup** - Create new accounts with username, password, and role
3. **Forgot Password** - Request password reset token
4. **Reset Password** - Reset password using token

## Default Users

The system initializes with these default users:

| Username | Password | Role | Name |
|----------|----------|------|------|
| greenvalley | fpo123 | FPO | Green Valley FPO |
| sunrise | fpo123 | FPO | Sunrise FPO |
| harvest | fpo123 | FPO | Harvest FPO |
| admin | admin123 | MAHAFPC | MAHAFPC Admin |
| raigad | retail123 | Retailer | Raigad Market |

You can also use email addresses for login:
- greenvalley@fpo.in
- sunrise@fpo.in
- harvest@fpo.in
- admin@mahafpc.in
- raigad@retailer.in

## Backend Endpoints

### Login
```
POST /api/auth/login
Body: { username: "admin", password: "admin123" }
```

### Signup
```
POST /api/auth/signup
Body: {
  username: "newuser",
  password: "password123",
  name: "New User",
  email: "user@example.com",
  role: "FPO",
  location: "Pune",
  contact: "9876543210"
}
```

### Forgot Password
```
POST /api/auth/forgot-password
Body: { username: "admin" } or { email: "admin@mahafpc.in" }
```

### Reset Password
```
POST /api/auth/reset-password
Body: { resetToken: "token", newPassword: "newpassword123" }
```

## Frontend Routes

- `/login` - Login page
- `/signup` - Signup page
- `/forgot-password` - Forgot password page

## Security Features

1. **Password Hashing** - All passwords are hashed using bcryptjs (10 rounds)
2. **JWT Tokens** - Authentication tokens expire in 24 hours
3. **Password Validation** - Minimum 6 characters
4. **Reset Token Expiry** - Reset tokens expire after 1 hour

## Password Reset Flow

1. User requests password reset with username/email
2. System generates reset token (shown in console in development mode)
3. User receives token (via email in production, console in development)
4. User enters token and new password
5. Password is reset and user can login

## Testing

1. **Login Test:**
   - Go to `/login`
   - Enter username: `admin`
   - Enter password: `admin123`
   - Should redirect to dashboard

2. **Signup Test:**
   - Go to `/signup`
   - Fill in all required fields
   - Submit form
   - Should auto-login and redirect to dashboard

3. **Forgot Password Test:**
   - Go to `/forgot-password`
   - Enter username or email
   - Check backend console for reset token (development mode)
   - Use token to reset password

## Notes

- In development mode, reset tokens are shown in the backend console
- In production, implement email sending for reset tokens
- Passwords are never stored in plain text
- All authentication is handled through JWT tokens

