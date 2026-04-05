// Firebase Analytics stub - add @react-native-firebase/analytics for full support
type EventParams = Record<string, string | number | boolean>;

export const analytics = {
  logEvent: async (eventName: string, params?: EventParams): Promise<void> => {
    if (__DEV__) console.log(`[Analytics] ${eventName}`, params);
    // TODO: await firebaseAnalytics().logEvent(eventName, params);
  },
  logScreenView: async (screenName: string, screenClass?: string): Promise<void> => {
    if (__DEV__) console.log(`[Analytics] Screen: ${screenName}`);
    // TODO: await firebaseAnalytics().logScreenView({ screen_name: screenName, screen_class: screenClass ?? screenName });
  },
  setUserProperties: async (properties: EventParams): Promise<void> => {
    if (__DEV__) console.log(`[Analytics] User properties:`, properties);
    // TODO: implement with Firebase
  },
};
