# Timebox Works — Collaborative Sharing & Deep Links (Plan 3)

## Context

Follow-up to the UX pass (Home/Overview landing page, left sidebar nav, noun/lifecycle routes `/meetings/new|live|report`) and builds on the hardened RTDB rules in `database.rules.json`. It introduces **deep-linkable meeting routes** and turns meetings from per-user-private documents into **shareable, optionally collaborative boards** with three visibility modes and per-guest edit/view permissions.

This reverses a deliberate shortcut from the UX pass: those routes were kept **ID-less** (`/meetings/live`) reading the single `currentMeeting` slot. Sharing requires addressing a *specific* meeting by id for a *specific* viewer, so **deep-link, load-by-id routing is the prerequisite** and is section A here.

> ⚠️ **This plan breaks the current data model and security rules on purpose.** Today meetings live at `users/$uid/meetings/$id`, siloed and readable only by their owner (the rules we just deployed: `.read/.write = auth.uid === $uid`). Sharing means a non-owner must read/write someone else's meeting — which the per-user silo cannot express. The core of this plan is migrating meetings to a **top-level collection with an explicit membership ACL**, plus the rule rewrite that comes with it.

It also revisits the **client-only vs Cloud Functions** decision from the metrics discussion (metrics stayed client-side). Sharing has operations — email→uid resolution and index fan-out — that are awkward or unsafe purely client-side.

---

## A. Deep-link routing (prerequisite)

1. **Routes** — add `/meetings/:id` (detail/report), `/meetings/:id/live`, `/meetings/:id/report`. Extend `router/paths.ts` from string constants to **builders** (e.g. `paths.meeting(id)`, `paths.liveMeeting(id)`, `paths.report(id)`) while keeping the static ones (`home`, `newMeeting`, `meetings`).
2. **Load-by-id** — the meeting store gains `subscribeMeeting(id)` that reads a single meeting from the new top-level collection (section B) instead of depending on `currentMeetingId`. Live/report pages read `:id` via `useRouteParams` and subscribe to that board.
3. **Guarding** — a route guard checks the viewer's membership/visibility before rendering. Unauthorized → a "no access" / 404 page that **does not leak existence** for private boards.
4. **Backfill links** — Home "recent" and History rows link to `/meetings/:id/report`; the ID-less routes either redirect to the resolved current meeting or are retired.

## B. Data model — meetings become shareable documents

Move meetings out of the per-user silo into a top-level collection addressed by id, with membership and a per-user index for listing.

```
meetings/$meetingId:
  owner:       uid
  visibility:  'private' | 'restricted' | 'public'
  defaultRole: 'viewer' | 'editor'           // role granted via public/link access
  members/$uid: 'owner' | 'editor' | 'viewer'
  data: { ...existing Meeting fields: name, description, goals, sideTopics,
          expected/real times, status, createdAt, updatedAt }

userMeetings/$uid/$meetingId:                // per-user index for cheap listing
  role, name, status, updatedAt, owner       // denormalized (own + shared-with-me)

usersByEmail/$emailKey -> uid                // directory for email → uid resolution
users/$uid/profile: { email, displayName, photoURL }   // member display + autocomplete
```

- The existing **per-field `.validate` + `$other:false`** rules carry over, relocated under `meetings/$id/data`.
- `userMeetings` **replaces** the current `users/$uid/meetings` listing (Home/History read it).
- `$emailKey` = lowercased email with RTDB-illegal chars (`.`, `@`, `#`, `$`, `[`, `]`) encoded.

**Migration** — one-time move of existing `users/$uid/meetings/*` → `meetings/*` (owner = that uid, visibility = `private`) + `userMeetings/$uid/*`. Script or Cloud Function (section G).

## C. Security rules rewrite

Replace the per-user-silo ruleset. Sketch:

- `meetings/$id`
  - `.read`: `auth != null && (newData/data.owner === auth.uid || members[auth.uid] exists)` **OR** `visibility === 'public'`.
  - `.write`: owner, or `members[auth.uid] === 'editor'`, or (`visibility === 'public'` && `defaultRole === 'editor'`).
  - `owner` / `visibility` / `members` / `defaultRole`: **owner-only `.write`** (a guest must not escalate their own role or flip visibility).
  - `data/*`: keep the hardened per-field validation + `$other:false`.
