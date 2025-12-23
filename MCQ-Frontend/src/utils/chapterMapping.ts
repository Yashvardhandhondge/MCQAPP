/**
 * Frontend chapter mapping utility
 * Categorizes chapters by standard (11th/12th) when backend returns old format
 */

import type { ChapterAnalytics } from '../types/mcq';

// Chemistry chapter mapping
const chemistryMapping: Record<string, { standard: '11' | '12'; chapterNumber: number }> = {
  // Std. XI
  'Some Basic Concepts of Chemistry': { standard: '11', chapterNumber: 1 },
  'Structure of Atom': { standard: '11', chapterNumber: 2 },
  'Chemical Bonding': { standard: '11', chapterNumber: 3 },
  'Redox Reactions': { standard: '11', chapterNumber: 4 },
  'Elements of Group 1 and Group 2': { standard: '11', chapterNumber: 5 },
  'Elements of Group 1 and Group 2': { standard: '11', chapterNumber: 5 },
  'States of Matter': { standard: '11', chapterNumber: 6 },
  'States of Matter: Gaseous and Liquid States': { standard: '11', chapterNumber: 6 },
  'Adsorption and Colloids': { standard: '11', chapterNumber: 7 },
  'Basic Principles of Organic Chemistry': { standard: '11', chapterNumber: 8 },
  'Hydrocarbons': { standard: '11', chapterNumber: 9 },
  
  // Std. XII
  'Solid State': { standard: '12', chapterNumber: 1 },
  'Solutions': { standard: '12', chapterNumber: 2 },
  'Ionic Equilibria': { standard: '12', chapterNumber: 3 },
  'Chemical Thermodynamics': { standard: '12', chapterNumber: 4 },
  'Electrochemistry': { standard: '12', chapterNumber: 5 },
  'Chemical Kinetics': { standard: '12', chapterNumber: 6 },
  'Elements of Groups 16, 17 and 18': { standard: '12', chapterNumber: 7 },
  'Elements of Group 16, 17 and 18': { standard: '12', chapterNumber: 7 },
  'Transition and Inner Transition Elements': { standard: '12', chapterNumber: 8 },
  'Transition and Inner transition Elements': { standard: '12', chapterNumber: 8 },
  'Coordination Compounds': { standard: '12', chapterNumber: 9 },
  'Halogen Derivatives': { standard: '12', chapterNumber: 10 },
  'Alcohols, Phenols and Ethers': { standard: '12', chapterNumber: 11 },
  'Aldehydes, Ketones and Carboxylic Acids': { standard: '12', chapterNumber: 12 },
  'Amines': { standard: '12', chapterNumber: 13 },
  'Biomolecules': { standard: '12', chapterNumber: 14 },
  'Introduction to Polymer Chemistry': { standard: '12', chapterNumber: 15 },
  'Green Chemistry and Nanochemistry': { standard: '12', chapterNumber: 16 },
};

// Physics chapter mapping
const physicsMapping: Record<string, { standard: '11' | '12'; chapterNumber: number }> = {
  // Std. XI
  'Motion in a Plane': { standard: '11', chapterNumber: 1 },
  "Laws of Motion": { standard: '11', chapterNumber: 2 },
  "Newton's Laws of Motion": { standard: '11', chapterNumber: 2 },
  'Gravitation': { standard: '11', chapterNumber: 3 },
  'Thermal Properties of Matter': { standard: '11', chapterNumber: 4 },
  'Sound': { standard: '11', chapterNumber: 5 },
  'Optics': { standard: '11', chapterNumber: 6 },
  'Electrostatics': { standard: '11', chapterNumber: 7 },
  'Semiconductors': { standard: '11', chapterNumber: 8 },
  'Vectors': { standard: '11', chapterNumber: 9 },
  'Error Analysis': { standard: '11', chapterNumber: 10 },
  
  // Std. XII
  'Rotational Dynamics': { standard: '12', chapterNumber: 1 },
  'Mechanical Properties of Fluids': { standard: '12', chapterNumber: 2 },
  'Kinetic Theory of Gases and Radiation': { standard: '12', chapterNumber: 3 },
  'Kinetic Theory of Gases & Radiation': { standard: '12', chapterNumber: 3 },
  'Thermodynamics': { standard: '12', chapterNumber: 4 },
  'Oscillations': { standard: '12', chapterNumber: 5 },
  'Superposition of Waves': { standard: '12', chapterNumber: 6 },
  'Wave Optics': { standard: '12', chapterNumber: 7 },
  'Current Electricity': { standard: '12', chapterNumber: 9 },
  'Magnetic Field Due To Electric Current': { standard: '12', chapterNumber: 10 },
  'Magnetic Field Due to Electric Current': { standard: '12', chapterNumber: 10 },
  'Magnetic Materials': { standard: '12', chapterNumber: 11 },
  'Electromagnetic Induction': { standard: '12', chapterNumber: 12 },
  'AC Circuits': { standard: '12', chapterNumber: 13 },
  'Dual Nature of Radiation and Matter': { standard: '12', chapterNumber: 14 },
  'Structure of Atoms and Nuclei': { standard: '12', chapterNumber: 15 },
  'Semiconductor Devices': { standard: '12', chapterNumber: 16 },
};

