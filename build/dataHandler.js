import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getDatabase, ref, set, get} from "https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js"
import { nanoid } from 'https://cdn.jsdelivr.net/npm/nanoid/nanoid.js'

const USE_FIREBASE = true;

if (USE_FIREBASE) {
    // import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-analytics.js";
    // TODO: Add SDKs for Firebase products that you want to use
    // https://firebase.google.com/docs/web/setup#available-libraries

    // Your web app's Firebase configuration
    // For Firebase JS SDK v7.20.0 and later, measurementId is optional
    const firebaseConfig = {
        apiKey: "AIzaSyC59cqJ00gaqC5VGiZ1N69QcJxVK_KlL-A",
        authDomain: "emoji-password-web.firebaseapp.com",
        databaseURL: "https://emoji-password-web-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "emoji-password-web",
        storageBucket: "emoji-password-web.appspot.com",
        messagingSenderId: "467385346507",
        appId: "1:467385346507:web:adc25580066acb13b7ee4e",
        measurementId: "G-JG5C0SJT3H"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app)

    let urlParams = new URLSearchParams(window.location.search);
    const GROUP_ID = urlParams.get('group');

    function validateGroupAndGetContent() {
        return new Promise((resolve) => {
            get(ref(database, 'groups/' + GROUP_ID)).then((snapshot) => {
                if (snapshot.exists()) { //if the group exists, we can fetch the task from the database, and display the relevant task to the user.
                    let groupTemplateString = snapshot.val();
                    //remove first and last character, since they are the quotes
                    // groupTemplateString = groupTemplateString.substring(1, groupTemplateString.length - 1);
                    resolve(groupTemplateString)
                } else {
                    replaceContent(createErrorMessage("No experiment found for the user group that you are in. Sorry."));
                    resolve(false)
                }
            }).catch((error) => {
                console.error(error);
                resolve(false)
            });
        })
    }

    function populateContent() {
        return new Promise((resolve, reject) => {
            let existingContent = localStorage.getItem("groupContent");
            if (existingContent != null) {
                console.log("existing content is not null. using local storage.")
                replaceContent(existingContent);
                resolve(GROUP_ID)
            } else {
                if (GROUP_ID == null) { //if the url does not have a group in the parameters, it is wrong and user should not be able to participate
                    replaceContent(createErrorMessage("You are not in a valid user group."));
                    reject()
                }
                console.log("existing content is null. fetching from database.")
                validateGroupAndGetContent(GROUP_ID).then((result) => {
                    if (result != false) {
                        replaceContent(result);
                        localStorage.setItem("groupContent", result);
                        resolve()
                    } else {
                        replaceContent(createErrorMessage("The user group you were provided does not exist. Sorry."));
                        reject()
                    }
                })
            }
        })
    }

    function initUser() {
        return new Promise((resolve, reject) => {
            let userId = localStorage.getItem("userId");
            
            if (userId == null) {
                userId = nanoid();
                localStorage.setItem("userId", userId);

                //create user in database
                let user = {
                    groupId: GROUP_ID,
                    datetimeVisited: getDatetime(),
                }

                set(ref(database, 'users/' + userId), user).then(() => {
                    resolve(userId)
                }).catch((error) => {
                    console.error(error);
                    reject()
                });
            } else {
                resolve(userId)
            }
        })
    }

    function handleTrial(userId) {
        //this is called assuming the user is in a valid group, and the user is in the database, and all content is loaded.

        let form = document.getElementById("finalForm");
        //check when the user submits the form, make sure it passes the default validity checks, and then store the data in the database
        form.addEventListener("sendData", (e) => {
            console.log("sendData event triggered")
            console.log(e.detail)

            //form is valid, we can store the data in the database
            let alias = e.detail.alias;
            let password = e.detail.password;
            //we need to update the user in the database, by adding the alias and password
            //we can use the userId to update the user in the database
            get(ref(database, 'users/' + userId)).then((snapshot) => {
                let user = {}
                if (snapshot.exists()) {
                    user = snapshot.val();
                    if (!user.groupId) {
                        user.groupId = GROUP_ID;
                    }
                }
                let existing_alias = user.alias;
                let existing_passwords = user.passwords;
                let passwords = [
                    {
                        password: password,
                        datetimeSubmitted: getDatetime(),
                        score: scorePassword(password),
                    }
                ]

                if (existing_alias && existing_alias != alias) {
                    if (confirm(`Your previously submitted alias was ${existing_alias}. Are you sure you want to change it to ${alias}? if you do so, please remember this alias, as you will need it to for a future survey.`)) {
                        //okay, we can continue
                    } else {
                        alias = existing_alias; //we can just set the alias to the old alias, since we dont want to override the old alias
                    }
                }
                //if there is no passwords, we can create an array with one passwords. alternatively, we should push the password to the array
                if (existing_passwords) {
                    //check existing passwords is an array
                    if (Array.isArray(existing_passwords)) {
                        if (confirm("You have already submitted a password before. You can submit another password, and it will override your previous entry. Are you sure you want to do that?")) {
                            //add passwords to existing passwords
                            existing_passwords.push(passwords[0]);
                            passwords = existing_passwords;
                        } else {
                            passwords = existing_passwords; //we can just set the passwords to the old passwords, since we dont want to override the old passwords
                        }
                    }
                }

                user.alias = alias;
                user.passwords = passwords;
                
                set(ref(database, 'users/' + userId), user).then(() => {
                    let successContent = `
                        <div class="success">
                            <h1>Thank you for participating, ${user.alias}!</h1>
                            <p>You have successfully submitted your password - <span class="pw-highlight">${user.passwords[user.passwords.length - 1].password}</span></p>
                            <p>Please remember your alias, as you will need it for a future survey.</p>
                        </div>
                    `
                    replaceContent(successContent)
                }).catch((error) => {
                    console.error(error);
                });
            }).catch((error) => {
                console.error(error);
            });
            
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        //High level description:
        //1. Content is populated, fetched from the database, depending on the group of the participant (fetched from the url)
        //2. Before any data is submitted, we store some basic data (when they logged in, and their groupId) (if they are not already in the database).
        //3. Final step handleTrial will be called, which will handle the user submitting the form, and updating the state of the user in the database.
        populateContent().then(() => {
            //dispatch custom event to winow, to announce that the content is loaded
            document.dispatchEvent(new CustomEvent('backendContentLoaded'));
            initUser().then((userId) => {
                handleTrial(userId)
            })
        })
    });

    //constraints
    //can be HTML constraints, or custom constraints
    //alias, confirm_alias. if alias not empty, -> confim_alias will make input field uneditable and reveal the password fields.
    //alias, pw, pwConfirm
}