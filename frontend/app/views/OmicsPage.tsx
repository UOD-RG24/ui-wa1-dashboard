import data from "../data/dashboard.json";
import { OmicsScatterChart } from "../components/charts/OmicsScatterChart";
import { VolcanoChart } from "../components/charts/VolcanoChart";
import { Panel } from "../components/ui/Panel";
import { Section } from "../components/ui/Section";
import { Toolbar } from "../components/ui/Toolbar";
import ui from "../components/ui/Ui.module.css";
import styles from "./OmicsPage.module.css";

export function OmicsPage() {
  return (
    <div className={styles.contentSplit}>
      <div>
        <Toolbar />
        <Section title="Circos Plot">
          <Panel title="Cross-omics chromosome view" meta="BRCA Stage II">
            <div className={styles.circos}>
              {Array.from({ length: 18 }, (_, index) => <span key={index} style={{ transform: `rotate(${index * 20}deg)` }} />)}
              <b>RNA</b>
              <i>Protein</i>
            </div>
          </Panel>
        </Section>
        <Section title="Layer Visualisations">
          <div className={`${ui.grid} ${ui.three}`}>
            <Panel title="Dimensionality reduction" meta="UMAP">
              <OmicsScatterChart small />
            </Panel>
            <Panel title="Volcano plot" meta="RNA">
              <VolcanoChart />
            </Panel>
            <Panel title="KEGG / Reactome enrichment" meta="Top pathways">
              {data.omicsRows.map((row) => <p key={row.gene} className={styles.metricLine}><span>{row.pathway}</span><b>{row.gene}</b></p>)}
            </Panel>
          </div>
        </Section>
      </div>
      <aside className={styles.sidePanel}>
        <Section title="Legend">
          <div className={styles.legend}>
            <span><b className={styles.dna} />Genomics</span>
            <span><b className={styles.rna} />Transcriptomics</span>
            <span><b className={styles.protein} />Proteomics</span>
            <span><b className={styles.discordant} />Discordant</span>
          </div>
        </Section>
        <Section title="Filters">
          <label>Cohort<select><option>BRCA</option><option>COAD</option><option>LUAD</option></select></label>
          <label>Fold-change threshold<input type="range" min="0" max="4" defaultValue="2" /></label>
          <label>p-value cutoff<input type="range" min="1" max="10" defaultValue="5" /></label>
          <label>Gene set search<input placeholder="TP53, ERBB2..." /></label>
          <div className={styles.checks}>
            {["DNA", "RNA", "Protein"].map((item) => <label key={item}><input type="checkbox" defaultChecked />{item}</label>)}
          </div>
        </Section>
      </aside>
    </div>
  );
}
