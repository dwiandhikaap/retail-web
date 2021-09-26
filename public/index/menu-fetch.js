async function menuFetch(){
    await fetch("/api/shop_items")
        .then(res => res.json())
        .then(data => updateList(data))
}

function updateList(items){
    const itemList = document.getElementById("shop-item-list");
    const temp = document.getElementsByTagName("template")[0];
    const item = temp.content.querySelector(".shop-item");

    for(itemData of items){
        const newItem = document.importNode(item, true);
        newItem.querySelector('.shop-item-name').textContent = itemData.product_name;
        newItem.querySelector('.shop-item-name').setAttribute("href", `/product?id=${itemData.id}`);
        newItem.querySelector('.shop-item-price').textContent = moneyFormat(itemData.price);
        newItem.querySelector('.shop-item-stock').textContent = itemData.stock + " left!";
        itemList.appendChild(newItem);
    }
}

function moneyFormat(amount){
    if (amount == null || amount == undefined){
        return "";
    }
    return amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })
}