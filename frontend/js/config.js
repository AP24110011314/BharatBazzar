/**
 * config.js — BharatBazzar Runtime Frontend Configuration
 * 
 * ============================================================================
 * 🚀 PRODUCTION DEPLOYMENT GUIDE (Vercel + Render):
 * ============================================================================
 * If you deploy the backend on Render (e.g. https://your-backend.onrender.com),
 * you have TWO flexible ways to link the frontend to the backend:
 * 
 * OPTION A (Recommended — Zero CORS, handled by Vercel rewrite proxy):
 * Leave window.BACKEND_API_URL as empty string '' below, and in vercel.json set:
 *   "destination": "https://<your-render-service>.onrender.com/api/:match*"
 * 
 * OPTION B (Direct cross-origin requests):
 * Set your full Render backend API URL below:
 *   window.BACKEND_API_URL = 'https://<your-render-service>.onrender.com/api';
 * 
 * ============================================================================
 * 💻 LOCAL DEVELOPMENT:
 * If left empty (''), api.js automatically connects to:
 *   http://localhost:5001/api
 * ============================================================================
 */

window.BACKEND_API_URL = '';

