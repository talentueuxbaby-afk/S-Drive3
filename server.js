const express = require('express');
const session = require('express-session');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT || 3000);

/* =========================================================
   CONFIGURATION
========================================================= */

const APP_URL =
  process.env.APP_URL ||
  'https://sdrive-1.onrender.com';

const WAVE_URL =
  process.env.WAVE_URL ||
  'https://pay.wave.com/m/M_ci_kpNTVGT9JGah/c/ci/?amount=1000';

const WHATSAPP_NUMBER =
  '2250152171974';

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  'CHANGE-ME-TO-A-LONG-RANDOM-SECRET';


/* =========================================================
   APPLICATION
========================================================= */

app.use(
  express.json({
    limit: '1mb'
  })
);

app.use(
  express.urlencoded({
    extended: false
  })
);

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      sameSite: 'lax',

      secure:
        process.env.NODE_ENV === 'production',

      maxAge:
        7 * 24 * 60 * 60 * 1000
    }
  })
);


/* =========================================================
   BASE DE DONNÉES
========================================================= */

const dbPath =
  path.join(__dirname, 'sdrive.db');

const db =
  new Database(dbPath);

db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    odds_type INTEGER NOT NULL
      CHECK(odds_type IN (2, 10)),
    status TEXT NOT NULL
      DEFAULT 'payment_pending',
    created_at TEXT NOT NULL
      DEFAULT CURRENT_TIMESTAMP
  );
`);


/* =========================================================
   UTILITAIRES
========================================================= */

function whatsappLink(message) {

  const number =
    String(WHATSAPP_NUMBER)
      .replace(/[^\d]/g, '');

  return (
    'https://wa.me/' +
    number +
    '?text=' +
    encodeURIComponent(message)
  );
}


/* =========================================================
   PAGE PRINCIPALE
========================================================= */

app.get('/', (req, res) => {

  res.send(`
<!doctype html>

<html lang="fr">

<head>

<meta charset="utf-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
>

<meta
  name="theme-color"
  content="#071A2D"
>

<title>S-Drive — Analyse des matchs</title>

<style>

/* =========================================================
   VARIABLES
========================================================= */

:root {

  --navy: #071A2D;
  --navy2: #0B223D;
  --card: #102B4C;
  --line: #23486B;
  --blue: #00BFFF;
  --green: #21C55D;
  --red: #DC2626;
  --white: #FFFFFF;
  --muted: #AFC1D4;

}


/* =========================================================
   RESET
========================================================= */

* {
  box-sizing: border-box;
}

html {
  min-height: 100%;
}

body {

  margin: 0;

  min-height: 100vh;

  font-family:
    Arial,
    Helvetica,
    sans-serif;

  color:
    var(--white);

  background:
    radial-gradient(
      circle at top,
      #12385C 0%,
      var(--navy) 58%
    );

}


/* =========================================================
   CONTENEUR
========================================================= */

.container {

  width:
    min(
      calc(100% - 28px),
      520px
    );

  margin:
    auto;

  padding:
    18px 0 35px;

}


/* =========================================================
   CENTRAGE
========================================================= */

.center {
  text-align: center;
}


/* =========================================================
   LOGO / BALLON
========================================================= */

.logo {

  width:
    100px;

  height:
    100px;

  margin:
    15px auto 8px;

  display:
    flex;

  justify-content:
    center;

  align-items:
    center;

  border-radius:
    50%;

  font-size:
    64px;

  background:
    rgba(0,191,255,.10);

  border:
    1px solid
    rgba(0,191,255,.25);

}


/* =========================================================
   TITRES
========================================================= */

h1 {

  margin:
    8px 0 5px;

  font-size:
    32px;

}

h2 {

  margin:
    0 0 16px;

  font-size:
    21px;

}

.muted {

  color:
    var(--muted);

  line-height:
    1.55;

}


/* =========================================================
   CARTES
========================================================= */

.card {

  background:
    rgba(16,43,76,.96);

  border:
    1px solid
    var(--line);

  border-radius:
    20px;

  padding:
    20px;

  margin:
    15px 0;

  box-shadow:
    0 8px 25px
    rgba(0,0,0,.18);

}


