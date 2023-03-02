function toggleHidden(n) {
    var btn = document.getElementById('toggle' + n);
    var pwd = document.getElementById('pwd' + n);
    if (pwd.type == 'password') {
      pwd.type = 'text';
      btn.innerHTML = 'Hide password';
    }
    else {
      pwd.type = 'password';
      btn.innerHTML = 'Show password';
    }
}

// feel free to add more rules
function checkPwdPasswordStrength(password_no, strength_no) {
  const password_value = document.getElementById(password_no).value;
  // true if password includes emoji
  var isEmoji = /[\uD800-\uDFFF]/.test(password_value);
  const password = password_value.replace(/[\uD800-\uDFFF]/g, '');
  let score = 0;
  // add a point if password is longer than 8 and 12 chars
  if (password.length >= 6) {
      score += 1;
  }
  else if (password.length >= 10) {
    score += 2;
  }
  else if (password.length >= 12) {
      score += 2;
    }
  // for each special character add a point
  var regex = /[^a-zA-Z0-9]/;
  for (let i = 0; i < password.length; i++) {
      if (regex.test(password[i])) {
          score += 1;
      }
  }
  // add 10 points emojis
  if (isEmoji) {
    score += 10
  }
  // add a point if password contains digits
  regex = /\d/;
  if (regex.test(password)) {
      score += 2;
  }

  strength = calculateStrengthValue(score);
  document.getElementById(strength_no).innerHTML = strength;
}

function calculateStrengthValue(score) {
  let strength = ""
    if (score <= 4) {
      strength = 'poor';
  } else if (score <= 6) {
      strength = 'fair';
  } else if (score <= 10) {
      strength = 'good';
  } else {
      strength = 'excellent';
  }
  return strength;
}

function addEmoji(emoji) {
    var pwd = document.getElementById("pwd2");
    pwd.value += emoji;
    checkPwdPasswordStrength("pwd2","strength2");
}

document.addEventListener('DOMContentLoaded', function() {
    //You may run all your code here. Think of this a the main() method in other langauges.
    //The reason we use this is because we want to make sure the HTML is loaded before we run our code.
    //If we don't do this, we may try to access elements that don't exist yet.
    //But now we can access any element, eg:
    // Call checkPwdPasswordStrength() for each password input element
    var btn = document.getElementById('toggle1');
    //And we can add event listeners to it, eg:
    // btn.addEventListener('click', function() {
    // });
});

//UTILITY FUNCTIONS
function getDatetime() {
    var timestamp = new Date();
    return timestamp.getDate() + "/"
    + (timestamp.getMonth()+1) + "/"
    + timestamp.getFullYear() + " @ "
    + timestamp.getHours() + ":"
    + timestamp.getMinutes() + ":"
    + timestamp.getSeconds();
}

function string_to_html_element(html_string) {
    var doc = new DOMParser().parseFromString(html_string, "text/html");
    return doc.body.firstChild
}

function replaceContent(newContent) {
    var content = document.getElementById("content");
    //make sure not undefined
    if (content == null)
        return;
    
    //if content is string
    if (typeof newContent === 'string' || newContent instanceof String)
        content.innerHTML = newContent;
    //if content is html element
    else if (newContent instanceof HTMLElement) {
        content.innerHTML = "";
        content.appendChild(newContent);
    }
}

function createErrorMessage(message) {
    return `
        <div class="error">
            <h1>We've encountered a problem 🙁</h1>
            <h3>${message}</h3>
            <p>Please reach out to the trials team, to assist you, and send you a working link.</p>
        </div>
    `
}