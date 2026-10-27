# social-development-centre
civic hubby

```
🫒🫒🫒🫒   🫒🫒🫒     🫒🫒🫒🫒
🫒        🫒   🫒   🫒
🫒🫒🫒🫒   🫒    🫒  🫒
     🫒   🫒   🫒   🫒   
🫒🫒🫒🫒   🫒🫒🫒     🫒🫒🫒🫒
```

## Setup

1. `pnpm install`
2. Copy `.env.example` to `.env.local` and fill in the project URL and publishable key from the Supabase dashboard.
3. Set up Supabase as described in [docs/auth.md](docs/auth.md#setup).
4. `pnpm dev`

## Where things live

```
src/
  app/               Routes. Pages stay thin: they check access, then render a feature.
  features/          One folder per feature: server actions, queries and UI.
    auth/            Sign-in pages, requireAdmin/requireMember, sending links
    admins/          The Admins page
    welcome/         The form members fill in after their first sign-in
  components/ui/     The design-system kit. Build UI from these.
  lib/               Small shared helpers; supabase/ has the Supabase clients.
  proxy.ts           Keeps the session fresh and sends signed-out visitors to sign in.
supabase/            Database migrations and the sign-in email template.
docs/                Product context, design rules, component docs, how sign-in works (auth.md).
```
