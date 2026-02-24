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
      return { 
        standard: value.standard, 
        chapterNumber: value.chapterNumber, 
        originalName: key,
        examQuestions: value.examQuestions,
        examMarks: value.examMarks,
      };
    }
  }
  
  // Try partial match
  for (const [key, value] of Object.entries(mappingList)) {
    const keyNormalized = normalizeChapterName(key);
    if (normalized.includes(keyNormalized) || keyNormalized.includes(normalized)) {
      return { 
        standard: value.standard, 
        chapterNumber: value.chapterNumber, 
        originalName: key,
        examQuestions: value.examQuestions,
        examMarks: value.examMarks,
      };
    }
  }
  
  return null;
};

// Physics chapter mapping
// examQuestions: Number of questions from this chapter in MHT-CET exam
// examMarks: Total marks for questions from this chapter in MHT-CET exam
const physicsMapping = {
  // Std. XI (20% weightage - 10 Questions, 20 Marks)
  'Motion in a Plane': { standard: '11', chapterNumber: 1, examQuestions: 1, examMarks: 1 },
  "Laws of Motion": { standard: '11', chapterNumber: 2, examQuestions: 0, examMarks: 0 },
  'Newton\'s Laws of Motion': { standard: '11', chapterNumber: 2, examQuestions: 0, examMarks: 0 },
  'Laws of Gravitation': { standard: '11', chapterNumber: 3, examQuestions: 2, examMarks: 2 },
  'Gravitation': { standard: '11', chapterNumber: 3, examQuestions: 1, examMarks: 1 },
  'Thermal Properties of Matter': { standard: '11', chapterNumber: 4, examQuestions: 1, examMarks: 1 },
  'Sound': { standard: '11', chapterNumber: 5, examQuestions: 1, examMarks: 1 },
  'Optics': { standard: '11', chapterNumber: 6, examQuestions: 2, examMarks: 2 },
  'Electrostatics': { standard: '11', chapterNumber: 7, examQuestions: 1, examMarks: 1 },
  'Semiconductors': { standard: '11', chapterNumber: 8, examQuestions: 1, examMarks: 1 },
  'Semiconductor': { standard: '11', chapterNumber: 8, examQuestions: 1, examMarks: 1 },
  'Vectors': { standard: '11', chapterNumber: 9, examQuestions: 0, examMarks: 0 },
  'Error Analysis': { standard: '11', chapterNumber: 10, examQuestions: 0, examMarks: 0 },
  'Measurement': { standard: '11', chapterNumber: 10, examQuestions: 0, examMarks: 0 },
  'Rectilinear Motion': { standard: '11', chapterNumber: 1, examQuestions: 0, examMarks: 0 },
  
  // Std. XII (80% weightage - 40 Questions, 80 Marks)
  'Rotational Dynamics': { standard: '12', chapterNumber: 1, examQuestions: 3, examMarks: 3 },
  'Mechanical Properties of Fluids': { standard: '12', chapterNumber: 2, examQuestions: 3, examMarks: 3 },
  'Kinetic Theory of Gases and Radiation': { standard: '12', chapterNumber: 3, examQuestions: 3, examMarks: 3 },
  'Kinetic Theory of Gases & Radiation': { standard: '12', chapterNumber: 3, examQuestions: 3, examMarks: 3 },
  'Thermodynamics': { standard: '12', chapterNumber: 4, examQuestions: 3, examMarks: 3 },
  'Oscillations': { standard: '12', chapterNumber: 5, examQuestions: 2, examMarks: 2 },
  'Superposition of Waves': { standard: '12', chapterNumber: 6, examQuestions: 2, examMarks: 2 },
  'Wave Optics': { standard: '12', chapterNumber: 7, examQuestions: 3, examMarks: 3 },
  'Electrostatics': { standard: '12', chapterNumber: 8, examQuestions: 3, examMarks: 3 },
  'Current Electricity': { standard: '12', chapterNumber: 9, examQuestions: 2, examMarks: 2 },
  'Magnetic Field Due To Electric Current': { standard: '12', chapterNumber: 10, examQuestions: 3, examMarks: 3 },
  'Magnetic Field Due to Electric Current': { standard: '12', chapterNumber: 10, examQuestions: 3, examMarks: 3 },
  'Moving Charges and Magnetism': { standard: '12', chapterNumber: 10, examQuestions: 3, examMarks: 3 },
  'Moving Coil Galvanometer': { standard: '12', chapterNumber: 10, examQuestions: 0, examMarks: 0 },
  'Magnetic Materials': { standard: '12', chapterNumber: 11, examQuestions: 1, examMarks: 1 },
  'Magnetism': { standard: '12', chapterNumber: 11, examQuestions: 0, examMarks: 0 },
  'Electromagnetic Induction': { standard: '12', chapterNumber: 12, examQuestions: 3, examMarks: 3 },
  'AC Circuits': { standard: '12', chapterNumber: 13, examQuestions: 3, examMarks: 3 },
  'Dual Nature of Radiation and Matter': { standard: '12', chapterNumber: 14, examQuestions: 2, examMarks: 2 },
  'Structure of Atoms and Nuclei': { standard: '12', chapterNumber: 15, examQuestions: 3, examMarks: 3 },
  'Atoms and Nuclei': { standard: '12', chapterNumber: 15, examQuestions: 3, examMarks: 3 },
  'Semiconductor Devices': { standard: '12', chapterNumber: 16, examQuestions: 1, examMarks: 1 },
  'EM Waves': { standard: '12', chapterNumber: 17, examQuestions: 0, examMarks: 0 },
};

