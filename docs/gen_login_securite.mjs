import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, BorderStyle, PageNumber,
  NumberFormat, Header, Footer, ShadingType,
  convertInchesToTwip
} from "docx";
import { writeFileSync } from "fs";

// ── Helpers ──────────────────────────────────────────────────────────────────
const FONT = "Calibri";
const ACCENT = "1B5E8C";
const GREY = "F2F2F2";
const RED = "C0392B";
const GREEN = "27AE60";

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

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, font: FONT, size: 24, bold: true, color: "555555" })],
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, font: FONT, size: 22, ...opts })],
  });
}

function paraRuns(runs) {
  return new Paragraph({
    spacing: { after: 120 },
    children: runs.map(r => new TextRun({ font: FONT, size: 22, ...r })),
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { after: 80 },
    children: [new TextRun({ text, font: FONT, size: 22 })],
  });
}

function bulletBold(label, text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { after: 80 },
    children: [
      new TextRun({ text: label, font: FONT, size: 22, bold: true }),
      new TextRun({ text, font: FONT, size: 22 }),
    ],
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

function shadedCell(text) {
  return new TableCell({
    shading: { type: ShadingType.SOLID, color: GREY },
    children: [cellP(text)],
  });
}

function simpleTable(headers, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: headers.map(h => headerCell(h)) }),
      ...rows.map((r, i) =>
        new TableRow({
          children: r.map(c => i % 2 === 1 ? shadedCell(c) : cell(c)),
        })
      ),
    ],
  });
}

function spacer(pts = 200) {
  return new Paragraph({ spacing: { before: pts } });
}

function note(text) {
  return new Paragraph({
    spacing: { after: 120 },
    indent: { left: convertInchesToTwip(0.3) },
    border: {
      left: { style: BorderStyle.SINGLE, size: 6, color: ACCENT },
    },
    children: [new TextRun({ text: "\u2139\uFE0F  " + text, font: FONT, size: 20, italics: true, color: "555555" })],
  });
}

function importantNote(text) {
  return new Paragraph({
    spacing: { after: 120 },
    indent: { left: convertInchesToTwip(0.3) },
    border: {
      left: { style: BorderStyle.SINGLE, size: 6, color: RED },
    },
    children: [new TextRun({ text: "\u26A0\uFE0F  " + text, font: FONT, size: 20, bold: true, color: RED })],
  });
}

// ── Document content ────────────────────────────────────────────────────────

const children = [];

// ═══════════════════════════════════════════════════════════════════════════
// 1. PAGE DE GARDE
// ═══════════════════════════════════════════════════════════════════════════
children.push(
  new Paragraph({ spacing: { before: 3000 } }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: "GROUPE FILATEX", font: FONT, size: 44, bold: true, color: ACCENT })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", font: FONT, size: 28, color: "CCCCCC" })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    children: [new TextRun({ text: "Dashboard PMO", font: FONT, size: 36, color: "333333" })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: "Système d'Authentification", font: FONT, size: 32, bold: true, color: ACCENT })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: "et Sécurité du Login", font: FONT, size: 32, bold: true, color: ACCENT })],
  }),
  new Paragraph({ spacing: { before: 1500 } }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: "Document Technique", font: FONT, size: 24, italics: true, color: "777777" })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: "Mars 2026", font: FONT, size: 22, color: "777777" })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Version 1.0 — Confidentiel", font: FONT, size: 20, color: "999999" })],
  }),
  new Paragraph({ pageBreakBefore: true, children: [] }),
);

