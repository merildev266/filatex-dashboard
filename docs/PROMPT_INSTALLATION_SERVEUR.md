# Prompt a coller dans Claude sur le serveur

Copie tout le bloc ci-dessous dans la session Claude du serveur :

---

Je dois installer le Dashboard PMO Filatex sur ce serveur. Voici les instructions exactes a suivre. Ne saute aucune etape.

## 1. Prerequis

Verifie que Python 3.10+ et Node.js 18+ sont installes :
```
python --version
node --version
```

## 2. Cloner le repo

```bash
cd /opt  # ou le dossier de ton choix
git clone https://github.com/[REPO_URL] filatex-dashboard
cd filatex-dashboard
```

## 3. Backend Python

```bash
# Creer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou: venv\Scripts\activate  # Windows

# Installer les dependances
pip install -r requirements.txt
```

## 4. Variable d'environnement JWT_SECRET

IMPORTANT : genere une cle secrete aleatoire de 64+ caracteres et configure-la :

```bash
# Generer une cle
python -c "import secrets; print(secrets.token_hex(64))"

# Ajouter au fichier .env ou exporter directement
export JWT_SECRET="[colle_la_cle_generee_ici]"
```

Ne jamais utiliser la cle par defaut en production.

## 5. Build du frontend React

```bash
cd frontend
npm install
npm run build
cd ..
```

Cela genere `frontend/dist/` que Flask servira directement.

## 6. Initialisation de la base de donnees

La base SQLite `dashboard.db` se cree automatiquement au premier lancement.
Trois comptes par defaut sont crees :

| Username | PIN  | Role        | Sections |
|----------|------|-------------|----------|
| pmo      | 2618 | Super Admin | Toutes   |
| dg       | 2618 | Super Admin | Toutes   |
| cpo      | 2618 | Admin       | Toutes   |

IMPORTANT : changer les PIN de ces 3 comptes des la premiere connexion via la page Admin.

## 7. Lancer le serveur

Pour tester :
```bash
python main.py
```

Pour la production, utilise gunicorn :
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## 8. Verifier que ca marche

```bash
# Health check
curl http://localhost:5000/api/health
# Doit retourner : {"ok": true, "version": "2.0"}

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "pmo", "pin": "2618"}'
# Doit retourner : {"success": true, "must_set_pin": false, "token": "...", "user": {...}}
```

## 9. Configuration reseau

Le serveur ecoute sur le port 5000. Pour le rendre accessible :

Option A — Acces direct (reseau interne) :
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

Option B — Derriere Nginx (recommande pour HTTPS) :
```nginx
server {
    listen 443 ssl;
    server_name dashboard.filatex.local;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 10. Service systemd (pour que ca tourne en permanence)

Cree le fichier `/etc/systemd/system/filatex-dashboard.service` :

```ini
[Unit]
Description=Filatex PMO Dashboard
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/filatex-dashboard
Environment="JWT_SECRET=[ta_cle_secrete]"
ExecStart=/opt/filatex-dashboard/venv/bin/gunicorn -w 4 -b 127.0.0.1:5000 app:app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Puis :
```bash
sudo systemctl daemon-reload
sudo systemctl enable filatex-dashboard
sudo systemctl start filatex-dashboard
sudo systemctl status filatex-dashboard
```

## 11. Acces OneDrive (pour les donnees Excel)

Le serveur a besoin d'acceder aux fichiers Excel via OneDrive. Verifie que le dossier OneDrive est synchronise :
```
~/OneDrive - GROUPE FILATEX/Fichiers de DOSSIER DASHBOARD - Data_Dashbords/
```

Si le serveur est Linux sans client OneDrive, il faudra soit :
- Monter un partage reseau vers le dossier OneDrive
- Copier periodiquement les fichiers Excel sur le serveur

## Systeme d'authentification

Architecture :
- **SQLite** (`dashboard.db`) : stocke les utilisateurs et l'historique de connexion
- **bcrypt** : hachage des codes PIN (irreversible)
- **JWT** : tokens de session (expirent apres 8h)
- **Roles** : super_admin > admin > utilisateur
- **Permissions** : par section (energy, properties, capex, investments, reporting, csi) et sous-section (energy.hfo, energy.enr, etc.)
- **Verrouillage** : apres 5 tentatives echouees, le compte se verrouille. Seul un admin peut deverrouiller.

Regles des usernames :
- Utilisateurs normaux : `prenom.nom` (genere automatiquement, sans accents)
- Comptes speciaux : `pmo`, `dg`, `cpo` (acronymes directs)

Quand le PMO cree un utilisateur depuis la page Admin :
1. Il saisit prenom + nom + email + role + sections
2. Le username `prenom.nom` est genere automatiquement
3. L'utilisateur n'a pas de PIN — il le definira a sa premiere connexion
4. A la premiere connexion : il entre son username, le systeme lui demande de creer un PIN 4 ou 6 chiffres

---

Execute chaque etape dans l'ordre et dis-moi si tu rencontres une erreur.
