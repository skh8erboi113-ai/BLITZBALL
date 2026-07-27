/**
 * Main application entry point
 * Initializes the application when DOM is ready
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('🏐 Blitzball League Manager - Initializing...');
    
    try {
        UIManager.init();
        console.log('✅ Application initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize application:', error);
        alert('Failed to load application. Please refresh the page.');
    }
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});
