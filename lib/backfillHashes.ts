/**
 * Backfill script to compute and store content_hash for existing ideas
 * that don't have one yet.
 *
 * Run via: npx ts-node --compiler-options '{"module":"commonjs"}' lib/backfillHashes.ts
 * Or import and call from an API route.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { supabase } from "./supabase";
import { normalizeForHash, computeHash } from "./claude";

async function backfillHashes() {
  console.log("Fetching ideas without content_hash...");

  const { data: ideas, error } = await supabase
    .from("ideas")
    .select("id, title")
    .is("content_hash", null);

  if (error) {
    console.error("Failed to fetch ideas:", error.message);
    process.exit(1);
  }

  if (!ideas || ideas.length === 0) {
    console.log("No ideas need backfilling. All have content_hash set.");
    return;
  }

  console.log(`Found ${ideas.length} ideas to backfill.`);

  let updated = 0;
  let failed = 0;

  for (const idea of ideas) {
    try {
      const normalized = normalizeForHash(idea.title);
      const hash = await computeHash(normalized);

      const { error: updateError } = await supabase
        .from("ideas")
        .update({ content_hash: hash })
        .eq("id", idea.id);

      if (updateError) {
        console.error(`Failed to update idea ${idea.id}: ${updateError.message}`);
        failed++;
      } else {
        updated++;
        if (updated % 10 === 0) {
          console.log(`Progress: ${updated}/${ideas.length} ideas backfilled...`);
        }
      }
    } catch (err: any) {
      console.error(`Error processing idea ${idea.id}:`, err?.message);
      failed++;
    }
  }

  console.log(`\nBackfill complete. ${updated} updated, ${failed} failed.`);
}

// Run if called directly
backfillHashes().catch(console.error);