// ═══════════════════════════════════════════════════════════════════════════
// 2. ARCHITECTURE DU SYSTÈME
// ═══════════════════════════════════════════════════════════════════════════
children.push(
  heading1("1. Architecture du système"),
  para("Le Dashboard PMO Filatex repose sur une architecture web moderne, conçue pour un déploiement sur le réseau interne du Groupe Filatex. Voici les composants principaux :"),
  spacer(100),

  heading2("1.1 Composants techniques"),
  simpleTable(
    ["Composant", "Technologie", "Rôle"],
    [
      ["Serveur web", "Flask (Python)", "Sert l'application et les API REST"],
      ["Frontend", "React (Vite)", "Interface utilisateur, compilée dans frontend/dist/"],
      ["Base de données", "SQLite (dashboard.db)", "Stockage des utilisateurs, rôles et historique"],
      ["Authentification", "JWT (JSON Web Tokens)", "Gestion des sessions utilisateur"],
      ["Hachage", "bcrypt", "Sécurisation des mots de passe"],
    ]
  ),
  spacer(100),

  heading2("1.2 Schéma de fonctionnement"),
  para("Le flux d'authentification suit les étapes suivantes :"),
  bullet("L'utilisateur accède au dashboard via son navigateur (http://serveur:5000)"),
  bullet("Il saisit son identifiant et son mot de passe sur la page de login"),
  bullet("Flask vérifie les identifiants contre la base SQLite (mot de passe haché bcrypt)"),
  bullet("Si les identifiants sont valides, Flask génère un token JWT signé"),
  bullet("Le token est stocké dans le sessionStorage du navigateur"),
  bullet("Chaque requête API inclut ce token dans l'en-tête Authorization"),
  bullet("Flask vérifie le token à chaque requête avant de répondre"),
  spacer(100),

  heading2("1.3 Hébergement"),
  para("Le serveur Flask est déployé en interne sur le réseau Filatex. Il n'est pas exposé directement sur Internet, ce qui constitue une première couche de sécurité importante."),
  note("Le serveur écoute sur le port 5000 par défaut. Seuls les postes connectés au réseau interne (ou via VPN) peuvent y accéder."),
  new Paragraph({ pageBreakBefore: true, children: [] }),
);

// ═══════════════════════════════════════════════════════════════════════════
// 3. SÉCURITÉ DES MOTS DE PASSE
// ═══════════════════════════════════════════════════════════════════════════
children.push(
  heading1("2. Sécurité des mots de passe"),
  para("La protection des mots de passe est un élément fondamental de la sécurité du dashboard. Aucun mot de passe n'est jamais stocké en clair dans la base de données."),
  spacer(100),

  heading2("2.1 Hachage bcrypt"),
  para("Chaque mot de passe est transformé par l'algorithme bcrypt avant d'être enregistré dans la base SQLite. Bcrypt est un algorithme de hachage spécialement conçu pour les mots de passe, reconnu comme l'un des plus sûrs du marché."),
  spacer(50),
  paraRuns([
    { text: "Fonctionnement : ", bold: true },
    { text: "Lors de la création d'un compte, le mot de passe saisi est haché avec bcrypt. Seul le résultat du hachage (appelé « hash ») est stocké en base. Lors de la connexion, le mot de passe saisi est de nouveau haché et comparé au hash stocké." },
  ]),
  spacer(100),

  heading2("2.2 Salt unique par utilisateur"),
  para("Bcrypt intègre automatiquement un « salt » (valeur aléatoire) unique pour chaque mot de passe haché. Cela signifie que :"),
  bullet("Deux utilisateurs ayant le même mot de passe auront des hash différents"),
  bullet("Les attaques par tables arc-en-ciel (rainbow tables) sont inefficaces"),
  bullet("Chaque hash est unique, même pour des mots de passe identiques"),
  spacer(100),

  heading2("2.3 Irréversibilité"),
  importantNote("Il est mathématiquement impossible de retrouver le mot de passe original à partir du hash bcrypt. En cas d'oubli, le mot de passe doit être réinitialisé par l'administrateur."),
  spacer(100),

  simpleTable(
    ["Propriété", "Valeur"],
    [
      ["Algorithme", "bcrypt (Blowfish)"],
      ["Longueur du salt", "128 bits (22 caractères base64)"],
      ["Coût (work factor)", "12 rounds par défaut"],
      ["Taille du hash", "60 caractères"],
      ["Réversible", "Non — hachage à sens unique"],
    ]
  ),
  new Paragraph({ pageBreakBefore: true, children: [] }),
);

