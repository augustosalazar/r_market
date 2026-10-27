import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Button, Text, TextInput, useTheme } from "react-native-paper";

import { Formatters } from "@/src/core/utils/formatters";
import { Question } from "../../domain/entities/Question";

// Las preguntas públicas de una publicación. Quien mira puede preguntar; solo
// el dueño ve el campo de respuesta, y solo en las que aún no ha respondido.
export function QuestionList({
  questions,
  isOwner,
  onAsk,
  onAnswer,
}: {
  questions: Question[];
  isOwner: boolean;
  onAsk: (text: string) => Promise<boolean>;
  onAnswer: (question: Question, text: string) => Promise<boolean>;
}) {
  const { colors } = useTheme();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setSending(true);
    const ok = await onAsk(text);
    setSending(false);
    if (ok) setText("");
  };

  return (
    <View>
      <Text variant="titleMedium" style={styles.title}>
        Preguntas públicas ({questions.length})
      </Text>
      {!isOwner ? (
        <TextInput
          mode="outlined"
          placeholder="Escribe una pregunta pública"
          accessibilityLabel="Pregunta pública"
          value={text}
          onChangeText={setText}
          multiline
          style={styles.ask}
          right={
            sending ? (
              <TextInput.Icon icon={() => <ActivityIndicator size={18} />} />
            ) : (
              <TextInput.Icon icon="send" onPress={submit} accessibilityLabel="Publicar pregunta" />
            )
          }
        />
      ) : null}
      {questions.length === 0 ? (
        <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, marginVertical: 12 }}>
          Todavía nadie ha preguntado.
        </Text>
      ) : null}
      {questions.map((q) => (
        <QuestionTile key={q.id} question={q} isOwner={isOwner} onAnswer={(t) => onAnswer(q, t)} />
      ))}
    </View>
  );
}

function QuestionTile({
  question,
  isOwner,
  onAnswer,
}: {
  question: Question;
  isOwner: boolean;
  onAnswer: (text: string) => Promise<boolean>;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState("");

  return (
    <View style={[styles.tile, { borderColor: colors.outlineVariant }]}>
      <View style={styles.row}>
        <Text variant="labelLarge" style={styles.flex}>
          {question.askerName}
        </Text>
        <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant }}>
          {Formatters.relative(question.createdAt)}
        </Text>
      </View>
      <Text variant="bodyMedium" style={styles.body}>
        {question.text}
      </Text>
      {question.answer ? (
        <View style={[styles.answer, { backgroundColor: colors.surfaceVariant }]}>
          <Text variant="labelMedium" style={{ color: colors.primary }}>
            {question.answer.responderName} respondió
          </Text>
          <Text variant="bodyMedium">{question.answer.text}</Text>
        </View>
      ) : isOwner ? (
        open ? (
          <TextInput
            mode="outlined"
            autoFocus
            multiline
            placeholder="Tu respuesta pública"
            accessibilityLabel="Respuesta pública"
            value={answer}
            onChangeText={setAnswer}
            style={styles.answerInput}
            right={
              <TextInput.Icon
                icon="send"
                accessibilityLabel="Publicar respuesta"
                onPress={async () => {
                  if (await onAnswer(answer)) setOpen(false);
                }}
              />
            }
          />
        ) : (
          <Button icon="reply" style={styles.reply} onPress={() => setOpen(true)}>
            Responder en público
          </Button>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: 12 },
  ask: { marginBottom: 16 },
  tile: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center" },
  flex: { flex: 1 },
  body: { marginTop: 4 },
  answer: { marginTop: 12, padding: 12, borderRadius: 10, gap: 4 },
  answerInput: { marginTop: 8 },
  reply: { alignSelf: "flex-start", marginTop: 8 },
});
