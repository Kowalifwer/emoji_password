//create a function, that will map a number (0-100) to a strength color (5 colors total from good to great)
function scoreToColorAndStrength(score) {
    let color = "";
    let strength = "";
    if (score <= 20) {
        color = "red";
        strength = "very weak";
    } else if (score <= 40) {
        color = "orange";
        strength = "weak";
    } else if (score <= 60) {
        color = "yellow";
        strength = "good";
    } else if (score <= 80) {
        color = "lightgreen";
        strength = "strong";
    } else {
        color = "green";
        strength = "impenetrable";
    }
    return [color, strength];
}

function scorePassword(pass) {
    var score = 0;
    if (!pass)
        return score;

    // award every unique letter until 5 repetitions
    // award every unique emoji until 4 repetitions
    var letters = new Object();
    var emojis = new Object();
    for (var i=0; i<pass.length; i++) {
        if (pass[i].match(/[\uD800-\uDFFF]/)) { //IF EMOJI
            emojis[pass[i]] = (emojis[pass[i]] || 0) + 1;
            score += 15.0 / emojis[pass[i]];
        } else { //IF ANY OTHER CHARACTER
            letters[pass[i]] = (letters[pass[i]] || 0) + 1;
            score += 5.0 / letters[pass[i]];
        }
    }

    // bonus points for mixing it up
    var variations = {
        digits: /\d/.test(pass),
        lower: /[a-z]/.test(pass),
        upper: /[A-Z]/.test(pass),
        nonWords: /\W/.test(pass),
    }

    var variationCount = 0;
    for (var check in variations) {
        variationCount += (variations[check] == true) ? 1 : 0;
    }
    score += (variationCount - 1) * 10;

    return parseInt(score);
}

document.addEventListener('backendContentLoaded', function() {
    finalForm = document.getElementById('finalForm');
    previousBtn = document.getElementById('previous');
    nextBtn = document.getElementById('next');

    pwd = document.getElementById('pwd');
    pwdConfirm = document.getElementById('pwdConfirm');
    pwdStrength = document.getElementById('pwdStrength');
    pwd.addEventListener('input', function(e) {
        let password = e.target.value;
        let score = scorePassword(password);
        let [color, strength] = scoreToColorAndStrength(score);
        pwdStrength.innerHTML = strength;
        pwdStrength.style.color = color;
    });

    function handlePreviousNextBtns() {
        if (currentSection == 0) {
            previousBtn.classList.add('hidden');
        } else {
            previousBtn.classList.remove('hidden');
        }

        if (currentSection == sections.length - 1) {
            nextBtn.innerHTML = 'Submit!';
        } else {
            nextBtn.innerHTML = 'Next';
        }
    }

    function validateSection(section) {
        return new Promise(function(resolve) {
            //reset the validator state on the password fields
            pwdConfirm.setCustomValidity('');
            pwd.setCustomValidity('');

            //BASE FIELD VALIDATION
            let inputs = section.querySelectorAll('input');
            inputs.forEach(function(input) {
                let valid = input.checkValidity();
                if (!valid) {
                    input.reportValidity();
                    resolve(false);
                }
            })

            //CUSTOM VALIDATION
            //we are in section 2 - password input
            pwd_field = section.querySelector('#pwd');
            if (pwd_field) {
                let password = pwd_field.value;
                //if we are in emoji mode
                if (finalForm.classList.contains('emoji')) { 
                    //make sure the password contains at least one emoji
                    let containsEmoji = false;
                    for (let i = 0; i < password.length; i++) {
                        if (password[i].match(/[\uD800-\uDFFF]/)) {
                            containsEmoji = true;
                            break;
                        }
                    }
                    if (!containsEmoji) {
                        pwd_field.setCustomValidity('Password must contain at least one emoji.');
                        pwd_field.reportValidity();
                        resolve(false);
                    }
                } else { //TODO: add extra validators for non emoji modes.
                    //
                }
            }

            resolve(true);
        })
    }

    //if enter key is pressed, we should go to the next section
    finalForm.addEventListener('keyup', function(e) {
        if (e.keyCode == 13) {
            nextBtn.click();
        }
    })

    emoji_container = document.querySelector('.emoji-container');
    //make a bubbling event listener for each button in the emoji container
    emoji_container.addEventListener('click', function(e) {
        if (e.target.tagName == 'BUTTON') {
            pwd.value += e.target.innerHTML;
            pwd.dispatchEvent(new Event('input'));
        }
    })

    sections = finalForm.querySelectorAll('section');
    //we need a system to keep track of which section we are on
    currentSection = 0;
    //we should be able to navigate back and forth
    previousBtn.addEventListener('click', function() {
        if (currentSection > 0) {
            sections[currentSection].classList.remove('active');
            currentSection--;
            sections[currentSection].classList.add('active');
        }
        handlePreviousNextBtns();
    })

    nextBtn.addEventListener('click', function() {
        validateSection(sections[currentSection]).then(success => {
            if (success) {
                if (currentSection < sections.length - 1) { //if we are not on the last section
                    sections[currentSection].classList.remove('active');
                    currentSection++;
                    sections[currentSection].classList.add('active');
                    handlePreviousNextBtns();
                } else { //last section (nextu button should trigger form submission)
                    //check that passwords match
                    if (pwd.value != pwdConfirm.value) {
                        pwdConfirm.setCustomValidity('Passwords do not match. Hint: they should!');
                        pwdConfirm.reportValidity();
                        return;
                    } else {
                        pwdConfirm.setCustomValidity('');
                        //submit the data to be hadnled by dataHandler.js
                        //send a custom event 'sendData' to the finalForm. pass as parameters, the alias and password
                        finalForm.dispatchEvent(new CustomEvent('sendData', {
                            detail: {
                                alias: document.getElementById('alias').value,
                                password: pwd.value
                            }
                        }))
                    }
                }
            }
        })
    })
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