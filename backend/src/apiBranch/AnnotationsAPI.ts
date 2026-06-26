import { Request, Response } from "express";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import defaultSupabase from "../config/db";
import type { Database } from "../config/database.types";

/**
 * Universal annotation save pipeline.
 *
 * Accepts any feature's data slice and merges it into the JSONB `elements`
 * column for the given page URL, then mirrors each item out to `public.notes`
 * so the dashboard's History / Graph / Analytics pages see sticky notes,
 * drawings, highlights, anchor notes, handwriting, stamps, and paper notes
 * the same way they see clips and AI summaries.
 *
 * Expected request body:
 *   pageUrl      — normalized URL of the page
 *   featureKey   — which feature is saving (stickyNotes | drawPaths | handwriting |
 *                  highlights | anchorNotes | paperNotes | stamps | manualRewrites |
 *                  aiReplacements | rewrites | summaries)
 *   data         — full state array/object for that feature
 *   workspaceId  — optional workspace UUID (falls back to null = "default")
 *   pageTitle    — optional document.title
 *   domain       — optional hostname (server falls back to URL().hostname)
 *   clearedAt    — optional timestamp meaning "this was a clear-all, delete mirrored rows"
 *
 * Expected header:
 *   Authorization: Bearer <supabase access token> — required for RLS-backed writes.
 */

type JsonObj = Record<string, unknown>;
type ElementsRow = { elements: JsonObj | null } | null;
type SupabaseError = { message: string } | null;

const SUPABASE_URL = process.env.SECRET_DATABASE_CONNECTION || "";
const SUPABASE_KEY = process.env.SECRET_DATABASE_KEY || "";
const NEXT_APP_URL =
  process.env.NEXT_APP_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://useinline.vercel.app"
    : "http://localhost:3000");

const MIRROR_DEBOUNCE_MS = 30_000;
const lastRecapCall = new Map<string, number>();

function looksLikeJwt(token: string): boolean {
  // A valid Supabase access token is always a three-segment JWT.
  // Reject anything that is empty, placeholder text, or missing dots, which
  // otherwise causes Supabase to throw "Expected 3 parts in JWT; got 1".
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  return parts.every((p) => p.length > 0);
}

function clientFromRequest(req: Request): SupabaseClient<Database> {
  const header = req.header("authorization") || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!looksLikeJwt(bearer) || !SUPABASE_URL || !SUPABASE_KEY)
    return defaultSupabase;
  return createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    global: { headers: { Authorization: `Bearer ${bearer}` } },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

function itemId(item: unknown): string | null {
  if (!item || typeof item !== "object") return null;
  const anyItem = item as Record<string, unknown>;
  if (typeof anyItem.id === "string" && anyItem.id) return anyItem.id;
  return null;
}

function safeDomain(pageUrl: string, fallback: string | undefined): string {
  if (fallback && fallback.trim()) return fallback.trim();
  try {
    return new URL(pageUrl).hostname;
  } catch {
    return "";
  }
}

/**
 * Map extension featureKey → notes.type. The live DB constrains notes.type to
 * exactly 'text' | 'canvas' | 'ai-summary'; anything else is rejected by the
 * CHECK constraint and the mirror row never lands (which is why History /
 * Analytics / Graph were empty). The original feature kind is preserved in
 * the tags column so the dashboard can still filter / group by it.
 */
function noteTypeForFeature(featureKey: string): string | null {
  switch (featureKey) {
    case "stickyNotes":
      return "text";
    case "anchorNotes":
      return "text";
    case "paperNotes":
      return "text";
    case "highlights":
      return "text";
    case "manualRewrites":
      return "text";
    case "drawPaths":
      return "canvas";
    case "handwriting":
      return "canvas";
    case "stamps":
      return "canvas";
    default:
      return null; // rewrites/summaries stay blob-only
  }
}

function tagsForFeature(featureKey: string): string[] {
  switch (featureKey) {
    case "stickyNotes":
      return ["sticky"];
    case "anchorNotes":
      return ["anchor"];
    case "paperNotes":
      return ["paper-note"];
    case "highlights":
      return ["highlight"];
    case "manualRewrites":
      return ["manual", "rewrite"];
    case "drawPaths":
      return ["drawing"];
    case "handwriting":
      return ["handwriting"];
    case "stamps":
      return ["stamp"];
    default:
      return [featureKey];
  }
}

