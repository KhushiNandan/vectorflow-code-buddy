# Student authentication setup

The student client uses the authentication routes verified in the current `feature/backend` implementation:

- `POST /api/auth/google` with `{ "idToken": "<Google Identity Services ID token>" }`.
- `POST /api/auth/register` with `{ "usn": "...", "year": "1st Year" }` (or `2nd Year`, `3rd Year`, `4th Year`). This request is Bearer-token protected.
- `GET /api/auth/me`, Bearer-token protected.

Google ID tokens are verified by the backend. The browser does not decode or accept token claims as proof of identity. The backend checks the configured Google audience, verified email, and `@vvce.ac.in` domain. The Google response returns the backend JWT and the student registration state. The browser then loads the canonical student profile from `/api/auth/me`.

## Local environment configuration

Set these public frontend build variables in a local `.env` file (do not commit that file):

```dotenv
VITE_API_BASE_URL=
VITE_GOOGLE_CLIENT_ID=
```

Obtain the actual reachable backend origin from Likith for `VITE_API_BASE_URL`. Obtain the Google OAuth **Web client ID** used by the project from Likith for `VITE_GOOGLE_CLIENT_ID`; it must match the backend's `GOOGLE_CLIENT_ID`. No values are included here because they are environment-specific and have not been supplied. The backend signing secret (for example `JWT_SECRET`) must remain server-side and must never use a `VITE_` prefix.

The returned JWT is held by the API client's in-memory token provider and stored in `sessionStorage` so a page refresh within the same browser tab can restore the session. A non-secret real-session marker is also kept so an expired real session is reported as expired instead of silently loading as signed out. Sign-out clears this session. Demo mode was removed entirely on 2026-11-23 (refactor stage 2); there is no demo sign-in flow.

## Current integration boundary

Authentication, registration, competition configuration, level information, persistent question allocation, active round/timer display, read-only round history and evaluation summaries, wallet transaction history, the two competition record aggregates, and the authenticated student's own rank summary use the verified student APIs on `feature/backend`. Demo mode was removed entirely on 2026-11-23 (refactor stage 2); all student data comes from these backend APIs. The student UI does not call volunteer-only timer, evaluation, settlement, or progression routes, and it does not display a participant ranking list.

The backend atomically checks the student's wallet against the configured entry risk and debits the entry stake on allocation (wallet enforcement implemented 2026-11-22). The UI also disables its allocation action when the current backend-reported balance is below the configured entry risk; the server-side guard is the authoritative boundary. Student-safe round/question responses also currently omit question input and output format fields; those sections appear only when the API includes them. Check `docs/student-frontend-api-requirements.md` for the full verified route inventory and field shapes.
