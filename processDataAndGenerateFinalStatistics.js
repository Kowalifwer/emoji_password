//load a text file name postTrialData.txt into a string
let fs = require("fs");
let postTrialDataString = fs.readFileSync("postTrialData.txt", "utf8");
//get data from dbDataJson.json file in same directory
let dbDataJson = require("./dbData.json");
//load string similarity library
//from build folder, frontendHandler import scorePassword ONLY, not whole file

//npm install string-similarity --save
const stringSimilarity = require("string-similarity");
//npm install --save js-levenshtein
const levenshtein = require('js-levenshtein');

let postTrialSurveyUserAliasToPasswordMap = new Map();
//go over each line, which represents a username and a password, separated by a tab
let xlsx_array = postTrialDataString.split("\r");
for (let i = 0; i < xlsx_array.length; i++) {
    //split the line into two parts, the first part is the username, and the second part is the password. separator is a tab
    let line = xlsx_array[i].split("\t");
    let [username, password] = line;
    //remove trailing and leading spaces from username
    username = username.trim();
    //lowercase the username
    username = username.toLowerCase();

    postTrialSurveyUserAliasToPasswordMap.set(username, password);
}

let group_ids = Object.keys(dbDataJson.groups)
let users = dbDataJson.users
let groupPasswords = new Map();
let finalStatistics = {
    'totalUsersSubmitted': 0,
    'totalUsersSubmittedPostTrial': postTrialSurveyUserAliasToPasswordMap.size,
    'totalUsersFoundPostTrial': 0,
    'groups': {},
    'postTrialAliasesNotFoundInDatabase': [],
}

let groupNames = [
    "Group 1 - Emoji password STRONG",
    "Group 2 - Emoji password MEDIUM",
    "Group 3 - Normal password STRONG",
    "Group 4 - Normal password MEDIUM"
]
let counter = 0
for (let group_id of group_ids) {
    groupPasswords[group_id] = {
        'passwords': [],
        'nUsers': 0,
        'nPasswords': 0,
    }

    finalStatistics.groups[group_id] = {
        'name': groupNames[counter],
        'totalUsersSubmitted': 0,
        'totalUsersFoundPostTrial': 0,
        'levenshteins': [],
        'scores': [],
        // 'foundPasswords': [], uncomment if you want full password data for each entry
    }
    counter += 1
}

for (let userId in users) {
    let userData = users[userId]
    if (userData.passwords) {
        if (userData.passwords.length > 1) {
            console.log(userData.alias + " has more than one password. Will only consider the closest levensthein distance password.")
        }
        let hasPassword = true
        let minLevDist = 1000
        let minLevObject = {
            'index': 0,
            'surveyPassword': null,
            'levenshtein': null,
        }
        let i = 0
        let groupId = userData.groupId
        for (let password of userData.passwords) {
            //replaceGroupID if password.groupId exists, else do not replace
            if (password.groupId) {
                groupId = password.groupId
            }

            if (!groupId) {
                console.log("User without a group! Skipping.", userData)
                hasPassword = false
                continue
            }

            let userSurveyPassword = postTrialSurveyUserAliasToPasswordMap.get(userData.alias.toLowerCase())
            if (userSurveyPassword == undefined) {
                //search across all passwords, and find the closest similarity
                let closestSimilarity = 0
                let closestMatchAlias = null
                //go over postTrialSurveyUserAliasToPasswordMap map, and find the closest match
                for (let name of postTrialSurveyUserAliasToPasswordMap.keys()) {
                    let similarity = stringSimilarity.compareTwoStrings(userData.alias.toLowerCase(), name)
                    if (similarity > closestSimilarity) {
                        closestSimilarity = similarity
                        closestMatchAlias = name
                    }
                }
                if (closestSimilarity > 0.80) {
                    console.log(`User alias ${userData.alias} not found in survey data, but found a similar name: ${closestMatchAlias}`)
                    userSurveyPassword = postTrialSurveyUserAliasToPasswordMap.get(closestMatchAlias.toLowerCase())
                }
            }

            if (userSurveyPassword != undefined) {
                let levenshteinDistance = levenshtein(userSurveyPassword, password.password)
                if (levenshteinDistance < minLevDist) {
                    minLevDist = levenshteinDistance
                    minLevObject['surveyPassword'] = userSurveyPassword
                    minLevObject['levenshtein'] = levenshteinDistance
                    minLevObject['groupId'] = groupId
                    minLevObject['index'] = i
                }
            }

            password.userAlias = userData.alias
            groupPasswords[groupId].passwords.push(password)
            groupPasswords[groupId]['nPasswords'] += 1
            i += 1
        }
        if (hasPassword) {
            //
            groupPasswords[groupId]['nUsers'] += 1
            let index = groupPasswords[groupId]['nPasswords'] - (i - minLevObject['index'])
            delete minLevObject['index']
            groupPasswords[groupId].passwords[index] = {...groupPasswords[groupId].passwords[index], ...minLevObject}
        }
    }
}

//update our final statistics report with the data we have. Here we only include the passwords that were found in the post trial survey and the database.
for (let grpId in groupPasswords) {
    let group = groupPasswords[grpId]
    finalStatistics.totalUsersSubmitted += group.nUsers
    for (let password of group.passwords) {
        //check if levenshtein key in password object
        if (Object.keys(password).includes('levenshtein')) {
            if (password.levenshtein != null) {
                finalStatistics.totalUsersFoundPostTrial += 1
                finalStatistics.groups[grpId].totalUsersFoundPostTrial += 1
                finalStatistics.groups[grpId].levenshteins.push(password.levenshtein)
                finalStatistics.groups[grpId].scores.push(password.score)
                
                //uncomment if you want full password data for each entry in the statistics report.
                // finalStatistics.groups[grpId].foundPasswords.push({
                //     'userAlias': password.userAlias,
                //     'originalPassword': password.password,
                //     'surveyPassword': password.surveyPassword,
                //     'originalPasswordScore': password.score,
                //     'levenshtein': password.levenshtein,
                // })
            }
            finalStatistics.groups[grpId].totalUsersSubmitted += 1
        }
    }
}

//this section will locate all user aliases that were IN the POST TRIAL SURVEY, but were NOT FOUND in the database.
for (let userAlias of postTrialSurveyUserAliasToPasswordMap.keys()) {
    let found = false
    for (let grpId in groupPasswords) {
        let group = groupPasswords[grpId]
        for (let password of group.passwords) {
            if (password.userAlias.toLowerCase() == userAlias) {
                found = true
                break
            }
        }
        if (found) {
            break
        }
    }
    if (!found) {
        finalStatistics.postTrialAliasesNotFoundInDatabase.push(userAlias)
    }
}

//save finalStatistics to json file. make sure its nicely formatted with 4 spaces
fs.writeFile('finalStatistics.json', JSON.stringify(finalStatistics, null, 4), (err) => {
    if (err) {
        console.log(err)
    }
})
