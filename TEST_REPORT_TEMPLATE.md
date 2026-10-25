# Round 1 Admin Dashboard — Test Report

Date tested: ____________________
Tester: ____________________
Firebase project: `chrono-explorers-round1`

| Test | Expected result | Result / notes |
|---|---|---|
| Admin ID and name both `admin` | Dashboard loads after backend responds | Not yet run in user's Firebase environment |
| Non-admin values | Login is rejected by the page | Not yet run |
| Fetch team results | All Firestore teams returned by `getAdminResults` appear | Not yet run |
| Correct answer display | Each assigned question displays the answer key from the backend | Not yet run |
| Search | Results filter by team ID or name | Local UI logic implemented; live test pending |
| Submission filter | All / has submissions / complete / pending filters work | Local UI logic implemented; live test pending |
| Sorting | Name, latest submission, points sorts work | Local UI logic implemented; live test pending |
| CSV export | One row per team; six required headers in order | Local export logic implemented; spreadsheet test pending |
| CSV filter independence | Export includes all teams, not only visible filtered teams | Local export logic implemented; live test pending |
| Cross-device persistence | New device sees same teams after backend fetch | Requires deployed Firebase test |
| Mobile layout | No horizontal page overflow; table scrolls inside its wrapper | CSS responsive behavior implemented; device test pending |
| Submission behavior | Duplicate question submission rejected by backend | Existing backend behavior; test pending |
| Security review | Admin endpoint requires server-verified admin identity | **Not passed** — current literal admin/admin check is not secure |

## Release decision
Do not mark this as production-ready until Firebase configuration is added, deployed backend calls are verified, mobile/browser tests are completed, and the admin endpoint is protected by server-verified authentication.
