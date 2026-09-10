"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UsersIcon } from "lucide-react";
import { toast } from "sonner";
import type { MembroBoard } from "@/lib/types";
import { FUNCOES_EQUIPE, PAPEL_LABEL, type ConviteEquipe } from "@/lib/team";
import { adicionarPessoa, removerPessoa } from "@/lib/actions/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function EquipeDialog({ projectId, userId, membros, convites, podeGerenciar, erroCarregamento }: {
  projectId: string; userId: string; membros: MembroBoard[]; convites: ConviteEquipe[]; podeGerenciar: boolean; erroCarregamento: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState<(typeof FUNCOES_EQUIPE)[number]>("especialista");
  const [pending, startTransition] = useTransition();
  const [confirmacao, setConfirmacao] = useState<string | null>(null);

  function adicionar(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await adicionarPessoa({ projectId, email, papel });
        if (!res.ok) { toast.error(res.erro); return; }
        toast.success(res.pendente ? "Acesso pendente cadastrado" : "Pessoa adicionada ao projeto");
        setEmail("");
        router.refresh();
      } catch { toast.error("Não foi possível adicionar. Tente novamente."); }
    });
  }

  function remover(id: string, convite: boolean) {
    startTransition(async () => {
      try {
        const res = await removerPessoa({ projectId, ...(convite ? { conviteId: id } : { userId: id }) });
        if (!res.ok) { toast.error(res.erro); return; }
        setConfirmacao(null);
        toast.success(convite ? "Acesso pendente cancelado" : "Acesso removido");
        router.refresh();
      } catch { toast.error("Não foi possível remover. Tente novamente."); }
    });
  }

  function controleRemover(id: string, convite: boolean, nome: string) {
    return confirmacao === id ? (
      <div className="flex flex-wrap gap-1">
        <Button size="sm" variant="destructive" disabled={pending} onClick={() => remover(id, convite)}>Confirmar remoção</Button>
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => setConfirmacao(null)}>Cancelar</Button>
      </div>
    ) : <Button size="sm" variant="ghost" disabled={pending} aria-label={`Remover ${nome}`} onClick={() => setConfirmacao(id)}>{convite ? "Cancelar acesso" : "Remover"}</Button>;
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm"><UsersIcon className="size-4" /> Equipe ({membros.length})</Button>} />
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Equipe do projeto</DialogTitle>
          <DialogDescription>Compartilhe o lançamento para acompanhar o progresso e atualizar tarefas em equipe.</DialogDescription>
        </DialogHeader>
        {podeGerenciar && (
          <form onSubmit={adicionar} className="space-y-3 rounded-lg border p-4">
            <div className="space-y-2"><Label htmlFor="equipe-email">E-mail da pessoa</Label><Input id="equipe-email" type="email" required maxLength={254} placeholder="pessoa@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={pending || erroCarregamento} /></div>
            <div className="space-y-2"><Label htmlFor="equipe-papel">Função no projeto</Label>
              <select id="equipe-papel" value={papel} disabled={pending || erroCarregamento} onChange={(e) => setPapel(e.target.value as typeof papel)} className="h-9 w-full rounded-md border bg-background px-2 text-sm">
                {FUNCOES_EQUIPE.map((p) => <option key={p} value={p}>{PAPEL_LABEL[p]}</option>)}
              </select>
            </div>
            <p className="text-xs text-muted-foreground">Todas as funções podem atualizar tarefas. Gestores também podem gerenciar a equipe.</p>
            <p className="text-xs text-muted-foreground">Quem ainda não tem conta receberá acesso ao entrar com este e-mail confirmado. Compartilhe o link do projeto com a pessoa; nenhum convite por e-mail é enviado automaticamente.</p>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={pending || erroCarregamento}>{pending ? "Salvando…" : "Adicionar pessoa"}</Button>
              <Button type="button" variant="outline" onClick={async () => {
                try { await navigator.clipboard.writeText(`${window.location.origin}/projetos/${projectId}`); toast.success("Link do projeto copiado"); }
                catch { toast.error("Não foi possível copiar. Copie o endereço do projeto no navegador."); }
              }}>Copiar link do projeto</Button>
            </div>
          </form>
        )}
        {erroCarregamento && <p role="alert" className="text-sm text-destructive">Não foi possível carregar a equipe completa. Verifique se a migração de equipe foi aplicada e tente novamente.</p>}
        <ul className="divide-y">
          {membros.map((m) => <li key={m.user_id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div className="min-w-0"><p className="break-words text-sm font-medium">{m.full_name ?? "Usuário"}{m.user_id === userId ? " (você)" : ""}</p><p className="text-xs text-muted-foreground">{PAPEL_LABEL[m.papel]}</p></div>
            {podeGerenciar && m.papel !== "owner" && m.user_id !== userId && controleRemover(m.user_id, false, m.full_name ?? "pessoa")}
          </li>)}
        </ul>
        {podeGerenciar && convites.length > 0 && <div>
          <h3 className="text-sm font-medium">Acessos pendentes ({convites.length})</h3>
          <ul className="divide-y">{convites.map((c) => <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div className="min-w-0"><p className="break-all text-sm">{c.email}</p><p className="text-xs text-muted-foreground">{PAPEL_LABEL[c.papel]} · Aguardando cadastro ou confirmação do e-mail</p></div>
            {controleRemover(c.id, true, c.email)}
          </li>)}</ul>
        </div>}
      </DialogContent>
    </Dialog>
  );
}
