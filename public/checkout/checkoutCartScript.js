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
                <br>
                <span class="product-info-bottom">
                    <span class="price-after">
                        ${moneyFormat(price*(100-discount)/100)}
                    </span>
                    x
                    <span class="item-quantity">
                        @${barangJumlah} pcs
                    </span>
                </span>
            </div>
            <div class="checkout-cart-price-total">
                ${moneyFormat(price*(100-discount)/100*barangJumlah)}
            </div>
`}

async function getCartData(){
    const response = await fetch('/api/get_cart/?sort=desc&filter=unresolved');

    if(response.status != 200){
        addNotif("Terjadi masalah saat mengambil data!", 3000, 'error');
        return;
    }

    const { items } = await response.json();
    for(item of items){
        const cartDiv = document.createElement("div");
        cartDiv.setAttribute("class", "checkout-cart");
        const markup = cartDataMarkup(item);
        cartDiv.innerHTML = markup;

        const cartContainer = document.getElementById("checkout-cart-container");
        cartContainer.appendChild(cartDiv);
    }

    addCartCheckboxEventListener();
    updateCheckoutPrice();
}

function addCartCheckboxEventListener(){
    const checkboxs = document.getElementsByClassName("checkout-cart-checkbox");
    for(checkbox of checkboxs){
        checkbox.addEventListener("change", () => {
            updateCheckoutPrice();
        })
    }
}

function updateCheckoutPrice(){
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
    const pricePromoSpan = document.getElementById('price-promo-value');

    const promo = parseFloat((pricePromoSpan.textContent).replace(/\D+/g, ""))/100;

    const priceTotalSpan = document.getElementById('price-total-value');
    const priceTaxSpan = document.getElementById('price-tax-value');
    const priceGrandTotalSpan = document.getElementById('price-grand-total-value');

    priceTotalSpan.textContent = moneyFormat(priceTotal);
    priceTaxSpan.textContent = moneyFormat(tax);

    priceGrandTotalSpan.textContent = moneyFormat(priceTotal+tax-promo);
}

async function executePayment(){
    const cartCheckboxes = document.getElementsByClassName("checkout-cart-checkbox");
    const regexp = /\d+(?=\D*$)/;
    let checkoutCartData = [];

    for(checkbox of cartCheckboxes){
        if(checkbox.checked){
            const checkboxCartId = regexp.exec(checkbox.getAttribute("id"))[0];
            checkoutCartData.push({
                cartId: checkboxCartId
            })
        }
    }
    
    const checkoutPayload = JSON.stringify(checkoutCartData);
    const checkoutFetch = await fetch("/api/transaction/pay", {
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