"use client";

import Image from "next/image";
import Link from "next/link";
import { FiActivity, FiChevronLeft, FiChevronRight, FiDatabase, FiHardDrive, FiLogOut, FiUser } from "react-icons/fi";
import data from "../../data/dashboard.json";
import type { DatasetItem, Experiment, MainView } from "../../types";
import derbyLogo from "../../university-of-derby-logo-01.webp";
import styles from "./DashboardShell.module.css";

function sortByLatestExperiments(items: Experiment[]) {
  return [...items].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
}

function sortByLatestDatasets(items: DatasetItem[]) {
  return [...items].sort((left, right) => new Date(right.updated).getTime() - new Date(left.updated).getTime());
}

const experiments = sortByLatestExperiments(data.experiments as Experiment[]);
const datasets = sortByLatestDatasets(data.datasets as DatasetItem[]);

export function DashboardShell({
  mainView,
  selectedExperimentId,
  selectedDatasetId,
  isCollapsed,
  onToggleCollapsed,
  onSelectExperiment,
  onSelectDataset,
  onSelectProfile,
  onSignOut,
  children,
}: {
  mainView: MainView;
  selectedExperimentId: string;
  selectedDatasetId: string;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  onSelectExperiment: (id: string) => void;
  onSelectDataset: (id: string) => void;
  onSelectProfile: () => void;
  onSignOut: () => void;
  children: React.ReactNode;
}) {
  const activeExperiment = experiments.find((item) => item.id === selectedExperimentId) ?? experiments[0];
  const activeDataset = datasets.find((item) => item.id === selectedDatasetId) ?? datasets[0];

  const pageTitle =
    mainView === "profile"
      ? "Profile"
      : mainView === "experiment"
        ? activeExperiment?.name ?? "Experiment"
        : activeDataset?.name ?? "Dataset";

  return (
    <div className={`${styles.dashboardShell} ${isCollapsed ? styles.sidebarCollapsed : ""}`}>
      <aside className={`${styles.appSidebar} ${isCollapsed ? styles.collapsed : ""}`}>
        <div className={styles.sidebarHeader}>
          <button className={styles.sidebarToggle} onClick={onToggleCollapsed} aria-label="Toggle sidebar">
            {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
          {!isCollapsed ? <p className={styles.sidebarHint}>Workspace navigation</p> : null}
        </div>

        <div className={styles.sidebarSection}>
          {!isCollapsed ? (
            <p className={styles.sectionLabel}>
              <FiActivity aria-hidden="true" />
              Experiments
            </p>
          ) : null}
          <nav className={styles.navList} aria-label="Experiments">
            {experiments.map((experiment) => (
              <button
                key={experiment.id}
                className={mainView === "experiment" && selectedExperimentId === experiment.id ? styles.active : ""}
                onClick={() => onSelectExperiment(experiment.id)}
                title={experiment.name}
              >
                <span className={styles.navIcon} aria-hidden="true">
                  <FiActivity />
                </span>
                {!isCollapsed ? (
                  <span className={styles.itemContent}>
                    <span className={styles.itemTitle}>{experiment.name}</span>
                    <span className={styles.itemMeta}>{new Date(experiment.updatedAt).toLocaleDateString()}</span>
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
        </div>

        <div className={styles.sidebarSection}>
          {!isCollapsed ? (
            <p className={styles.sectionLabel}>
              <FiDatabase aria-hidden="true" />
              Datasets
            </p>
          ) : null}
          <nav className={styles.navList} aria-label="Datasets">
            {datasets.map((dataset) => (
              <button
                key={dataset.id}
                className={mainView === "dataset" && selectedDatasetId === dataset.id ? styles.active : ""}
                onClick={() => onSelectDataset(dataset.id)}
                title={dataset.name}
              >
                <span className={styles.navIcon} aria-hidden="true">
                  <FiHardDrive />
                </span>
                {!isCollapsed ? (
                  <span className={styles.itemContent}>
                    <span className={styles.itemTitle}>{dataset.name}</span>
                    <span className={styles.itemMeta}>{dataset.updated}</span>
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <div className={styles.mainColumn}>
        <header className={styles.navBar}>
          <div className={styles.navBrand}>
            <Link href="/" className={styles.logoLink}>
              <Image src={derbyLogo} alt="University of Derby" priority />
              <span>Multi Omics Dashboard</span>
            </Link>
          </div>
          <div className={styles.navActions}>
            <button
              className={`${styles.navButton} ${mainView === "profile" ? styles.navActive : ""}`}
              type="button"
              onClick={onSelectProfile}
            >
              <FiUser aria-hidden="true" />
              Profile
            </button>
            <button className={styles.navButton} type="button" onClick={onSignOut}>
              <FiLogOut aria-hidden="true" />
              Sign-Out
            </button>
          </div>
        </header>

        <main className={styles.dashboardMain}>
          <header className={styles.topbar}>
            <h1>{pageTitle}</h1>
          </header>
          <div className={styles.pageBody}>{children}</div>
        </main>

        <footer className={styles.footer}>
          <span>Creative Commons</span>
          <span>University of Derby Multi Omics Dashboard</span>
        </footer>
      </div>
    </div>
  );
}

export { experiments, datasets };
