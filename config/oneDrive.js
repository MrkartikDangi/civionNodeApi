require('dotenv').config();

module.exports = {
  clientId: process.env.ONEDRIVE_CLIENT_ID,
  clientSecret: process.env.ONEDRIVE_CLIENT_SECRET,
  tenantId: process.env.ONEDRIVE_TENANT_ID,
  driveEmail: process.env.ONEDRIVE_EMAIL,
  redirectUri: process.env.ONEDRIVE_REDIRECT_URI || 'http://localhost',
  // ✅ Fixed for Client Credentials
  scopes: ['https://graph.microsoft.com/.default'],
  authUrl: `https://login.microsoftonline.com/${process.env.ONEDRIVE_TENANT_ID}/oauth2/v2.0/token`,
};
