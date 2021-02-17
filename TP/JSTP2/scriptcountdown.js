var timeoutID;
var time = 10;

function countdown(){
    timeoutID = window.setInterval(setnumber, 1000);
}

function setnumber(){
    if (time > 0){
        document.getElementById('count').innerHtml = time;
        time = time - 1;
    } else {
        clear();
    }
}


function clear() {
    window.clearInterval(timeoutID);
    time = 10;
}