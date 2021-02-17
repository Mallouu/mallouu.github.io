
function init()
{
	aCanvas=document.getElementById('myCanvas');
}
function updateCanvas(){
    if(j<10){
		if(i>9){
    		i=1;
            j++;
        }
	point1=new Point(20*i,20*j,aCanvas);
    point1.ache();
    i++;
	}
}

function play(){

}

function stop(){

}

function pause(){
    
}
		