// Chemistry chapter mapping
// examQuestions: Number of questions from this chapter in MHT-CET exam
// examMarks: Total marks for questions from this chapter in MHT-CET exam
const chemistryMapping = {
  // Std. XI (20% weightage - 10 Questions, 10 Marks)
  'Some Basic Concepts of Chemistry': { standard: '11', chapterNumber: 1, examQuestions: 1, examMarks: 1 },
  'Structure of Atom': { standard: '11', chapterNumber: 2, examQuestions: 1, examMarks: 1 },
  'Chemical Bonding': { standard: '11', chapterNumber: 3, examQuestions: 1, examMarks: 1 },
  'Redox Reactions': { standard: '11', chapterNumber: 4, examQuestions: 1, examMarks: 1 },
  'Elements of Group 1 and Group 2': { standard: '11', chapterNumber: 5, examQuestions: 1, examMarks: 1 },
  'Elements of Group 1 and 2': { standard: '11', chapterNumber: 5, examQuestions: 1, examMarks: 1 },
  'States of Matter': { standard: '11', chapterNumber: 6, examQuestions: 1, examMarks: 1 },
  'States of Matter: Gaseous and Liquid States': { standard: '11', chapterNumber: 6, examQuestions: 1, examMarks: 1 },
  'Adsorption and Colloids': { standard: '11', chapterNumber: 7, examQuestions: 1, examMarks: 1 },
  'Basic Principles of Organic Chemistry': { standard: '11', chapterNumber: 8, examQuestions: 1, examMarks: 1 },
  'Hydrocarbons': { standard: '11', chapterNumber: 9, examQuestions: 2, examMarks: 2 },
  
  // Std. XII (80% weightage - 40 Questions, 40 Marks)
  'Solid State': { standard: '12', chapterNumber: 1, examQuestions: 3, examMarks: 3 },
  'Solutions': { standard: '12', chapterNumber: 2, examQuestions: 3, examMarks: 3 },
  'Ionic Equilibria': { standard: '12', chapterNumber: 3, examQuestions: 2, examMarks: 2 },
  'Ionic Equilibrium': { standard: '12', chapterNumber: 3, examQuestions: 2, examMarks: 2 },
  'Chemical Thermodynamics': { standard: '12', chapterNumber: 4, examQuestions: 3, examMarks: 3 },
  'Electrochemistry': { standard: '12', chapterNumber: 5, examQuestions: 2, examMarks: 2 },
  'Chemical Kinetics': { standard: '12', chapterNumber: 6, examQuestions: 2, examMarks: 2 },
  'Elements of Groups 16, 17 and 18': { standard: '12', chapterNumber: 7, examQuestions: 4, examMarks: 4 },
  'Elements of Group 16, 17 and 18': { standard: '12', chapterNumber: 7, examQuestions: 4, examMarks: 4 },
  'Transition and Inner Transition Elements': { standard: '12', chapterNumber: 8, examQuestions: 3, examMarks: 3 },
  'Transition and Inner transition Elements': { standard: '12', chapterNumber: 8, examQuestions: 3, examMarks: 3 },
  'Elements of Group 16, 17, 18 & Transition and Inner Transition Elements': { standard: '12', chapterNumber: 7, examQuestions: 7, examMarks: 7 },
  'Coordination Compounds': { standard: '12', chapterNumber: 9, examQuestions: 2, examMarks: 2 },
  'Halogen Derivatives': { standard: '12', chapterNumber: 10, examQuestions: 3, examMarks: 3 },
  'Alcohols, Phenols and Ethers': { standard: '12', chapterNumber: 11, examQuestions: 3, examMarks: 3 },
  'Alcohol, Phenol, and Ether': { standard: '12', chapterNumber: 11, examQuestions: 3, examMarks: 3 },
  'Aldehydes, Ketones and Carboxylic Acids': { standard: '12', chapterNumber: 12, examQuestions: 3, examMarks: 3 },
  'Aldehyde, Ketone, and Carboxylic Acid': { standard: '12', chapterNumber: 12, examQuestions: 3, examMarks: 3 },
  'Amines': { standard: '12', chapterNumber: 13, examQuestions: 4, examMarks: 4 },
  'Biomolecules': { standard: '12', chapterNumber: 14, examQuestions: 1, examMarks: 1 },
  'Introduction to Polymer Chemistry': { standard: '12', chapterNumber: 15, examQuestions: 2, examMarks: 2 },
  'Polymers': { standard: '12', chapterNumber: 15, examQuestions: 2, examMarks: 2 },
  'Green Chemistry and Nanochemistry': { standard: '12', chapterNumber: 16, examQuestions: 1, examMarks: 1 },
  'Green and Nano Chemistry': { standard: '12', chapterNumber: 16, examQuestions: 1, examMarks: 1 },
};

