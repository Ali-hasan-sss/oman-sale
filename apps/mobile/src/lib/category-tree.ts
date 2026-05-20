export type CategoryTreeNode<T extends { id: string; parentId?: string | null; sortOrder?: number }> = T & {
  children: T[];
};

export const buildCategoryTree = <T extends { id: string; parentId?: string | null; sortOrder?: number }>(
  items: T[]
): CategoryTreeNode<T>[] => {
  const sortByOrder = (a: T, b: T) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  const itemIds = new Set(items.map((item) => item.id));
  const roots = items
    .filter((item) => !item.parentId || !itemIds.has(item.parentId))
    .sort(sortByOrder);

  return roots.map((root) => ({
    ...root,
    children: items.filter((item) => item.parentId === root.id).sort(sortByOrder)
  }));
};
