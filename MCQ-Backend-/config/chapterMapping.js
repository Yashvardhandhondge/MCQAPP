/**
 * Chapter mapping configuration for MHT-CET subjects
 * Maps chapter names to their standard (11th/12th) and chapter numbers
 */

// Helper function to normalize chapter names for matching
const normalizeChapterName = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/&/g, 'and')
    .replace(/[^\w\s]/g, '');
};

// Helper function to find best match for a chapter name
const findBestMatch = (chapterName, mappingList) => {
  const normalized = normalizeChapterName(chapterName);
  
  // Try exact match first
  for (const [key, value] of Object.entries(mappingList)) {
    if (normalizeChapterName(key) === normalized) {
      return { standard: value.standard, chapterNumber: value.chapterNumber, originalName: key };
    }
  }
  
  // Try partial match
  for (const [key, value] of Object.entries(mappingList)) {
    const keyNormalized = normalizeChapterName(key);
    if (normalized.includes(keyNormalized) || keyNormalized.includes(normalized)) {
      return { standard: value.standard, chapterNumber: value.chapterNumber, originalName: key };
    }
  }
  
  return null;
};

// Physics chapter mapping
const physicsMapping = {
  // Std. XI (20% weightage)
  'Motion in a Plane': { standard: '11', chapterNumber: 1 },
  "Laws of Motion": { standard: '11', chapterNumber: 2 },
  'Newton\'s Laws of Motion': { standard: '11', chapterNumber: 2 },
  'Gravitation': { standard: '11', chapterNumber: 3 },
  'Thermal Properties of Matter': { standard: '11', chapterNumber: 4 },
  'Sound': { standard: '11', chapterNumber: 5 },
  'Optics': { standard: '11', chapterNumber: 6 },
  'Electrostatics': { standard: '11', chapterNumber: 7 },
  'Semiconductors': { standard: '11', chapterNumber: 8 },
  'Vectors': { standard: '11', chapterNumber: 9 },
  'Error Analysis': { standard: '11', chapterNumber: 10 },
  'Measurement': { standard: '11', chapterNumber: 10 },
  'Rectilinear Motion': { standard: '11', chapterNumber: 1 },
  
  // Std. XII (80% weightage)
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
  'Moving Charges and Magnetism': { standard: '12', chapterNumber: 10 },
  'Moving Coil Galvanometer': { standard: '12', chapterNumber: 10 },
  'Magnetic Materials': { standard: '12', chapterNumber: 11 },
  'Magnetism': { standard: '12', chapterNumber: 11 },
  'Electromagnetic Induction': { standard: '12', chapterNumber: 12 },
  'AC Circuits': { standard: '12', chapterNumber: 13 },
  'Dual Nature of Radiation and Matter': { standard: '12', chapterNumber: 14 },
  'Structure of Atoms and Nuclei': { standard: '12', chapterNumber: 15 },
  'Atoms and Nuclei': { standard: '12', chapterNumber: 15 },
  'Semiconductor Devices': { standard: '12', chapterNumber: 16 },
  'EM Waves': { standard: '12', chapterNumber: 17 },
};

// Chemistry chapter mapping
const chemistryMapping = {
  // Std. XI
  'Some Basic Concepts of Chemistry': { standard: '11', chapterNumber: 1 },
  'Structure of Atom': { standard: '11', chapterNumber: 2 },
  'Chemical Bonding': { standard: '11', chapterNumber: 3 },
  'Redox Reactions': { standard: '11', chapterNumber: 4 },
  'Elements of Group 1 and Group 2': { standard: '11', chapterNumber: 5 },
  'Elements of Group 1 and 2': { standard: '11', chapterNumber: 5 },
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

// Maths chapter mapping
const mathsMapping = {
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
  'Solutions of a Triangle': { standard: '11', chapterNumber: 11 },
  
  // Std. XII
  'Mathematical Logic': { standard: '12', chapterNumber: 1 },
  'Matrices': { standard: '12', chapterNumber: 2 },
  'Trigonometric Functions': { standard: '12', chapterNumber: 3 },
  'Trigonomeetric Functions': { standard: '12', chapterNumber: 3 },
  'Inverse Trigonometric Functions': { standard: '12', chapterNumber: 3 },
  'Pair of Straight Lines': { standard: '12', chapterNumber: 4 },
  'Vectors': { standard: '12', chapterNumber: 5 },
  'Line and Plane': { standard: '12', chapterNumber: 6 },
  'Linear Programming': { standard: '12', chapterNumber: 7 },
  'Differentiation': { standard: '12', chapterNumber: 8 },
  'Applications of Derivatives': { standard: '12', chapterNumber: 9 },
  'Indefinite Integration': { standard: '12', chapterNumber: 10 },
  'Definite Integration': { standard: '12', chapterNumber: 11 },
  'Application of Definite Integration': { standard: '12', chapterNumber: 12 },
  'Applications of Definite Integration': { standard: '12', chapterNumber: 12 },
  'Differential Equations': { standard: '12', chapterNumber: 13 },
  'Differential Equation': { standard: '12', chapterNumber: 13 },
  'Probability Distributions': { standard: '12', chapterNumber: 14 },
  'Probability Distribution': { standard: '12', chapterNumber: 14 },
  'Binomial Distribution': { standard: '12', chapterNumber: 15 },
};

// Biology mapping (placeholder - to be filled later)
const biologyMapping = {};

// Get mapping for a subject
const getSubjectMapping = (subject) => {
  switch (subject) {
    case 'Physics':
      return physicsMapping;
    case 'Chemistry':
      return chemistryMapping;
    case 'Maths':
      return mathsMapping;
    case 'Biology':
      return biologyMapping;
    default:
      return {};
  }
};

// Get chapter info (standard and chapter number) for a chapter name
const getChapterInfo = (subject, chapterName) => {
  const mapping = getSubjectMapping(subject);
  if (!mapping || Object.keys(mapping).length === 0) {
    return null;
  }
  
  return findBestMatch(chapterName, mapping);
};

module.exports = {
  getSubjectMapping,
  getChapterInfo,
  physicsMapping,
  chemistryMapping,
  mathsMapping,
  biologyMapping,
};

