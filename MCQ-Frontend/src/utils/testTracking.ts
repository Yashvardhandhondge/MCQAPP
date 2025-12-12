import AsyncStorage from '@react-native-async-storage/async-storage';

const TEST_COUNT_KEY = '@test_count';
const MAX_FREE_TESTS = 3;

export async function getTestCount(): Promise<number> {
  try {
    const count = await AsyncStorage.getItem(TEST_COUNT_KEY);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    console.error('Error getting test count:', error);
    return 0;
  }
}

export async function incrementTestCount(): Promise<number> {
  try {
    const currentCount = await getTestCount();
    const newCount = currentCount + 1;
    await AsyncStorage.setItem(TEST_COUNT_KEY, newCount.toString());
    return newCount;
  } catch (error) {
    console.error('Error incrementing test count:', error);
    return 0;
  }
}

export async function resetTestCount(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TEST_COUNT_KEY);
  } catch (error) {
    console.error('Error resetting test count:', error);
  }
}

export function canTakeTest(isPremium: boolean, testCount: number): boolean {
  return isPremium || testCount < MAX_FREE_TESTS;
}

export function getRemainingTests(isPremium: boolean, testCount: number): number {
  if (isPremium) return Infinity;
  return Math.max(0, MAX_FREE_TESTS - testCount);
}

