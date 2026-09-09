"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import type { EtapaBoard, StatusTarefa, Prioridade } from "@/lib/types";
import {
  STATUS_ORDEM,
  STATUS_LABEL,
  PRIORIDADE_ORDEM,
  PRIORIDADE_LABEL,
} from "@/lib/constants";
import { criarTarefa } from "@/lib/actions/tasks";
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

const selectCls =
  "h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

export function NovaTarefaDialog({
  projectId,
  etapas,
  statusInicial = "a_fazer",
}: {
  projectId: string;
  etapas: EtapaBoard[];
  statusInicial?: StatusTarefa;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [titulo, setTitulo] = useState("");
  const [subetapa, setSubetapa] = useState("");
  const [canal, setCanal] = useState("");
  const [stageId, setStageId] = useState<string>(etapas[0]?.id ?? "");
  const [prioridade, setPrioridade] = useState<Prioridade>("media");
  const [status, setStatus] = useState<StatusTarefa>(statusInicial);
  const [visivelCliente, setVisivelCliente] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await criarTarefa({
        project_id: projectId,
        stage_id: stageId || null,
        titulo,
        subetapa: subetapa || undefined,
        canal: canal || undefined,
        prioridade,
        status,
        visivel_cliente: visivelCliente,
      });
      if (!res.ok) {
        toast.error("Não foi possível criar", { description: res.erro });
        return;
      }
      toast.success("Tarefa criada");
      setOpen(false);
      setTitulo("");
      setSubetapa("");
      setCanal("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <PlusIcon className="size-4" />
            Nova tarefa
          </Button>
        }
      />
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Nova tarefa</DialogTitle>
            <DialogDescription>
              A data é calculada automaticamente a partir da etapa escolhida.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="subetapa">Subetapa</Label>
                <Input id="subetapa" value={subetapa} onChange={(e) => setSubetapa(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="canal">Canal</Label>
                <Input id="canal" value={canal} onChange={(e) => setCanal(e.target.value)} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="etapa">Etapa</Label>
              <select
                id="etapa"
                className={selectCls}
                value={stageId}
                onChange={(e) => setStageId(e.target.value)}
              >
                <option value="">Sem etapa</option>
                {etapas.map((et) => (
                  <option key={et.id} value={et.id}>
                    {et.ordem}. {et.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="prioridade">Prioridade</Label>
                <select
                  id="prioridade"
                  className={selectCls}
                  value={prioridade}
                  onChange={(e) => setPrioridade(e.target.value as Prioridade)}
                >
                  {PRIORIDADE_ORDEM.map((p) => (
                    <option key={p} value={p}>
                      {PRIORIDADE_LABEL[p]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className={selectCls}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusTarefa)}
                >
                  {STATUS_ORDEM.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-emerald-500"
                checked={visivelCliente}
                onChange={(e) => setVisivelCliente(e.target.checked)}
              />
              Visível ao cliente
            </label>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Criando…" : "Criar tarefa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
