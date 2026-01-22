// This script fixes the "Invalid target origin 'null'" error
// likely caused by HMR or browser extensions when running in specific environments.

if (typeof window !== 'undefined') {
    const originalPostMessage = window.postMessage;
    window.postMessage = function (message: any, targetOrOptions: any, transfer?: any) {
        if (targetOrOptions === 'null' || targetOrOptions === null) {
            // console.warn('Supressed postMessage with invalid targetOrigin:', targetOrOptions);
            return; // Ignore invalid calls
        }
        return originalPostMessage.apply(this, arguments as any);
    };
}