// ═══════════════════════════════════════════════════════════════════════════
// 4. GESTION DES SESSIONS (JWT)
// ═══════════════════════════════════════════════════════════════════════════
children.push(
  heading1("3. Gestion des sessions (JWT)"),
  para("Une fois l'utilisateur authentifié, le serveur génère un JSON Web Token (JWT) qui sert de « ticket d'accès » pour toute la durée de la session."),
  spacer(100),

  heading2("3.1 Structure du token JWT"),
  para("Le token JWT contient trois parties encodées en Base64 :"),
  simpleTable(
    ["Partie", "Contenu", "Description"],
    [
      ["Header", "Algorithme + Type", "Spécifie HS256 et le type JWT"],
      ["Payload", "Données utilisateur", "user_id, username, role, permissions, exp (expiration)"],
      ["Signature", "HMAC-SHA256", "Vérification d'intégrité avec JWT_SECRET"],
    ]
  ),
  spacer(100),

  heading2("3.2 Signature et vérification"),
  para("Le token est signé avec une clé secrète (JWT_SECRET) connue uniquement du serveur. Toute modification du token (même d'un seul caractère) invalide la signature. Le serveur vérifie la signature à chaque requête API."),
  spacer(100),

  heading2("3.3 Expiration automatique"),
  bullet("Le token expire automatiquement après 8 heures"),
  bullet("Après expiration, l'utilisateur doit se reconnecter"),
  bullet("Pas de mécanisme de refresh token (par conception, pour la sécurité)"),
  spacer(100),

  heading2("3.4 Stockage côté client"),
  para("Le token JWT est stocké dans le sessionStorage du navigateur, et non dans un cookie. Cela signifie :"),
  bullet("Le token est supprimé automatiquement à la fermeture de l'onglet"),
  bullet("Le token n'est pas envoyé automatiquement avec les requêtes (protection CSRF)"),
  bullet("Le token n'est pas accessible depuis d'autres domaines"),
  note("Le sessionStorage est isolé par onglet. Ouvrir un nouvel onglet nécessite une nouvelle connexion."),
  new Paragraph({ pageBreakBefore: true, children: [] }),
);

// ═══════════════════════════════════════════════════════════════════════════
// 5. PROTECTION CONTRE LES ATTAQUES
// ═══════════════════════════════════════════════════════════════════════════
children.push(
  heading1("4. Protection contre les attaques"),
  para("Plusieurs mécanismes sont en place pour protéger le dashboard contre les attaques courantes."),
  spacer(100),

  heading2("4.1 Verrouillage automatique (brute force)"),
  para("Après 5 tentatives de connexion échouées consécutives, le compte est automatiquement verrouillé. Ce mécanisme empêche les attaques par force brute (essai systématique de mots de passe)."),
  bullet("Seuil : 5 tentatives échouées"),
  bullet("Action : verrouillage du compte"),
  bullet("Déverrouillage : uniquement par l'administrateur (PMO)"),
  spacer(100),

  heading2("4.2 Historique des connexions"),
  para("Chaque tentative de connexion est enregistrée dans la base de données avec les informations suivantes :"),
  simpleTable(
    ["Information", "Description", "Utilité"],
    [
      ["Identifiant", "Nom d'utilisateur saisi", "Identification de l'utilisateur"],
      ["Adresse IP", "IP du poste client", "Traçabilité géographique"],
      ["Date et heure", "Horodatage précis", "Chronologie des événements"],
      ["Résultat", "Succès ou échec", "Détection d'anomalies"],
      ["Raison échec", "Mot de passe incorrect, compte verrouillé, etc.", "Diagnostic"],
    ]
  ),
  spacer(100),

  heading2("4.3 Décorateurs de sécurité API"),
  para("Les endpoints API sont protégés par des décorateurs Python qui vérifient l'authentification et les permissions avant d'exécuter la logique métier :"),
  bulletBold("@require_auth : ", "vérifie que le token JWT est valide et non expiré. Toute requête sans token valide reçoit une erreur 401 (Non autorisé)."),
  bulletBold("@require_pmo : ", "vérifie en plus que l'utilisateur possède le rôle Admin/PMO. Les utilisateurs standards ne peuvent pas accéder aux fonctions d'administration."),
  spacer(100),

  heading2("4.4 Autres protections"),
  bullet("Pas de données sensibles dans les URLs (paramètres GET)"),
  bullet("Les réponses d'erreur ne révèlent pas si c'est l'identifiant ou le mot de passe qui est incorrect"),
  bullet("Les tokens expirés sont rejetés immédiatement"),
  bullet("La clé JWT_SECRET n'est jamais exposée côté client"),
  new Paragraph({ pageBreakBefore: true, children: [] }),
);

