function addNotif(message, duration, type){
    let color = '';

    switch(type){
        case 'error':{
            color = 'rgba(208, 26, 66, 0.75)'; // Red
            break;
        }
        case 'success':{
            color = 'rgba(0, 162, 51, 0.75)'; // Green
            break;
        }
        default :{
            color = 'rgba(87, 98, 255, 0.75)'; // Red
            break;
        }
    }

    var notif = document.createElement("p");
    notif.className = "notif-item";
    var notifText = document.createTextNode(message);
    var firstElement = document.getElementById("notif-container").firstChild;
    notif.style.setProperty("--duration", `${duration}ms`);
    notif.style.setProperty("--bgColor", `${color}`);
    
    notif.appendChild(notifText);

    document.getElementById("notif-container").insertBefore(notif, firstElement);
    setTimeout(() => {
        document.getElementById("notif-container").removeChild(notif)
    }, duration);
}