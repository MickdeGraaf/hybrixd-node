// PRNG seeder and generator

PRNG = {};
﻿PRNG.seeder = {
  init: (function () {
    document.getElementById('generatekeyinput').value = '';
  })(),

  restart: function() {
    PRNG.seeder.seedCount=0; PRNG.seeder.isStillSeeding=true;
    document.querySelector('html').style.overflow = 'hidden';
    document.getElementById('newaccountmodal').style.display = 'block';
    document.getElementById('newaccountcontent').style.display = 'block';
    document.getElementById('generate').style.display = 'block';
    document.getElementById('mousemovelimit').innerHTML = '0%';
  },

  // number of mouse movements to wait for
  seedLimit: (function () {
    var num = Crypto.util.randomBytes(12)[11];
    return 200 + Math.floor(num);
  })(),

  seedCount: 0, // counter
  lastInputTime: new Date().getTime(),
  seedPoints: [],
  isStillSeeding: true,

  // seed function exists to wait for mouse movement to add more entropy before generating an address
  seed: function (evt) {
    // DEBUG: console.log('evt', evt);
    if (!evt) var evt = window.event;
    var timeStamp = new Date().getTime();
    // seeding is over now we generate and display the address
    if (PRNG.seeder.seedCount == PRNG.seeder.seedLimit) {
      PRNG.seeder.seedCount++;
      PRNG.seeder.seedingOver();
    }
      // seed mouse position X and Y when mouse movements are greater than 40ms apart.
    else if ((PRNG.seeder.seedCount < PRNG.seeder.seedLimit) && evt && (timeStamp - PRNG.seeder.lastInputTime) > 40) {
      SecureRandom.seedTime();
      if(evt.type == 'mousemove') {
        var clientX = evt.clientX;
        var clientY = evt.clientY;
      } else {
        var clientX = evt.touches[0].pageX;
        var clientY = evt.touches[0].pageY;
      }
      SecureRandom.seedInt16((clientX * clientY));
      PRNG.seeder.showPoint(clientX, clientY);
      PRNG.seeder.seedCount++;
      PRNG.seeder.lastInputTime = new Date().getTime();
      PRNG.seeder.showPool();
    }
  },

  // seed function exists to wait for mouse movement to add more entropy before generating an address
  seedKeyPress: function (evt) {
    if (!evt) var evt = window.event;
    // seeding is over now we generate and display the address
    if (PRNG.seeder.seedCount == PRNG.seeder.seedLimit) {
      PRNG.seeder.seedCount++;
      PRNG.seeder.seedingOver();
    }
      // seed key press character
    else if ((PRNG.seeder.seedCount < PRNG.seeder.seedLimit) && evt.which) {
      var timeStamp = new Date().getTime();
      // seed a bunch (minimum seedLimit) of times
      SecureRandom.seedTime();
      SecureRandom.seedInt8(evt.which);
      var keyPressTimeDiff = timeStamp - PRNG.seeder.lastInputTime;
      SecureRandom.seedInt8(keyPressTimeDiff);
      PRNG.seeder.seedCount++;
      PRNG.seeder.lastInputTime = new Date().getTime();
      PRNG.seeder.showPool();
    }
  },

  showPool: function () {
    var poolHex;
    if (SecureRandom.poolCopyOnInit != null) {
      poolHex = Crypto.util.bytesToHex(SecureRandom.poolCopyOnInit);
      document.getElementById('seedpool').innerHTML = poolHex;
      document.getElementById('seedpooldisplay').innerHTML = poolHex;
    }
    else {
      poolHex = Crypto.util.bytesToHex(SecureRandom.pool);
      document.getElementById('seedpool').innerHTML = poolHex;
      document.getElementById('seedpooldisplay').innerHTML = poolHex;
    }
    var percentSeeded = Math.round((PRNG.seeder.seedCount / PRNG.seeder.seedLimit) * 100) + '%';
    document.getElementById('mousemovelimit').innerHTML = percentSeeded;
  },

  showPoint: function (x, y) {
    var div = document.createElement('div');
    div.setAttribute('class', 'seedpoint');
    div.style.top = y + 'px';
    div.style.left = x + 'px';
    document.body.appendChild(div);
    PRNG.seeder.seedPoints.push(div);
  },

  removePoints: function () {
    for (var i = 0; i < PRNG.seeder.seedPoints.length; i++) {
      document.body.removeChild(PRNG.seeder.seedPoints[i]);
    }
    PRNG.seeder.seedPoints = [];
  },

  seedingOver: function () {
    PRNG.seeder.isStillSeeding = false;
    // hide generator window
    document.getElementById('generate').style.display = 'none';
    document.getElementById('newaccountcontent').style.display = 'none';
    document.getElementById('newaccountmodal').style.display = 'none';
    document.querySelector('html').style.overflow = 'scroll';
    PRNG.seeder.removePoints();
    // generate account using random data
    generateAccount(document.getElementById('seedpooldisplay').innerHTML);
  }
};

