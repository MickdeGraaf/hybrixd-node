$(document).ready(function() {
  new customAlert();
});

function alertbutton() {
  alert('<div class="alert-header">⚠</div><br><h2>WARNING: Do not store large value in this wallet!</h2><br>We\'re making every effort towards a secure design, and do not store any wallet file or data on this computer. Regardless, we cannot guarantee the security of your cryptocurrency in this stage of the project!<br><br>',
        {title: '', button: 'Yes, I understand'});
}

function helpbutton() {
  alert('<h2>Welcome to the Internet of Coins wallet</h2><br><h3>I already have an account</h3>To sign in, you need to enter an account code and password that are both 16 characters long.<br><br><h3>I\'m new, I need a new account </h3>If you don\'t have sign in credentials yet, you can generate them by clicking on the "+ Create a new account" button, and the new credentials will be filled in for you.<br><br><h3>Do you still have questions?</h3>Please visit <a href="https://internetofcoins.org" target="_BLANK">our FAQ.</a><br><br>',
        {title: '', button: 'Close'});
}

function checkfields () {
  var userID = String($('#inputUserID').val());
  var pass = String($('#inputPasscode').val());
  var isUserIDValid = validateUserID(userID) && validate_userid(userID) && userID !== pass;
  var isPasswordValid = validatePassword(pass) && validate_passwd(userID, pass);

  if (isUserIDValid && isPasswordValid) {
    $('#loginbutton').removeClass('disabled');
    $('#tooltip').css('opacity', 0);
    $('#loginform input[type=text], #loginform input[type=password]').css( 'border-color', '#D9E3EB' );
  } else {
    // TODO: Give back some feedback to the user about incorrect credentials????
    if (userID.length > 0) {
      $('#inputUserID').css('text-transform','uppercase');
    } else {
      $('#inputUserID').css('text-transform','');
    }
    $('#loginbutton').addClass('disabled');
  }
}

// animation (init)
function animate_login() {
  $('#arc0').css('background-color',$('#combinator').css('color'));
  if ( blink('arc0') && rotate_login(0) && dial_login(0) ) {
    // return true to confirm animation is running
    return true;
  }
}

// animation (blink)
function blink(target) {
  var el = document.getElementById(target);
  if (el != null && typeof el.style!='undefined') {
    if(typeof el.style.visibility!='undefined' && el.style.visibility=='hidden') {
      el.style.visibility='visible';
    } else {
      el.style.visibility='hidden';
    }
  }
  setTimeout("blink('"+target+"')",400);
  return true;
}

// animation (rotation)
function rotate_login(turn) {
  var el = document.getElementById('arc3');
  var bgcl = $('#combinator').css('background-color');
  //alert(bgcl);
  if (el != null) {
    if (el.style['border-left']=='1px solid '+bgcl) {
      el.style['border-left']='1px solid';
      el.style['border-right']='1px solid';
      el.style['border-top']='1px solid '+bgcl;
      el.style['border-bottom']='1px solid '+bgcl;
    } else {
      el.style['border-left']='1px solid '+bgcl;
      el.style['border-right']='1px solid '+bgcl;
      el.style['border-top']='1px solid';
      el.style['border-bottom']='1px solid';
    }
  }
  if ( turn==0 ) { turn = 1; } else { turn = 0; }
  setTimeout("rotate_login("+turn+")",1500);
  return true;
}

function dial_login(turn) {
  var el = document.getElementById('arc2');
  var bgcl = $('#combinator').css('background-color');
  if (turn==0) {
    el.style['border-left']='1px solid';
    el.style['border-top']='1px solid '+bgcl;
    el.style['border-right']='1px solid '+bgcl;
    el.style['border-bottom']='1px solid '+bgcl;
  }
  if (turn==1) {
    el.style['border-left']='1px solid';
    el.style['border-top']='1px solid';
    el.style['border-right']='1px solid '+bgcl;
    el.style['border-bottom']='1px solid '+bgcl;
  }
  if (turn==2) {
    el.style['border-left']='1px solid';
    el.style['border-top']='1px solid';
    el.style['border-right']='1px solid';
    el.style['border-bottom']='1px solid '+bgcl;
  }
  if (turn==3) {
    el.style['border-left']='1px solid';
    el.style['border-top']='1px solid';
    el.style['border-right']='1px solid';
    el.style['border-bottom']='1px solid';
  }
  return true;
}