// ═══════════════════════════════════════════════════════════════════════════
// 6. RÔLES ET PERMISSIONS
// ═══════════════════════════════════════════════════════════════════════════
children.push(
  heading1("5. Rôles et permissions"),
  para("Le système implémente un contrôle d'accès basé sur les rôles (RBAC) avec deux niveaux principaux et des permissions granulaires par sous-section."),
  spacer(100),

  heading2("5.1 Rôles disponibles"),
  simpleTable(
    ["Rôle", "Accès", "Administration"],
    [
      ["Admin (PMO)", "Toutes les sections et sous-sections", "Oui — gestion des utilisateurs, déverrouillage, historique"],
      ["Utilisateur", "Sections autorisées uniquement", "Non — aucun accès à la page d'administration"],
    ]
  ),
  spacer(100),

  heading2("5.2 Sous-sections et permissions"),
  para("Les permissions sont attribuées par sous-section. Un utilisateur peut avoir accès à certaines sous-sections et pas à d'autres :"),
  spacer(50),

  heading3("Energy"),
  bullet("HFO — Centrales thermiques (Tamatave, Diego, Majunga, Tuléar, Antsirabe)"),
  bullet("EnR — Centrales solaires et projets pipeline"),
  spacer(50),

  heading3("CAPEX"),
  bullet("HFO — Budget CAPEX des centrales thermiques"),
  bullet("EnR — Budget CAPEX des projets solaires"),
  bullet("Properties — Budget CAPEX immobilier"),
  bullet("Investments — Budget CAPEX investissements"),
  spacer(50),

  heading3("Reporting"),
  bullet("HFO + LFO — Reporting moteurs thermiques"),
  bullet("EnR — Reporting centrales solaires"),
  bullet("Properties — Reporting immobilier (Dev, Travaux, SAV, Commercial)"),
  bullet("Investments — Reporting investissements internes/externes"),
  spacer(100),

  para("L'administrateur PMO configure les permissions de chaque utilisateur depuis la page d'administration du dashboard."),
  new Paragraph({ pageBreakBefore: true, children: [] }),
);

// ═══════════════════════════════════════════════════════════════════════════
// 7. HÉBERGEMENT SERVEUR
// ═══════════════════════════════════════════════════════════════════════════
children.push(
  heading1("6. Hébergement serveur"),
  para("Le dashboard est conçu pour être hébergé sur un serveur interne du Groupe Filatex, garantissant un contrôle total sur l'accès et les données."),
  spacer(100),

  heading2("6.1 Configuration serveur"),
  simpleTable(
    ["Paramètre", "Valeur", "Notes"],
    [
      ["Framework", "Flask (Python)", "Serveur WSGI"],
      ["Port", "5000", "Configurable via variable d'environnement"],
      ["Base de données", "dashboard.db (SQLite)", "Fichier local sur le serveur"],
      ["Frontend", "frontend/dist/", "Build React (Vite) pré-compilé"],
      ["Réseau", "Interne Filatex", "Non exposé sur Internet par défaut"],
    ]
  ),
  spacer(100),

  heading2("6.2 Accès réseau"),
  para("Par défaut, le serveur Flask est accessible uniquement depuis le réseau interne Filatex. Cela signifie que seuls les collaborateurs connectés au réseau de l'entreprise (filaire, Wi-Fi ou VPN) peuvent accéder au dashboard."),
  spacer(50),
  para("Pour un accès depuis l'extérieur du réseau, deux options sont recommandées :"),
  bulletBold("VPN : ", "les utilisateurs se connectent d'abord au VPN Filatex, puis accèdent au dashboard comme s'ils étaient sur le réseau interne."),
  bulletBold("Reverse proxy (Nginx) : ", "un serveur Nginx est placé devant Flask pour gérer le HTTPS (certificat SSL/TLS), la compression et le load balancing."),
  spacer(100),

  heading2("6.3 Sécurisation de JWT_SECRET"),
  importantNote("La variable JWT_SECRET est la clé utilisée pour signer les tokens JWT. Elle DOIT être changée avant la mise en production."),
  spacer(50),
  para("Recommandations :"),
  bullet("Utiliser une chaîne aléatoire d'au moins 64 caractères"),
  bullet("Stocker la clé dans une variable d'environnement (pas dans le code source)"),
  bullet("Ne jamais commiter la clé dans le dépôt Git"),
  bullet("Changer la clé périodiquement (tous les 6 mois minimum)"),
  spacer(50),
  note("Exemple de configuration : export JWT_SECRET=\"votre_cle_aleatoire_de_64_caracteres\" dans le fichier .env du serveur."),
  new Paragraph({ pageBreakBefore: true, children: [] }),
);

