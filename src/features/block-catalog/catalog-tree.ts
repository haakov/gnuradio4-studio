import type { BlockCatalogItem } from '../../lib/api/blocks';
import {
  abbreviateTypeExpr,
  splitTopLevelTemplateArgs,
  stripScopedTypeNames,
} from './type-names';

export type ParsedTypeId = {
  moduleName: string;
  familyName: string;
  variantLabel: string;
  /** Template arguments in their abbreviated catalog spelling, e.g. `['ui8', 'ns']`. */
  templateArgs: string[];
  /** Template arguments with namespaces stripped but no abbreviation applied. */
  verboseTemplateArgs: string[];
};

export type CatalogVariantEntry = {
  block: BlockCatalogItem;
  label: string;
};

export type CatalogTypeGroup = Map<string, BlockCatalogItem[]>;
export type CategoryTreeNode = {
  children: Map<string, CategoryTreeNode>;
  types: CatalogTypeGroup;
};

export function createCategoryTreeNode(): CategoryTreeNode {
  return {
    children: new Map(),
    types: new Map(),
  };
}

export function parseTypeId(blockTypeId: string): ParsedTypeId {
  const lt = blockTypeId.indexOf('<');
  const hasTemplate = lt >= 0 && blockTypeId.endsWith('>');
  const core = hasTemplate ? blockTypeId.slice(0, lt) : blockTypeId;
  const templateArgs = hasTemplate ? blockTypeId.slice(lt + 1, -1) : '';

  const scopeSplit = core.lastIndexOf('::');
  const dottedSplit = core.lastIndexOf('.');
  const moduleName =
    scopeSplit >= 0
      ? core.slice(0, scopeSplit)
      : dottedSplit >= 0
        ? core.slice(0, dottedSplit)
        : '(uncategorized)';
  const familyName =
    scopeSplit >= 0
      ? core.slice(scopeSplit + 2)
      : dottedSplit >= 0
        ? core.slice(dottedSplit + 1)
        : core;

  const topLevelArgs = templateArgs ? splitTopLevelTemplateArgs(templateArgs) : [];
  const verboseArgs = topLevelArgs.map((arg) => stripScopedTypeNames(arg));
  const compactArgs = topLevelArgs.map((arg) => abbreviateTypeExpr(arg));

  return {
    moduleName,
    familyName: familyName || blockTypeId,
    variantLabel: formatVariantLabel(compactArgs.slice(0, 1)),
    templateArgs: compactArgs,
    verboseTemplateArgs: verboseArgs,
  };
}

export function formatVariantLabel(templateArgs: string[]): string {
  return templateArgs.length > 0 ? templateArgs.join(', ') : '(default)';
}

/**
 * Naming schemes for the instantiations of one block family, from shortest to
 * most explicit. The whole family shares whichever scheme first tells all of its
 * instantiations apart, so labels within a family stay comparable.
 */
const verboseVariantLabelScheme = (parsed: ParsedTypeId) =>
  formatVariantLabel(parsed.verboseTemplateArgs);

const VARIANT_LABEL_SCHEMES: ((parsed: ParsedTypeId) => string)[] = [
  (parsed) => formatVariantLabel(parsed.templateArgs.slice(0, 1)),
  (parsed) => formatVariantLabel(parsed.templateArgs),
  verboseVariantLabelScheme,
];

export function buildVariantEntries(variants: BlockCatalogItem[]): CatalogVariantEntry[] {
  const parsedVariants = variants.map((block) => ({
    block,
    parsed: parseTypeId(block.blockTypeId),
  }));

  const scheme =
    VARIANT_LABEL_SCHEMES.find((candidate) => {
      const labels = new Set(parsedVariants.map(({ parsed }) => candidate(parsed)));
      return labels.size === parsedVariants.length;
    }) ?? verboseVariantLabelScheme;

  return parsedVariants
    .map(({ block, parsed }) => ({ block, label: scheme(parsed) }))
    .sort(
      (a, b) =>
        // Numeric collation keeps width-suffixed labels in width order: i8, i16, i32.
        a.label.localeCompare(b.label, undefined, { numeric: true }) ||
        a.block.blockTypeId.localeCompare(b.block.blockTypeId),
    );
}

export function deriveNamespaceCategoryPath(blockTypeId: string): string {
  const lt = blockTypeId.indexOf('<');
  const core = lt >= 0 ? blockTypeId.slice(0, lt) : blockTypeId;
  const segments = core.split('::').filter((segment) => segment.length > 0);
  const trimmed = segments[0] === 'gr' ? segments.slice(1, -1) : segments.slice(0, -1);
  return trimmed.length > 0 ? trimmed.join('/') : 'uncategorized';
}

export function isMalformedCategoryPath(category: string): boolean {
  return /[<>()]/.test(category) || category.includes(',');
}

export function normalizeCategoryPath(block: BlockCatalogItem): string {
  void block;
  return deriveNamespaceCategoryPath(block.blockTypeId);
}

export function countCategoryNode(node: CategoryTreeNode): number {
  let total = node.types.size;
  for (const child of node.children.values()) {
    total += countCategoryNode(child);
  }
  return total;
}

export function collectCategoryPaths(
  node: CategoryTreeNode,
  path: string[] = [],
  result: string[] = [],
): string[] {
  const entries = Array.from(node.children.entries()).sort(([a], [b]) => a.localeCompare(b));

  for (const [name, child] of entries) {
    const childPath = [...path, name];
    result.push(childPath.join('/'));
    collectCategoryPaths(child, childPath, result);
  }

  return result;
}

export function buildCategoryTree(blocks: BlockCatalogItem[]): CategoryTreeNode {
  const root = createCategoryTreeNode();

  for (const block of blocks) {
    const parsed = parseTypeId(block.blockTypeId);
    const categoryPath = normalizeCategoryPath(block);
    const segments = categoryPath.split('/').filter((segment) => segment.length > 0);

    let current = root;
    for (const segment of segments) {
      const next = current.children.get(segment) ?? createCategoryTreeNode();
      current.children.set(segment, next);
      current = next;
    }

    const typeName = parsed.familyName;
    const variants = current.types.get(typeName) ?? [];
    variants.push(block);
    current.types.set(typeName, variants);
  }

  return root;
}
