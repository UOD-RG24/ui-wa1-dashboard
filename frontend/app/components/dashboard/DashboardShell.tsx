"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  FiActivity,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiDatabase,
  FiHardDrive,
  FiLogOut,
  FiMenu,
  FiPlus,
  FiUser,
  FiX,
} from "react-icons/fi";
import type { DatasetItem, Experiment, MainView } from "../../types";
import derbyLogo from "../../university-of-derby-logo-01.webp";
import styles from "./DashboardShell.module.css";

export function DashboardShell({
  mainView,
  experiments,
  datasets,
  selectedExperimentId,
  selectedDatasetId,
  isCollapsed,
  onToggleCollapsed,
  onSelectExperiment,
  onSelectDataset,
  onSelectProfile,
  onSignOut,
  onCreateExperiment,
  onCreateDataset,
  userName,
  children,
}: {
  mainView: MainView;
  experiments: Experiment[];
  datasets: DatasetItem[];
  selectedExperimentId: string;
  selectedDatasetId: string;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  onSelectExperiment: (id: string) => void;
  onSelectDataset: (id: string) => void;
  onSelectProfile: () => void;
  onSignOut: () => void;
  onCreateExperiment?: () => void;
  onCreateDataset?: () => void;
  userName?: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [experimentsOpen, setExperimentsOpen] = useState(true);
  const [datasetsOpen, setDatasetsOpen] = useState(true);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [autoRail, setAutoRail] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  const railMode = isCollapsed || autoRail;
  const displayName = userName?.trim() || "User";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const pageTitle =
    mainView === "profile"
      ? "Profile"
      : mainView === "experiment"
        ? experiments.find((item) => item.id === selectedExperimentId)?.name ?? "Experiment"
        : datasets.find((item) => item.id === selectedDatasetId)?.name ?? "Dataset";

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1280px) and (min-width: 901px)");
    const sync = () => setAutoRail(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setAvatarMenuOpen(false);
  }, [mainView, selectedExperimentId, selectedDatasetId]);

  useEffect(() => {
    if (!avatarMenuOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!avatarRef.current?.contains(event.target as Node)) {
        setAvatarMenuOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAvatarMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [avatarMenuOpen]);

  const closeMobile = () => setMobileOpen(false);

  const selectExperiment = (id: string) => {
    onSelectExperiment(id);
    closeMobile();
  };

  const selectDataset = (id: string) => {
    onSelectDataset(id);
    closeMobile();
  };

  return (
    <div className={`${styles.dashboardShell} ${railMode ? styles.sidebarCollapsed : ""}`}>
      {mobileOpen ? (
        <button
          type="button"
          className={styles.navBackdrop}
          aria-label="Close navigation"
          onClick={closeMobile}
        />
      ) : null}

      <aside
        className={`${styles.appSidebar} ${railMode ? styles.collapsed : ""} ${mobileOpen ? styles.mobileOpen : ""}`}
      >
        <button type="button" className={styles.mobileClose} onClick={closeMobile} aria-label="Close menu">
          <FiX />
        </button>

        <div className={styles.brandBlock}>
          <Image
            src={derbyLogo}
            alt="University of Derby"
            className={styles.brandMark}
            priority
          />
          {!railMode ? <span className={styles.brandTitle}>Multi Omics Dashboard</span> : null}
        </div>

        <button
          type="button"
          className={styles.collapseToggle}
          onClick={onToggleCollapsed}
          aria-label={railMode ? "Expand navigation" : "Collapse navigation"}
          data-tooltip={railMode ? "Expand" : undefined}
        >
          {railMode ? <FiChevronRight /> : <FiChevronLeft />}
          {!railMode ? <span>Collapse</span> : null}
        </button>

        <nav className={styles.navMenu} aria-label="Workspace">
          <div className={styles.navSection}>
            <button
              type="button"
              className={`${styles.navParent} ${mainView === "experiment" ? styles.parentActive : ""}`}
              onClick={() => setExperimentsOpen((value) => !value)}
              aria-expanded={experimentsOpen}
              data-tooltip={railMode ? "Experiments" : undefined}
            >
              <span className={styles.navIcon} aria-hidden="true">
                <FiActivity />
              </span>
              {!railMode ? <span className={styles.navLabel}>Experiments</span> : null}
              {!railMode ? (
                <span className={`${styles.navChevron} ${experimentsOpen ? styles.chevronOpen : ""}`}>
                  <FiChevronDown />
                </span>
              ) : null}
            </button>

            {railMode ? (
              <div className={styles.flyout}>
                <p className={styles.flyoutTitle}>Experiments</p>
                {onCreateExperiment ? (
                  <button type="button" className={styles.flyoutAction} onClick={onCreateExperiment}>
                    <FiPlus /> New experiment
                  </button>
                ) : null}
                {experiments.map((experiment) => (
                  <button
                    key={experiment.id}
                    type="button"
                    className={
                      mainView === "experiment" && selectedExperimentId === experiment.id ? styles.active : ""
                    }
                    onClick={() => selectExperiment(experiment.id)}
                  >
                    {experiment.name}
                  </button>
                ))}
              </div>
            ) : null}

            {!railMode && experimentsOpen ? (
              <div className={styles.submenu}>
                {onCreateExperiment ? (
                  <button type="button" className={styles.sidebarAction} onClick={onCreateExperiment}>
                    <FiPlus aria-hidden="true" />
                    New experiment
                  </button>
                ) : null}
                {experiments.length === 0 ? <p className={styles.emptyHint}>No experiments yet</p> : null}
                {experiments.map((experiment) => (
                  <button
                    key={experiment.id}
                    type="button"
                    className={`${styles.navChild} ${
                      mainView === "experiment" && selectedExperimentId === experiment.id ? styles.active : ""
                    }`}
                    onClick={() => selectExperiment(experiment.id)}
                    title={experiment.name}
                  >
                    <span className={styles.navIconSm} aria-hidden="true">
                      <FiActivity />
                    </span>
                    <span className={styles.itemContent}>
                      <span className={styles.itemTitle}>{experiment.name}</span>
                      <span className={styles.itemMeta}>{new Date(experiment.updatedAt).toLocaleDateString()}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className={styles.navSection}>
            <button
              type="button"
              className={`${styles.navParent} ${mainView === "dataset" ? styles.parentActive : ""}`}
              onClick={() => setDatasetsOpen((value) => !value)}
              aria-expanded={datasetsOpen}
              data-tooltip={railMode ? "Datasets" : undefined}
            >
              <span className={styles.navIcon} aria-hidden="true">
                <FiDatabase />
              </span>
              {!railMode ? <span className={styles.navLabel}>Datasets</span> : null}
              {!railMode ? (
                <span className={`${styles.navChevron} ${datasetsOpen ? styles.chevronOpen : ""}`}>
                  <FiChevronDown />
                </span>
              ) : null}
            </button>

            {railMode ? (
              <div className={styles.flyout}>
                <p className={styles.flyoutTitle}>Datasets</p>
                {onCreateDataset ? (
                  <button type="button" className={styles.flyoutAction} onClick={onCreateDataset}>
                    <FiPlus /> Upload dataset
                  </button>
                ) : null}
                {datasets.map((dataset) => (
                  <button
                    key={dataset.id}
                    type="button"
                    className={mainView === "dataset" && selectedDatasetId === dataset.id ? styles.active : ""}
                    onClick={() => selectDataset(dataset.id)}
                  >
                    {dataset.name}
                  </button>
                ))}
              </div>
            ) : null}

            {!railMode && datasetsOpen ? (
              <div className={styles.submenu}>
                {onCreateDataset ? (
                  <button type="button" className={styles.sidebarAction} onClick={onCreateDataset}>
                    <FiPlus aria-hidden="true" />
                    Upload dataset
                  </button>
                ) : null}
                {datasets.length === 0 ? <p className={styles.emptyHint}>No datasets yet</p> : null}
                {datasets.map((dataset) => (
                  <button
                    key={dataset.id}
                    type="button"
                    className={`${styles.navChild} ${
                      mainView === "dataset" && selectedDatasetId === dataset.id ? styles.active : ""
                    }`}
                    onClick={() => selectDataset(dataset.id)}
                    title={dataset.name}
                  >
                    <span className={styles.navIconSm} aria-hidden="true">
                      <FiHardDrive />
                    </span>
                    <span className={styles.itemContent}>
                      <span className={styles.itemTitle}>{dataset.name}</span>
                      <span className={styles.itemMeta}>{dataset.updated}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            className={`${styles.navFlat} ${mainView === "profile" ? styles.active : ""}`}
            onClick={() => {
              onSelectProfile();
              closeMobile();
            }}
            data-tooltip={railMode ? "Profile" : undefined}
          >
            <span className={styles.navIcon} aria-hidden="true">
              <FiUser />
            </span>
            {!railMode ? <span className={styles.navLabel}>Profile</span> : null}
          </button>
        </nav>
      </aside>

      <div className={styles.mainColumn}>
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <button
              type="button"
              className={styles.menuToggle}
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <FiMenu />
            </button>
            <h1 className={styles.appTitle}>{pageTitle}</h1>
          </div>

          <div className={styles.topBarRight}>
            <span className={styles.userName}>{displayName}</span>

            <div className={styles.avatarWrap} ref={avatarRef}>
              <button
                type="button"
                className={styles.avatarButton}
                aria-haspopup="menu"
                aria-expanded={avatarMenuOpen}
                onClick={() => setAvatarMenuOpen((value) => !value)}
              >
                <span className={styles.avatar}>{initials || "U"}</span>
              </button>
              {avatarMenuOpen ? (
                <div className={styles.avatarMenu} role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onSelectProfile();
                      setAvatarMenuOpen(false);
                    }}
                  >
                    <FiUser aria-hidden="true" />
                    Profile
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAvatarMenuOpen(false);
                      onSignOut();
                    }}
                  >
                    <FiLogOut aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className={styles.dashboardMain}>{children}</main>
      </div>
    </div>
  );
}
