async function submitRegister(){
    const name = document.getElementById("name-input").value;
    const email = document.getElementById("email-input").value;
    const password = document.getElementById("password-input").value;

    const response = await fetch("/register", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: name,
            email: email,
            password: password
        })
    })

    if(response.status == 200){
        window.location.replace('/login')
    }

    else{
        const registerError = document.getElementById("register-error");
        registerError.textContent = await response.text();
        registerError.style.marginBottom = "1rem";
    }
}