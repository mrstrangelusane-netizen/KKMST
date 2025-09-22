import { errorMessages } from './config.js';

// Error Handler Class
export class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
    }

    // Handle different types of errors
    handle(error, context = 'Unknown', showToUser = true) {
        const errorInfo = {
            timestamp: new Date().toISOString(),
            context: context,
            message: error.message || error,
            stack: error.stack,
            type: this.getErrorType(error)
        };

        // Log error
        this.logError(errorInfo);

        // Show user-friendly message
        if (showToUser) {
            this.showUserMessage(error, context);
        }

        // Send to analytics if available
        this.trackError(errorInfo);

        return errorInfo;
    }

    // Get error type for better handling
    getErrorType(error) {
        if (error.code) {
            switch (error.code) {
                case 'permission-denied':
                    return 'PERMISSION_ERROR';
                case 'unavailable':
                    return 'NETWORK_ERROR';
                case 'unauthenticated':
                    return 'AUTH_ERROR';
                case 'not-found':
                    return 'NOT_FOUND_ERROR';
                default:
                    return 'FIREBASE_ERROR';
            }
        }
        
        if (error.name === 'TypeError') return 'TYPE_ERROR';
        if (error.name === 'ReferenceError') return 'REFERENCE_ERROR';
        if (error.name === 'SyntaxError') return 'SYNTAX_ERROR';
        
        return 'UNKNOWN_ERROR';
    }

    // Log error to console and local storage
    logError(errorInfo) {
        console.error(`[${errorInfo.context}] ${errorInfo.message}`, errorInfo);
        
        this.errorLog.unshift(errorInfo);
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(0, this.maxLogSize);
        }
        
        // Save to localStorage for debugging
        try {
            localStorage.setItem('errorLog', JSON.stringify(this.errorLog));
        } catch (e) {
            console.warn('Could not save error log to localStorage');
        }
    }

    // Show user-friendly error message
    showUserMessage(error, context) {
        let message = errorMessages.generic;
        
        switch (this.getErrorType(error)) {
            case 'NETWORK_ERROR':
                message = errorMessages.network;
                break;
            case 'AUTH_ERROR':
                message = errorMessages.auth;
                break;
            case 'PERMISSION_ERROR':
                message = "ဤလုပ်ဆောင်ချက်ကို လုပ်ဆောင်ရန် ခွင့်ပြုချက် မရှိပါ။";
                break;
            case 'NOT_FOUND_ERROR':
                message = "ဒေတာ မတွေ့ပါ။";
                break;
            case 'FIREBASE_ERROR':
                message = errorMessages.firebase;
                break;
            default:
                if (error.message) {
                    message = error.message;
                }
        }

        // Show message using existing showMessage function
        if (window.showMessage) {
            window.showMessage(message, true);
        } else {
            // Fallback to alert
            alert(message);
        }
    }

    // Track error for analytics
    trackError(errorInfo) {
        if (window.gtag) {
            gtag('event', 'exception', {
                description: `${errorInfo.context}: ${errorInfo.message}`,
                fatal: false,
                custom_map: {
                    error_type: errorInfo.type,
                    error_context: errorInfo.context
                }
            });
        }
    }

    // Get error log for debugging
    getErrorLog() {
        return this.errorLog;
    }

    // Clear error log
    clearErrorLog() {
        this.errorLog = [];
        localStorage.removeItem('errorLog');
    }

    // Retry mechanism for failed operations
    async retry(operation, maxRetries = 3, delay = 1000) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await operation();
            } catch (error) {
                if (i === maxRetries - 1) {
                    throw error;
                }
                
                console.log(`Retry ${i + 1}/${maxRetries} failed, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
            }
        }
    }
}

// Create global error handler instance
export const errorHandler = new ErrorHandler();

// Global error handler for unhandled errors
window.addEventListener('error', (event) => {
    errorHandler.handle(event.error, 'Global Error Handler');
});

// Global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handle(event.reason, 'Unhandled Promise Rejection');
});

// Export for use in other modules
export default errorHandler;

