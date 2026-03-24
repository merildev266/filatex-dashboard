import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, BorderStyle, PageNumber,
  NumberFormat, Header, Footer, ShadingType, TableOfContents,
  convertInchesToTwip, LevelFormat, Tab, TabStopType, TabStopPosition
} from "docx";
import { writeFileSync } from "fs";

// ── Helpers ──────────────────────────────────────────────────────────────────
const FONT = "Calibri";
const ACCENT = "1B5E8C";
const GREY = "F2F2F2";

function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, font: FONT, size: 32, bold: true, color: ACCENT })],
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, font: FONT, size: 26, bold: true, color: "333333" })],
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, font: FONT, size: 22, ...opts })],
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { after: 80 },
    children: [new TextRun({ text, font: FONT, size: 22 })],
  });
}

function cellP(text, bold = false, color) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: 20, bold, color })],
  });
}

function headerCell(text) {
  return new TableCell({
    shading: { type: ShadingType.SOLID, color: ACCENT },
    children: [cellP(text, true, "FFFFFF")],
  });
}

function cell(text) {
  return new TableCell({ children: [cellP(text)] });
}

function simpleTable(headers, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: headers.map(h => headerCell(h)) }),
      ...rows.map(r => new TableRow({ children: r.map(c => cell(c)) })),
    ],
  });
}

// ── Document sections ────────────────────────────────────────────────────────

const children = [];

// 1. Page de garde
children.push(
  new Paragraph({ spacing: { before: 4000 } }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "FILATEX GROUP", font: FONT, size: 48, bold: true, color: ACCENT })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200 },
    children: [new TextRun({ text: "PMO Dashboard", font: FONT, size: 40, color: "555555" })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 600 },
    children: [new TextRun({ text: "Migration React + Tailwind CSS", font: FONT, size: 34, bold: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200 },
    children: [new TextRun({ text: "Document de Build v2", font: FONT, size: 28, color: "666666" })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 600 },
    children: [new TextRun({ text: "25 mars 2026", font: FONT, size: 24, color: "888888" })],
  }),
  new Paragraph({ spacing: { before: 2000 } }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Confidentiel — Usage interne uniquement", font: FONT, size: 20, italics: true, color: "999999" })],
  }),
  new Paragraph({ pageBreakBefore: true, children: [] }),
);

// 2. Objectif
children.push(
  heading1("1. Objectif de la migration"),
  para("La migration du dashboard PMO Filatex depuis une SPA vanilla (HTML/CSS/JS) vers une architecture React + Tailwind CSS répond à trois objectifs stratégiques :"),
  heading2("1.1 Maintenabilité"),
  bullet("Code modulaire avec composants React réutilisables"),
  bullet("Séparation stricte des responsabilités (composants, hooks, services)"),
  bullet("TypeScript prévu en phase 2 pour le typage statique"),
  bullet("Tests unitaires et d'intégration avec Vitest + Testing Library"),
  heading2("1.2 Mobile-first"),
  bullet("Tailwind CSS avec classes utilitaires responsive (sm:, md:, lg:)"),
  bullet("PWA installable sur iOS et Android"),
  bullet("Navigation bottom-bar adaptée au tactile"),
  bullet("Performances optimisées (lazy loading, code splitting)"),
  heading2("1.3 Extensibilité"),
  bullet("Ajout de nouvelles sections (Finance, Audit, RH) sans impact sur l'existant"),
  bullet("Architecture plugin-ready avec lazy loading par route"),
  bullet("Système de données centralisé (contextes React + futurs appels API)"),
  new Paragraph({ pageBreakBefore: true, children: [] }),
);

// 3. Stack technique
children.push(
  heading1("2. Stack technique"),
  simpleTable(
    ["Technologie", "Version", "Rôle"],
    [
      ["React", "18.x", "Bibliothèque UI — composants, hooks, état"],
      ["Vite", "5.x", "Bundler / dev server (HMR rapide)"],
      ["Tailwind CSS", "3.x", "Framework CSS utilitaire responsive"],
      ["React Router", "6.x", "Routage SPA (routes imbriquées)"],
      ["Flask", "3.x", "Backend API (Python) — commentaires, données"],
      ["Tauri", "2.x", "Application desktop native (Rust)"],
      ["vite-plugin-pwa", "0.x", "Progressive Web App (service worker, manifest)"],
      ["Vitest", "1.x", "Tests unitaires et d'intégration"],
      ["GitHub Actions", "—", "CI/CD — build + déploiement GitHub Pages"],
    ],
  ),
  new Paragraph({ pageBreakBefore: true, children: [] }),
);

