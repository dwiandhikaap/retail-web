async function submitLogin(){
    const email = document.getElementById("email-input").value;
    const password = document.getElementById("password-input").value;

    const response = await fetch("/login", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    })

    if(response.status == 200){
        window.location.replace('/')
    }

    else{
        const loginError = document.getElementById("login-error");
        loginError.textContent = await response.text();
        loginError.style.marginBottom = "1rem";
    }
}