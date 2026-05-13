<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into Gastly, a Next.js 16 (App Router) personal finance app. PostHog is initialized via `instrumentation-client.ts` using the recommended approach for Next.js 15.3+. A reverse proxy is configured in `next.config.ts` so all analytics traffic routes through `/ingest` to reduce ad-blocker interference. Users are identified on login and signup so all events are tied to known individuals. A server-side client is available in `src/lib/posthog-server.ts` for future API route instrumentation.

| Event | Description | File |
|---|---|---|
| `user_logged_in` | User successfully logs in with email and PIN | `src/context/AppContext.tsx` |
| `user_signed_up` | User successfully creates a new account | `src/context/AppContext.tsx` |
| `workspace_created` | User creates a new workspace (onboarding) | `src/context/AppContext.tsx` |
| `workspace_joined` | User joins an existing workspace via invite code | `src/context/AppContext.tsx` |
| `expense_added` | User successfully saves a new expense | `src/components/HomeScreen.tsx` |
| `expense_category_overridden` | User manually changes the auto-detected category before saving an expense | `src/components/HomeScreen.tsx` |
| `category_created` | User creates a new category from the expense picker sheet | `src/components/HomeScreen.tsx` |
| `recurring_check_toggled` | User marks a recurring expense as paid or unpaid | `src/components/HomeScreen.tsx` |
| `shopping_item_added` | User adds an item to the shared shopping list | `src/components/HomeScreen.tsx` |
| `shopping_list_cleared` | User clears all completed items from the shopping list | `src/components/HomeScreen.tsx` |
| `expense_edited` | User saves edits to an existing expense | `src/components/ExpenseDetailModal.tsx` |
| `expense_deleted` | User deletes an expense | `src/components/ExpenseDetailModal.tsx` |
| `expense_added_to_recurring` | User adds an expense to the recurring templates list | `src/components/ExpenseDetailModal.tsx` |
| `invite_generated` | Owner generates a new workspace invite code | `src/components/ConfigScreen.tsx` |
| `category_saved` | User saves a new or edited category from the config screen | `src/components/ConfigScreen.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/1580546)
- [New signups & logins over time](/insights/avL5fIZ0)
- [Onboarding funnel: signup → workspace created](/insights/2WWyGQQN)
- [Daily expense entries](/insights/gyP6iWVy)
- [Feature adoption: recurring checks & shopping list](/insights/IEbazAEO)
- [Invite funnel: generated → workspace joined](/insights/tFfsNUGH)

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
