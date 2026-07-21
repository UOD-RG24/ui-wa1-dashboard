"use client";

import { useState } from "react";
import data from "../data/dashboard.json";
import type { Message } from "../types";
import { DataTable } from "../components/ui/DataTable";
import { Panel } from "../components/ui/Panel";
import { Section } from "../components/ui/Section";
import styles from "./AgentsPage.module.css";

export function AgentsPage() {
  const [messages, setMessages] = useState<Message[]>([
    { from: "user", text: "Top upregulated proteins in stage 2 BRCA?" },
    { from: "agent", text: "ERBB2, MUC1 and EPCAM rank highest after proteomic filtering." },
  ]);
  const [draft, setDraft] = useState("");

  function sendMessage() {
    if (!draft.trim()) return;
    setMessages([...messages, { from: "user", text: draft }, { from: "agent", text: "Queued to the relevant omics agent with current cohort filters." }]);
    setDraft("");
  }

  return (
    <div className={styles.agentsGrid}>
      <Section title="Natural Language Query Interface">
        <Panel title="Chat panel" meta="Context-aware">
          <div className={styles.chatArea}>
            {messages.map((message, index) => <p key={index} className={`${styles.chat} ${message.from === "agent" ? styles.agent : ""}`}>{message.text}</p>)}
          </div>
          <div className={styles.chatInput}>
            <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask about cohorts, genes, proteins or targets" />
            <button onClick={sendMessage}>Send</button>
          </div>
        </Panel>
      </Section>
      <Section title="Agent Activity Log">
        <Panel title="Agent Activity Log">
          <div className={styles.tableFill}>
            <DataTable rows={data.activityLog} columns={["time", "agent", "action", "input", "output", "duration"]} />
          </div>
        </Panel>
      </Section>
    </div>
  );
}
