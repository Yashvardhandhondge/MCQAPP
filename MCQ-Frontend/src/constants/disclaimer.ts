/**
 * Disclaimer and official source links for Misleading Claims policy compliance.
 * Required: app must state it does not represent a government entity and link to official sources.
 */

export const DISCLAIMER_TEXT =
  'This app is not affiliated with, endorsed by, or operated by the Government of Maharashtra or the State Common Entrance Test Cell. For official exam information, notifications, and results, please use the official sources below.';

export const DISCLAIMER_SHORT =
  'Not a government app. For official MHT CET info, use the links below.';

/** Short description for PYQ/practice screens: practice-only disclaimer + refer to official sources. */
export const PYQ_PRACTICE_DISCLAIMER =
  'These practice questions are based on previous MHT CET exams and are provided for practice only. For official information and documents, please refer to the official State CET Cell website below.';

export const OFFICIAL_SOURCE_URL = 'https://cetcell.mahacet.org/';

export interface OfficialSource {
  name: string;
  url: string;
  description?: string;
}

/** Official government/official source for MHT CET (State CET Cell, Maharashtra). */
export const OFFICIAL_SOURCES: OfficialSource[] = [
  {
    name: 'State CET Cell (MHT CET)',
    url: OFFICIAL_SOURCE_URL,
    description: 'Official MHT CET website – syllabus, notices, information brochure',
  },
];
