/* 
    Utility functions
*/

const createShopItemElement = (itemData) => {
    const {discount, id, price, product_name, sold, stock} = itemData;
    const priceAfter = discount > 0 ? Math.floor(price*(100-discount)/100) : price;
    const markup = `
        <img class="shop-item-img" src="/api/v1/product/img?id=${id}" width="144" height="144" alt="${product_name}">
        <a href="/product?id=${id}" class="shop-item-name">${product_name}</a>
        ${discount > 0 ? `
        <div>
            <span class="shop-item-price-before">${moneyFormat(price)}</span>
            <span class="shop-item-discount">-${discount}%</span>
        </div>
        ` : ``}
        <span class="shop-item-price-after">${moneyFormat(priceAfter)}</span>
        
        <div>
            ${sold > 0 ? `<span class="shop-item-sold">${sold} sold</span>` : ''}
            <span class="shop-item-stock">${stock} left!</span>
        </div>
    `

    const element = document.createElement('div');
    element.className = 'shop-item';
    element.innerHTML = markup;

    return element;
}

function getURLParams(){
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category');
    const sort = params.get('sort');
    let page = params.get('page');
    page = parseInt(page) || 1;

    return {
        category: category,
        sort: sort,
        page: page
    }
}

function generateQueryString(URLParams){
    const {category, sort, page} = URLParams;
    let apiQueryString = '?';
    if(category) apiQueryString += `category=${category}&`;
    if(sort) apiQueryString += `sort=${sort}&`;
    if(page) apiQueryString += `page=${page}&`;
    
    // trim any unnecessary '?' or '&' character on the last character
    return apiQueryString.slice(0, -1);
}

function moneyFormat(amount){
    if (amount == null || amount == undefined){
        return "";
    }
    return amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })
}

function clamp(num, min, max){
    return (num > max ? max : (num < min ? min : num))
}

const createNavBack = (isDisabled) => {
    const div = document.createElement('div');
    div.id = "page-back";
    if(isDisabled){
        div.setAttribute("disabled", "true");
    }
    div.innerText = '<'

    return div;
}

const createNavNext = (isDisabled) => {
    const div = document.createElement('div');
    div.id = "page-next";
    if(isDisabled){
        div.setAttribute("disabled", "true");
    }
    div.innerText = '>'

    return div;
}

const createNavSpacing = () => {
    const div = document.createElement('div');
    div.className = "page-nav-spacing";
    div.innerText = '...'

    return div;
}

const createNavPage = (page, currentPage) => {
    const div = document.createElement('div')

    div.className = `page-select ${page == currentPage ? 'page-selected' : ''}`;
    div.setAttribute("data-page", page);
    div.innerText = page

    return div;
}

/* 
    Actual main function
*/

async function menuFetch(){
    const URLParams = getURLParams();
    const apiQueryString = generateQueryString(URLParams)    

    await fetch("/api/v1/product/shop_items" + apiQueryString)
        .then(res => res.json())
        .then(data => updateList(data))
}

