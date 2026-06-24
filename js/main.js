/**
 * Main - Application Initialization
 */

// Initialize the app
const app = new App();

// Set today's date as default
document.getElementById('f-date').value = new Date().toISOString().slice(0, 10);

// Initialize app
app.init();

// Make app globally available for inline onclick handlers
window.app = app;
