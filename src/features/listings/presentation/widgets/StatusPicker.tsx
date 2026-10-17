import React from "react";

import { ChoiceChips } from "@/src/core/widgets/ChoiceChips";
import { LISTING_STATUSES, ListingStatus, statusLabel } from "../../domain/entities/CarListing";

// Los cuatro estados como chips. Lo usa el dueño en el detalle y en «Lo mío».
export function StatusPicker({ status, onSelect }: { status: ListingStatus; onSelect: (s: ListingStatus) => void }) {
  return (
    <ChoiceChips
      compact
      options={LISTING_STATUSES.map((s) => ({ value: s, label: statusLabel[s] }))}
      selected={status}
      onSelect={(s) => s !== status && onSelect(s)}
    />
  );
}