async function generateItemFilter(){
    const categoryList = await fetch('/api/v1/product/get_category_list', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(res => res.json());

    const categorySelection = document.getElementById("select-category");
    const sortSelection = document.getElementById("select-sort");

    for(const category of categoryList){
        const categoryOption = document.createElement("option");
        categoryOption.text = category;

        categorySelection.appendChild(categoryOption);
    }

    const URLParams = getURLParams();
    categorySelection.value = URLParams.category || 'Semua';
    sortSelection.value = URLParams.sort || 'random'

    categorySelection.addEventListener('change', () => {
        const category = categorySelection.value;
        if(category == 'Semua'){
            URLParams.category = '';
        }
        else{
            URLParams.category = category;
        }

        URLParams.page = '';
        const apiQueryString = generateQueryString(URLParams);

        window.location.href = "/" + apiQueryString;
    })

    sortSelection.addEventListener('change', () => {
        const sortMode = sortSelection.value;
        if(sortMode == 'random'){
            URLParams.sort = '';
        }
        else{
            URLParams.sort = sortMode;
        }

        const apiQueryString = generateQueryString(URLParams);
        window.location.href = "/" + apiQueryString;
    })
}

function updateList(data){
    const {availablePage, items} = data;

    const itemList = document.getElementById("shop-item-list");
    const temp = document.getElementsByTagName("template")[0];
    const item = temp.content.querySelector(".shop-item");

    for(itemData of items){
        const newItem = createShopItemElement(itemData);
        itemList.appendChild(newItem);
    }

    generateNavigation(availablePage);
}

function generateNavigation(pageCount){
    let URLParams = getURLParams();
    URLParams.page = clamp(URLParams.page, 1, pageCount);

    let {page: currentPage} = URLParams;
    const pageNavigationDiv = document.getElementById("page-navigation");
    pageNavigationDiv.innerHTML = '';

    const navBackDiv = createNavBack(currentPage == 1);
    const navNextDiv = createNavNext(currentPage == pageCount);

    pageNavigationDiv.appendChild(navBackDiv);
    
    //  I Wrote This Algorithm Below™
    const clusterSize = 3;

    if(clusterSize+3 >= pageCount){
        for(let i = 1; i <= pageCount; i++){
            const navPageDiv = createNavPage(i, currentPage);
            pageNavigationDiv.appendChild(navPageDiv);
        }
    }
    
    else{
        if(currentPage < clusterSize){
            for(let i = 1; i < clusterSize+3; i++){
                const navPageDiv = createNavPage(i, currentPage);
                pageNavigationDiv.appendChild(navPageDiv);
            }
            
            pageNavigationDiv.appendChild(createNavSpacing());

            const navPageDiv = createNavPage(pageCount, currentPage);
            pageNavigationDiv.appendChild(navPageDiv);
        }

        else if(currentPage > pageCount - clusterSize){
            const navFirstPageDiv = createNavPage(1, currentPage);
            pageNavigationDiv.appendChild(navFirstPageDiv);

            pageNavigationDiv.appendChild(createNavSpacing());

            const clusterStart = pageCount - clusterSize - 1;
            for(let i = clusterStart; i <= pageCount; i++){
                const navPageDiv = createNavPage(i, currentPage);
                pageNavigationDiv.appendChild(navPageDiv);
            }
        }

        else{
            const navFirstPageDiv = createNavPage(1, currentPage);
            pageNavigationDiv.appendChild(navFirstPageDiv);

            pageNavigationDiv.appendChild(createNavSpacing());

            const clusterEnd = currentPage + clusterSize - 1;
            for(let i = currentPage; i <= clusterEnd; i++){
                const navPageDiv = createNavPage(i, currentPage);
                pageNavigationDiv.appendChild(navPageDiv);
            }

            pageNavigationDiv.appendChild(createNavSpacing());

            const navLastPageDiv = createNavPage(pageCount, currentPage);
            pageNavigationDiv.appendChild(navLastPageDiv);
        }
    }

    pageNavigationDiv.appendChild(navNextDiv);

    addNavigationListener(URLParams);
}

function addNavigationListener(URLParams){
    let {category, sort, page: currentPage} = URLParams;

    const navBackDiv = document.getElementById("page-back");
    const navNextDiv = document.getElementById("page-next");
    const navPageDivs = document.getElementsByClassName("page-select");

    if(!navBackDiv.getAttribute('disabled')){
        navBackDiv.addEventListener('click', event => {
            const apiQueryString = generateQueryString({
                category: category,
                sort: sort,
                page: currentPage-1
            })
            
            window.location.href = "/" + apiQueryString;
        })
    }

    if(!navNextDiv.getAttribute('disabled')){
        navNextDiv.addEventListener('click', event => {
            const apiQueryString = generateQueryString({
                category: category,
                sort: sort,
                page: currentPage+1
            })
            
            window.location.href = "/" + apiQueryString;
        })
    }

    for(const navPageDiv of navPageDivs){
        navPageDiv.addEventListener('click', event => {
            const apiQueryString = generateQueryString({
                category: category,
                sort: sort,
                page: navPageDiv.dataset.page
            })
            
            window.location.href = "/" + apiQueryString;
        })
    }
}