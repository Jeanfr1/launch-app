import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/app/app-shell";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { user, supabase } = await requireUser();

  const [{ data: profile }, { data: projetos }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase
      .from("projects")
      .select("id, nome, status")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <AppShell projetos={projetos ?? []} profile={profile}>
      {children}
    </AppShell>
  );
}