/* =========================================================
   BOUTONS
========================================================= */

.btn {

  width:
    100%;

  min-height:
    52px;

  padding:
    14px;

  border-radius:
    14px;

  font-weight:
    800;

  font-size:
    15px;

  border:
    0;

  margin:
    8px 0;

  cursor:
    pointer;

  text-decoration:
    none;

  display:
    flex;

  justify-content:
    center;

  align-items:
    center;

  text-align:
    center;

}

.btn:active {

  transform:
    scale(.98);

}

.primary {

  background:
    var(--blue);

  color:
    #001B2D;

}

.green {

  background:
    var(--green);

  color:
    #FFFFFF;

}

.secondary {

  background:
    #193A5C;

  color:
    #FFFFFF;

  border:
    1px solid
    #315D82;

}


/* =========================================================
   CHOIX DES COTES
========================================================= */

.choice {

  border:
    1px solid
    #315D82;

  background:
    #0B223D;

  padding:
    17px;

  border-radius:
    15px;

  margin:
    9px 0;

  cursor:
    pointer;

  transition:
    .2s ease;

}

.choice strong {

  display:
    block;

  font-size:
    18px;

  margin-bottom:
    6px;

}

.choice small {

  color:
    var(--muted);

  line-height:
    1.4;

}

.choice.selected {

  border-color:
    var(--blue);

  background:
    #123B60;

  transform:
    scale(1.01);

}


/* =========================================================
   PRIX
========================================================= */

.price {

  font-size:
    28px;

  font-weight:
    900;

  text-align:
    center;

  margin:
    17px 0;

}


/* =========================================================
   NOTICES
========================================================= */

.notice {

  padding:
    14px;

  border-left:
    3px solid
    var(--blue);

  background:
    #0C2745;

  border-radius:
    8px;

  line-height:
    1.55;

  margin:
    10px 0;

}


/* =========================================================
   STATUT
========================================================= */

.status {

  margin-top:
    12px;

  color:
    var(--muted);

  text-align:
    center;

  min-height:
    24px;

  line-height:
    1.4;

}

.status.success {

  color:
    #6EE7A0;

}

.status.error {

  color:
    #FF8A8A;

}


/* =========================================================
   PARTAGE
========================================================= */

.share-box {

  display:
    grid;

  grid-template-columns:
    1fr 1fr;

  gap:
    8px;

}


/* =========================================================
   HIDDEN
========================================================= */

.hidden {

  display:
    none !important;

}


/* =========================================================
   SPINNER
========================================================= */

.spinner {

  width:
    18px;

  height:
    18px;

  border:
    3px solid
    rgba(0,0,0,.25);

  border-top-color:
    currentColor;

  border-radius:
    50%;

  animation:
    spin .8s linear infinite;

  margin-right:
    8px;

}

@keyframes spin {

  to {
    transform:
      rotate(360deg);
  }

}


/* =========================================================
   FOOTER
========================================================= */

footer {

  text-align:
    center;

  color:
    var(--muted);

  font-size:
    12px;

  margin-top:
    25px;

}


/* =========================================================
   MOBILE
========================================================= */

@media (max-width: 360px) {

  .container {

    width:
      calc(100% - 20px);

  }

  h1 {

    font-size:
      28px;

  }

  .card {

    padding:
      16px;

  }

}

</style>

</head>


<body>

<main class="container">


<!-- =====================================================
     ACCUEIL
====================================================== -->

