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
    const response = await fetch('/api/get_cart/?sort=desc');

    if(response.status != 200){
        addNotif("Terjadi masalah saat mengambil data!", 3000, 'error');
        return;
    }

    const { items } = await response.json();
    for(item of items){
        console.log(item);
        const cartDiv = document.createElement("div");
        cartDiv.setAttribute("class", "checkout-cart");
        const markup = cartDataMarkup(item);
        cartDiv.innerHTML = markup;

        const cartContainer = document.getElementById("checkout-cart-container");
        cartContainer.appendChild(cartDiv);
    }
}