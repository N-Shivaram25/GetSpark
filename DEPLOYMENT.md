# Get Spark - Deployment Guide

## Netlify Deployment

### Step 1: Build Configuration
Make sure your project has the correct build settings:

1. **Build Command**: `npm run build`
2. **Publish Directory**: `dist`
3. **Node Version**: 18.x or higher

### Step 2: Environment Variables
Add these environment variables in Netlify Dashboard > Site settings > Environment variables:

```
CLIPDROP_API_KEY=your_clipdrop_api_key
LANGUAGETOOL_API_KEY=your_languagetool_api_key
OPENAI_API_KEY=your_openai_api_key
RAPIDAPI_KEY=your_rapidapi_key
DATABASE_URL=your_postgresql_database_url
```

### Step 3: Deploy to Netlify

#### Option A: Connect GitHub Repository
1. Go to [Netlify](https://netlify.com)
2. Click "New site from Git"
3. Connect your GitHub account
4. Select your Get Spark repository
5. Set build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click "Deploy site"

#### Option B: Manual Deploy
1. Run `npm run build` locally
2. Drag and drop the `dist` folder to Netlify

### Step 4: Configure Redirects
The `netlify.toml` file is already included with proper redirect rules for Single Page Application routing.

### Step 5: Database Setup
For production, you'll need a PostgreSQL database. Options:
- **Neon Database** (recommended): https://neon.tech
- **Supabase**: https://supabase.com
- **PlanetScale**: https://planetscale.com

Update your `DATABASE_URL` environment variable with the production database URL.

## Troubleshooting Common Deployment Issues

### 1. "Page not found" Error
- Ensure `netlify.toml` is in the root directory
- Verify the redirect rule is properly configured
- Check that `dist` folder contains `index.html`

### 2. Environment Variables Not Working
- Make sure all API keys are set in Netlify environment variables
- Prefix frontend environment variables with `VITE_` if needed
- Redeploy after adding environment variables

### 3. Build Failures
- Check Node.js version compatibility (use Node 18+)
- Ensure all dependencies are properly listed
- Check build logs for specific error messages

### 4. Database Connection Issues
- Verify `DATABASE_URL` format: `postgresql://user:password@host:port/database`
- Run database migrations: `npm run db:push`
- Check database connection limits

## Performance Optimization

### 1. Image Optimization
- Images are served optimized through the ClipDrop API
- Custom uploaded images are processed and cached
- SVG fallbacks ensure fast loading

### 2. Caching Strategy
- Static assets are cached by Netlify CDN
- API responses use appropriate cache headers
- Database queries are optimized for performance

### 3. Bundle Size
- Components are lazy-loaded where possible
- Unused dependencies are tree-shaken
- CSS is minified and optimized

## Monitoring & Analytics

Consider adding:
- **Error Tracking**: Sentry or LogRocket
- **Analytics**: Google Analytics or Plausible
- **Performance**: Web Vitals monitoring

## Security Considerations

- API keys are properly secured as environment variables
- Database connections use SSL
- CORS is configured for production domains
- User uploads are validated and sanitized

## Support

For deployment issues:
1. Check Netlify deploy logs
2. Verify environment variables
3. Test locally with production build: `npm run build && npm run start`
4. Check database connectivity

---

*This deployment guide ensures your Get Spark application runs smoothly in production with optimal performance and security.*