// Maths chapter mapping
// examQuestions: Number of questions from this chapter in MHT-CET exam
// examMarks: Total marks for questions from this chapter in MHT-CET exam
const mathsMapping = {
  // Std. XI (20% weightage - 10 Questions, 20 Marks)
  'Trigonometry-II': { standard: '11', chapterNumber: 1, examQuestions: 1, examMarks: 2 },
  'Trigonometry II': { standard: '11', chapterNumber: 1, examQuestions: 1, examMarks: 2 },
  'Trigonometry': { standard: '11', chapterNumber: 1, examQuestions: 1, examMarks: 2 },
  'Straight Lines': { standard: '11', chapterNumber: 2, examQuestions: 1, examMarks: 2 },
  'Straight Line': { standard: '11', chapterNumber: 2, examQuestions: 1, examMarks: 2 },
  'Circle': { standard: '11', chapterNumber: 3, examQuestions: 1, examMarks: 2 },
  'Conic Sections': { standard: '11', chapterNumber: 4, examQuestions: 0, examMarks: 0 },
  'Conics': { standard: '11', chapterNumber: 4, examQuestions: 0, examMarks: 0 },
  'Probability': { standard: '11', chapterNumber: 5, examQuestions: 1, examMarks: 2 },
  'Complex Numbers': { standard: '11', chapterNumber: 6, examQuestions: 1, examMarks: 2 },
  'Permutations and Combinations': { standard: '11', chapterNumber: 7, examQuestions: 1, examMarks: 2 },
  'Permutation and Combination': { standard: '11', chapterNumber: 7, examQuestions: 1, examMarks: 2 },
  'Functions': { standard: '11', chapterNumber: 8, examQuestions: 1, examMarks: 2 },
  'Limits': { standard: '11', chapterNumber: 9, examQuestions: 1, examMarks: 2 },
  'Continuity': { standard: '11', chapterNumber: 10, examQuestions: 1, examMarks: 2 },
  'Measure of Dispersion': { standard: '11', chapterNumber: 11, examQuestions: 1, examMarks: 2 },
  'Solutions of a Triangle': { standard: '11', chapterNumber: 11, examQuestions: 0, examMarks: 0 },
  
  // Std. XII (80% weightage - 40 Questions, 80 Marks)
  'Mathematical Logic': { standard: '12', chapterNumber: 1, examQuestions: 2, examMarks: 4 },
  'Matrices': { standard: '12', chapterNumber: 2, examQuestions: 2, examMarks: 4 },
  'Trigonometric Functions': { standard: '12', chapterNumber: 3, examQuestions: 3, examMarks: 6 },
  'Trigonomeetric Functions': { standard: '12', chapterNumber: 3, examQuestions: 3, examMarks: 6 },
  'Inverse Trigonometric Functions': { standard: '12', chapterNumber: 3, examQuestions: 0, examMarks: 0 },
  'Pair of Straight Lines': { standard: '12', chapterNumber: 4, examQuestions: 2, examMarks: 4 },
  'Vectors': { standard: '12', chapterNumber: 5, examQuestions: 4, examMarks: 8 },
  'Line and Plane': { standard: '12', chapterNumber: 6, examQuestions: 4, examMarks: 8 },
  'Line & Plane': { standard: '12', chapterNumber: 6, examQuestions: 4, examMarks: 8 },
  'Linear Programming': { standard: '12', chapterNumber: 7, examQuestions: 1, examMarks: 2 },
  'Linear Programming Problems (LPP)': { standard: '12', chapterNumber: 7, examQuestions: 1, examMarks: 2 },
  'Differentiation': { standard: '12', chapterNumber: 8, examQuestions: 3, examMarks: 6 },
  'Derivatives': { standard: '12', chapterNumber: 8, examQuestions: 3, examMarks: 6 },
  'Applications of Derivatives': { standard: '12', chapterNumber: 9, examQuestions: 3, examMarks: 6 },
  'Application of Derivatives': { standard: '12', chapterNumber: 9, examQuestions: 3, examMarks: 6 },
  'Indefinite Integration': { standard: '12', chapterNumber: 10, examQuestions: 3, examMarks: 6 },
  'Integration': { standard: '12', chapterNumber: 10, examQuestions: 3, examMarks: 6 },
  'Definite Integration': { standard: '12', chapterNumber: 11, examQuestions: 4, examMarks: 8 },
  'Application of Definite Integration': { standard: '12', chapterNumber: 12, examQuestions: 2, examMarks: 4 },
  'Applications of Definite Integration': { standard: '12', chapterNumber: 12, examQuestions: 2, examMarks: 4 },
  'Application of Integration': { standard: '12', chapterNumber: 12, examQuestions: 2, examMarks: 4 },
  'Differential Equations': { standard: '12', chapterNumber: 13, examQuestions: 3, examMarks: 6 },
  'Differential Equation': { standard: '12', chapterNumber: 13, examQuestions: 3, examMarks: 6 },
  'Probability Distributions': { standard: '12', chapterNumber: 14, examQuestions: 2, examMarks: 4 },
  'Probability Distribution': { standard: '12', chapterNumber: 14, examQuestions: 2, examMarks: 4 },
  'Binomial Distribution': { standard: '12', chapterNumber: 15, examQuestions: 1, examMarks: 2 },
  'Probability Distribution & Binomial Distribution': { standard: '12', chapterNumber: 14, examQuestions: 3, examMarks: 6 },
};

