import data from "../data/dashboard.json";
import { PageShell } from "../components/dashboard/PageShell";
import { StageSparkline } from "../components/charts/StageSparkline";
import { Panel } from "../components/ui/Panel";
import { Section } from "../components/ui/Section";
import { Toolbar } from "../components/ui/Toolbar";
import ui from "../components/ui/Ui.module.css";
import styles from "./OverviewPage.module.css";

function RingMetric({ value, label }: { value: number; label: string }) {
  return (
    <div className={styles.ringMetric}>
      <b>{value}%</b>
      <span>{label}</span>
    </div>
  );
}

export function OverviewPage() {
  return (
    <PageShell category="Overview" title="Workspace monitor">
      <Toolbar />

      <div className={ui.unifiedBoard}>
        <div className={ui.unifiedRow}>
          <div className={`${ui.unifiedZone} ${ui.unifiedZoneWide}`}>
            <p className={ui.zoneLabel}>Active cohort</p>
            <div className={ui.zoneBody}>
              <h2 className={styles.cohortTitle}>BRCA - Stage II</h2>
              <p className={ui.muted}>Cohort coverage and twin updates remain stable across the current run.</p>
            </div>
            <div className={ui.zoneFooter}>Monitor strip</div>
          </div>
          <div className={ui.unifiedZone}>
            <p className={ui.zoneLabel}>Fresh</p>
            <div className={ui.zoneBody}>
              <p className={ui.metricValue}>97%</p>
            </div>
          </div>
          <div className={ui.unifiedZone}>
            <p className={ui.zoneLabel}>Discordant</p>
            <div className={ui.zoneBody}>
              <p className={ui.metricValue}>742</p>
            </div>
          </div>
          <div className={ui.unifiedZone}>
            <p className={ui.zoneLabel}>Queued</p>
            <div className={ui.zoneBody}>
              <p className={ui.metricValue}>2</p>
            </div>
          </div>
        </div>

        <div className={ui.metricStrip} style={{ border: 0, borderRadius: 0, boxShadow: "none", borderTop: "1px solid var(--line)" }}>
          {data.kpis.map((kpi) => (
            <div key={kpi.label} className={ui.metricCell}>
              <p className={ui.metricLabel}>{kpi.label}</p>
              <p className={ui.metricValue}>{kpi.value}</p>
            </div>
          ))}
        </div>
      </div>

      <Section title="Signal mix">
        <div className={ui.unifiedBoard}>
          <div className={ui.unifiedRow}>
            <div className={ui.unifiedZone}>
              <p className={ui.zoneLabel}>TCGA</p>
              <div className={ui.zoneBody}>
                <RingMetric value={96} label="Coverage" />
              </div>
            </div>
            <div className={ui.unifiedZone}>
              <p className={ui.zoneLabel}>CPTAC</p>
              <div className={ui.zoneBody}>
                <RingMetric value={93} label="Coverage" />
              </div>
            </div>
            <div className={ui.unifiedZone}>
              <p className={ui.zoneLabel}>GTEx</p>
              <div className={ui.zoneBody}>
                <RingMetric value={98} label="Coverage" />
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Cohort coverage">
        <div className={`${ui.grid} ${ui.four}`}>
          {data.cohorts.map((cohort) => (
            <Panel
              key={cohort.code}
              title={`${cohort.code} - ${cohort.name}`}
              meta={`${cohort.patients} patients`}
              className={styles.cohortCard}
            >
              <StageSparkline stages={cohort.stages} />
              <div className={styles.cardFoot}>
                <span>{cohort.risk}</span>
                <b>Stage I-IV</b>
              </div>
            </Panel>
          ))}
        </div>
      </Section>
    </PageShell>
  );
}
