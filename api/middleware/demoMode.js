// Demo Mode Middleware for Vercel API
// Simplified version that works with ES modules

export function demoModeMiddleware(req, res, next) {
  // Check if user is demo user via header or request body
  const isDemoHeader = req.headers['x-demo-mode'] === 'true';
  const isDemoBody = req.body && req.body.isDemo === true;
  
  if (isDemoHeader || isDemoBody || (req.user && req.user.isDemo === true)) {
    req.isDemo = true;
  } else {
    req.isDemo = false;
  }
  next();
}

export function isDemoUser(req) {
  return req.user && req.user.isDemo === true;
}

export function attachDemoFlag(req, user) {
  if (user && user.isDemo) {
    req.user = user;
    req.isDemo = true;
  }
}
