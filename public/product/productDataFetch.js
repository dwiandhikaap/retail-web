function addPriceListener(price, stock){
    const quantityInput = document.getElementById("item-quantity");
    quantityInput.setAttribute('max', stock);
    quantityInput.addEventListener('change', (evnt) => {

        const parsedQuantity = parseInt(evnt.target.value);
        if(isNaN(parsedQuantity) || parsedQuantity <= 0){
            quantityInput.value = "1";
            return;
        }

        const finalQuantity = Math.min(parsedQuantity, stock);
        quantityInput.value = finalQuantity;
        document.querySelector("#total-price").textContent = moneyFormat(price*finalQuantity);
    })
}


async function getProductData(){
    const params = new URLSearchParams(window.location.search)
    const productId = parseInt(params.get('id'));

    if(productId < 0 || isNaN(productId)){
        return;
    }
    
    const productData = await fetch(`/api/product_data/?id=${productId}`)
                            .then(data => data.json());

    return productData[0];                       
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

async function showProduct(){
    const { product_name, price, discount, description, stock, sold } = await getProductData();

    await sleep(300); // simulate loading

    const container = document.getElementById("item-info-container");
    const template = document.getElementsByTagName("template")[0];
    
    container.innerHTML = '';

    const itemThumbnail = template.content.querySelector("#item-thumbnail");
    const itemDetails = template.content.querySelector("#item-details");

    const itemThumbnailNode = document.importNode(itemThumbnail, true);
    const itemDetailsNode = document.importNode(itemDetails, true);

    itemDetailsNode.querySelector("#item-name").textContent = product_name;
    itemDetailsNode.querySelector("#item-price-container").querySelector("#item-price").textContent = moneyFormat(price*(100-discount)/100);
    itemDetailsNode.querySelector("#item-description").textContent = description;
    itemDetailsNode.querySelector("#item-stock").textContent = `Tersisa ${stock} barang!`;
    itemDetailsNode.querySelector("#item-sold").textContent = `${sold} Terjual`;
    itemDetailsNode.querySelector("#total-price").textContent = moneyFormat(price);

    if(discount > 0){
        const itemPriceBefore = document.createElement('span');
        const itemPriceDiscount = document.createElement('div');
        const itemPriceAfter = itemDetailsNode.querySelector("#item-price-container");
        const itemPrice = itemPriceAfter.querySelector("#item-price");

        itemPriceBefore.setAttribute('id', 'item-price-before');
        itemPriceDiscount.setAttribute('id', 'item-price-discount');

        itemPriceBefore.textContent = moneyFormat(price);
        itemPriceDiscount.textContent = `Hemat ${discount}%`;
        itemDetailsNode.insertBefore(itemPriceBefore, itemPriceAfter);
        itemPriceAfter.insertBefore(itemPriceDiscount, itemPrice.nextSibling)
    }

    container.appendChild(itemThumbnailNode);
    container.appendChild(itemDetailsNode); 

    addPriceListener(price, stock)
}

async function submitCart(){
    const params = new URLSearchParams(window.location.search)
    const productId = parseInt(params.get('id'));
    const quantity = document.getElementById("item-quantity").value;

    const cartResponse = await fetch('/api/add_to_cart', {
        method: "POST",
        headers: {
            'Content-Type' : 'application/json' 
        },
        body: JSON.stringify({
            id: productId,
            count: quantity
        })
    })

    if(cartResponse.status == 200){
        addNotif("Successfully added item to your cart!", 3000, 'success');
        return;
    }
    
    addNotif(await cartResponse.text(), 3000, 'error');
}