async function isUserAuth(){
    const isAuth = await fetch("/api/is_authenticated");

    return isAuth.json();
}

function profileMenuClick(){
    const menu = document.getElementById("profile-dropdown");
    if(menu.style.opacity == "0"){
        menu.style.visibility = "visible";
        menu.style.opacity = "1";
        return;
    }

    menu.style.opacity = "0";
    setTimeout(function(){
        menu.style.visibility = "hidden";
    }, 250);
    
}

async function onHeaderLoad(){
    if(!await isUserAuth()){
        return;
    }

    setDropdownProfile();

    await fetch("/api/user_profile")
        .then(res => res.json())
        .then(data => setUserProfile(data))
}

function setUserProfile(data){
    const profileNames = document.getElementsByClassName("user-profile-name");
    const profileBalances = document.getElementsByClassName("user-profile-balance");

    for(profileName of profileNames){
        profileName.textContent = data.name;
    }

    for(profileBalance of profileBalances){
        profileBalance.textContent = 'Saldo ' + moneyFormat(data.balance);
    }
}

function setDropdownProfile(){
    const dropdownProfile = document.getElementById('profile-dropdown');
    dropdownProfile.innerHTML = `
        <span class="user-profile-name"></span>
        <span class="user-profile-balance"></span>
        <a class="user-profile-logout" href="/logout">Logout</a>
    `
    return;
}

function moneyFormat(amount){
    return amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })
}