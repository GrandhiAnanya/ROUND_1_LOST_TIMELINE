# The Lost Timeline — Round 1 Admin & Results

## What is included
- `admin.html`: single-file responsive admin dashboard (HTML, CSS, JavaScript together).
- `backend/functions/index.js`: existing Firebase callable backend, updated so the admin results endpoint includes assigned-question correct answers.
- `Pictures/`: Round 1 question images already supplied in the original repository.
- `sample_round1.csv`: example of the required CSV schema.

## Current backend
This project uses Firebase Cloud Functions (region `asia-south1`) and Cloud Firestore. Firestore is the shared source of truth, so submissions are not limited to one browser or device.

## Setup
1. Open the Firebase Console for project `chrono-explorers-round1`.
2. In Project settings → General → Your apps, create/select a **Web App** and copy its Firebase web configuration.
3. Open `admin.html` and replace `REPLACE_WITH_FIREBASE_WEB_API_KEY` and `REPLACE_WITH_FIREBASE_WEB_APP_ID` with the values from that web configuration. Keep `projectId` as the correct project ID. These web config values are not service-account secrets; never paste a service-account JSON or private key into the HTML.
4. From a terminal, open the `backend` directory. Install the Firebase CLI if needed, sign in with an account that has access to the Firebase project, and check the selected project:
   ```sh
   firebase login
   firebase use chrono-explorers-round1
   ```
5. Install function dependencies and deploy the updated function:
   ```sh
   cd functions
   npm ci
   cd ..
   firebase deploy --only functions
   ```
   The function runtime is Node.js 24 per `backend/functions/package.json`. Ensure the Firebase project supports this runtime and billing is enabled if required.
6. Serve `admin.html` over HTTP (recommended, rather than opening it as a `file://` URL). For a quick local preview from the repository root:
   ```sh
   python -m http.server 8000
   ```
   Then open `http://localhost:8000/admin.html`.
7. Sign in with Team ID `admin` and Team Name `admin`. Refresh to fetch current data. Export CSV downloads all teams currently returned by the backend, not only the filtered rows.

## Important security limitation
The requested `admin` / `admin` gate is **not secure authentication**. The current Cloud Function checks those two literal strings, so a technically capable person can call the endpoint directly. Before using this with real participant data, replace this gate with Firebase Authentication and a server-verified admin custom claim or another trusted server-side authorization mechanism. Do not treat a client-side check as security. Firestore should not be directly readable/writable by unauthenticated clients; the Admin SDK in Cloud Functions bypasses Firestore client rules.

## CSV schema
Exactly one row per team:
- `team_id`
- `team_name`
- `round_id`
- `responses` — JSON array in a CSV-escaped cell, with question ID, submitted answer, correctness, points, and each answer's submission timestamp.
- `completion_time` — elapsed seconds from team registration to the latest answer when every assigned question has been answered; blank when incomplete or timestamps are unavailable.
- `submitted_at` — ISO timestamp for the latest recorded answer; blank if the team has no submissions.

The sample CSV is illustrative. Your backend currently records individual answer submissions rather than a separate final-submit event. Therefore `submitted_at` means latest answer submission, and completion is inferred when all assigned questions have a submission. If the event requires a distinct final submission time, add a dedicated server-side final-submit function and field.

## Current behavior and known gaps
- The current backend assigns 3 random questions from the 15 configured questions to each team.
- Existing team IDs must be unique and a team ID cannot be reused with a different team name.
- Re-submitting the same question is rejected by the backend.
- Team registration stores a registration time; login and logout fields are updated by backend calls.
- A team with no submissions has no answer submission timestamp.
- The participant-facing HTML is not present in the uploaded ZIP. This package supplies the admin dashboard; connect the participant page to `registerTeam`, `submitAnswer`, and `logoutTeam` using the same Firebase project and the same stable Team ID format across rounds.
- Do not implement a cumulative leaderboard here. This dashboard displays round-level points already recorded by the backend only.

## Test checklist
- [ ] Firebase web configuration populated in `admin.html`.
- [ ] Cloud Functions deployed successfully in `asia-south1`.
- [ ] Admin dashboard opens on desktop and mobile viewport widths.
- [ ] `admin` / `admin` reaches dashboard; other credentials are rejected by the page.
- [ ] Registered teams and assigned questions load from Firestore through `getAdminResults`.
- [ ] Correct answers are visible for assigned questions.
- [ ] Search, submission filters, sorting, and refresh work.
- [ ] CSV opens in spreadsheet software and has exactly the six required columns in the same order.
- [ ] Export includes all teams, regardless of active UI filters.
- [ ] A team that submits all assigned questions is marked complete; incomplete teams have blank completion time.
- [ ] Test one successful and one failed answer submission using test teams.
- [ ] Verify no participant-facing code exposes the answer key.
- [ ] Before a live event, replace the literal admin gate with server-verified authentication.

## GitHub workflow
From the repository root:
```sh
git status
git add admin.html sample_round1.csv backend/functions/index.js README_ADMIN.md
git commit -m "Add round 1 admin results dashboard and CSV export"
git push origin main
```
If your default branch is not `main`, replace it with the actual branch. Review `git status` before committing and never commit service-account keys, private credentials, or `.env` secrets.