- `userMeetings/$uid`: `.read/.write` = `auth.uid === $uid` (own index). Writing into a **guest's** index when sharing needs either owner-permitted cross-write (broad rules) or a Function (preferred — see G).
- `usersByEmail/$emailKey`: `.read = auth != null` at the **leaf only** (lookup by exact key, no parent listing); `.write` only by the user who owns that email.
- `users/$uid/profile`: `.read = auth != null` (member display); owner-only `.write`.
- **Public + unauthenticated**: decide whether `visibility === 'public'` permits `auth == null` reads (drop the `auth != null` guard on the public branch only if so).

## D. Share UI

1. **Share button** on the board / live / report header → Share modal (reuse `common/components` Dialog/Modal).
2. **Visibility** — radio: Private / Specific people / Public (the three requested modes).
3. **Specific people** — email input with **autocomplete** against profiles/`usersByEmail`; allow a free-typed email for not-yet-registered addresses; each added row gets a **role dropdown (Can edit / Can view)**; removing a row revokes.
4. **Public** — show the shareable deep link + a **default-role** toggle (view / edit) for link access; Copy link.
5. Reflect current members and roles, owner badge; **only the owner** sees the controls (editors/viewers see read-only share state).

## E. Collaboration semantics

1. Realtime is free via existing `onValue` subscriptions — multiple viewers/editors get live updates.
2. **Concurrency** — last-write-wins per field is acceptable (single board, low concurrency): goal toggles, side topics, decisions merge fine.
3. **Control actions** — only owner + editors can **start / finish / cancel**; viewers get a read-only board (reuse existing `disabled` states in `MeetingDashboard`).
4. `currentMeetingId` (per-user single slot) no longer governs shared boards — the deep-link id does. Keep it only as a "resume" convenience pointer, or retire.
5. *Optional:* lightweight **presence** ("3 people viewing") via `meetings/$id/presence/$uid` heartbeats with `onDisconnect` cleanup. Nice-to-have.

## F. Email autocomplete & privacy

- Typeahead that reveals registered users enables **enumeration**. Mitigations: match only on near-complete input; don't confirm existence until an explicit add; or resolve via a **callable Function** returning only `{ found, uid }` for an exact email. Recommend the Function path so the directory is never exposed.
- Keep `usersByEmail` readable by **exact key only** (no parent list) regardless of the above.

## G. Cloud Functions vs client (the key architectural call)

Two operations are awkward/unsafe purely client-side:
- **email → uid resolution** without exposing the directory.
- **index fan-out** — on a share change, write/remove `userMeetings/$guestUid/$id`. From the owner's client this needs rules letting an owner write into *another* user's index (broad, risky). A Function with admin rights keeps the rules tight.

**Decision:** introduce **Cloud Functions (Blaze plan)** for `shareMeeting` / `resolveEmail` / the migration; keep everything else (board edits, listing, metrics) client-side. Note the project is **hosting-only today** — this adds Functions infra, cold starts, and cost. The alternative (client-only with looser index rules) trades infra for a weaker security posture; call it out before committing.

## H. Profile capture

Populate `users/$uid/profile` + `usersByEmail` on sign-in (we already have email/displayName/photoURL from Google auth in `authStore`). Required before sharing-by-email or autocomplete works.

## Verification

- Deep links resolve for owner / editor / viewer; a private board is 404 for non-members; a public link works (and, per the auth decision, for signed-out users).
- Share modal: add by autocomplete **and** manual email; role changes apply live; revoke removes access immediately — enforced by **rules**, not just UI.
- Two accounts editing one board see live updates; a viewer cannot mutate (UI disabled **and** rules reject the write).
- **Rules tests (emulator)** across the visibility × role × action matrix; confirm a viewer/non-member cannot write and cannot escalate role/visibility.
- Migration moves existing meetings with no loss; Home/History read from `userMeetings`.

## Open Items

- **Public = unauthenticated?** World-readable vs login-required public boards.
- **Functions vs client-only** for share / email-resolution / migration (recommend Functions).
- **Email enumeration** tradeoff in autocomplete.
- **Link revocation** — if "anyone with link" must be revocable, use a rotatable link token rather than the raw meeting id.
- **Conflict policy** beyond last-write-wins (likely unnecessary for v1).
- **Presence** (optional).
- **Interaction with Plan 2 (PWA/offline)** — offline writes to shared boards + reconnect reconciliation; last-write-wins across clients.
