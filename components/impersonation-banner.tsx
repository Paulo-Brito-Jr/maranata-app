import { ROTULO_PAPEL } from "@/lib/auth";
import type { MKRole } from "@/lib/maranata-key-sso";
import { ImpersonarSair } from "./impersonar-controls";

export function ImpersonationBanner({ papel }: { papel: MKRole }) {
  return (
    <div className="border-b border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-yellow-200">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 text-sm">
        <div>
          <span className="mr-2 inline-flex h-5 items-center rounded-full bg-yellow-500 px-2 text-[10px] font-bold uppercase text-yellow-950">
            Modo teste
          </span>
          Você está vendo a plataforma como{" "}
          <strong className="font-semibold">{ROTULO_PAPEL[papel]}</strong>. As permissões reduzidas
          estão ativas — admin volta sozinho ao sair.
        </div>
        <ImpersonarSair />
      </div>
    </div>
  );
}