// Biology mapping (placeholder - to be filled later)
const biologyMapping = {
  // Std. XI
  'Biomolecules': { standard: '11', chapterNumber: 1 },
  'Respiration and Energy Transfer': { standard: '11', chapterNumber: 2 },
  'Human Nutrition': { standard: '11', chapterNumber: 3 },
  'Excretion and Osmoregulation': { standard: '11', chapterNumber: 4 },

  // Std. XII
  'Reproduction in Lower and Higher Plants': { standard: '12', chapterNumber: 1 },
  'Reproduction in Lower and Higher Animals': { standard: '12', chapterNumber: 2 },
  'Inheritance and Variation': { standard: '12', chapterNumber: 3 },
  'Molecular Basis of Inheritance': { standard: '12', chapterNumber: 4 },
  'Origin and Evolution of Life': { standard: '12', chapterNumber: 5 },
  'Plant Water Relations': { standard: '12', chapterNumber: 6 },
  'Plant Growth and Mineral Nutrition': { standard: '12', chapterNumber: 7 },
  'Respiration and Circulation': { standard: '12', chapterNumber: 8 },
  'Control and Co-ordination': { standard: '12', chapterNumber: 9 },
  'Human Health and Diseases': { standard: '12', chapterNumber: 10 },
  'Enhancement of Food Production': { standard: '12', chapterNumber: 11 },
  'Biotechnology': { standard: '12', chapterNumber: 12 },
  'Organisms and Populations': { standard: '12', chapterNumber: 13 },
  'Ecosystems and Energy Flow': { standard: '12', chapterNumber: 14 },
  'Biodiversity, Conservation and Environmental Issues': { standard: '12', chapterNumber: 15 }
};

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

