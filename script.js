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

document.addEventListener('DOMContentLoaded', function() {
    console.log('HTML loaded, script running')
    //You may run all your code here. Think of this a the main() method in other langauges.
    //The reason we use this is because we want to make sure the HTML is loaded before we run our code.
    //If we don't do this, we may try to access elements that don't exist yet.
    //But now we can access any element, eg:
    var btn = document.getElementById('toggle1');
    console.log(btn)
    //And we can add event listeners to it, eg:
    btn.addEventListener('click', function() {
        console.log('Button 1 clicked!')
    });
});