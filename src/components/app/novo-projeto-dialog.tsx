"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { criarProjeto } from "@/lib/actions/projects";
import { criarProjetoDoTemplate } from "@/lib/actions/template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** Próxima segunda-feira a partir de hoje (sugestão para início de Vendas). */
function proximaSegunda(): string {
  const d = new Date();
  const wd = d.getDay(); // 0=dom..6=sab
  const delta = wd === 1 ? 7 : ((8 - wd) % 7) || 7;
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function NovoProjetoDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [data, setData] = useState(proximaSegunda());
  const [usarTemplate, setUsarTemplate] = useState(true);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = usarTemplate
        ? await criarProjetoDoTemplate({ nome, data_inicio_vendas: data })
        : await criarProjeto({ nome, data_inicio_vendas: data });
      if (!res.ok) {
        toast.error("Não foi possível criar", { description: res.erro });
        return;
      }
      toast.success("Lançamento criado", {
        description: usarTemplate
          ? `${"tarefas" in res ? res.tarefas : 432} tarefas geradas a partir do template.`
          : "10 etapas geradas com datas calculadas.",
      });
      setOpen(false);
      setNome("");
      router.push(`/projetos/${res.projectId}`);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <PlusIcon className="size-4" />
            Novo lançamento
          </Button>
        }
      />
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Novo lançamento</DialogTitle>
            <DialogDescription>
              As 10 etapas e todas as datas são geradas automaticamente a partir
              da semana de Vendas.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nome">Nome do lançamento</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Lançamento Setembro 2026"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="data">Início da semana de Vendas (segunda-feira)</Label>
              <Input
                id="data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Se você escolher outro dia, ajustamos para a segunda-feira daquela
                semana.
              </p>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors has-[:checked]:border-primary/50 has-[:checked]:bg-accent/40">
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-indigo-500"
                checked={usarTemplate}
                onChange={(e) => setUsarTemplate(e.target.checked)}
              />
              <span className="text-sm">
                <span className="font-medium">Começar do template padrão</span>
                <span className="block text-xs text-muted-foreground">
                  Já traz as 10 etapas e as 432 tarefas reais, todas com datas
                  calculadas. Desmarque para um projeto em branco.
                </span>
              </span>
            </label>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Criando…" : "Criar lançamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
