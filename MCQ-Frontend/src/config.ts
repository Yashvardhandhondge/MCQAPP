import { Platform } from 'react-native';

// Determine the correct API URL based on the platform
// For Android Emulator: use 10.0.2.2 (special IP that maps to host's localhost)
// For Physical Device (Expo Go): use your computer's network IP (192.168.1.7)
// For iOS Simulator: use localhost
// For iOS Physical Device: use your computer's network IP

let API_BASE_URL: string;
const ENV_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

if (__DEV__) {
  if (ENV_API_BASE_URL) {
    API_BASE_URL = ENV_API_BASE_URL;
  } else if (Platform.OS === 'android') {
    // Android Emulator default for local backend
    API_BASE_URL = 'http://192.168.29.158:8000';
    // API_BASE_URL = 'https://goldfish-app-vwvh7.ondigitalocean.app';
  } else {
    // iOS Simulator default for local backend
    // API_BASE_URL = 'http://localhost:8000';
    API_BASE_URL = 'https://goldfish-app-vwvh7.ondigitalocean.app';
  }

  // Previous remote defaults kept below as comments for quick switching.
  if (Platform.OS === 'android') {
    // For physical Android device via Expo Go, use your network IP
    // Change this to your computer's IP address (found via ipconfig)
    // API_BASE_URL = 'http://192.168.1.7:8000';
    // API_BASE_URL ='https://mcqapp-nu.vercel.app';
    // API_BASE_URL = 'http://192.168.29.132:8000';
    // API_BASE_URL = 'http://10.228.232.180:8000';
    API_BASE_URL = 'http://192.168.29.158:8000'; // Local URL - commented out
    // API_BASE_URL = 'http://10.228.232.180:8000';
    // API_BASE_URL = 'https://goldfish-app-vwvh7.ondigitalocean.app';
    // API_BASE_URL = 'http://192.168.1.6:8000'; // Local URL - commented out


    // If using Android Emulator instead, use:
    // API_BASE_URL = 'http://10.0.2.2:8000';
  } else {
    // iOS Simulator can use localhost
    // API_BASE_URL = 'https://goldfish-app-vwvh7.ondigitalocean.app';
    // For physical iOS device via Expo Go, use network IP:
    // API_BASE_URL = 'http://192.168.1.7:8000';
  }
} else {
  // Production - use your production API URL
  API_BASE_URL = 'https://goldfish-app-vwvh7.ondigitalocean.app';
}

export { API_BASE_URL };
export const AUTH_BASE_URL = `${API_BASE_URL}/api/auth`;
export const MCQ_BASE_URL = `${API_BASE_URL}/api/mcq`;
