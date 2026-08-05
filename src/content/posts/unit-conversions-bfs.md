---
title: Unit Conversions Using BFS
description: Modeling weight, volume, and custom unit conversions as a graph and searching it with breadth-first search.
pubDate: 2026-08-05
---

## Overview

For my most recent project, ChefKit, inventory management software for professional kitchens, I ran into a problem when depleting ingredients at recipe-production time. An ingredient's stored base unit may be different from the unit a recipe deducts it in. For example, we might have a kilogram of paprika on hand, but a recipe calls for 1 tablespoon. That's a weight-to-volume conversion the user needs to explicitly define once, for future use.

Once they define a single weight-volume bridge, every other weight and volume unit can be inferred from that one translation. But we also have to account for units that are neither weight nor volume: carton, bag, and so on. It gets messy fast: imagine a case where a weight unit converts to a custom unit, which *also* converts to a volume unit (1 lb = 1 bag, 1 bag = 4 cups). Now we need to hop from weight, through the custom unit, into volume, just to figure out how many cups are in a pound.

With only those two conversions defined, we can already answer that one by hand: look up `bag`'s factor for `lbs` (1), then `bag`'s factor for `cup` (4), and chain them: `1 × 4 = 4`. So 1 lb = 4 cups.

That's as simple as it gets. But what about something less direct, like tablespoons to grams, using only those same two custom conversions? It should still be possible, since a bridge from weight to volume exists via `bag`; we just need a way to *search* for it instead of working it out by hand each time. That's where a graph, and a breadth-first search over it, comes in.

## Building the standard graph

First, we predefine the conversions we already know. For weight, we know how many grams are in a kg, lb, oz, and so on. Same for volume, in milliliters. I chose to express every weight factor relative to grams (`g = 1`, `kg = 1000`, `lbs = 453.592`, …) and every volume factor relative to milliliters (`ml = 1`, `l = 1000`, `cup = 236.588`, …), since that's the most intuitive base to reason from.

```ts
const VOLUME_FACTORS: Record<string, number> = {
  ml: 1, l: 1000, tsp: 4.92892, tbsp: 14.7868,
  cup: 236.588, pt: 473.176, qt: 946.353, gal: 3785.41,
};

const WEIGHT_FACTORS: Record<string, number> = {
  g: 1, kg: 1000, oz: 28.3495, lbs: 453.592,
};
```

The graph itself is a map of units, where each unit maps to another map of its known conversions and their factors:

```ts
type Graph = Map<string, Map<string, number>>;
```

We populate it with `addEdge`:

```ts
function addEdge(graph: Graph, from: string, to: string, factor: number) {
  if (from === to || !Number.isFinite(factor) || factor === 0) return;
  let fromEdges = graph.get(from);
  if (!fromEdges) { fromEdges = new Map(); graph.set(from, fromEdges); }
  let toEdges = graph.get(to);
  if (!toEdges) { toEdges = new Map(); graph.set(to, toEdges); }
  // Don't overwrite an existing edge (preserve first-seen factor for determinism)
  if (!fromEdges.has(to)) fromEdges.set(to, factor);
  if (!toEdges.has(from)) toEdges.set(from, 1 / factor);
}
```

`buildStandardGraph` loops over both constants and adds each as an edge, always pointing *to* `g` or `ml`:

```ts
function buildStandardGraph(): Graph {
  const graph: Graph = new Map();
  for (const [unit, factor] of Object.entries(WEIGHT_FACTORS)) {
    addEdge(graph, unit, "g", factor);
  }
  for (const [unit, factor] of Object.entries(VOLUME_FACTORS)) {
    addEdge(graph, unit, "ml", factor);
  }
  return graph;
}
```

Since `addEdge` writes to both `from` and `to`, each call does two things at once: it stores the forward factor under the *from* unit (e.g. `kg → g: 1000`), and it stores the reciprocal under the *to* unit (`g → kg: 0.001`), so we can just as easily ask "how many kg are in a gram" as the reverse. The one exception is `g` itself (and `ml`): since `from === to` when the loop reaches `g: 1` or `ml: 1`, `addEdge` bails out immediately, so neither gets a pointless self-edge.

The net effect: `g` and `ml` end up as **hubs**, each holding one entry per unit in their dimension, while every other unit is a **spoke** with a single edge pointing back to its hub. Here's what the fully built standard graph actually looks like:

```
kg   -> { g: 1000 }
g    -> { kg: 0.001, oz: 0.035274, lbs: 0.002205 }
oz   -> { g: 28.3495 }
lbs  -> { g: 453.592 }
l    -> { ml: 1000 }
ml   -> { l: 0.001, tsp: 0.202884, tbsp: 0.067628, cup: 0.004227, pt: 0.002113, qt: 0.001057, gal: 0.000264 }
tsp  -> { ml: 4.92892 }
tbsp -> { ml: 14.7868 }
cup  -> { ml: 236.588 }
pt   -> { ml: 473.176 }
qt   -> { ml: 946.353 }
gal  -> { ml: 3785.41 }
```