/**
 * Turn one element out of the per-featureKey array into the fields that `notes`
 * needs. Returns null for items the mirror should skip (no stable id, etc).
 */
function shapeItemForNotes(
  featureKey: string,
  item: unknown,
): {
  externalId: string;
  content: string;
  color: string;
  posX: number;
  posY: number;
  width: number;
  height: number;
} | null {
  if (!item || typeof item !== "object") return null;
  const r = item as Record<string, unknown>;
  const id = itemId(r);
  if (!id) return null;

  const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);
  const num = (v: unknown, d = 0) =>
    typeof v === "number" && Number.isFinite(v) ? v : d;

  switch (featureKey) {
    case "stickyNotes":
    case "paperNotes": {
      return {
        externalId: id,
        content: str(r.content, ""),
        color: str(r.color, "#FFEB3B"),
        posX: num(r.x, 200),
        posY: num(r.y, 200),
        width: num(r.width, 240),
        height: num(r.height, 160),
      };
    }
    case "anchorNotes": {
      return {
        externalId: id,
        content: str(r.text, "") || str(r.content, ""),
        color: str(r.color, "#FDFBF7"),
        posX: num(r.x, 40),
        posY: num(r.y, 140),
        width: 240,
        height: 150,
      };
    }
    case "highlights": {
      const text =
        str(r.text, "") || str(r.selectedText, "") || str(r.content, "");
      return {
        externalId: id,
        content: text,
        color: str(r.color, "#FFEB3B"),
        posX: 0,
        posY: 0,
        width: 0,
        height: 0,
      };
    }
    case "manualRewrites": {
      const from = str(r.originalText, "");
      const to = str(r.text, "") || str(r.aiText, "");
      const snippet = (s: string) => (s.length > 120 ? `${s.slice(0, 117)}…` : s);
      return {
        externalId: id,
        content: to
          ? `Manual edit: "${snippet(from)}" → "${snippet(to)}"`
          : `Manual edit: "${snippet(from)}"`,
        color: "#93C5FD",
        posX: 0,
        posY: 0,
        width: 0,
        height: 0,
      };
    }
    case "drawPaths": {
      // Prefer a readable description ("Pen stroke (42 points)", "Arrow",
      // etc) so Dashboard/History/Graph show something meaningful instead of
      // the raw JSON blob. The original data is already saved in the
      // per-page annotations.elements blob.
      const shapeLabels: Record<string, string> = {
        path: "Pen stroke",
        line: "Line",
        rect: "Rectangle",
        arrow: "Arrow",
        ellipse: "Ellipse",
      };
      const kindKey = typeof r.type === "string" ? r.type : "";
      const shapeName = shapeLabels[kindKey] ?? "Sketch";
      const points = Array.isArray(r.points) ? r.points.length : 0;
      const descriptor = points > 0 ? ` · ${points} points` : "";
      return {
        externalId: id,
        content: `Drawing — ${shapeName}${descriptor}`,
        color: str(r.stroke, "#1C1E26"),
        posX: 0,
        posY: 0,
        width: 0,
        height: 0,
      };
    }
    case "handwriting": {
      const pts = Array.isArray(r.points) ? r.points.length : 0;
      return {
        externalId: id,
        content: pts > 0 ? `Handwriting — ${pts} points` : "Handwriting",
        color: str(r.color, "#1C1E26"),
        posX: 0,
        posY: 0,
        width: 0,
        height: 0,
      };
    }
    case "stamps": {
      return {
        externalId: id,
        content:
          str(r.label, "") || str(r.emoji, "") || str(r.content, "Stamp"),
        color: str(r.color, "#fffbe0"),
        posX: num(r.x, 0),
        posY: num(r.y, 0),
        width: num(r.width, 48),
        height: num(r.height, 48),
      };
    }
    default:
      return null;
  }
}

