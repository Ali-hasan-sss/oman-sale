export type CategoryTreeNode<T extends { id: string; parentId?: string | null; sortOrder?: number }> = T & {
  children: CategoryTreeNode<T>[];
};

export const buildCategoryTree = <T extends { id: string; parentId?: string | null; sortOrder?: number }>(
  items: T[]
): CategoryTreeNode<T>[] => {
  const sortByOrder = (a: T, b: T) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  const itemIds = new Set(items.map((item) => item.id));

  const buildChildren = (parentId: string): CategoryTreeNode<T>[] =>
    items
      .filter((item) => item.parentId === parentId)
      .sort(sortByOrder)
      .map((item) => ({
        ...item,
        children: buildChildren(item.id)
      }));

  return items
    .filter((item) => !item.parentId || !itemIds.has(item.parentId))
    .sort(sortByOrder)
    .map((root) => ({
      ...root,
      children: buildChildren(root.id)
    }));
};

export const flattenCategoryTreeWithPath = <
  T extends { id: string; name?: string; nameAr?: string; nameEn?: string; type?: string }
>(
  tree: CategoryTreeNode<T>[],
  getLabel: (node: T) => string,
  parentPath = ''
): Array<{ id: string; label: string; type?: string }> =>
  tree.flatMap((node) => {
    const label = getLabel(node);
    const path = parentPath ? `${parentPath} · ${label}` : label;

    return [
      { id: node.id, label: path, type: node.type },
      ...flattenCategoryTreeWithPath(node.children, getLabel, path)
    ];
  });