// 4. Architecture
children.push(
  heading1("3. Architecture du projet"),
  heading2("3.1 Arborescence frontend/"),
  para("frontend/", { bold: true }),
  bullet("src/"),
  bullet("components/          — Composants réutilisables (KPI, Card, Table)", 1),
  bullet("pages/               — Pages principales par section", 1),
  bullet("pages/Energy/         — HFO + ENR", 2),
  bullet("pages/Properties/     — Dev, Travaux, SAV, Commercial, Foncier, Location", 2),
  bullet("pages/Capex/          — CAPEX par catégorie", 2),
  bullet("pages/Investments/    — Investissements internes/externes", 2),
  bullet("pages/Reporting/      — Reporting multi-pôle", 2),
  bullet("pages/CSI/            — CSI", 2),
  bullet("pages/Home/           — Accueil dashboard", 2),
  bullet("hooks/               — Custom hooks (useFilter, useAuth, useData)", 1),
  bullet("contexts/            — React contexts (AuthContext, FilterContext)", 1),
  bullet("services/            — Appels API, utilitaires données", 1),
  bullet("data/                — Données embarquées (migration depuis *_data.js)", 1),
  bullet("styles/              — Fichiers CSS complémentaires (animations)", 1),
  bullet("public/              — Assets statiques (logos SVG, favicon, manifest)", 1),
  bullet("tailwind.config.js   — Configuration Tailwind (couleurs, breakpoints)"),
  bullet("vite.config.js       — Configuration Vite (plugins, alias)"),
  bullet("index.html           — Point d'entrée HTML"),

  heading2("3.2 Principe d'isolation par section"),
  para("Chaque section métier (Energy, Properties, CAPEX, etc.) vit dans son propre dossier sous pages/. Les composants partagés sont dans components/. Cette architecture garantit qu'une modification dans une section n'impacte jamais les autres."),
  new Paragraph({ pageBreakBefore: true, children: [] }),
);

// 5. Sections métier
children.push(
  heading1("4. Sections métier"),

  heading2("4.1 Energy — HFO (5 sites)"),
  para("Suivi de la production thermique HFO sur 5 sites à Madagascar."),
  simpleTable(
    ["Site", "Contrat (MW)", "MW/moteur", "Nb moteurs"],
    [
      ["Tamatave", "32", "1.85", "13"],
      ["Diego", "18.5", "1.2", "10"],
      ["Majunga", "16.3", "2.0", "5"],
      ["Tuléar", "9.9", "—", "—"],
      ["Antsirabe", "7.5", "—", "—"],
    ],
  ),
  para(""),
  para("KPIs affichés : MW disponible, production MWh, SFOC, SLOC, heures de marche, blackouts, stock fuel. 57 projets HFO suivis (overhauls, maintenance, installation, SCADA)."),

  heading2("4.2 Energy — ENR (solaire + projets)"),
  para("Sites de production existants :"),
  bullet("Diego — 2.4 MW"),
  bullet("Tamatave — 2.0 MW"),
  bullet("Majunga — 1.2 MW"),
  para("Pipeline de 21 projets : 161.2 MWc, 45 MWh BESS, 157.6 M$ CAPEX total."),
  para("Champs projet : pvMw, bessMwh, capexM, tri, engPct, constPct, spi, cpi."),

  heading2("4.3 Properties (6 sous-sections)"),
  simpleTable(
    ["Sous-section", "Description", "Nb projets"],
    [
      ["Développement (DEV)", "Projets immobiliers nouveaux", "11"],
      ["Travaux (TVX)", "Projets en cours de construction", "33"],
      ["SAV", "Service après-vente — 35 étapes", "13"],
      ["Commercial — Vente immobilière", "Ventes d'immeubles", "—"],
      ["Commercial — Vente foncière", "Ventes de terrains", "—"],
      ["Commercial — Location", "Biens en location", "—"],
    ],
  ),
  para(""),
  para("Champs : name, site, responsable, étape, timing_var (On Time / Delay), budget_var, status_cps."),

  heading2("4.4 CAPEX (4 pôles)"),
  simpleTable(
    ["Pôle", "Périmètre"],
    [
      ["ENAT", "Énergie et activités techniques"],
      ["Infrastructure", "Bâtiments, routes, réseaux"],
      ["Tech", "Systèmes IT, logiciels, équipements"],
      ["Études", "Études de faisabilité, audits techniques"],
    ],
  ),
  para(""),
  para("Champs : budget initial, incurred, H1/H2 2026, projection 2027, TRI."),

  heading2("4.5 Investments (19 projets)"),
  para("12 investissements externes : OASIS (5.6 M$), Seedstars (4.3 M$), Hotel Tamatave (2.7 M$), BGFI, Energiestro, etc."),
  para("7 investissements internes : Café Mary, GHU, HAYA, Hakanto House, etc."),
  para("Champs : invest (budget), état (réalisé), pct (exécution %), responsable."),

  heading2("4.6 Reporting"),
  para("Dashboard de reporting consolidé par pôle : ENR, HFO, LFO, Properties, Investments."),
  bullet("LFO : filtres moteurs (tous, installés, au F23, à rapatrier, à définir)"),
  bullet("Commercial : objectifs trimestriels (T1-T4) réalisé vs objectif en EUR"),

  heading2("4.7 CSI"),
  para("Section dédiée au suivi CSI (Corporate Social Investment). Contenu en cours de définition."),
  new Paragraph({ pageBreakBefore: true, children: [] }),
);