Notice there's no path anywhere from a weight unit to a volume unit; they're two entirely separate components. That's exactly the gap a custom conversion needs to bridge.

## Layering in custom conversions

`buildGraph` starts from the standard graph and adds any user-defined conversions on top, using the same `addEdge`:

```ts
function buildGraph(customConversions: GenericConversion[]): Graph {
  const graph = buildStandardGraph();
  for (const c of customConversions) {
    const factor = typeof c.factor === "string" ? parseFloat(c.factor) : c.factor;
    addEdge(graph, c.from_unit, c.to_unit, factor);
  }
  return graph;
}
```

So if a user defines `1 bag = 1 kg`, we get a new entry for `bag` under `kg`'s map (factor 1), and a brand-new `bag` node with a single entry pointing back to `kg` (also factor 1), courtesy of the same forward/reverse write `addEdge` always does.

## Searching the graph: BFS

With the full graph built, we search it with a breadth-first search:

```ts
function findPath(
  graph: Graph,
  fromUnit: string,
  toUnit: string,
): number | null {
  if (fromUnit === toUnit) return 1;
  if (!graph.has(fromUnit) || !graph.has(toUnit)) return null;

  const queue: Array<{ unit: string; factor: number }> = [
    { unit: fromUnit, factor: 1 },
  ];
  const visited = new Set<string>([fromUnit]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    const { unit, factor } = current;
    const neighbors = graph.get(unit);
    if (!neighbors) continue;

    for (const [next, edgeFactor] of neighbors) {
      if (visited.has(next)) continue;
      const nextFactor = factor * edgeFactor;
      if (next === toUnit) return nextFactor;
      visited.add(next);
      queue.push({ unit: next, factor: nextFactor });
    }
  }

  return null;
}
```

We seed the queue with `fromUnit` at a factor of `1`; it can't be anything else, since it's the starting point of the multiplicative chain we're about to build. Each time we dequeue a unit, we look at its neighbors. For each unvisited neighbor, we compute `nextFactor` (the running factor times this edge's factor) and check: is this neighbor the unit we're looking for? If so, we return `nextFactor` immediately. Otherwise we mark it visited and push it onto the queue, to be expanded in its own turn later.

Because it's a queue (FIFO, via `shift()`) rather than a stack, the search expands in rings: every unit one hop away gets processed before any unit two hops away is even looked at. That's what makes it *breadth*-first, and it's why the first path `findPath` finds is guaranteed to be the shortest one, in hop count. Fewer hops means fewer chained floating-point multiplications, which matters once conversions start stacking up.

### Walking through an example

Say we have two custom conversions: `1 lb = 1 bag`, and `1 bag = 4 cups`. We want tablespoons per pound.

- **Dequeue `lbs`** (factor 1). Its neighbors are `g` (standard) and `bag` (custom). Neither is `tbsp`, so both get pushed: `g` with factor `1 × 1000 = 1000`, `bag` with factor `1 × 1 = 1`.
- **Dequeue `g`** (factor 1000). Its neighbors are `kg`, `oz`, and `lbs`, but `lbs` is already in `visited` (it was our starting unit), so it's skipped. `kg` and `oz` get pushed with their scaled factors; neither is `tbsp`.
- **Dequeue `bag`** (factor 1). Its only neighbor is `cup`, at `1 × 4 = 4`. Not `tbsp`, so `cup` gets pushed with factor 4.
- **Dequeue `kg`, then `oz`**: both dead ends (their only neighbor, `g`, is already visited).
- **Dequeue `cup`** (factor 4). Its neighbor is `ml`, giving `4 × 236.588 = 946.35`. Not `tbsp` yet, push `ml`.
- **Dequeue `ml`** (factor 946.35). Among its neighbors is `tbsp`, with edge factor `0.067628`. Match, return `946.35 × 0.067628 ≈ 64`.

So `findPath` reports **≈64 tablespoons per pound** (matching a hand-check: 1 lb → 4 cups → (×236.588 ml/cup) 946.35 ml → (÷14.7868 ml/tbsp) ≈ 64 tbsp).

The key thing to notice: the "is this our target?" check happens on *every* edge as it's discovered, not just when a node is dequeued. `tbsp` doesn't show up as anyone's neighbor until `ml` is finally dequeued, and `ml` only enters the queue because `cup` was dequeued before it, which only happened because `bag` was dequeued before that. The queue is what carries the accumulated factor forward, one hop at a time, until something finally matches.

## Wrapping up

This turned out to be one of the more interesting problems I got to work on in ChefKit. Modeling conversions as a graph, rather than hardcoding weight↔volume logic, meant a single user-defined bridge conversion is enough to unlock every combination of units on both sides of it, no matter how many hops apart they are. Hope this write-up is useful if you run into a similar problem.
