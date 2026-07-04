# Avion Messager

Un petit avion traverse ton écran en tirant une banderole : il décolle tout seul
5 minutes avant chaque réunion de ton agenda Google. Impossible de rater une
réunion, et beaucoup plus joli qu'une notification.

```
   ┌─────────────────────────────┐
   │  Réunion Adrien dans 5 min  │ - - - -  ✈️
   └─────────────────────────────┘
```

L'avion passe au-dessus de toutes tes fenêtres, et les clics passent au travers :
il ne gêne jamais ce que tu es en train de faire. L'application ne collecte
rien, n'envoie rien nulle part : elle lit ton agenda depuis ton ordinateur,
c'est tout.

## Installation facile (recommandée)

Aucun outil à installer, juste un téléchargement :
va sur la page **[Téléchargements](https://github.com/annece29-netizen/avion-messager/releases/latest)**.

### Sur Windows

1. Télécharge le fichier `Avion-Messager-Windows-... .exe` (section "Assets")
2. Ton navigateur va probablement bloquer le fichier avec un message du type
   "n'est pas fréquemment téléchargé" : c'est sa prudence normale face à une
   application toute neuve. Pour le débloquer, ouvre le panneau des
   téléchargements (Ctrl+J), passe la souris sur le fichier, clique sur les
   trois points **"..."** puis **"Conserver"**. Une fenêtre "Vérifiez que
   vous faites confiance..." s'ouvre alors : ne clique pas sur Supprimer,
   clique sur la **petite flèche du bouton "Supprimer"** (ou sur "Afficher
   plus" selon les versions) puis sur **"Conserver quand même"**.
3. Double-clique sur le fichier. Windows affiche un écran bleu "Windows a
   protégé votre ordinateur" : même prudence, application non signée
   commercialement. Clique sur **"Informations complémentaires"** puis
   **"Exécuter quand même"**.
4. C'est tout : l'application s'installe et s'ouvre toute seule.

### Sur Mac

1. Télécharge le fichier `Avion-Messager-Mac-... .dmg` (section "Assets")
2. Ouvre-le et glisse l'avion dans le dossier **Applications**
3. Au premier lancement, macOS peut bloquer l'ouverture (application non
   signée). Deux cas selon ta version de macOS :
   - Ouvre **Réglages Système > Confidentialité et sécurité**, descends en bas
     de la page et clique sur **"Ouvrir quand même"**
   - Ou plus simple sur les Mac moins récents : clic droit sur l'application,
     puis **Ouvrir**

## Connecter ton agenda Google (2 minutes, une seule fois)

Au premier lancement, une fenêtre s'ouvre et te guide pas à pas. En résumé :

1. Ouvre [Google Agenda](https://calendar.google.com) sur ordinateur
2. Roue dentée en haut à droite, puis **Paramètres**
3. Colonne de gauche, section "Paramètres de mes agendas" : clique sur ton agenda
4. Descends jusqu'à **"Adresse secrète au format iCal"** et copie l'adresse
5. Colle-la dans la fenêtre de l'application et clique sur **Enregistrer**

L'application vérifie la connexion et te confirme le nombre d'événements
trouvés. Ensuite, elle vit discrètement dans la barre des tâches (petit avion
blanc sur fond bleu) : clic droit pour un vol d'essai, pour changer d'agenda,
pour la lancer au démarrage de l'ordinateur, ou pour quitter.

**Important : cette adresse est secrète.** Elle permet de lire ton agenda
(et uniquement de le lire). Ne la partage à personne, ne la poste nulle part.
Elle reste enregistrée sur ton ordinateur uniquement. En cas de doute, Google
Agenda propose un bouton "Réinitialiser" juste à côté de l'adresse, qui en
génère une nouvelle et rend l'ancienne inutilisable.

## Et si ton agenda est sur Outlook (Microsoft 365) ?

Ça fonctionne aussi : Outlook sait publier son calendrier au même format.

1. Ouvre Outlook sur le web : [outlook.office.com](https://outlook.office.com)
   (compte professionnel) ou [outlook.live.com](https://outlook.live.com)
   (compte personnel). Le nouveau Outlook de Windows fonctionne aussi.
2. Roue dentée, puis **Calendrier** > **Calendriers partagés**
3. Section "Publier un calendrier" : choisis ton calendrier et le niveau
   **"Peut afficher tous les détails"**, puis clique sur **Publier**
4. Deux liens apparaissent : copie le lien **ICS** (pas le lien HTML)
   et colle-le dans l'application, comme pour Google

À savoir :

- En entreprise, l'administrateur informatique peut avoir désactivé la
  publication de calendrier. Si la section "Publier un calendrier" n'apparaît
  pas ou est grisée, il n'y a pas de contournement : c'est un choix de
  sécurité de l'entreprise.
- Ce lien ICS est secret, comme chez Google : on ne le colle que dans
  l'application.
- Même remarque que pour Google sur le délai : Microsoft rafraîchit le lien
  publié par vagues, une réunion créée à la dernière minute peut échapper à
  l'avion.

Astuce : iCloud et tous les agendas qui fournissent une adresse iCal
fonctionnent de la même façon.

## Limites connues

- Google met parfois du temps (jusqu'à quelques heures) à rafraîchir l'adresse
  secrète : une réunion créée à la toute dernière minute peut ne pas
  déclencher l'avion. Les réunions posées à l'avance fonctionnent parfaitement.
- Les événements "journée entière" sont ignorés (pas d'heure, pas de rappel).
- L'application doit être ouverte pour que l'avion décolle. Active l'option
  "Lancer au démarrage de l'ordinateur" (clic droit sur l'icône) pour ne plus
  y penser.

## Installation manuelle (pour les bricoleurs)

Il faut [Node.js](https://nodejs.org) version 18 ou plus.

```
git clone https://github.com/annece29-netizen/avion-messager.git
cd avion-messager
npm install
npm run demo     # vol d'essai immédiat, sans agenda
npm start        # lancement normal
```

La configuration vit dans `config.json` (créé au premier lancement) :

| Réglage | Rôle | Valeur par défaut |
|---------|------|-------------------|
| `icsUrl` | Adresse secrète iCal de l'agenda | vide |
| `minutesBefore` | Combien de minutes avant la réunion l'avion décolle | 5 |
| `durationSeconds` | Durée de la traversée de l'écran | 12 |
| `checkEverySeconds` | Fréquence de vérification de l'agenda | 60 |

Pour la version installée (.exe ou .dmg), ce fichier se trouve dans le dossier
de données de l'application : `%APPDATA%\Avion Messager\` sur Windows,
`~/Library/Application Support/Avion Messager/` sur Mac.

Pour fabriquer les installateurs toi-même : `npm run dist`. Ils sont aussi
fabriqués automatiquement par GitHub Actions à chaque étiquette de version
(voir `.github/workflows/build.yml`).

## Sous le capot

- **Electron** : le seul moyen simple d'afficher une fenêtre transparente,
  au-dessus de tout et traversée par les clics, identique sur Windows et Mac.
- **Adresse secrète iCal plutôt qu'OAuth Google** : pas de compte développeur,
  pas de Google Cloud Console, pas d'écran de consentement. Une simple adresse
  à coller, en lecture seule. Contrepartie assumée : le délai de
  rafraîchissement du flux par Google.
- **node-ical** pour lire le format d'agenda (y compris les réunions
  récurrentes).
- **Icônes générées par script maison** (`tools/make-icon.js`) : aucune
  dépendance graphique, aucun fichier binaire opaque dans le dépôt.

Licence MIT : utilise, modifie, partage librement.
