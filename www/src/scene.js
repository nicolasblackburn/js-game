
export function* iterateNodes(ctx, node, parent) {
  yield [node, parent];
  for (const child of node.children ?? []) {
    yield* iterateNodes(ctx, child, node);
  }
}

