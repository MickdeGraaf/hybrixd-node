// hy_login.js - contains javascript for login, encryption and session authentication
const C = commonUtils;
const A = animations;
const S = loginInputStreams;
const V = validations;
const Utils = utils;
const fetch_ = fetch

const path = 'api';

function btnIsNotDisabled (e) {
  return !e.target.parentElement.classList.contains('disabled');
}

const loginBtnStr = Rx.Observable
      .fromEvent(document.querySelector('#loginbutton'), 'click')
      .filter(btnIsNotDisabled);

const loginStream = loginBtnStr
      .withLatestFrom(S.credentialsStream)
      .map(function (z) {
        const userID = z[1][0];
        const pass = z[1][1];
        login(userID, pass);
      });

// TODO Give user feedback about incorrect credentials
function login (userID, password) {
  var isValidUserIDAndPassword = V.validateCredentials(userID, password);
  if (isValidUserIDAndPassword) {
    var sessionStep = session_step = 0; // TODO: Factor out!
    setCSSTorenderButtonsToDisabled();
    startAnimationAndInitializeNacl(userID, password, sessionStep);
  }
}

function startAnimationAndInitializeNacl (userid, passcode, sessionStep) {
  doAnimation();
  nacl = null; // TODO: make official global
  nacl_factory.instantiate(
    instantiateNaclAndHandleLogin(passcode, userid, sessionStep)
  ); // instantiate nacl and handle login
}



function doAnimation (n) {
  blink('arc0');
  A.rotateLogin(0);
  dialLoginAnimation(0);
  function dialLoginAnimation (n) {
    var newNumberOrZero = n > 3 ? 0 : n;
    A.dialLogin(n);
    setTimeout(function () { dialLoginAnimation(n + 1); }, 100);
  }
}

function instantiateNaclAndHandleLogin (passcode, userID, sessionStep, cb) {
  return function (naclinstance) {
    nacl = naclinstance; // TODO: INSTANTIATION MUST BE SAVED SOMEWHERE NON-GLOBALLY SO IT IS ACCESSABLE THROUGHOUT
    generateNonceAndUserKeys(passcode, userID, sessionStep);
  };
}

function generateNonceAndUserKeys (passcode, userID, sessionStep) {
  var nonce = nacl.crypto_box_random_nonce();
  var userKeys = C.generateKeys(passcode, userID, 0);

  startAnimationAndDoLogin(userKeys, nonce, userID, sessionStep);
}

function startAnimationAndDoLogin (userKeys, nonce, userID, sessionStep) {
  postSessionStep0Data(userKeys, nonce, sessionStep);
  C.continueSession(userKeys, nonce, userID, getSessionData, sessionContinuation(userKeys, nonce, userID));
}

// posts to server under session sign public key
function postSessionStep0Data (userKeys, nonce, sessionStep) {
  var initialSessionData = C.generateInitialSessionData(nonce);
  var url = path + 'x/' + initialSessionData.session_hexsign + '/' + sessionStep;
  fetch_(url)
    .then(r => r.json()
      .then(processSessionStep0Reply(initialSessionData, nonce, userKeys))
      .catch(e => console.log('postSessionStep0Data: Error retrieving nonce:', e)))
    .catch(e => console.log('postSessionStep0Data: Error fetching data:', e));
}

function processSessionStep0Reply (sessionStep0Data, nonce, userKeys) {
  return function (nonce1Data) {
    const cleanNonceHasCorrectLength = C.clean(nonce1Data.nonce1).length === 48;
    if (cleanNonceHasCorrectLength) {
      session_step++; // next step, hand out nonce2
      const sessionStep = session_step;
      var sessionStep1Data = C.generateSecondarySessionData(nonce1Data, sessionStep0Data.session_hexkey, sessionStep0Data.session_signpair.signSk);
      var url = path + 'x/' + sessionStep0Data.session_hexsign + '/' + sessionStep + '/' + sessionStep1Data.crypt_hex;
      fetch_(url)
        .then(r => r.json()
              .then(postSession1StepData(sessionStep0Data, sessionStep1Data, nonce, userKeys))
              .catch(e => console.log('postSessionStep0Data: Error retrieving nonce:', e)))
        .catch(e => console.log('postSessionStep0Data: Error fetching data:', e));
    }
  };
}

function setSessionDataInElement (sessionHex) {
  document.querySelector('#session_data').textContent = sessionHex;
}

function getSessionData () {
  return document.querySelector('#session_data').textContent;
}

function postSession1StepData (initialSessionData, sessionStep1Data, nonce, userKeys) {
  return function (data) {
    var sessionData = Object.assign(initialSessionData, sessionStep1Data, { nonce }, { userKeys });

    C.sessionStep1Reply(data, sessionData, setSessionDataInElement);
  };
}

function maybeOpenNewWalletModal (location) {
  if (location.href.indexOf('#') !== -1) {
    var locationHref = location.href.substr(location.href.indexOf('#'));
    if (locationHref === '#new') {
      PRNG.seeder.restart();
      document.getElementById('newaccountmodal').style.display = 'block';
    }
  }
}

function sessionContinuation (userKeys, nonce, userid) {
  return function () {
    setTimeout(function () { // added extra time to avoid forward to interface before x authentication completes! TODO: Remove!
      fetchview('interface', {
        user_keys: userKeys,
        nonce,
        userid
      });
    }, 3000);
  };
}

function handleCtrlSKeyEvent (e) {
  var possible = [ e.key, e.keyIdentifier, e.keyCode, e.which ];

  while (key === undefined && possible.length > 0) {
    key = possible.pop();
  }

  if (key && (key === '115' || key === '83') && (e.ctrlKey || e.metaKey) && !(e.altKey)) {
    e.preventDefault();
    document.querySelector('#loginbutton').removeAttribute('disabled');
    return false;
  }
  return true;
}

function setCSSTorenderButtonsToDisabled () {
  const arcBackgroundColor = document.querySelector('#combinator').style.color;
  document.querySelector('#loginbutton').classList.add('disabled');
  document.querySelector('#arc0').style.backgroundColor = arcBackgroundColor;
  document.querySelector('#generatebutton').setAttribute('disabled', 'disabled');
  document.querySelector('#helpbutton').setAttribute('disabled', 'disabled');
  document.querySelector('#combinatorwrap').style.opacity = 1;
}

function focusOnPasswordAfterReturnKeyOnID (e) {
  const keyPressIsReturn = e.keyCode === 13;
  if (keyPressIsReturn) {
    document.querySelector('#inputPasscode').focus();
  }
}

function focusOnLoginButton (cb) {
  return function (e) {
    const keyPressIsReturn = e.keyCode === 13;
    if (keyPressIsReturn) {
      document.querySelector('#loginbutton').focus();
      cb();
    }
  };
}

function initializeClickAndKeyEvents () {
  document.querySelector('#loginbutton').onclick = login;
  document.querySelector('#inputUserID').onkeypress = focusOnPasswordAfterReturnKeyOnID;
  document.querySelector('#inputPasscode').onkeypress = focusOnLoginButton(login);
  document.keydown = handleCtrlSKeyEvent; // for legacy wallets enable signin button on CTRL-S
}

Utils.documentReady(function () {
  const documentLocation = location;
  initializeClickAndKeyEvents();
  maybeOpenNewWalletModal(documentLocation);
  loginStream.subscribe();
});
