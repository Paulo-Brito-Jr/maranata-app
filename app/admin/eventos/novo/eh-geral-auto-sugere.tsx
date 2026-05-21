"use client";

import { useState, useEffect } from "react";

/**
 * Checkbox "Evento geral" que, quando marcado, auto-preenche o select
 * de Igreja organizadora pra Sede (se ainda não houver outra escolhida).
 */
export function EhGeralAutoSugere({ sedeId }: { sedeId: string | null }) {
  const [checked, setChecked] = useState(false);
  const [aplicou, setAplicou] = useState(false);

  useEffect(() => {
    if (!checked || !sedeId || aplicou) return;
    const select = document.querySelector<HTMLSelectElement>(
      'select[name="igrejaId"]',
    );
    if (select && !select.value) {
      select.value = sedeId;
      setAplicou(true);
    }
  }, [checked, sedeId, aplicou]);

  return (
    <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-3">
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          name="ehGeral"
          className="mt-0.5"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        />
        <span>
          <strong>Evento geral</strong> — organizado pela Sede e exibido pra
          membros das 14 unidades. Marque pra eventos como acampamentos,
          congressos e festas-amor que envolvem todo o campo.
          {checked && aplicou && (
            <span className="ml-2 text-xs text-blue-700 dark:text-blue-300">
              ✓ Sede preenchida como organizadora
            </span>
          )}
        </span>
      </label>
    </div>
  );
}
