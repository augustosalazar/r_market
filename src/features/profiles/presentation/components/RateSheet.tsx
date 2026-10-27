import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";

import { BottomSheet } from "@/src/core/components/BottomSheet";
import { MAX_STARS, RatedRole, ratedRoleLabel } from "../../domain/entities/UserRating";
import { StarPicker } from "./StarRating";

// La hoja para calificar a la otra parte de una venta. Arranca en cinco
// estrellas: lo normal es que la venta saliera bien.
type Props = {
  visible: boolean;
  personName: string;
  role: RatedRole;
  listingTitle: string;
  onSubmit: (result: { stars: number; comment: string }) => void;
  onDismiss: () => void;
};

export function RateSheet(props: Props) {
  return (
    <BottomSheet visible={props.visible} onDismiss={props.onDismiss}>
      {props.visible ? <RateForm {...props} /> : null}
    </BottomSheet>
  );
}

function RateForm({ personName, role, listingTitle, onSubmit }: Props) {
  const [stars, setStars] = useState(MAX_STARS);
  const [comment, setComment] = useState("");

  return (
    <>
      <Text variant="titleLarge">Calificar a {personName}</Text>
      <Text variant="bodySmall" style={styles.hint}>
        {ratedRoleLabel[role]} · {listingTitle}
      </Text>
      <StarPicker stars={stars} onChange={setStars} />
      <TextInput
        mode="outlined"
        label="Comentario (opcional)"
        placeholder="¿Cómo fue el trato?"
        multiline
        maxLength={280}
        value={comment}
        onChangeText={setComment}
      />
      <Text variant="bodySmall" style={styles.hint}>
        Una calificación no se puede cambiar ni borrar después.
      </Text>
      <Button mode="contained" onPress={() => onSubmit({ stars, comment })} contentStyle={styles.cta}>
        Publicar calificación
      </Button>
    </>
  );
}

const styles = StyleSheet.create({
  hint: { marginVertical: 8 },
  cta: { height: 48 },
});
