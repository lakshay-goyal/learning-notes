/**
 * Shared taxonomy registry contract.
 *
 * Page metadata may use stable IDs before a topic has a full manifest. The
 * registry keeps those IDs meaningful without coupling them to navigation
 * labels or filesystem routes.
 */

import { readFileSync } from 'node:fs';
import { STABLE_ID, TAXONOMY_FACETS } from './learning-contract.mjs';

export function readTaxonomyRegistry(path) {
  let data;
  try {
    data = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error(`cannot read taxonomy registry ${path}: ${error.message}`);
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(`taxonomy registry ${path} must contain an object`);
  }
  if (data.version !== 1) {
    throw new Error(`taxonomy registry ${path} has unsupported version "${data.version}"`);
  }

  for (const facet of TAXONOMY_FACETS) {
    const values = data[facet];
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error(`taxonomy registry ${path} must define a non-empty ${facet} array`);
    }
    const invalid = values.filter((value) => typeof value !== 'string' || !STABLE_ID.test(value));
    if (invalid.length) {
      throw new Error(`taxonomy registry ${path} has invalid ${facet} IDs: ${invalid.join(', ')}`);
    }
    if (new Set(values).size !== values.length) {
      throw new Error(`taxonomy registry ${path} contains duplicate ${facet} IDs`);
    }
  }
  return data;
}

/** Return stable-ID problems for one resolved page's taxonomy object. */
export function validatePageTaxonomy(taxonomy, registry) {
  const problems = [];
  for (const facet of TAXONOMY_FACETS) {
    const known = new Set(registry[facet] || []);
    for (const id of taxonomy?.[facet] || []) {
      if (!known.has(id)) problems.push(`${facet} references unknown taxonomy ID "${id}"`);
    }
  }
  return problems;
}
