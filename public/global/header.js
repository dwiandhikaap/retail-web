function moneyFormat(amount){
    return amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })
}


async function isUserAuth(){
    const isAuth = await fetch("/api/is_authenticated");

    return isAuth.json();
}

const states = {
    CART    : 1,
    PROFILE : 2,
}

var dropdownState = 0;

const checkState = (state) => {
    return dropdownState == state
}

function hideAllDropdownExcept(divId){
    const dropdowns = document.getElementsByClassName("header-menu-dropdown");
    for(dropdown of dropdowns){
        if(dropdown.id != divId){
            console.log(dropdown.id, "!=", divId)
            dropdown.style.opacity = "0";
            
            dropdown.style.visibility = "hidden";
        }
    }
}

function hideDropdown(dropdown){
    dropdown.style.opacity = "0";
    setTimeout(function(){
        dropdown.style.visibility = "hidden";
    }, 250);
}

async function updateCartDropdown(){
    const cartResponse = await fetch('/api/get_cart?max=5&sort=desc').then(res => res.json());
    const {items, itemRemaining} = cartResponse;
    
    const dropdownContainer = document.getElementById('cart-dropdown');
    dropdownContainer.innerHTML = '';
    
    if(items.length == 0){
        dropdownContainer.innerHTML = `<span class="cart-info" style="color: black">Keranjang anda kosong!</span>`;
        return;
    }

    for(item of items){
        const {barangId, barangJumlah, product_name, price, discount} = item;
        const dropdownItem = document.createElement('div');

        dropdownItem.setAttribute('class', 'cart-dropdown-item');
        dropdownItem.innerHTML = `
            <a href="/product?id=${barangId}" class="cart-dropdown-item-name">${product_name}</a>
            <div class="cart-dropdown-item-price">
                <p class="price-total">${moneyFormat(barangJumlah*price*(100-discount)/100)}</p>
                <p class="price">@${barangJumlah} x ${moneyFormat(price*(100-discount)/100)}</p>
            </div>
        `
        dropdownContainer.appendChild(dropdownItem);
    }

    if(itemRemaining > 0){
        const dropdownMore = document.createElement('div');
        dropdownMore.setAttribute('id', 'cart-dropdown-more');
        dropdownMore.innerHTML = `<p>... (+${itemRemaining} more)</p>`

        dropdownContainer.appendChild(dropdownMore)
    }
}

async function cartMenuClick(){

    const dropdown = document.getElementById("cart-dropdown");
    if(!checkState(states.CART)){
        hideAllDropdownExcept("cart-dropdown")
        dropdown.style.visibility = "visible";
        dropdown.style.opacity = "1";
        dropdownState = states.CART;

        await updateCartDropdown();

        return;
    }

    dropdownState = 0;
    hideDropdown(dropdown);
}

async function profileMenuClick(){
    const dropdown = document.getElementById("profile-dropdown");
    if(!checkState(states.PROFILE)){
        hideAllDropdownExcept("profile-dropdown")
        dropdown.style.visibility = "visible";
        dropdown.style.opacity = "1";
        dropdownState = states.PROFILE;
        return;
    }

    dropdownState = 0;
    hideDropdown(dropdown);
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

