import { requireUser, getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app/app-shell";

export default async function AppLayout({
  children,
}: LayoutProps<"/">) {
  await requireUser();
  const profile = await getProfile();
  const supabase = await createClient();
  const { data: projetos } = await supabase
    .from("projects")
    .select("id, nome, status")
    .order("created_at", { ascending: false });

  return (
    <AppShell projetos={projetos ?? []} profile={profile}>
      {children}
    </AppShell>
  );
}
