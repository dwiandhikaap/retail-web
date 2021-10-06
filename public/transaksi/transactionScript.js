var transaction = null;

function padLeft(number, padCount){
    return Array(padCount-String(number).length+1).join('0')+number;
}

function formatDate(date){
    return date.toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric'});
}

function formatTime(date){
    return date.toLocaleTimeString("en-US", {hour12: false}) + ' WIB';
}

const transactionListItemMarkup = (transaction, index) => {
    const {transactionId, transaction_date, final_price} = transaction;
    const parsedDate = new Date(transaction_date);

    return `
        <div class="list-item-transaction">
            <span>No Transaksi</span>
            <br>
            <span>Transaction#${padLeft(transactionId, 4)}</span>
        </div>
        <div class="list-item-total">
            <span>Total Transaksi</span>
            <br>
            <span>${moneyFormat(final_price)}</span>
        </div>
        <div class="list-item-waktu">
            <span>Waktu</span>
            <br>
            <span>${formatDate(parsedDate)}<br>${formatTime(parsedDate)}</span>
        </div>
        <div class="list-item-detail">
            <button class="list-item-detail-button" onclick='showTransactionInfo(${index})'>Lihat Detail</button>
        </div>
    `
}

const transactionProductsMarkup = (transactionData) => {
    let markupResult = '';
    for(cart of transactionData){
        const {barangId, barangJumlah, product_name, cartId, cart_price, discount, item_price:price} = cart;

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

        const productMarkup = `
            <div class="transaction-product">
                <div class="transaction-product-thumbnail">
                    <img src="https://loremflickr.com/86/86" width="86" height="86">
                </div>
                <div class="transaction-product-item-details">
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
                        x ${barangJumlah}
                    </span>
                </div>
                <div class="transaction-product-price-total">
                    ${moneyFormat(cart_price)}
                </div>
            </div>
        `
        
        markupResult += productMarkup;
    }
    
    return markupResult;
}

/* TODO: bikin markup utk transaction infonya */
const transactionInfoMarkup = (transaction) => {
    console.log(transaction);

    const {data:transactionData, transactionId, transaction_date, name, promo, total_price, final_price} = transaction;

    const parsedDate = new Date(transaction_date)

    return `
        <h2>Transaction#${padLeft(transactionId, 4)}</h2>
        <div class="transaksi-info-details-top">
            <span>Waktu Transaksi</span>
            <span>${formatDate(parsedDate)}, ${formatTime(parsedDate)}</span>
            <span>Atas Nama</span>
            <span>${name}</span>
        </div>
        <div class="transaksi-info-details-body">
            <div class="details-body-labels">
                <span>Product</span>
                <span>Total</span>
            </div>
            <div class="details-body-items">
                ${transactionProductsMarkup(transactionData)}
            </div>
        </div>
        <div class="transaksi-info-details-price">
            <span>Sub Total</span>
            <span>${moneyFormat(total_price)}</span>
            <span>Tax 10%</span>
            <span>${moneyFormat(Math.floor(total_price/10))}</span>
            <span>Promo Code</span>
            <span>- ${moneyFormat(promo)}</span>
        </div>
        <div class="details-grand-total">
            <span>Grand Total</span>
            <span>${moneyFormat(final_price)}</span>
        </div>
    `
}

async function getTransactions(){
    const res = await fetch('/api/v1/transaction/get_transaction');

    if(res.status != 200){
        addNotif("Terjadi masalah saat mengambil data!", 3000, 'error');
        return;
    }

    transactions = (await res.json()).transactions;

    await insertTransactionsOnList();
}

async function insertTransactionsOnList(){
    const transactionLength = Object.keys(transactions).length;
    for(let i = 0; i < transactionLength; i++){
        const listContainer = document.getElementById('transaksi-list-container');
        const itemDiv = document.createElement('div');
        itemDiv.className = 'transaksi-list-item';
        itemDiv.innerHTML = transactionListItemMarkup(transactions[i], i);

        listContainer.appendChild(itemDiv);
    }
}

function showTransactionInfo(index){
    const transaction = transactions[index];
    console.log(transaction);
    document.getElementById('transaksi-item-container').innerHTML = transactionInfoMarkup(transaction);
}