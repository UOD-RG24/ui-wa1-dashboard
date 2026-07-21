import data from "../data/dashboard.json";
import { OmicsScatterChart } from "../components/charts/OmicsScatterChart";
import { DataTable } from "../components/ui/DataTable";
import { MiniHeatmap } from "../components/ui/MiniHeatmap";
import { Panel } from "../components/ui/Panel";
import { ProgressBar } from "../components/ui/ProgressBar";
import { Section } from "../components/ui/Section";
import { Toolbar } from "../components/ui/Toolbar";
import ui from "../components/ui/Ui.module.css";
import styles from "./PatientPage.module.css";

export function PatientPage() {
  return (
    <div className={styles.contentSplit}>
      <aside className={styles.sidePanel}>
        <Section title="Patient Profile">
          <dl className={styles.detailList}>
            {Object.entries(data.patient).map(([key, value]) => (
              <div key={key}>
                <dt>{key.replace(/([A-Z])/g, " $1")}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </Section>
        <Section title="Stage Progression">
          <div className={styles.stageStack}>
            <span>Normal GTEx</span>
            <span>Stage I</span>
            <span className={styles.active}>Stage II current</span>
          </div>
        </Section>
        <Section title="Patient Selector">
          <select aria-label="Patient selector">
            <option>CPTAC-BRCA-0042</option>
            <option>CPTAC-LUAD-0081</option>
            <option>CPTAC-COAD-0024</option>
          </select>
        </Section>
      </aside>
      <div>
        <Toolbar />
        <Section title="Dual-Omics Comparison">
          <div className={`${ui.grid} ${ui.two}`}>
            <Panel title="RNA-seq expression heatmap" meta="20k genes">
              <MiniHeatmap variant="rna" />
            </Panel>
            <Panel title="Mass spec protein abundance heatmap" meta="8,942 proteins">
              <MiniHeatmap variant="protein" />
            </Panel>
          </div>
        </Section>
        <Section title="Causal Flow">
          <div className={styles.causalFlow}>
            {["DNA", "RNA", "Protein", "Metabolite", "Phenotype"].map((item) => <span key={item}>{item}</span>)}
          </div>
        </Section>
        <Section title="RNA vs Protein Correlation">
          <div className={`${ui.grid} ${ui.two}`}>
            <Panel title="Scatter plot" meta="R2 0.61">
              <OmicsScatterChart />
            </Panel>
            <Panel title="Discordant genes table">
              <DataTable rows={data.omicsRows} columns={["gene", "rna", "protein", "direction"]} />
            </Panel>
          </div>
        </Section>
        <Section title="Foundation Model Outputs">
          <div className={`${ui.grid} ${ui.four}`}>
            {data.foundationModels.map((model) => (
              <Panel key={model.name} title={`${model.name} - ${model.domain}`} meta={`${model.confidence}%`}>
                <p className={ui.muted}>In: {model.input}</p>
                <p>{model.output}</p>
                <ProgressBar value={model.confidence} />
              </Panel>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