function generateAccount(entropy) {
  confirm('<h2>Choose your level of security</h2> <h3>Do you want a medium or high security wallet?</h3> A medium security wallet has a much shorter password, which is easier to remember. \
           However, we do advise not to store more than a month\'s wage worth of value in a medium security wallet.\
           High security wallets have a very long password, making them more secure.',function(highlevel) {
            if(highlevel) {
              var offset=Math.floor(Math.random() * (511-120))
              var passwd=hexToBase32(entropy.substr(offset+20,60));
            } else {
              var offset=Math.floor(Math.random() * (511-60))
              var passwd=hexToBase32(entropy.substr(offset+20,20));
            }
            //console.log( DJB2.hash(entropy.substr(offset,12).toLowerCase()+passwd.toUpperCase()).substr(4,4) );
            var userid=hexToBase32( entropy.substr(offset,12)+DJB2.hash(entropy.substr(offset,12).toUpperCase()).substr(0,4)+DJB2.hash(entropy.substr(offset,12).toLowerCase()+passwd.toUpperCase()).substr(4,4) );
            finalizeAccount(userid,passwd,entropy);
    },
    {
      'cancel':{
        'text':'Medium',
        'default':true
      },
      'done':{
        'text':'High',
        'default':false
      }
    });
}

function finalizeAccount(userid,passwd,entropy) {
  alert('<h2>Your account has been created!</h2> Please <u>write down</u> these login details and put them in a safe place. If you lose them, you can <u>never ever</u> log into your wallet again! <br/><br/> \
    <div class="login-credentials"><table><tbody><tr style="border-bottom: 1px solid #D9E3EB;"><td>Account ID: </td><td class="credential">'+userid+'</td></tr><tr><td>Password: </td><td class="credential">'+passwd+'</td></tr></tbody></table></div> \
    <br/>We cannot help you recover the keys, so they are <u>your responsibility</u>! <br/>Have a lot of fun using Internet of Coins! <br /><br /> <span class="warning"><span style="font-size: 1em;">⚠</span> WARNING: This wallet is still in beta.<br />Do not yet store large amounts of value on it!</span> <br>',
    {title: '', button: 'Continue'},
    function(){
      confirm('<h2>Your account has been created!</h2> Did you write down your login details and put them in a safe place? If not, you will get new login credentials.',function(redo) {
          if(redo) {
            generateAccount(entropy);
          }
        },
        {
          'cancel':{
            'text':'&nbsp;Yes, continue to login ',
            'default':true
          },
          'done':{
            'text':' No, I need new credentials ',
            'default':false
          }
        });
    });
  // DEPRECATED:
  // document.getElementById('inputUserID').value=userid;
  // document.getElementById('inputPasscode').value=passwd;

  document.querySelector('#inputUserID').value = userid;
  document.querySelector('#inputPasscode').value = passwd;
  // FIXME: quick hack to make login work -> streamify!
  var U = utils;
  U.triggerEvent(document.querySelector('#inputUserID'), 'input');
  U.triggerEvent(document.querySelector('#inputPasscode'), 'input');
}

function removeClass(element,className) {
  var currentClassName = element.getAttribute("class");
  if (typeof currentClassName!== "undefined" && currentClassName) {

    var class2RemoveIndex = currentClassName.indexOf(className);
    if (class2RemoveIndex != -1) {
        var class2Remove = currentClassName.substr(class2RemoveIndex, className.length);
        var updatedClassName = currentClassName.replace(class2Remove,"").trim();
        element.setAttribute("class",updatedClassName);
    }
  }
  else {
    element.removeAttribute("class");
  }
}

function executeSeedTime (event) {
  document.querySelector('#newaccountcontent').addEventListener(event, function (e) {
    SecureRandom.seedTime();
    if (R.not(R.isNil(event.preventDefault))) event.preventDefault();
  });
}

function increaseSeed (event) {
  document.querySelector('#newaccountcontent').addEventListener(event, PRNG.seeder.seed);
}

var downEvents = ['mousedown', 'touchstart'];
var moveEvents = ['touchmove', 'mousemove'];

R.forEach(increaseSeed, moveEvents);
R.forEach(executeSeedTime, downEvents);
