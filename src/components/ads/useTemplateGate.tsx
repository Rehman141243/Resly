import { useCallback, useState } from "react";
import { templateOpen, useAccess } from "../../context/AccessContext";
import { useToast } from "../../context/ToastContext";
import type { TemplateInfo } from "../../types/resume";
import UnlockSheet from "./UnlockSheet";

/**
 * Wraps "open this template". Free or already unlocked templates go straight
 * to `onOpen`. Locked ones show the "watch ads to unlock" sheet first.
 */
export function useTemplateGate(onOpen: (t: TemplateInfo) => void) {
  const { access, refresh } = useAccess();
  const toast = useToast();
  const [target, setTarget] = useState<TemplateInfo | null>(null);

  const gate = useCallback(
    async (t: TemplateInfo) => {
      if (!t.adUnlockable) {
        toast.info("Template locked", "This template is not available right now.");
        return;
      }
      const a = access ?? (await refresh());
      if (templateOpen(a, t)) return onOpen(t);
      setTarget(t);
    },
    [access, refresh, onOpen, toast],
  );

  const sheet = (
    <UnlockSheet
      visible={!!target}
      template={target}
      onClose={() => setTarget(null)}
      onUnlocked={(t) => {
        setTarget(null);
        onOpen(t);
      }}
    />
  );

  return { gate, sheet };
}
