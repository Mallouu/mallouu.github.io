onmessage = function(e) {
    console.log('Worker: Message received from main script');
    const rand_x = parseInt(getRandomInt(600));
    const rand_y = parseInt(getRandomInt(600));

    const workerResult = 'Result x : ' + rand_x + 'Result y : ' + rand_y;
    console.log('Worker: Posting message back to main script');
    postMessage(workerResult);
    
}