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

// TODO: make it show product data as html
async function showProduct(){
    const { product_name, price, discount, description, stock, sold } = await getProductData();

    //await sleep(3000);

    const container = document.getElementById("item-info-container");
    const template = document.getElementsByTagName("template")[0];
    
    container.innerHTML = '';

    const itemThumbnail = template.content.querySelector("#item-thumbnail");
    const itemDetails = template.content.querySelector("#item-details");

    const itemThumbnailNode = document.importNode(itemThumbnail, true);
    const itemDetailsNode = document.importNode(itemDetails, true);

    itemDetailsNode.querySelector("#item-name").textContent = product_name;
    itemDetailsNode.querySelector("#item-price").textContent = moneyFormat(price);
    itemDetailsNode.querySelector("#item-description").textContent = description;
    itemDetailsNode.querySelector("#item-stock").textContent = `Tersisa ${stock} barang!`;
    itemDetailsNode.querySelector("#item-sold").textContent = `${sold} Terjual`;

    container.appendChild(itemThumbnailNode);
    container.appendChild(itemDetailsNode); 
}