import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@free_full_chapter_usage_v1';
export const MAX_FREE_FULL_CHAPTERS_PER_SUBJECT = 3;

type SubjectChapterMap = Record<string, string[]>;

async function getStoredMap(): Promise<SubjectChapterMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object') {
      return parsed as SubjectChapterMap;
    }
    return {};
  } catch (error) {
    console.error('Error reading free chapter limits storage:', error);
    return {};
  }
}

async function setStoredMap(map: SubjectChapterMap): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (error) {
    console.error('Error writing free chapter limits storage:', error);
  }
}

export async function getFullPracticeChapters(subject: string): Promise<string[]> {
  const map = await getStoredMap();
  return map[subject] ?? [];
}

export async function addFullPracticeChapter(subject: string, chapter: string): Promise<string[]> {
  const map = await getStoredMap();
  const current = map[subject] ?? [];

  if (!current.includes(chapter)) {
    const updated = [...current, chapter].slice(0, MAX_FREE_FULL_CHAPTERS_PER_SUBJECT);
    map[subject] = updated;
    await setStoredMap(map);
    return updated;
  }

  return current;
}

export async function canStartFullPractice(
  isPremium: boolean,
  subject: string,
  chapter: string,
): Promise<{ allowed: boolean; usedChapters: string[] }> {
  if (isPremium) {
    return { allowed: true, usedChapters: [] };
  }

  const used = await getFullPracticeChapters(subject);

  if (used.includes(chapter)) {
    return { allowed: true, usedChapters: used };
  }

  if (used.length >= MAX_FREE_FULL_CHAPTERS_PER_SUBJECT) {
    return { allowed: false, usedChapters: used };
  }

  return { allowed: true, usedChapters: used };
}

