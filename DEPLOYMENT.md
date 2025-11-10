# Deployment Guide for VeriVote

This guide will help you deploy VeriVote to Render (backend) and Vercel (frontend).

## Backend Deployment (Render)

### 1. Environment Variables
Set the following environment variables in Render:

```
MONGO_URI=your_mongodb_connection_string
PORT=10000 # Render services must bind to port 10000
NODE_ENV=production
CLIENT_URL=https://your-vercel-app.vercel.app # Your deployed Vercel frontend URL
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
JWT_SECRET=your_jwt_secret_key
```
**Note:** For enhanced security, you should update `server/src/index.ts` to use `CLIENT_URL` for CORS configuration instead of `app.use(cors())`.

### 2. Build Settings
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Node Version**: 18.x or higher

### 3. Database
Make sure your MongoDB database is accessible from Render. If using MongoDB Atlas, whitelist Render's IP addresses (or use 0.0.0.0/0 for development).

## Frontend Deployment (Vercel)

### 1. Environment Variables
Set the following environment variables in Vercel dashboard:

```
VITE_API_URL=https://your-render-app.onrender.com/api
```

**Important**: 
- Replace `your-render-app.onrender.com` with your actual Render backend URL
- Make sure to include `/api` at the end of the URL
- No trailing slash after `/api`

### 2. Build Settings
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Root Directory**: `client` (if your client folder is in the root)

### 3. Important Notes
- The `VITE_API_URL` should point to your Render backend URL (include `/api` at the end)
- Make sure the Render backend URL is accessible (no trailing slash in the base URL)
- After deployment, test the connection by checking browser console for any CORS or network errors
- Vercel will automatically rebuild when you push to your repository

## Troubleshooting

### Login Error: "An unknown error occurred"
1. **Check Environment Variables**:
   - Verify `VITE_API_URL` is set correctly in Vercel (should be `https://your-render-app.onrender.com/api`)
   - Verify `CLIENT_URL` in Render matches your Vercel URL exactly (e.g., `https://your-app.vercel.app`)
   
2. **Verify Backend is Running**:
   - Check Render dashboard to ensure service is running
   - Test backend URL directly: `https://your-render-app.onrender.com/` should return "VeriVote API Running"
   
3. **Check Browser Console**:
   - Open browser developer tools (F12)
   - Check Console tab for detailed error messages
   - Check Network tab to see if requests are being made and what responses are received
   
4. **Verify CORS Configuration**:
   - `CLIENT_URL` in Render should match your Vercel URL exactly
   - No trailing slashes in URLs
   - CORS should allow credentials
   
5. **Check Render Logs**:
   - Go to Render dashboard → Your Service → Logs
   - Look for any error messages during login attempts
   - Check if database connection is successful
   - Verify JWT_SECRET is set correctly
   
6. **Common Issues**:
   - Network timeout: Render services may take a moment to wake up if idle
   - Database connection: Verify MONGO_URI is correct and database is accessible
   - JWT secret mismatch: Ensure JWT_SECRET is the same (though this shouldn't cause login to fail, it would cause auth to fail later)
   - **Local Environment Variables**: If running locally, ensure `dotenv` is installed in the `server` directory (`npm install dotenv`) and `import 'dotenv/config';` is the very first line in `server/src/index.ts` and `server/src/seeder.ts`.

### CORS Errors
- Make sure `CLIENT_URL` in Render matches your Vercel deployment URL exactly
- Check that CORS middleware is configured correctly (consider using `cors({ origin: process.env.CLIENT_URL, credentials: true })` in `server/src/index.ts`)
- Verify the backend allows credentials

### Database Connection Issues
- Verify `MONGO_URI` is set correctly
- Check MongoDB Atlas whitelist includes Render IPs
- Verify database connection string format

### Email Issues
- Verify email credentials are set correctly
- For Gmail, use App Password (not regular password)
- Check email service logs for delivery issues

## Testing After Deployment

1. Test login with demo credentials
2. Verify tickets are sent via email
3. Test voting flow
4. Check transaction feed updates
5. Verify all API endpoints are accessible

## Local Development

For local development, create a `.env` file in the `client` directory:

```
VITE_API_URL=http://localhost:5000/api
```

And in the `server` directory:

```
MONGO_URI=your_local_mongodb_uri_or_atlas_one
PORT=5000
CLIENT_URL=http://localhost:5173 # Or whatever port your Vite dev server runs on
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
JWT_SECRET=your_jwt_secret
```
**Important:** Ensure `dotenv` is installed in your `server` directory (`npm install dotenv`) and `import 'dotenv/config';` is the very first line in both `server/src/index.ts` and `server/src/seeder.ts` to load these environment variables.