<section id="dashboard">


  <div class="center">

    <div class="logo">
      ⚽
    </div>

    <h1>
      S-Drive
    </h1>

    <p class="muted">
      Analyse professionnelle de vos matchs
    </p>

  </div>


  <!-- ANALYSE -->

  <div class="card">

    <h2>
      Analyse des matchs
    </h2>

    <div class="notice">

      Choisissez le type d'analyse
      que vous souhaitez.

    </div>


    <!-- COTE 2 -->

    <div
      id="choice2"
      class="choice selected"
      onclick="selectOdds(2)"
    >

      <strong>
        Cote 2
      </strong>

      <small>
        Analyse rapide — environ
        2 à 3 minutes
      </small>

    </div>


    <!-- COTE 10 -->

    <div
      id="choice10"
      class="choice"
      onclick="selectOdds(10)"
    >

      <strong>
        Cote 10
      </strong>

      <small>
        Analyse complète — environ
        7 à 8 minutes
      </small>

    </div>


    <div class="price">
      1 000 F
    </div>

    <p class="muted center">
      Paiement unique pour l'analyse.
    </p>


    <!-- WAVE -->

    <a
      class="btn green"
      href="${WAVE_URL}"
      target="_blank"
      rel="noopener noreferrer"
    >
      💳 Payer 1 000 F avec Wave
    </a>


    <!-- WHATSAPP -->

    <button
      id="whatsappButton"
      class="btn primary"
      type="button"
      onclick="sendMatchScreenshot()"
    >
      📸 Envoyer la capture des matchs
    </button>


    <div
      id="analysisStatus"
      class="status"
    ></div>

  </div>


  <!-- PARTAGE -->

  <div class="card">

    <h2>
      Partager S-Drive
    </h2>

    <p class="muted">
      Invitez vos amis à découvrir S-Drive.
    </p>


    <div class="share-box">

      <button
        class="btn secondary"
        type="button"
        onclick="copyAppLink()"
      >
        📋 Copier le lien
      </button>


      <button
        class="btn secondary"
        type="button"
        onclick="shareApp()"
      >
        📤 Partager
      </button>

    </div>


    <div
      id="shareStatus"
      class="status"
    ></div>

  </div>


  <!-- CONDITIONS -->

  <div class="card">

    <h2>
      Conditions d'utilisation
    </h2>


    <div class="notice">

      <strong>
        Cote 2
      </strong>

      <br><br>

      Après paiement et réception
      de votre capture, S-Drive analyse
      vos matchs de cote 2.

      <br><br>

      Le délai indicatif d'analyse est de
      <strong>
        2 à 3 minutes
      </strong>.

      <br><br>

      Si le coupon de cote 2 analysé
      et envoyé par S-Drive est validé
      après votre pari, aucun montant
      supplémentaire ne vous sera demandé.

      <br><br>

      Si le coupon de cote 2 n'est pas
      validé, vous pouvez réclamer un
      remboursement de
      <strong>
        500 F
      </strong>.

    </div>


    <div class="notice">

      <strong>
        Cote 10
      </strong>

      <br><br>

      Le délai indicatif d'analyse est de
      <strong>
        7 à 8 minutes
      </strong>.

      <br><br>

      Pour une analyse de cote 10,
      aucun remboursement n'est prévu
      après le gain ou la perte du pari.

    </div>


    <p class="muted">

      Le paiement de l'analyse est de
      <strong>
        1 000 F
      </strong>.

    </p>

  </div>


</section>


<footer>

  S-Drive — Analyse des matchs

</footer>


</main>


<script>

/* =====================================================
   VARIABLES
====================================================== */

let selectedOdds = 2;


/* =====================================================
   CHOIX DE LA COTE
====================================================== */

function selectOdds(type) {

  if (
    type !== 2 &&
    type !== 10
  ) {
    return;
  }

  selectedOdds = type;


  document
    .getElementById('choice2')
    .classList
    .remove('selected');


  document
    .getElementById('choice10')
    .classList
    .remove('selected');


  document
    .getElementById(
      type === 2
        ? 'choice2'
        : 'choice10'
    )
    .classList
    .add('selected');

}


/* =====================================================
   CREER LA DEMANDE
====================================================== */