async function mirrorToNotes(
  supabase: SupabaseClient<Database>,
  params: {
    pageUrl: string;
    featureKey: string;
    previous: unknown[];
    incoming: unknown[];
    workspaceId: string | null;
    pageTitle: string;
    domain: string;
    userIdFallback: string | null;
    clearedAt?: unknown;
    authHeader?: string;
  },
): Promise<void> {
  const {
    pageUrl,
    featureKey,
    previous,
    incoming,
    workspaceId,
    pageTitle,
    domain,
    userIdFallback,
    clearedAt,
    authHeader,
  } = params;
  const type = noteTypeForFeature(featureKey);
  if (!type) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;

  // Resolve user_id. Prefer the authenticated user; fall back to value provided
  // by the extension so writes still happen when the token wasn't forwarded.
  let userId: string | null = userIdFallback ?? null;
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user?.id) userId = authData.user.id;
  } catch {
    /* ignore */
  }
  if (!userId) return; // no user → cannot satisfy RLS → skip mirror

  const prevIds = new Set<string>(
    previous.map((i) => itemId(i)).filter((x): x is string => !!x),
  );
  const nextIds = new Set<string>(
    incoming.map((i) => itemId(i)).filter((x): x is string => !!x),
  );

  const baseTags = tagsForFeature(featureKey);
  const rowsToInsert: Record<string, unknown>[] = [];
  for (const item of incoming) {
    const shape = shapeItemForNotes(featureKey, item);
    if (!shape) continue;
    rowsToInsert.push({
      user_id: userId,
      workspace_id: workspaceId,
      page_url: pageUrl,
      domain,
      page_title: pageTitle,
      content: shape.content.slice(0, 20_000),
      type,
      color: shape.color,
      pos_x: shape.posX,
      pos_y: shape.posY,
      width: shape.width || 240,
      height: shape.height || 160,
      tags: baseTags,
      anchor_id: shape.externalId,
      updated_at: new Date().toISOString(),
    });
  }

  // notes has no unique constraint on (user_id, anchor_id) in the live DB, so
  // instead of upsert-on-conflict we manually delete the previous anchor_id
  // set for this feature and re-insert. This keeps the mirror idempotent
  // without requiring a schema migration.
  const incomingAnchorIds = rowsToInsert
    .map((r) => r.anchor_id)
    .filter((x): x is string => !!x);

  if (incomingAnchorIds.length > 0) {
    const del = await sb
      .from("notes")
      .delete()
      .eq("user_id", userId)
      .eq("page_url", pageUrl)
      .contains("tags", baseTags)
      .in("anchor_id", incomingAnchorIds);
    if (del.error)
      console.warn("[Inline mirror] pre-clean failed:", del.error.message);

    const up = await sb.from("notes").insert(rowsToInsert);
    if (up.error)
      console.error("[Inline mirror] insert notes failed:", up.error.message);
  }

  const idsToDelete = [...prevIds].filter((id) => !nextIds.has(id));
  const clearedAll = !!clearedAt;

  if (clearedAll) {
    const result: { error: SupabaseError } = await sb
      .from("notes")
      .delete()
      .eq("user_id", userId)
      .eq("page_url", pageUrl)
      .contains("tags", baseTags);
    if (result.error)
      console.error("[Inline mirror] clear-all failed:", result.error.message);
  } else if (idsToDelete.length > 0) {
    const result: { error: SupabaseError } = await sb
      .from("notes")
      .delete()
      .eq("user_id", userId)
      .eq("page_url", pageUrl)
      .contains("tags", baseTags)
      .in("anchor_id", idsToDelete);
    if (result.error)
      console.error(
        "[Inline mirror] delete-some failed:",
        result.error.message,
      );
  }

  // Best-effort: mark the page recap stale + trigger regeneration. Both calls
  // silently no-op if public.documents / the recap route don't exist yet.
  try {
    await sb
      .from("documents")
      .update({ recap_stale: true, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("workspace_id", workspaceId ?? "")
      .eq("page_url", pageUrl);
  } catch {
    /* documents table may not exist yet — ignore */
  }

  const key = `${userId}|${workspaceId ?? ""}|${pageUrl}`;
  const last = lastRecapCall.get(key) ?? 0;
  if (Date.now() - last > MIRROR_DEBOUNCE_MS) {
    lastRecapCall.set(key, Date.now());
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authHeader) headers.Authorization = authHeader;
    void fetch(`${NEXT_APP_URL}/api/ai/page-recap`, {
      method: "POST",
      headers,
      body: JSON.stringify({ workspaceId: workspaceId ?? "", pageUrl }),
    }).catch(() => {
      /* recap route may be absent — ignore */
    });
    // Embed the mirrored notes for semantic retrieval (RAG). Fire-and-forget,
    // same debounce window as the recap call.
    void fetch(`${NEXT_APP_URL}/api/ai/index`, {
      method: "POST",
      headers,
      body: JSON.stringify({ pageUrl, workspaceId: workspaceId ?? "" }),
    }).catch(() => {
      /* index route may be absent — ignore */
    });
  }
}

