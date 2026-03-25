import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, Header, Footer, HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType, PageNumber, PageBreak, LevelFormat } from 'docx';
import fs from 'fs';

const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: border, bottom: border, left: border, right: border };
const cellM = { top: 60, bottom: 60, left: 100, right: 100 };
const hdrShade = { fill: '1a1a2e', type: ShadingType.CLEAR };
const hdrRun = { bold: true, color: 'ffffff', font: 'DM Sans', size: 20 };
const cellRun = { font: 'DM Sans', size: 19, color: '222222' };

function hC(text, w) {
  return new TableCell({ borders, width: { size: w, type: WidthType.DXA }, shading: hdrShade, margins: cellM,
    children: [new Paragraph({ children: [new TextRun({ ...hdrRun, text })] })] });
}
function c(text, w, opts = {}) {
  return new TableCell({ borders, width: { size: w, type: WidthType.DXA }, margins: cellM,
    children: [new Paragraph({ children: [new TextRun({ ...cellRun, text, ...opts })] })] });
}

const W = 9506;

const doc = new Document({
  styles: {
    default: { document: { run: { font: 'DM Sans', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, font: 'DM Sans', color: '1a1a2e' },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'DM Sans', color: '2d3436' },
        paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 1 } },
    ]
  },
  numbering: { config: [{ reference: 'b', levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }] },
  sections: [{
    properties: {
      page: { size: { width: 11906, height: 16838 }, margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 } }
    },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Groupe Filatex - Inventaire Dashboard', font: 'DM Sans', size: 16, color: '999999', italics: true })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Page ', font: 'DM Sans', size: 16, color: '999999' }), new TextRun({ children: [PageNumber.CURRENT], font: 'DM Sans', size: 16, color: '999999' })] })] }) },
    children: [
      // TITLE
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: 'GROUPE FILATEX', font: 'DM Sans', size: 48, bold: true, color: '1a1a2e' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: 'PMO Dashboard', font: 'DM Sans', size: 32, color: '00ab63' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: 'Inventaire Complet du Projet', font: 'DM Sans', size: 26, color: '666666' })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: '25 Mars 2026 - v1.0', font: 'DM Sans', size: 20, color: '999999' })] }),

      // 1
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('1. Branches Git')] }),
      new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: '18 branches locales, dont 16 branches Claude (worktrees).', size: 20 })] }),
      new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [3000, 6506], rows: [
        new TableRow({ children: [hC('Branche', 3000), hC('Fonction', 6506)] }),
        new TableRow({ children: [c('main', 3000, { bold: true }), c('Production - deploye sur GitHub Pages', 6506)] }),
        new TableRow({ children: [c('claude/cool-chebyshev', 3000, { bold: true }), c('Branche de travail actuelle (worktree actif)', 6506)] }),
        new TableRow({ children: [c('claude/* (15 autres)', 3000), c('Anciens worktrees Claude - A NETTOYER', 6506, { color: 'E05C5C' })] }),
        new TableRow({ children: [c('enr-kpi-update', 3000), c('Mise a jour KPI ENR', 6506)] }),
      ]}),

      // 2
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('2. Chemins SharePoint / OneDrive')] }),
      new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: 'Base : C:\\Users\\Meril\\OneDrive - GROUPE FILATEX\\Fichiers de DOSSIER DASHBOARD - Data_Dashbords\\', size: 17, italics: true, color: '555555' })] }),
      new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [3500, 3000, 3006], rows: [
        new TableRow({ children: [hC('Dossier OneDrive', 3500), hC('Contenu', 3000), hC('Script Python', 3006)] }),
        new TableRow({ children: [c('.../01_Energy/Production/HFO/{site}/', 3500), c('Rapports quotidiens HFO 5 sites', 3000), c('generate_data.py', 3006)] }),
        new TableRow({ children: [c('.../01_Energy/Production/EnR/', 3500), c('Production solaire 3 sites', 3000), c('generate_enr_data.py', 3006)] }),
        new TableRow({ children: [c('.../01_Energy/Projet/EnR/Weekly_Report/', 3500), c('Weekly ENR + Paiements', 3000), c('generate_reporting.py', 3006)] }),
        new TableRow({ children: [c('.../01_Energy/Projet/EnR/', 3500), c('Fichiers projet ENR individuels', 3000), c('generate_enr_projects.py', 3006)] }),
        new TableRow({ children: [c('.../01_Energy/Projet/HFO/', 3500), c('CAPEX HFO', 3000), c('generate_capex.py', 3006)] }),
        new TableRow({ children: [c('.../02_Properties/Reporting/', 3500), c('COM_Reporting.xlsx', 3000), c('generate_com_reporting.py', 3006)] }),
        new TableRow({ children: [c('.../03_ Investments/Reporting/', 3500), c('Weekly Investments', 3000), c('app.py (API)', 3006)] }),
      ]}),

      // 3
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('3. Pipeline : Excel -> Python -> JS -> React')] }),
      new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [2800, 2800, 2400, 1506], rows: [
        new TableRow({ children: [hC('Script Python', 2800), hC('Source Excel', 2800), hC('Sortie JS', 2400), hC('Volume', 1506)] }),
        new TableRow({ children: [c('generate_data.py', 2800), c('HFO 5 sites (.xlsx)', 2800), c('site_data.js', 2400), c('5 sites', 1506)] }),
        new TableRow({ children: [c('generate_enr_data.py', 2800), c('Production ENR', 2800), c('enr_site_data.js', 2400), c('3 sites', 1506)] }),
        new TableRow({ children: [c('generate_enr_projects.py', 2800), c('Projets ENR + Weekly', 2800), c('enr_projects_data.js', 2400), c('21 projets', 1506)] }),
        new TableRow({ children: [c('generate_hfo_projects.py', 2800), c('Projets HFO', 2800), c('hfo_projects.js', 2400), c('57 projets', 1506)] }),
        new TableRow({ children: [c('generate_reporting.py', 2800), c('Weekly ENR', 2800), c('reporting_data.js', 2400), c('Multi-sem.', 1506)] }),
        new TableRow({ children: [c('generate_com_reporting.py', 2800), c('COM_Reporting.xlsx', 2800), c('com_reporting_data.js', 2400), c('3 cat.', 1506)] }),
        new TableRow({ children: [c('generate_capex.py', 2800), c('Fichiers CAPEX', 2800), c('capex_data.js', 2400), c('4 poles', 1506)] }),
      ]}),

      // 4
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('4. API Flask (port 5000)')] }),
      new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [1500, 3500, 4506], rows: [
        new TableRow({ children: [hC('Methode', 1500), hC('Route', 3500), hC('Description', 4506)] }),
        new TableRow({ children: [c('GET', 1500, { bold: true, color: '00ab63' }), c('/', 3500), c('Sert le build React', 4506)] }),
        new TableRow({ children: [c('GET', 1500, { bold: true, color: '00ab63' }), c('/api/tamatave', 3500), c('Donnees Tamatave JSON', 4506)] }),
        new TableRow({ children: [c('POST', 1500, { bold: true, color: 'f37056' }), c('/api/comment/enr', 3500), c('Sauvegarde commentaire DG dans Weekly ENR', 4506)] }),
        new TableRow({ children: [c('POST', 1500, { bold: true, color: 'f37056' }), c('/api/comment/investments', 3500), c('Sauvegarde commentaire Investments', 4506)] }),
        new TableRow({ children: [c('GET', 1500, { bold: true, color: '00ab63' }), c('/<path:path>', 3500), c('Catch-all : assets + SPA fallback', 4506)] }),
      ]}),

      // 5
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('5. Deploiement')] }),
      new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [2000, 3000, 4506], rows: [
        new TableRow({ children: [hC('Canal', 2000), hC('Config', 3000), hC('URL / Commande', 4506)] }),
        new TableRow({ children: [c('GitHub Pages', 2000, { bold: true }), c('.github/workflows/deploy.yml', 3000), c('merildev266.github.io/filatex-dashboard/', 4506)] }),
        new TableRow({ children: [c('Local Flask', 2000), c('app.py port 5000', 3000), c('python app.py', 4506)] }),
        new TableRow({ children: [c('Local Vite', 2000), c('npm run dev port 5173', 3000), c('cd frontend && npm run dev', 4506)] }),
        new TableRow({ children: [c('Desktop Tauri', 2000), c('src-tauri/tauri.conf.json', 3000), c('npm run tauri:dev / tauri:build', 4506)] }),
        new TableRow({ children: [c('PWA', 2000), c('vite-plugin-pwa', 3000), c('Installable Chrome/Safari', 4506)] }),
      ]}),

      // 6
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('6. Fichiers de configuration')] }),
      new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [4000, 5506], rows: [
        new TableRow({ children: [hC('Fichier', 4000), hC('Description', 5506)] }),
        new TableRow({ children: [c('CLAUDE.md', 4000, { bold: true }), c('Instructions projet Claude (architecture, conventions, skills)', 5506)] }),
        new TableRow({ children: [c('.claude/launch.json', 4000), c('Config serveurs preview (Flask + Vite)', 5506)] }),
        new TableRow({ children: [c('.github/workflows/deploy.yml', 4000), c('CI/CD GitHub Actions -> GitHub Pages', 5506)] }),
        new TableRow({ children: [c('frontend/package.json', 4000), c('Dependances (React 19, Vite 8, Tailwind 3, Tauri 2)', 5506)] }),
        new TableRow({ children: [c('frontend/vite.config.js', 4000), c('Config Vite (base path, PWA, proxy API)', 5506)] }),
        new TableRow({ children: [c('frontend/tailwind.config.js', 4000), c('Config Tailwind (couleurs Filatex)', 5506)] }),
        new TableRow({ children: [c('frontend/src-tauri/tauri.conf.json', 4000), c('Config Tauri desktop (fenetre 1440x900)', 5506)] }),
      ]}),

      // 7
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('7. Points d\'attention')] }),
      ...[
        ['16 branches Claude a nettoyer', 'anciens worktrees inutilises', 'E05C5C'],
        ['Aucun fichier .env', 'chemins OneDrive codes en dur (machine Meril uniquement)', 'f37056'],
        ['Deux versions paralleles', 'SPA legacy + React. Legacy sauvegarde dans legacy/', '222222'],
        ['Mot de passe hardcode', '"1979" en sessionStorage client (pas de vrai backend auth)', 'f37056'],
        ['Donnees non temps reel', 'fichiers JS generes manuellement. A connecter SharePoint API', '222222'],
        ['Tauri necessite Rust', 'installer Rust toolchain pour builder app desktop', '222222'],
      ].map(([title, desc, col]) =>
        new Paragraph({ numbering: { reference: 'b', level: 0 }, spacing: { after: 80 },
          children: [new TextRun({ text: title, bold: true, font: 'DM Sans', size: 20, color: col }), new TextRun({ text: ' - ' + desc, font: 'DM Sans', size: 20 })] })
      ),

      // 8
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('8. Prochaines etapes')] }),
      ...[
        ['Connecter SharePoint API', 'remplacer generate_*.py par appels API temps reel'],
        ['Deployer sur serveur Filatex', 'Flask + React build sur serveur interne'],
        ['App desktop Tauri', 'installer Rust et builder application'],
        ['Authentification serveur', 'remplacer mot de passe client par JWT + biometrique'],
        ['Nouvelles sections', 'Finance, Audit, RH (architecture prevue dans CLAUDE.md)'],
        ['Nettoyer les branches', 'supprimer les 16 branches claude/* inutilisees'],
      ].map(([title, desc]) =>
        new Paragraph({ numbering: { reference: 'b', level: 0 }, spacing: { after: 80 },
          children: [new TextRun({ text: title, bold: true, font: 'DM Sans', size: 20 }), new TextRun({ text: ' - ' + desc, font: 'DM Sans', size: 20 })] })
      ),
    ]
  }]
});

const buffer = await Packer.toBuffer(doc);
fs.writeFileSync('C:\\Users\\Meril\\OneDrive - GROUPE FILATEX\\1. DATA Meril HIVANAKO\\Bureau\\Filatex_Dashboard_Inventaire.docx', buffer);
console.log('OK - Document cree sur le bureau !');
