# Quick Setup Guide - NovaMart

## Step-by-Step Setup Instructions

### 1. Prerequisites Check
```bash
# Check Node.js version (should be v16+)
node --version

# Check npm version
npm --version

# Check MongoDB installation
mongod --version
```

### 2. MongoDB Setup

**Start MongoDB:**
```bash
# Windows
mongod

# macOS/Linux
sudo systemctl start mongod
```

**Verify MongoDB is running:**
```bash
# Connect to MongoDB shell
mongosh
# or
mongo
```

### 3. Backend Configuration

**Navigate to backend:**
```bash
cd backend
```

**Install dependencies:**
```bash
npm install
```

**Configure environment variables:**
- Copy `.env.example` to `.env`
- Update the following required variables:

```env
# Required for basic functionality
MONGODB_URI=mongodb://localhost:27017/mern_ecommerce
SESSION_SECRET=generate_a_strong_random_32_char_secret_here

# Required for email features
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM="NovaMart <no-reply@novamart.com>"

# Optional: Google OAuth (can skip initially)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

**Generate a strong SESSION_SECRET:**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use any random string generator (min 32 characters)
```

**Start backend server:**
```bash
npm run dev
```

Server should start on `http://localhost:5000`

### 4. Frontend Configuration

**Open new terminal and navigate to frontend:**
```bash
cd frontend
```

**Install dependencies:**
```bash
npm install
```

**Configure environment:**
- Create `.env` file with:
```env
VITE_API_URL=http://localhost:5000/api
```

**Start frontend development server:**
```bash
npm run dev
```

Frontend should start on `http://localhost:5173`

### 5. Test the Application

**Open browser and navigate to:**
```
http://localhost:5173
```

**Test authentication flow:**
1. Click "Sign up" or navigate to `/register`
2. Fill in registration form with valid data
3. Check your email for verification link
4. Click verification link
5. You should be logged in automatically
6. Try logging out and logging in again

### 6. Gmail App Password Setup (for Email Features)

1. Go to your Google Account settings
2. Security → 2-Step Verification (enable if not already)
3. Security → App passwords
4. Select "Mail" and "Other (Custom name)"
5. Enter "NovaMart" as the name
6. Copy the generated 16-character password
7. Use this password in `EMAIL_PASS` in `.env`

### 7. Google OAuth Setup (Optional)

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure consent screen if prompted
6. Application type: "Web application"
7. Add authorized redirect URI:
   ```
   http://localhost:5000/api/auth/google/callback
   ```
8. Copy Client ID and Client Secret to `.env`

## Common Issues & Solutions

### Issue: MongoDB connection failed
**Solution:**
- Ensure MongoDB is running: `mongod`
- Check if port 27017 is available
- Verify `MONGODB_URI` in `.env`

### Issue: Email not sending
**Solution:**
- Verify Gmail App Password is correct
- Check if 2FA is enabled on Gmail
- Ensure `EMAIL_USER` and `EMAIL_PASS` are correct
- Check spam folder for verification emails

### Issue: Session not persisting
**Solution:**
- Clear browser cookies
- Ensure `SESSION_SECRET` is set in `.env`
- Check MongoDB connection for session storage

### Issue: CORS errors
**Solution:**
- Verify `ALLOWED_ORIGINS` includes `http://localhost:5173`
- Ensure both frontend and backend are running
- Check `CLIENT_URL` is set correctly

### Issue: Google OAuth not working
**Solution:**
- Verify Google OAuth credentials in `.env`
- Check redirect URI matches exactly in Google Console
- Ensure Google+ API is enabled in Google Cloud Console

## Testing Checklist

- [ ] Backend server starts without errors
- [ ] Frontend server starts without errors
- [ ] Can access homepage at `http://localhost:5173`
- [ ] Can register a new user
- [ ] Receive verification email
- [ ] Can verify email via link
- [ ] Can log in with verified account
- [ ] Can log out
- [ ] Can request password reset
- [ ] Receive password reset email
- [ ] Can reset password
- [ ] Can log in with new password
- [ ] Protected routes redirect to login when not authenticated
- [ ] Can access protected routes when authenticated
- [ ] Session persists on page refresh
- [ ] Google OAuth login works (if configured)

## Development Tips

### Backend Development
```bash
# Run with nodemon for auto-restart
npm run dev

# Check for linting errors
npm run lint
```

### Frontend Development
```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Database Management
```bash
# Connect to MongoDB shell
mongosh

# Use the database
use mern_ecommerce

# View collections
show collections

# View users
db.users.find().pretty()

# View sessions
db.sessions.find().pretty()

# Clear all sessions (logout all users)
db.sessions.deleteMany({})
```

## Next Steps

1. **Customize Email Templates:** Edit email HTML in `backend/controllers/authController.js`
2. **Add Products:** Create products via admin panel or API
3. **Configure Cloudinary:** For image uploads
4. **Set up Stripe:** For payment processing
5. **Deploy to Production:** Follow deployment guide in README.md

## Support

If you encounter any issues:
1. Check this guide first
2. Review error messages in terminal
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly
5. Ensure all dependencies are installed

## Useful Commands

```bash
# Backend
cd backend
npm run dev          # Start development server
npm start            # Start production server

# Frontend
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Database
mongosh              # Connect to MongoDB
mongod               # Start MongoDB server
```

Happy coding! 🚀