async function sendMatchScreenshot() {

  const status =
    document.getElementById(
      'analysisStatus'
    );


  status.textContent =
    'Préparation de votre demande...';

  status.className =
    'status';


  const button =
    document.getElementById(
      'whatsappButton'
    );


  button.disabled = true;

  button.textContent =
    'Préparation...';


  try {

    const response =
      await fetch(
        '/api/create-analysis',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            'Accept':
              'application/json'
          },

          body:
            JSON.stringify({
              odds_type:
                selectedOdds
            })
        }
      );


    const text =
      await response.text();


    let data = {};

    try {

      data =
        JSON.parse(text);

    } catch (_) {

      data = {};

    }


    if (!response.ok) {

      status.textContent =
        data.error ||
        'Impossible de créer la demande.';

      status.className =
        'status error';

      return;

    }


    status.textContent =
      'Demande créée. Ouverture de WhatsApp...';

    status.className =
      'status success';


    if (data.whatsapp_url) {

      window.location.href =
        data.whatsapp_url;

    } else {

      status.textContent =
        'Impossible de préparer WhatsApp.';

      status.className =
        'status error';

    }


  } catch (error) {

    console.error(error);

    status.textContent =
      'Erreur de connexion au serveur.';

    status.className =
      'status error';

  } finally {

    button.disabled = false;

    button.textContent =
      '📸 Envoyer la capture des matchs';

  }

}


/* =====================================================
   COPIER LE LIEN
====================================================== */

async function copyAppLink() {

  const status =
    document.getElementById(
      'shareStatus'
    );


  try {

    await navigator.clipboard.writeText(
      window.location.origin
    );


    status.textContent =
      'Lien copié avec succès.';

    status.className =
      'status success';


  } catch (error) {

    status.textContent =
      'Impossible de copier le lien.';

    status.className =
      'status error';

  }

}


/* =====================================================
   PARTAGER
====================================================== */

async function shareApp() {

  const shareData = {

    title:
      'S-Drive',

    text:
      'Découvrez S-Drive — Analyse professionnelle de vos matchs.',

    url:
      window.location.origin

  };


  try {

    if (
      navigator.share
    ) {

      await navigator.share(
        shareData
      );

    } else {

      await copyAppLink();

    }

  } catch (error) {

    console.log(
      'Partage annulé.'
    );

  }

}

</script>

</body>

</html>
  `);
});


/* =========================================================
   API — CREATION ANALYSE
========================================================= */

app.post(
  '/api/create-analysis',
  (req, res) => {

    try {

      const oddsType =
        Number(
          req.body.odds_type
        );


      if (
        oddsType !== 2 &&
        oddsType !== 10
      ) {

        return res.status(400).json({

          success: false,

          error:
            'Type d’analyse incorrect.'

        });

      }


      const result =
        db
          .prepare(`
            INSERT INTO analyses
              (odds_type, status)
            VALUES
              (?, 'payment_pending')
          `)
          .run(
            oddsType
          );


      const message =
        [
          'Bonjour S-Drive 👋',
          '',
          'Je viens de créer une demande d’analyse.',
          '',
          'Type : Cote ' + oddsType,
          'Référence : SD-' + result.lastInsertRowid,
          '',
          'Je vais envoyer la capture de mes matchs.'
        ].join('\n');


      const whatsappUrl =
        whatsappLink(message);


      return res.status(201).json({

        success: true,

        message:
          'Demande créée avec succès.',

        analysis_id:
          result.lastInsertRowid,

        whatsapp_url:
          whatsappUrl

      });


    } catch (error) {

      console.error(
        'ERREUR ANALYSE:',
        error
      );


      return res.status(500).json({

        success: false,

        error:
          'Impossible de créer la demande.'

      });

    }

  }
);


/* =========================================================
   API — TEST SERVEUR
========================================================= */

app.get(
  '/api/health',
  (req, res) => {

    res.json({

      success:
        true,

      message:
        'S-Drive fonctionne correctement.',

      time:
        new Date().toISOString()

    });

  }
);


/* =========================================================
   ERREUR 404
========================================================= */

app.use(
  (req, res) => {

    if (
      req.path.startsWith('/api/')
    ) {

      return res.status(404).json({

        success: false,

        error:
          'Route API introuvable.'

      });

    }


    res.status(404).send(
      'Page introuvable.'
    );

  }
);


/* =========================================================
   DEMARRAGE
========================================================= */

app.listen(
  PORT,
  '0.0.0.0',
  () => {

    console.log(
      '======================================'
    );

    console.log(
      'S-Drive démarré'
    );

    console.log(
      'Port : ' + PORT
    );

    console.log(
      'URL : ' + APP_URL
    );

    console.log(
      '======================================'
    );

  }
);
