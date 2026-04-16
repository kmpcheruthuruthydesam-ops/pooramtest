/**
 * Taptic Engine Simulator / Native Haptics Manager
 * Provides iOS-style premium haptic feedback for interactions.
 */

// Safe wrapper for the vibrations API
export const hapticFeedback = (pattern = [10]) => {
    try {
        if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(pattern);
        }
    } catch (e) {
        // Silently fail on unsupported browsers (e.g. Safari on iOS may block programmatic vibration without native wrappers, but works on Android)
        console.warn('Haptic feedback not supported on this device', e);
    }
};

/**
 * Common preset vibrations
 */
export const Haptics = {
    // A tiny 'tick' for general button clicks and menu opens
    lightTick: () => hapticFeedback([10]),
    
    // A solid 'thud' for important actions like Submit or Delete
    heavyTap: () => hapticFeedback([30]),

    // A double tap for success/completion
    successDouble: () => hapticFeedback([15, 50, 15]),

    // An aggressive buzz for errors or destructive warnings
    errorBuzz: () => hapticFeedback([40, 40, 40, 40, 40])
};
