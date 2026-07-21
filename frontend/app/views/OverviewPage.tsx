import data from "../data/dashboard.json";
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
    <>
      <Toolbar />
      <div className={styles.overviewHero}>
        <Panel title="Active cohort" className={styles.heroPanel}>
          <div className={styles.heroGrid}>
            <div>
              <p className={ui.muted}>Workspace</p>
              <h2>BRCA - Stage II</h2>
              <p className={ui.muted}>Cohort coverage and twin updates remain stable across the current run.</p>
            </div>
            <div className={styles.heroMetrics}>
              <span><b>97%</b> fresh</span>
              <span><b>742</b> discordant</span>
              <span><b>2</b> queued</span>
            </div>
          </div>
        </Panel>
        <Panel title="Signal mix" className={styles.heroPanel}>
          <div className={styles.qualityRings}>
            <RingMetric value={96} label="TCGA" />
            <RingMetric value={93} label="CPTAC" />
            <RingMetric value={98} label="GTEx" />
          </div>
        </Panel>
      </div>
      <Section title="Key metrics">
        <div className={`${ui.grid} ${ui.four}`}>
          {data.kpis.map((kpi) => (
            <Panel key={kpi.label} title={kpi.label} className={styles.kpiCard}>
              <p className={styles.kpiValue}>{kpi.value}</p>
            </Panel>
          ))}
        </div>
      </Section>
      <Section title="Cohort coverage">
        <div className={`${ui.grid} ${ui.four}`}>
          {data.cohorts.map((cohort) => (
            <Panel key={cohort.code} title={`${cohort.code} - ${cohort.name}`} meta={`${cohort.patients} patients`} className={styles.cohortCard}>
              <StageSparkline stages={cohort.stages} />
              <div className={styles.cardFoot}>
                <span>{cohort.risk}</span>
                <b>Stage I-IV</b>
              </div>
            </Panel>
          ))}
        </div>
      </Section>
    </>
  );
}
