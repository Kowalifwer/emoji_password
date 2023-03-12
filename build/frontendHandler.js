//A function, that will map a number (0-100) to a strength color (5 colors total from good to great)
function scoreToColorAndStrength(score) {
    let color = ""
    let strength = "poor";
    if (score <= 20) {
        color = "red";
        strength = "poor";
    } else if (score <= 40) {
        color = "orange";
        strength = "poor";
    } else if (score <= 60) {
        color = "Gold"
        strength = "medium";
    } else if (score <= 80) {
        color = "yellowgreen";
        strength = "medium";
    } else {
        color = "green";
        strength = "strong";
    }
    return [color, strength];
}

//A function that will calculate the strength of a password based on a number of factors
function scorePassword(password) {
    var score = 0;
    if (!password)
        return score;

    // award every unique letter until 3 repetitions
    var characters = {}; //keep track of character and how many times it appears
    for (var i=0; i<password.length; i++) {
        characters[password[i]] = (characters[password[i]] || 0) + 1;
        score += 3.0 / characters[password[i]];
    }

    // map that awards more points for various different character types present
    var variations = [
        [1.0, /\d/.test(password)], //digits
        [0.75, /[a-z]/.test(password)], //lowercase letters
        [1.0, /[A-Z]/.test(password)], //uppercase letters
        [1.5, /\W/.test(password) && !/[\uD800-\uDFFF]/.test(password)], //special characters (NO EMOJI)
        [1.5, /[\uD800-\uDFFF]/.test(password)], //emoji (note that emojis usually worth 2 characters, so make sure to account for that when you set the score in this row)
    ]

    var variationCount = 0; //this is the multiplier that grows for each pattern detected from the 'variations' array
    for (var tuple of variations) {
        let weight = tuple[0];
        let hasVariation = tuple[1];
        variationCount += (hasVariation) ? weight : 0;
    }

    //bonus points for having a longer password
    if (password.length > 12) {
        score += 15;
    } else if (password.length > 8) {
        score += 8;
    } else if (password.length > 4) {
        score += 4;
    }

    score += (variationCount - 1) * 10;
    return parseInt(Math.min(score, 100)); //make sure the score is between 0 and 100
}

document.addEventListener('backendContentLoaded', function() {
    let finalForm = document.getElementById('finalForm');
    let previousBtn = document.getElementById('previous');
    let nextBtn = document.getElementById('next');

    let pwd = document.getElementById('pwd');
    let pwdConfirm = document.getElementById('pwdConfirm');
    let pwdStrength = document.getElementById('pwdStrength');
    let pwdMeter = document.getElementById('pwdMeter');

    //handle the password strength indicator and update the score as the user types into the password field.
    pwd.addEventListener('input', function(e) {
        let password = e.target.value;
        let score = scorePassword(password);
        let [color, strength] = scoreToColorAndStrength(score);
        pwdStrength.innerHTML = strength;
        pwdStrength.style.color = color;
        
        pwdMeter.children[0].style.width = score + '%';
        pwdMeter.children[0].style.backgroundColor = color;
    });

    //prevent copying from pwd
    pwd.addEventListener('copy', function(e) {
        e.preventDefault();
    });

    //prevent pasting into pwdConfirm
    pwdConfirm.addEventListener('paste', function(e) {
        e.preventDefault();
    });

    //will appear and disappear the next and previous buttons, depending on the current section.
    function handlePreviousNextBtns() {
        if (currentSection == 0) {
            previousBtn.classList.add('hidden');
        } else {
            previousBtn.classList.remove('hidden');
        }

        if (currentSection == sections.length - 1) {
            nextBtn.innerHTML = 'Submit!';
        } else {
            nextBtn.innerHTML = 'Next step';
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
                let expectedStrength = pwd_field.getAttribute('data-strength');
                if (expectedStrength) {
                    let score = scorePassword(password);
                    let strength = scoreToColorAndStrength(score)[1];
                    if (strength != expectedStrength) {
                        pwd_field.setCustomValidity(`Password must be "${expectedStrength}" strength to continue.`);
                        pwd_field.reportValidity();
                        resolve(false);
                    }
                }

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
                } else { //EXTRA: can add more complex validation rules for non-emoji mode. Note that currently it is done by adding the appropriate HTML5 validation attributes to the input fields.
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

    //this section will listen to any emoji button clicks, across all sections in the app, and add the emoji to the password field.
    emoji_containers = document.querySelectorAll('.emoji-container');
    for (let i = 0; i < emoji_containers.length; i++) {
        let emoji_container = emoji_containers[i];
        emoji_container.addEventListener('click', function(e) {
            if (e.target.tagName == 'BUTTON') {
                let container = e.target.closest('section');
                let containerPwd = container.querySelector('input[type="text"]');

                //this will also handle case if user wants to insert emoji at their cursor position
                //by default it will append the emoji to the end of the password
                let cursorPos = containerPwd.selectionStart;
                if (cursorPos != 0) {
                    let pwd = containerPwd.value;
                    let before = pwd.substring(0, cursorPos);
                    let after = pwd.substring(cursorPos, pwd.length);
                    containerPwd.value = before + e.target.innerHTML + after;
                } else {
                    containerPwd.value += e.target.innerHTML;
                } 
                containerPwd.dispatchEvent(new Event('input'));
            }
        })
    }

    sections = finalForm.querySelectorAll('section');
    //we need a system to keep track of which section we are on
    currentSection = 0;

    //navigation handlers for previous and next buttons
    previousBtn.addEventListener('click', function() {
        if (currentSection > 0) {
            sections[currentSection].classList.remove('active');
            currentSection--;
            sections[currentSection].classList.add('active');
        }
        handlePreviousNextBtns();
    })

    nextBtn.addEventListener('click', function() {
        //validate the current section, only then move to the next section
        validateSection(sections[currentSection]).then(success => {
            if (success) {
                if (currentSection < sections.length - 1) { //if we are not on the last section
                    sections[currentSection].classList.remove('active');
                    currentSection++;
                    sections[currentSection].classList.add('active');
                    handlePreviousNextBtns();
                } else { //last section (next button should trigger form submission)
                    //check that passwords match
                    if (pwd.value != pwdConfirm.value) {
                        pwdConfirm.setCustomValidity('Passwords do not match. Please try again. Feel free to navigate back to the previous section to view/update your password.');
                        pwdConfirm.reportValidity();
                        return;
                    } else {
                        pwdConfirm.setCustomValidity('');
                        // submit the data to be hadnled by dataHandler.js
                        // send a custom event 'sendData' to the finalForm. pass as parameters, the alias and password
                        // this event gets recieved and handled by dataHandler.js to send the data to the server
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

//this function will replace the content of our base html file with the new content
//newContent parameter can be a string or an html element
function replaceContent(newContent) {
    var content = document.getElementById("content");
    //make sure not undefined
    if (content == null) {
        console.warn("Content element not found. Please make sure you have an element with id 'content' in your html file.")
        return;
    }
    
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