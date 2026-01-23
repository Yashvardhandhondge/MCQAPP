import type { NavigationProp } from '@react-navigation/native';
import type { AppStackParamList } from '../navigation/types';

/**
 * Safely navigates back. If there's no previous screen in the stack,
 * navigates to MainTabs as a fallback.
 */
export function safeGoBack(
  navigation: NavigationProp<AppStackParamList> | { goBack: () => void; canGoBack?: () => boolean; navigate?: (screen: string, params?: any) => void }
): void {
  try {
    // Check if we can go back - use canGoBack if available, otherwise try goBack
    if (navigation.canGoBack) {
      if (navigation.canGoBack()) {
        navigation.goBack();
        return;
      }
    } else {
      // If canGoBack is not available, try goBack directly
      try {
        navigation.goBack();
        return;
      } catch (goBackError) {
        // If goBack fails, continue to fallback
        console.log('goBack failed, trying fallback:', goBackError);
      }
    }
    
    // Fallback to MainTabs if we can't go back
    if (navigation.navigate) {
      try {
        (navigation as NavigationProp<AppStackParamList>).navigate('MainTabs');
      } catch (navigateError) {
        console.error('Fallback navigation to MainTabs failed:', navigateError);
        // Last resort: try goBack anyway
        try {
          navigation.goBack();
        } catch (finalError) {
          console.error('All navigation attempts failed:', finalError);
        }
      }
    } else {
      // Last resort: try goBack anyway
      try {
        navigation.goBack();
      } catch (finalError) {
        console.error('Navigation goBack failed:', finalError);
      }
    }
  } catch (error) {
    console.error('Navigation error:', error);
    // Try to navigate to MainTabs as fallback
    if (navigation.navigate) {
      try {
        (navigation as NavigationProp<AppStackParamList>).navigate('MainTabs');
      } catch (fallbackError) {
        console.error('Fallback navigation also failed:', fallbackError);
      }
    }
  }
}