// Maths chapter mapping
const mathsMapping: Record<string, { standard: '11' | '12'; chapterNumber: number }> = {
  // Std. XI
  'Trigonometry-II': { standard: '11', chapterNumber: 1 },
  'Trigonometry II': { standard: '11', chapterNumber: 1 },
  'Straight Lines': { standard: '11', chapterNumber: 2 },
  'Circle': { standard: '11', chapterNumber: 3 },
  'Conic Sections': { standard: '11', chapterNumber: 4 },
  'Conics': { standard: '11', chapterNumber: 4 },
  'Probability': { standard: '11', chapterNumber: 5 },
  'Complex Numbers': { standard: '11', chapterNumber: 6 },
  'Permutations and Combinations': { standard: '11', chapterNumber: 7 },
  'Functions': { standard: '11', chapterNumber: 8 },
  'Limits': { standard: '11', chapterNumber: 9 },
  'Continuity': { standard: '11', chapterNumber: 10 },
  
  // Std. XII
  'Mathematical Logic': { standard: '12', chapterNumber: 1 },
  'Matrices': { standard: '12', chapterNumber: 2 },
  'Trigonometric Functions': { standard: '12', chapterNumber: 3 },
  'Pair of Straight Lines': { standard: '12', chapterNumber: 4 },
  'Vectors': { standard: '12', chapterNumber: 5 },
  'Line and Plane': { standard: '12', chapterNumber: 6 },
  'Linear Programming': { standard: '12', chapterNumber: 7 },
  'Differentiation': { standard: '12', chapterNumber: 8 },
  'Applications of Derivatives': { standard: '12', chapterNumber: 9 },
  'Indefinite Integration': { standard: '12', chapterNumber: 10 },
  'Definite Integration': { standard: '12', chapterNumber: 11 },
  'Applications of Definite Integration': { standard: '12', chapterNumber: 12 },
  'Application of Definite Integration': { standard: '12', chapterNumber: 12 },
  'Differential Equations': { standard: '12', chapterNumber: 13 },
  'Differential Equation': { standard: '12', chapterNumber: 13 },
  'Probability Distributions': { standard: '12', chapterNumber: 14 },
  'Probability Distribution': { standard: '12', chapterNumber: 14 },
  'Binomial Distribution': { standard: '12', chapterNumber: 15 },
};

// Get mapping for a subject
const getSubjectMapping = (subject: string): Record<string, { standard: '11' | '12'; chapterNumber: number }> => {
  switch (subject) {
    case 'Chemistry':
      return chemistryMapping;
    case 'Physics':
      return physicsMapping;
    case 'Maths':
      return mathsMapping;
    default:
      return {};
  }
};

// Categorize chapters by standard when receiving array format
export const categorizeChapters = (
  chapters: ChapterAnalytics[],
  subject: string
): { standard11: ChapterAnalytics[]; standard12: ChapterAnalytics[]; unclassified: ChapterAnalytics[] } => {
  const mapping = getSubjectMapping(subject);
  const standard11: ChapterAnalytics[] = [];
  const standard12: ChapterAnalytics[] = [];
  const unclassified: ChapterAnalytics[] = [];

  chapters.forEach((chapter) => {
    const chapterInfo = mapping[chapter.chapter];
    
    if (chapterInfo) {
      const categorizedChapter: ChapterAnalytics = {
        ...chapter,
        standard: chapterInfo.standard,
        chapterNumber: chapterInfo.chapterNumber,
      };
      
      if (chapterInfo.standard === '11') {
        standard11.push(categorizedChapter);
      } else {
        standard12.push(categorizedChapter);
      }
    } else {
      unclassified.push(chapter);
    }
  });

  // Sort by chapter number
  standard11.sort((a, b) => {
    if (a.chapterNumber !== undefined && b.chapterNumber !== undefined) {
      return a.chapterNumber - b.chapterNumber;
    }
    return a.chapter.localeCompare(b.chapter);
  });

  standard12.sort((a, b) => {
    if (a.chapterNumber !== undefined && b.chapterNumber !== undefined) {
      return a.chapterNumber - b.chapterNumber;
    }
    return a.chapter.localeCompare(b.chapter);
  });

  unclassified.sort((a, b) => a.chapter.localeCompare(b.chapter));

  return { standard11, standard12, unclassified };
};

