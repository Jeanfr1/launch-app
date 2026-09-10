"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckIcon, XIcon, SendIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { atualizarTarefa } from "@/lib/actions/tasks";
import { comentar, pedirAprovacao, responderAprovacao, salvarNotaInterna } from "@/lib/actions/collab";
import {
  STATUS_ORDEM,
  STATUS_LABEL,
  PRIORIDADE_ORDEM,
  PRIORIDADE_LABEL,
  formatarData,
} from "@/lib/constants";
import type { TarefaBoard, MembroBoard, StatusTarefa, Prioridade } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const sel = "h-8 rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

type Comentario = {
  id: string;
  author_id: string | null;
  corpo: string;
  visivel_cliente: boolean;
  created_at: string;
};
type Aprovacao = {
  id: string;
  aprovador_id: string | null;
  status: "pendente" | "aprovado" | "reprovado";
  comentario: string | null;
  decided_at: string | null;
};

const APROV_BADGE: Record<string, string> = {
  pendente: "bg-amber-500/15 text-amber-500",
  aprovado: "bg-emerald-500/15 text-emerald-500",
  reprovado: "bg-rose-500/15 text-rose-500",
};

export function TarefaDialog({
  taskId,
  projectId,
  tarefa,
  membros,
  meId,
  onClose,
}: {
  taskId: string | null;
  projectId: string;
  tarefa: TarefaBoard | undefined;
  membros: MembroBoard[];
  meId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [aprovacoes, setAprovacoes] = useState<Aprovacao[]>([]);
  const [nota, setNota] = useState("");
  const [novoComentario, setNovoComentario] = useState("");
  const [comentVisivel, setComentVisivel] = useState(true);
  const [aprovadorEscolhido, setAprovadorEscolhido] = useState("");
  const [titulo, setTitulo] = useState(tarefa?.titulo ?? "");

  const nomeDe = (id: string | null) =>
    (id && membros.find((m) => m.user_id === id)?.full_name) || "—";
  const equipe = membros.filter((m) => m.papel !== "cliente");

  const carregar = useCallback(async () => {
    if (!taskId) return;
    const supabase = createClient();
    const [c, a, p] = await Promise.all([
      supabase.from("task_comments").select("id, author_id, corpo, visivel_cliente, created_at").eq("task_id", taskId).order("created_at"),
      supabase.from("task_approvals").select("id, aprovador_id, status, comentario, decided_at").eq("task_id", taskId).order("created_at"),
      supabase.from("task_private").select("observacoes").eq("task_id", taskId).maybeSingle(),
    ]);
    setComentarios((c.data as Comentario[]) ?? []);
    setAprovacoes((a.data as Aprovacao[]) ?? []);
    setNota(p.data?.observacoes ?? "");
  }, [taskId]);

  useEffect(() => {
    // Carrega comentários/aprovações/nota ao abrir (fetch assíncrono legítimo).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (taskId) void carregar();
  }, [taskId, carregar]);

  function run(fn: () => Promise<{ ok: boolean; erro?: string }>, recarregar = true) {
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        toast.error("Erro", { description: res.erro });
        return;
      }
      if (recarregar) await carregar();
      router.refresh();
    });
  }

  if (!tarefa) return null;

  const patch = (p: Record<string, unknown>) =>
    run(() => atualizarTarefa({ taskId: tarefa.id, project_id: projectId, patch: p }), false);

  return (
    <Dialog open={!!taskId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] w-[min(92vw,640px)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Detalhe da tarefa</DialogTitle>
          <Input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            onBlur={() => titulo.trim() && titulo !== tarefa.titulo && patch({ titulo: titulo.trim() })}
            className="border-transparent px-0 text-base font-semibold shadow-none focus-visible:border-input focus-visible:px-2"
          />
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {/* Metadados */}
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Status">
              <select className={sel} value={tarefa.status} onChange={(e) => patch({ status: e.target.value as StatusTarefa })}>
                {STATUS_ORDEM.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </Campo>
            <Campo label="Prioridade">
              <select className={sel} value={tarefa.prioridade} onChange={(e) => patch({ prioridade: e.target.value as Prioridade })}>
                {PRIORIDADE_ORDEM.map((p) => <option key={p} value={p}>{PRIORIDADE_LABEL[p]}</option>)}
              </select>
            </Campo>
            <Campo label="Responsável">
              <select className={sel} value={tarefa.responsavel_id ?? ""} onChange={(e) => patch({ responsavel_id: e.target.value || null })}>
                <option value="">—</option>
                {equipe.map((m) => <option key={m.user_id} value={m.user_id}>{m.full_name ?? "Usuário"}</option>)}
              </select>
            </Campo>
            <Campo label="Data">
              <span className="flex h-8 items-center text-sm text-muted-foreground">{formatarData(tarefa.data_calculada)}</span>
            </Campo>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 accent-indigo-500" checked={tarefa.visivel_cliente} onChange={(e) => patch({ visivel_cliente: e.target.checked })} />
            Visível ao cliente
          </label>

          {/* Nota interna */}
          <section className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Observação interna (só equipe)</p>
            <Textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={2} placeholder="Anotações que o cliente nunca vê…" />
            <div>
              <Button size="sm" variant="outline" disabled={pending}
                onClick={() => run(() => salvarNotaInterna({ taskId: tarefa.id, projectId, observacoes: nota || null }))}>
                Salvar nota
              </Button>
            </div>
          </section>

          {/* Aprovações */}
          <section className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Aprovações</p>
            {aprovacoes.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma aprovação solicitada.</p>}
            {aprovacoes.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-2 rounded-md border p-2">
                <div className="min-w-0 text-sm">
                  <span className="font-medium">{nomeDe(a.aprovador_id)}</span>
                  <span className={cn("ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium", APROV_BADGE[a.status])}>{a.status}</span>
                  {a.comentario && <p className="truncate text-xs text-muted-foreground">{a.comentario}</p>}
                </div>
                {a.status === "pendente" && a.aprovador_id === meId && (
                  <div className="flex gap-1">
                    <Button size="icon-xs" variant="outline" aria-label="Aprovar" disabled={pending}
                      onClick={() => run(() => responderAprovacao({ approvalId: a.id, projectId, status: "aprovado" }))}>
                      <CheckIcon className="size-3.5 text-emerald-500" />
                    </Button>
                    <Button size="icon-xs" variant="outline" aria-label="Reprovar" disabled={pending}
                      onClick={() => run(() => responderAprovacao({ approvalId: a.id, projectId, status: "reprovado" }))}>
                      <XIcon className="size-3.5 text-rose-500" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
            <div className="flex gap-2">
              <select className={cn(sel, "flex-1")} value={aprovadorEscolhido} onChange={(e) => setAprovadorEscolhido(e.target.value)}>
                <option value="">Escolher aprovador…</option>
                {membros.map((m) => <option key={m.user_id} value={m.user_id}>{m.full_name ?? "Usuário"}</option>)}
              </select>
              <Button size="sm" variant="outline" disabled={pending || !aprovadorEscolhido}
                onClick={() => run(() => pedirAprovacao({ taskId: tarefa.id, projectId, aprovadorId: aprovadorEscolhido }))}>
                Pedir aprovação
              </Button>
            </div>
          </section>

          {/* Comentários */}
          <section className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Comentários</p>
            {comentarios.map((c) => (
              <div key={c.id} className="rounded-md bg-muted/40 p-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{nomeDe(c.author_id)}</span>
                  <span className="text-[11px] text-muted-foreground">{new Date(c.created_at).toLocaleString("pt-BR")}</span>
                  {!c.visivel_cliente && <Badge variant="secondary" className="text-[10px]">interno</Badge>}
                </div>
                <p className="whitespace-pre-wrap">{c.corpo}</p>
              </div>
            ))}
            <div className="flex flex-col gap-2">
              <Textarea value={novoComentario} onChange={(e) => setNovoComentario(e.target.value)} rows={2} placeholder="Escrever comentário…" />
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" className="size-3.5 accent-indigo-500" checked={comentVisivel} onChange={(e) => setComentVisivel(e.target.checked)} />
                  Visível ao cliente
                </label>
                <Button size="sm" disabled={pending || !novoComentario.trim()}
                  onClick={() => run(() => comentar({ taskId: tarefa.id, projectId, corpo: novoComentario, visivelCliente: comentVisivel }).then((r) => { if (r.ok) setNovoComentario(""); return r; }))}>
                  <SendIcon className="size-3.5" /> Enviar
                </Button>
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
