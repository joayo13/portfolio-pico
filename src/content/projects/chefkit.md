---
title: ChefKit
description: Inventory and recipe management for professional kitchens.
pubDate: 2026-07-29
repoURL: https://github.com/joayo13/chefkit
---

![ChefKit recipe detail](/chefkit/chefkit-recipe-detail.png)

ChefKit is inventory and recipe management for professional kitchens — batch-based stock tracking, FIFO depletion, and recipe production, built as a headless alternative to POS-centric kitchen software. It's built with Next.js 16, React 19 (React Compiler), TypeScript, Supabase (Postgres), Tailwind CSS 4, and TanStack Query v5.

ChefKit tracks ingredients as batches (each with its own quantity and optional expiry date) rather than a single running total, so stock reflects how kitchens actually receive and use inventory. Recipes are built from those ingredients — and from other recipes as sub-recipes — and "producing" a recipe batch deducts the right ingredient batches automatically, oldest first. Kitchens support multiple team members under a single admin, with subscription-gated limits managed through Stripe.

![ChefKit ingredients](/chefkit/chefkit-ingredients.png)

Depletion uses FIFO batch ordering with optimistic concurrency control: a plan is built client-side (oldest batches first) and committed with an expected-quantity guard per batch, so a concurrent write that already changed a batch raises a `stale_batch` exception instead of silently getting overwritten, and the write is retried against a fresh plan. Recipe production runs through a single Postgres RPC, so a recipe batch and its ingredient depletions either both write or neither does. Unit conversions (including crossing between weight and volume) are resolved with a BFS over a unit conversion graph, combining fixed standard factors with per-kitchen custom conversions.

![ChefKit prep list](/chefkit/chefkit-prep-list.png)

Every domain table is scoped to its owning kitchen with Postgres Row-Level Security rather than relying on application-layer checks alone. The test suite spans three tiers — unit tests against a mocked Supabase client, browser tests against real Chromium via Playwright, and integration tests against a real local Postgres instance — all enforced in CI on every push.
