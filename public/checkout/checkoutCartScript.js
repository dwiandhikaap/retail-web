const cartDataMarkup = (
   { cartId,
    barangId, 
    barangJumlah, 
    product_name, 
    price, 
    discount}) => {
        const discountMarkup = () => {
            if(discount > 0){
                return `
                    <span class="price-discount">
                        -${discount}%
                    </span>
                    <span class="price-before">
                        ${moneyFormat(price)}
                    </span>
                    <br>
                `;
            }
            return '';
        }

        return `
            <input type="checkbox" name="checkout-cart-checkbox" id="checkout-cart-checkbox-${cartId}" class="checkout-cart-checkbox" checked>
            <div id="checkout-cart-thumbnail">
                <img src="https://loremflickr.com/86/86" width="86" height="86">
            </div>
            <div class="checkout-cart-item-details">
                <div class="product-name">
                    <a href="../product/?id=${barangId}">${product_name}</a>
                </div>
                <span class="product-info-top">
                    ${discountMarkup()}
                </span>
                <span class="product-info-bottom">
                    <span class="price-after">
                        ${moneyFormat(price*(100-discount)/100)}
                    </span>
                    x
                    <input type="number" class="item-quantity" id="item-quantity-${cartId}" data-cartId="${cartId}" name="item-quantity" value=${barangJumlah} min="1">
                    pc(s)
                </span>
            </div>
            <div>
                <div class="checkout-cart-price-total">
                    ${moneyFormat(price*(100-discount)/100*barangJumlah)}
                </div>
                <div class="checkout-cart-remove" onclick="deleteCart(${cartId})">
                    Hapus
                </div>
            </div>
`}

async function getPromoDetails(priceTotal, promoCode){
    const promoDetails = await fetch('/api/v1/promo/details', {
        method: 'POST',
        headers : {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            code: promoCode,
            totalSpent: parseInt(priceTotal)
        })
    }).then(data => data.json());

    return promoDetails;
}

async function getCartData(){
    if(!await isUserAuth()){
        return;
    }

    const response = await fetch('/api/v1/cart/get_cart/?sort=desc&filter=unresolved');

    if(response.status != 200){
        addNotif("Terjadi masalah saat mengambil data!", 3000, 'error');
        return;
    }

    const { items } = await response.json();
    const cartContainer = document.getElementById("checkout-cart-container");
    cartContainer.innerHTML = "";
    for(item of items){
        const cartDiv = document.createElement("div");
        cartDiv.setAttribute("class", "checkout-cart");
        const markup = cartDataMarkup(item);
        cartDiv.innerHTML = markup;
        
        cartContainer.appendChild(cartDiv);
    }

    addCartCheckboxEventListener();
    updateCheckoutPrice();
    addQuantityListener();
}

function addCartCheckboxEventListener(){
    const checkboxs = document.getElementsByClassName("checkout-cart-checkbox");
    for(checkbox of checkboxs){
        checkbox.addEventListener("change", () => {
            updateCheckoutPrice();
        })
    }
}


async function updateCheckoutPrice(){
    const cartDivs = document.getElementsByClassName("checkout-cart");
    document.getElementById("checkout-pay-button").disabled = true;

    let priceTotal = 0.0;
    for(cartDiv of cartDivs){
        const checkbox = cartDiv.querySelector(".checkout-cart-checkbox");
        if(checkbox.checked){
            const priceStr = cartDiv.querySelector(".checkout-cart-price-total").textContent;
            priceTotal += parseFloat(priceStr.replace(/\D+/g, ""))/100;
            document.getElementById("checkout-pay-button").disabled = false;
        }
    }
    
    const tax = priceTotal/10;
    
    const priceTotalSpan = document.getElementById('price-total-value');
    const priceTaxSpan = document.getElementById('price-tax-value');
    const priceGrandTotalSpan = document.getElementById('price-grand-total-value');

    const promoCode = document.getElementById("checkout-kode-promo").value;

    let promoDetails = {
        info: "",
        discount: 0,
        message: ""
    }
    if(promoCode != ""){
        promoDetails = await getPromoDetails(priceTotal, promoCode);
    }
        
    const {info, discount, message} = promoDetails

    document.getElementById("checkout-promo-info").textContent = info;
    document.getElementById('price-promo-value').textContent = moneyFormat(parseInt(discount));
    document.getElementById('price-promo-details').textContent = message;
    document.getElementById('price-grand-total-value').textContent = moneyFormat(priceTotal*110/100-discount)

    priceTotalSpan.textContent = moneyFormat(priceTotal);
    priceTaxSpan.textContent = moneyFormat(tax);

    priceGrandTotalSpan.textContent = moneyFormat(priceTotal+tax-discount);

}

async function executePayment(){
    const cartCheckboxes = document.getElementsByClassName("checkout-cart-checkbox");
    const regexp = /\d+(?=\D*$)/;
    let checkoutCartData = [];

    const promoCode = document.getElementById("checkout-kode-promo").value;

    for(checkbox of cartCheckboxes){
        if(checkbox.checked){
            const checkboxCartId = regexp.exec(checkbox.getAttribute("id"))[0];
            checkoutCartData.push({
                cartId: checkboxCartId
            })
        }
    }
    
    const checkoutPayload = JSON.stringify({
        promoCode : promoCode,
        checkoutCartData: checkoutCartData
    });

    const checkoutFetch = await fetch("/api/v1/transaction/pay", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: checkoutPayload
    })

    if(checkoutFetch.status == 200){
        addNotif("Pembayaran telah berhasil!", 3000, "success")
        return;
    } 

    addNotif(await checkoutFetch.text(), 3000, "error")
}

async function isUserAuth(){
    const isAuth = await fetch("/api/v1/user/is_authenticated");

    return isAuth.json();
}

// script for user cart data quantity adjustment
function addQuantityListener(){
    const quantityInputs = document.getElementsByClassName("item-quantity");

    for(quantityInput of quantityInputs){
        // This is a certified bruh moment
        const quantityId = quantityInput.getAttribute("id");

        const actualQuantityInput = document.getElementById(quantityId);
        actualQuantityInput.addEventListener('change', async(evnt) => {
            actualQuantityInput.disabled = true;
            const parsedQuantity = parseInt(evnt.target.value);
            if(isNaN(parsedQuantity) || parsedQuantity <= 0){
                actualQuantityInput.value = "1";
            }

            const cartId = actualQuantityInput.dataset.cartid;
            const quantity = parseInt(actualQuantityInput.value);

            await updateCartQuantity(cartId, quantity);
        })
        
        
    }
}

async function updateCartQuantity(cartId, quantity){
    const response = await fetch("/api/v1/cart/update_cart", {
        method : "POST",
        headers: {
            "Content-Type" : "application/json"
        },
        body: JSON.stringify({
            cartId: cartId,
            quantity: quantity
        })
    })

    if(response.status != 200){
        addNotif(await response.text(), 3000, "error");
        return;
    }

    await getCartData();
}

async function deleteCart(cartId){
    const response = await fetch("/api/v1/cart/delete_cart", {
        method: "POST",
        headers: {
            "Content-Type" : "application/json"
        },
        body: JSON.stringify({
            cartId: cartId
        })
    })

    if(response.status != 200){
        addNotif(response.text(), 3000, "error");
        return;
    }

    addNotif("Keranjang berhasil dihapus!", 3000, "success");
    await getCartData();
}