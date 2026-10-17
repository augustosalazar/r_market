import React, { useCallback, useState } from "react";

import { ChatThread } from "@/src/features/chat/domain/entities/Chat";
import { CarListing } from "../../domain/entities/CarListing";
import { BuyerPickerSheet, SoldChoice } from "./BuyerPickerSheet";

// Cerrar una venta pregunta primero a quién: es lo que la deja en el historial
// de las dos partes. Lo comparten el detalle y «Lo mío».
export function useSellSheet(
  candidatesOf: (listing: CarListing) => Promise<ChatThread[]>,
  onChoose: (listing: CarListing, choice: SoldChoice) => void,
) {
  const [state, setState] = useState<{ listing: CarListing; candidates: ChatThread[] } | null>(null);

  const open = useCallback(
    async (listing: CarListing) => {
      const candidates = await candidatesOf(listing).catch(() => []);
      setState({ listing, candidates });
    },
    [candidatesOf],
  );

  const sheet = (
    <BuyerPickerSheet
      visible={state != null}
      candidates={state?.candidates ?? []}
      onDismiss={() => setState(null)}
      onChoose={(choice) => {
        const listing = state?.listing;
        setState(null);
        if (listing) onChoose(listing, choice);
      }}
    />
  );

  return { open, sheet };
}