// 6. Corrections visuelles
children.push(
  heading1("5. Corrections visuelles"),
  heading2("5.1 Logos SVG"),
  para("Tous les logos du dashboard sont migrés en SVG pour garantir la netteté sur tous les écrans (Retina, 4K, mobile)."),
  bullet("Logo Filatex principal — SVG inline dans le composant Header"),
  bullet("Icônes de navigation — SVG via composants React dédiés"),
  bullet("Logos des pôles — SVG avec couleurs paramétrables via props"),

  heading2("5.2 Classes CSS originales"),
  para("Les classes CSS du dashboard legacy sont conservées comme référence pour assurer la cohérence visuelle pendant la migration :"),
  simpleTable(
    ["Préfixe legacy", "Section", "Équivalent Tailwind"],
    [
      [".e-*", "Energy", "Classes utilitaires + composants Energy"],
      [".rpt-*", "Reporting", "Classes utilitaires + composants Reporting"],
      [".enrp-*", "Projets ENR", "Classes utilitaires + composants ENR"],
      [".bnav-*", "Bottom nav", "Classes utilitaires + composant BottomNav"],
      [".inner-*", "Panels internes", "Classes utilitaires + layout SlidePanel"],
      [".kpi-*", "KPI boxes", "Composant KpiBox avec Tailwind"],
    ],
  ),
  new Paragraph({ pageBreakBefore: true, children: [] }),
);

// 7. PWA
children.push(
  heading1("6. Progressive Web App (PWA)"),
  heading2("6.1 Configuration vite-plugin-pwa"),
  para("Le plugin vite-plugin-pwa génère automatiquement le service worker et le manifest.json. Configuration clé :"),
  bullet("registerType: 'autoUpdate' — mise à jour automatique en arrière-plan"),
  bullet("workbox.runtimeCaching — cache des assets et données API"),
  bullet("manifest.name: 'Filatex PMO Dashboard'"),
  bullet("manifest.short_name: 'Filatex PMO'"),
  bullet("manifest.theme_color: '#080b18'"),
  bullet("manifest.icons — icônes 192x192 et 512x512 (PNG + maskable)"),

  heading2("6.2 Service Worker"),
  para("Stratégie de cache :"),
  bullet("Assets statiques (JS, CSS, images) : Cache First"),
  bullet("Données API : Network First avec fallback cache"),
  bullet("Navigation : Network First"),

  heading2("6.3 Installation mobile"),
  para("L'application est installable sur iOS (Safari) et Android (Chrome) via le prompt natif « Ajouter à l'écran d'accueil ». L'icône apparaît comme une application native."),
  new Paragraph({ pageBreakBefore: true, children: [] }),
);

// 8. Desktop Tauri
children.push(
  heading1("7. Application Desktop — Tauri"),
  heading2("7.1 Scaffold"),
  para("Tauri 2.x est utilisé pour packager le dashboard en application desktop native (Windows, macOS, Linux). Le frontend React est intégré directement."),
  bullet("src-tauri/          — Code Rust Tauri"),
  bullet("src-tauri/tauri.conf.json — Configuration fenêtre, titre, permissions"),
  bullet("src-tauri/src/main.rs     — Point d'entrée Rust"),

  heading2("7.2 Configuration"),
  simpleTable(
    ["Paramètre", "Valeur"],
    [
      ["Titre fenêtre", "Filatex PMO Dashboard"],
      ["Dimensions par défaut", "1440 × 900"],
      ["Redimensionnable", "Oui"],
      ["Plein écran", "Disponible (F11)"],
      ["Icône", "Logo Filatex SVG converti en .ico/.icns"],
    ],
  ),

  heading2("7.3 Commandes Tauri"),
  para("Commandes personnalisées Rust exposées au frontend :"),
  bullet("open_excel — Ouvrir un fichier Excel avec l'application par défaut"),
  bullet("read_local_data — Lire des fichiers de données locaux"),
  bullet("notify — Afficher une notification système native"),
  new Paragraph({ pageBreakBefore: true, children: [] }),
);