// ═══════════════════════════════════════════════════════════════════════════
// 8. MODE HORS-LIGNE (GITHUB PAGES)
// ═══════════════════════════════════════════════════════════════════════════
children.push(
  heading1("7. Mode hors-ligne (GitHub Pages)"),
  para("En parallèle du serveur interne, une version simplifiée du dashboard peut être déployée sur GitHub Pages comme solution de secours."),
  spacer(100),

  heading2("7.1 Fonctionnement"),
  simpleTable(
    ["Caractéristique", "Serveur interne", "GitHub Pages"],
    [
      ["Authentification", "JWT + bcrypt + SQLite", "Mot de passe simple « 1979 »"],
      ["Gestion utilisateurs", "Oui (rôles, permissions)", "Non (accès unique)"],
      ["Historique connexions", "Oui (IP, date, résultat)", "Non"],
      ["Verrouillage compte", "Oui (après 5 tentatives)", "Non"],
      ["Données", "API Flask temps réel", "Données JS embarquées (statiques)"],
      ["HTTPS", "Via Nginx / reverse proxy", "Automatique (github.io)"],
    ]
  ),
  spacer(100),

  heading2("7.2 Limitations"),
  para("Le mode GitHub Pages est un mode de démonstration avec des limitations importantes :"),
  bullet("Pas de gestion des utilisateurs ni de rôles"),
  bullet("Mot de passe unique partagé (« 1979 »), sans hachage"),
  bullet("Pas de traçabilité des connexions"),
  bullet("Données statiques (pas de mise à jour en temps réel)"),
  spacer(100),

  heading2("7.3 Stratégie à terme"),
  para("Le mode GitHub Pages sera progressivement abandonné au profit du serveur interne uniquement. Il pourra rester actif temporairement pour des démonstrations ou des accès d'urgence, mais ne devra pas être utilisé pour la gestion quotidienne."),
  new Paragraph({ pageBreakBefore: true, children: [] }),
);

// ═══════════════════════════════════════════════════════════════════════════
// 9. COMPTE PAR DÉFAUT
// ═══════════════════════════════════════════════════════════════════════════
children.push(
  heading1("8. Compte par défaut"),
  para("Lors de la première installation, un compte administrateur est créé automatiquement pour permettre la configuration initiale du système."),
  spacer(100),

  heading2("8.1 Identifiants par défaut"),
  simpleTable(
    ["Paramètre", "Valeur"],
    [
      ["Identifiant", "pmo"],
      ["Mot de passe", "filatex2026"],
      ["Rôle", "Admin (PMO)"],
      ["Permissions", "Toutes les sections"],
    ]
  ),
  spacer(100),

  importantNote("Ce mot de passe par défaut DOIT être changé impérativement lors de la première connexion en production. Tout accès avec les identifiants par défaut sera tracé dans l'historique."),
  spacer(100),

  heading2("8.2 Procédure de première connexion"),
  para("1. Se connecter avec l'identifiant « pmo » et le mot de passe « filatex2026 »"),
  para("2. Accéder à la page d'administration"),
  para("3. Modifier immédiatement le mot de passe du compte PMO"),
  para("4. Créer les comptes utilisateurs nécessaires avec les permissions appropriées"),
  para("5. Vérifier que l'historique de connexion fonctionne correctement"),
  spacer(200),

  // ── Pied de document ──
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400 },
    children: [new TextRun({ text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", font: FONT, size: 22, color: "CCCCCC" })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: "Groupe Filatex — Document confidentiel — Mars 2026", font: FONT, size: 18, italics: true, color: "999999" })],
  }),
);

// ═══════════════════════════════════════════════════════════════════════════
// BUILD DOCUMENT
// ═══════════════════════════════════════════════════════════════════════════

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: FONT, size: 22 },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          size: {
            width: convertInchesToTwip(8.27),  // A4
            height: convertInchesToTwip(11.69),
          },
          margin: {
            top: convertInchesToTwip(1),
            bottom: convertInchesToTwip(0.8),
            left: convertInchesToTwip(1),
            right: convertInchesToTwip(1),
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: "Groupe Filatex — Dashboard PMO — Sécurité Login", font: FONT, size: 16, italics: true, color: "999999" }),
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

const OUTPUT = "C:\\Users\\Meril\\Desktop\\Filatex_Login_Securite.docx";

const buffer = await Packer.toBuffer(doc);
writeFileSync(OUTPUT, buffer);
console.log(`Document generated: ${OUTPUT} (${(buffer.length / 1024).toFixed(0)} KB)`);