export async function saveAnnotations(
  req: Request,
  res: Response,
): Promise<void> {
  const {
    pageUrl,
    featureKey,
    data,
    workspaceId,
    pageTitle,
    domain,
    userId: userIdFromBody,
    clearedAt,
  } = req.body as {
    pageUrl?: string;
    featureKey?: string;
    data?: unknown;
    workspaceId?: string;
    pageTitle?: string;
    domain?: string;
    userId?: string;
    clearedAt?: number | string | null;
  };

  if (!pageUrl || !featureKey || data === undefined) {
    res
      .status(400)
      .json({ error: "pageUrl, featureKey, and data are required" });
    return;
  }

  const supabase = clientFromRequest(req);

  // 1. Fetch existing annotations blob (for merge + mirror diff).
  const fetchResult = await (supabase
    .from("annotations")
    .select("elements")
    .eq("page_url", pageUrl)
    .maybeSingle() as unknown as Promise<{
    data: ElementsRow;
    error: SupabaseError;
  }>);

  if (fetchResult.error) {
    res.status(500).json({ error: fetchResult.error.message });
    return;
  }

  const existingElements = (fetchResult.data?.elements ?? {}) as JsonObj;
  const mergedElements = { ...existingElements, [featureKey]: data };

  let userId: string | null = userIdFromBody ?? null;
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user?.id) userId = authData.user.id;
  } catch {
    /* ignore */
  }

  // 2. Upsert merged blob.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const annotationsTable = supabase.from("annotations") as any;
  const upsertPayload: Record<string, unknown> = {
    page_url: pageUrl,
    elements: mergedElements,
    updated_at: new Date().toISOString(),
  };
  if (userId) upsertPayload.user_id = userId;

  const upsertResult = (await annotationsTable.upsert(
    upsertPayload,
    { onConflict: "page_url" },
  )) as { error: SupabaseError };

  if (upsertResult.error) {
    res.status(500).json({ error: upsertResult.error.message });
    return;
  }

  // 3. Fan out to public.notes so the dashboards see every activity. Swallow
  //    failures so the primary save still returns success even if mirror fails.
  try {
    const prev = Array.isArray(existingElements[featureKey])
      ? (existingElements[featureKey] as unknown[])
      : [];
    const next = Array.isArray(data) ? (data as unknown[]) : [];
    await mirrorToNotes(supabase, {
      pageUrl,
      featureKey,
      previous: prev,
      incoming: next,
      workspaceId: workspaceId ?? null,
      pageTitle: pageTitle ?? "",
      domain: safeDomain(pageUrl, domain),
      userIdFallback: userIdFromBody ?? null,
      clearedAt,
      authHeader: req.header("authorization") ?? undefined,
    });
  } catch (err) {
    console.error("[Inline] mirror failed:", err);
  }

  res.status(200).json({ success: true });
}

export async function getAnnotations(
  req: Request,
  res: Response,
): Promise<void> {
  const pageUrl = req.query.url as string | undefined;

  if (!pageUrl) {
    res.status(400).json({ error: "url query parameter is required" });
    return;
  }

  const supabase = clientFromRequest(req);

  const fetchResult = await (supabase
    .from("annotations")
    .select("elements")
    .eq("page_url", pageUrl)
    .maybeSingle() as unknown as Promise<{
    data: ElementsRow;
    error: SupabaseError;
  }>);

  if (fetchResult.error) {
    res.status(500).json({ error: fetchResult.error.message });
    return;
  }

  res.status(200).json({ elements: fetchResult.data?.elements ?? {} });
}
