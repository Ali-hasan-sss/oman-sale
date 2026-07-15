export type CategoryRef = {
  id: string;
  parentId?: string | null;
  sortOrder?: number;
};

export type SubcategoryFilterLevel<T extends CategoryRef> = {
  levelIndex: number;
  parentId: string;
  options: T[];
  selectedId: string;
  title: string;
};

export const getDirectChildCategories = <T extends CategoryRef>(categories: T[], parentId: string) =>
  categories
    .filter((category) => category.parentId === parentId)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

export const getEffectiveCategoryId = (rootId: string, selectedPath: string[]) => {
  for (let index = selectedPath.length - 1; index >= 0; index -= 1) {
    const selectedId = selectedPath[index];
    if (selectedId) return selectedId;
  }

  return rootId;
};

export const updateSubcategoryPath = (currentPath: string[], levelIndex: number, categoryId: string) => {
  if (!categoryId) return currentPath.slice(0, levelIndex);

  const nextPath = currentPath.slice(0, levelIndex);
  nextPath[levelIndex] = categoryId;
  return nextPath;
};

export const buildSubcategoryFilterLevels = <T extends CategoryRef>(
  categories: T[],
  rootId: string,
  selectedPath: string[],
  getLabel: (category: T) => string,
  rootLevelTitle: string
): SubcategoryFilterLevel<T>[] => {
  const levels: SubcategoryFilterLevel<T>[] = [];
  let currentParentId = rootId;

  for (let levelIndex = 0; levelIndex < categories.length; levelIndex += 1) {
    const options = getDirectChildCategories(categories, currentParentId);
    if (options.length === 0) break;

    const selectedId = selectedPath[levelIndex] ?? '';
    const parentCategory = categories.find((category) => category.id === currentParentId);
    const title = levelIndex === 0 ? rootLevelTitle : parentCategory ? getLabel(parentCategory) : rootLevelTitle;

    levels.push({
      levelIndex,
      parentId: currentParentId,
      options,
      selectedId,
      title
    });

    if (!selectedId) break;

    const nestedOptions = getDirectChildCategories(categories, selectedId);
    if (nestedOptions.length === 0) break;

    currentParentId = selectedId;
  }

  return levels;
};

export const isSubcategoryPathComplete = <T extends CategoryRef>(
  categories: T[],
  rootId: string,
  selectedPath: string[]
) => {
  if (!rootId) return false;

  const levels = buildSubcategoryFilterLevels(categories, rootId, selectedPath, () => '', '');
  if (levels.some((level) => level.options.length > 0 && !level.selectedId)) return false;

  const effectiveId = getEffectiveCategoryId(rootId, selectedPath);
  return getDirectChildCategories(categories, effectiveId).length === 0;
};

export const PASSENGER_CARS_SLUG = 'passenger-cars';
export const MODEL_YEAR_MIN = 1998;
export const MODEL_YEAR_MAX = 2026;

export const isCategoryUnderSlug = <T extends { id: string; parentId?: string | null; slug: string }>(
  categories: T[],
  categoryId: string,
  ancestorSlug: string
) => {
  let current = categories.find((category) => category.id === categoryId);

  while (current) {
    if (current.slug === ancestorSlug) return true;
    current = current.parentId ? categories.find((category) => category.id === current!.parentId) : undefined;
  }

  return false;
};

export const selectFilterOption = (currentOptionIds: string[], filterOptionIds: string[], optionId: string) => {
  const withoutSameFilter = currentOptionIds.filter((id) => !filterOptionIds.includes(id));
  return [...withoutSameFilter, optionId];
};
