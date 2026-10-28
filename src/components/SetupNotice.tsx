export function SetupNotice() {
  return (
    <div className="container-page flex min-h-screen max-w-2xl flex-col justify-center py-16">
      <div className="selvedge mb-8 max-w-[140px]" aria-hidden />
      <h1 className="text-5xl">Connect the database</h1>
      <p className="mt-4 text-[17px] text-charcoal/85">
        This site needs a Supabase project before it can show the catalogue. No data is shown until it is connected.
      </p>
      <ol className="prose-body mt-6 list-decimal space-y-2 pl-6">
        <li>Create a Supabase project and run the SQL files in <code>supabase/migrations</code> in order.</li>
        <li>
          Copy <code>.env.example</code> to <code>.env.local</code> and set <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_ANON_KEY</code>.
        </li>
        <li>Restart the dev server (or rebuild) so the values are picked up.</li>
      </ol>
      <p className="mt-6 text-sm text-earth">The README has the full setup, including how to create the owner login.</p>
    </div>
  )
}