// 9. GitHub Pages
children.push(
  heading1("8. Déploiement GitHub Pages"),
  heading2("8.1 Workflow GitHub Actions"),
  para("Le déploiement est automatisé via GitHub Actions. À chaque push sur la branche main, le workflow :"),
  bullet("Installe les dépendances (npm ci)"),
  bullet("Lance le build Vite (npm run build)"),
  bullet("Déploie le dossier dist/ sur GitHub Pages"),

  heading2("8.2 URL de production"),
  para("https://merildev266.github.io/filatex-dashboard/", { bold: true }),
  para("Le base path Vite est configuré sur /filatex-dashboard/ pour correspondre au dépôt GitHub."),
  new Paragraph({ pageBreakBefore: true, children: [] }),
);

// 10. Archive legacy
children.push(
  heading1("9. Archive legacy/"),
  para("L'intégralité du code legacy (SPA vanilla) est archivée dans le dossier legacy/ à la racine du projet. Cela permet :"),
  bullet("De conserver une référence fonctionnelle du dashboard original"),
  bullet("De comparer le rendu visuel pendant la migration"),
  bullet("De récupérer des données ou logiques métier si nécessaire"),
  para("Structure de l'archive :"),
  bullet("legacy/index.html    — SPA complète originale"),
  bullet("legacy/js/           — Scripts JS par section"),
  bullet("legacy/css/          — Feuilles de style par section"),
  bullet("legacy/*_data.js     — Fichiers de données embarquées"),
  bullet("legacy/app.py        — Serveur Flask original"),
  new Paragraph({ pageBreakBefore: true, children: [] }),
);

// 11. Couleurs
children.push(
  heading1("10. Palette de couleurs"),
  para("Variables CSS / Tailwind définies dans tailwind.config.js :"),
  simpleTable(
    ["Variable CSS", "Hex", "Nom Tailwind", "Usage"],
    [
      ["--dark", "#080B18", "dark", "Fond principal du dashboard"],
      ["--energy", "#00AB63", "energy", "Section Energy, statut « on time »"],
      ["--props", "#FDB823", "props", "Section Properties"],
      ["--capex", "#5E4C9F", "capex", "Section CAPEX"],
      ["--invest", "#F37056", "invest", "Section Investments"],
      ["—", "#5AAFAF", "teal", "Étapes, éléments secondaires"],
      ["—", "#E05C5C", "danger", "Retards, alertes critiques"],
      ["—", "#426AB3", "blue", "Développement, liens"],
      ["—", "#1B5E8C", "accent", "Titres, éléments d'accentuation"],
      ["—", "#FFFFFF", "white", "Texte sur fond sombre"],
      ["—", "#F2F2F2", "grey-light", "Fonds de tableaux alternés"],
    ],
  ),
  para(""),
  para("Des couleurs distinctes sont réservées pour les futures sections :"),
  bullet("Finance — à définir (suggestion : #2E86AB bleu finance)"),
  bullet("Audit — à définir (suggestion : #A23B72 magenta)"),
  bullet("RH — à définir (suggestion : #F18F01 orange doré)"),
  new Paragraph({ pageBreakBefore: true, children: [] }),
);

// 12. Prochaines étapes
children.push(
  heading1("11. Prochaines étapes"),

  heading2("11.1 Intégration SharePoint / OneDrive"),
  bullet("Remplacement des fichiers *_data.js par des appels API Microsoft Graph"),
  bullet("Authentification MSAL (Azure AD) pour accéder aux fichiers Excel OneDrive"),
  bullet("Synchronisation automatique des données (webhook ou polling)"),
  bullet("Cache local avec invalidation pour fonctionnement hors-ligne"),

  heading2("11.2 Publication App Store"),
  bullet("iOS : encapsulation via Capacitor ou build Tauri iOS (beta)"),
  bullet("Android : encapsulation via Capacitor ou build Tauri Android (beta)"),
  bullet("Windows Store : packaging MSIX via Tauri"),
  bullet("macOS App Store : packaging DMG/PKG via Tauri"),

  heading2("11.3 Nouvelles sections métier"),
  bullet("Finance — tableaux de bord financiers consolidés"),
  bullet("Audit — suivi des audits internes et externes"),
  bullet("RH — indicateurs ressources humaines"),

  heading2("11.4 Améliorations techniques"),
  bullet("Migration TypeScript (phase 2)"),
  bullet("Tests E2E avec Playwright"),
  bullet("Monitoring erreurs (Sentry)"),
  bullet("Internationalisation (i18n) français / anglais"),
);

// ── Build document ───────────────────────────────────────────────────────────
const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: "Filatex PMO Dashboard — Document de Build v2", font: FONT, size: 16, color: "999999", italics: true }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "Page ", font: FONT, size: 16, color: "999999" }),
                new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 16, color: "999999" }),
                new TextRun({ text: " / ", font: FONT, size: 16, color: "999999" }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 16, color: "999999" }),
              ],
            }),
          ],
        }),
      },
      children,
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
const outPath = new URL("./Filatex_React_Migration_Build.docx", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
writeFileSync(outPath, buffer);
console.log("Document generated:", outPath);
