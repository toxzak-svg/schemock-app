/**
 * English noun pluralization utilities
 * Provides intelligent pluralization for common patterns
 */

/**
 * Pluralize a noun based on English grammar rules
 * @param noun - The singular noun to pluralize
 * @returns The plural form of the noun
 */
export function pluralize(noun: string): string {
  if (!noun) {
    return 'items';
  }

  const word = noun.toLowerCase();

  // Words that don't change form
  const unchanging = ['sheep', 'fish', 'deer', 'species', 'series', 'moose'];
  if (unchanging.includes(word)) {
    return noun; // Return original case
  }

  // Words ending in s, x, z, ch, sh -> add 'es'
  // But skip if the word already ends with 's' and looks pluralized (e.g., "items", "users")
  if (word.endsWith('s') && word.length > 3 && !word.endsWith('ss')) {
    // Word already ends with 's' and looks pluralized, return as is
    return noun;
  }
  if (/[xz]$/.test(word) || word.endsWith('ch') || word.endsWith('sh')) {
    return noun + 'es';
  }

  // Words ending in consonant + y -> remove y, add 'ies'
  if (/[aeiouy]$/.test(word) && /[aeiou]y$/.test(word)) {
    // vowel + y -> add 's' (e.g., 'boy' -> 'boys')
    return noun + 's';
  } else if (word.endsWith('y')) {
    // consonant + y -> remove y, add 'ies'
    return noun.slice(0, -1) + 'ies';
  }

  // Words ending in f or fe -> remove f/fe, add 'ves'
  if (word.endsWith('fe')) {
    return noun.slice(0, -2) + 'ves';
  } else if (word.endsWith('f')) {
    return noun.slice(0, -1) + 'ves';
  }

  // Words ending in o -> add 'es' (most cases)
  const oExceptions = ['photo', 'piano', 'halo', 'cargo', 'memo', 'solo', 'studio'];
  if (word.endsWith('o') && !oExceptions.includes(word)) {
    return noun + 'es';
  }

  // Default: just add 's'
  return noun + 's';
}

/**
 * Handle special irregular plurals
 * @param noun - The singular noun
 * @returns The plural form or null if not irregular
 */
export function getIrregularPlural(noun: string): string | null {
  const irregulars: Record<string, string> = {
    'person': 'people',
    'man': 'men',
    'woman': 'women',
    'child': 'children',
    'tooth': 'teeth',
    'foot': 'feet',
    'mouse': 'mice',
    'goose': 'geese',
    'ox': 'oxen',
    'louse': 'lice',
    'leaf': 'leaves',
    'life': 'lives',
    'knife': 'knives',
    'wife': 'wives',
    'half': 'halves',
    'self': 'selves',
    'calf': 'calves',
    'loaf': 'loaves',
    'wolf': 'wolves',
    'thief': 'thieves',
    'datum': 'data',
    'criterion': 'criteria',
    'phenomenon': 'phenomena',
    'cactus': 'cacti',
    'focus': 'foci',
    'fungus': 'fungi',
    'nucleus': 'nuclei',
    'syllabus': 'syllabi',
    'analysis': 'analyses',
    'diagnosis': 'diagnoses',
    'oasis': 'oases',
    'thesis': 'theses',
    'crisis': 'crises',
    'basis': 'bases',
    'axis': 'axes',
    'appendix': 'appendices',
    'index': 'indices',
    'matrix': 'matrices',
    'vertex': 'vertices'
  };

  const lowerNoun = noun.toLowerCase();
  return irregulars[lowerNoun] || null;
}

/**
 * Pluralize a noun with special case handling
 * @param noun - The singular noun to pluralize
 * @returns The plural form of noun (lowercased)
 */
export function smartPluralize(noun: string): string {
  if (!noun) {
    return 'items';
  }

  // Check for irregular plurals first
  const irregular = getIrregularPlural(noun);
  if (irregular) {
    return irregular.toLowerCase();
  }

  // Fall back to rule-based pluralization
  return pluralize(noun).toLowerCase();
}
