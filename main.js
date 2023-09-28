var c = document.getElementById("visualizer");
var ctx = c.getContext("2d");

var delaySlider = document.getElementById("delayInput");
var delayDisplay = document.getElementById("delayDisplay");

var arraySizeInput = document.getElementById("arraySizeInput");
var arraySizeDisplay = document.getElementById("arraySizeDisplay");

var statusDisplay = document.getElementById("status");

var pauseButton = document.getElementById("pause-button");

var lastStatus;

var isPaused = false;

var animationCallback;

var urlParams = new URLSearchParams(window.location.search);

var sorts = Object();

var currentViewType;

var currentFrame = 0;

const randomSorts = [
    'bubble',
    'shaker',
    'brick',
    'insertion',
    'selection',
    'merge',
    'quick'
];


// Settings

var arrayLength = 100;
var delay = 1; // ms
var showBox = true;
var autoPlayOn = false;
var autoPlayDelayMs = 1000; // time between end of last sort and start of next shuffle in milliseconds

var settings = {

    dyHei: true,
    get dynamicHeight() {
        return this.dyHei;
    },
    set dynamicHeight(value) {
        this.dyHei = value;
        update();
    },

    visualizerColor: 'none',

    visSty : 'rainbow',
    get visualizerStyle() {
        return this.visSty;
    },
    set visualizerStyle(value) {
        this.visSty = value;

        switch(this.visualizerStyle) {
            case 'rainbow':
                this.backgroundColor = 'grey';
                break;
            case 'fullSpectrum':
                this.backgroundColor = 'grey';
            case 'none':
                this.backgroundColor = '#000';
                this.visualizerColor = 'none';
                break;
            default:
                this.backgroundColor = '#000';
                this.visualizerColor = 'none';
                break;
        }

        update();
    },

    backSty : 'grey',
    get backgroundColor() {
        return this.backSty;
    },
    set backgroundColor(value) {
        this.backSty = value;
        c.style.backgroundColor = value;
    }
}

var viewTypes = Object();

viewTypes.default = function() {

    settings.visualizerStyle = 'rainbow';
    settings.backgroundColor = 'grey';
    settings.dynamicHeight = true;

}// viewTypes.default

viewTypes.staticHeight = function() {

    settings.visualizerStyle = 'rainbow';
    settings.backgroundColor = 'grey';
    settings.dynamicHeight = false;

}// veiwTypes.staticHeight()

viewTypes.basic = function() {

    settings.visualizerStyle = 'none';
    settings.visualizerColor = '#ffffff';
    settings.backgroundColor = '#000000';
    settings.dynamicHeight = true;

}// viewTypes.basic()

viewTypes.fullSpectrum = Object();

viewTypes.fullSpectrum.dynamic = function() {

    settings.visualizerStyle = 'fullSpectrum';
    settings.backgroundColor = 'grey';
    settings.dynamicHeight = true;

}

viewTypes.fullSpectrum.static = function() {

    settings.visualizerStyle = 'fullSpectrum';
    settings.backgroundColor = 'grey';
    settings.dynamicHeight = false;

}

viewTypes.set = function(type) {
    
    switch(type) {

        case 'staticHeight':
            viewTypes.staticHeight();
            break;

        case 'fullDynamic':
            viewTypes.fullSpectrum.dynamic();
            break;
        
        case 'fullStatic':
            viewTypes.fullSpectrum.static();
            break;
        
        case 'basic':
            viewTypes.basic();
            break;
        
        case 'default':
        default:
            viewTypes.default();
            break;

    }

}// viewTypes.set(type)

// Settings end

var interval;


var numbers = [];
var animationQueue = [];

c.width = arrayLength*2;
c.height = arrayLength;

init();

document.body.onkeydown = function(e) {
    if(e.key=="h") {
        if(showBox) {
            document.getElementById("stuffs").style.opacity = 0;
            showBox = false;
        }
        else {
            document.getElementById("stuffs").style.opacity = 100;
            showBox = true;
        }
    }
}

function clear() {
    ctx.clearRect(0, 0, arrayLength*2, arrayLength);
    ctx.reset();
}// clear()

function stop() {
    interval = clearInterval(interval); 
}// stop()

function stopAll() {
    autoPlayOn = false; 
    isPaused = false;
    pauseButton.style.display = "none";
    statusDisplay.innerText = "Status: Idle";
    newAnimationQ();
    stop();
}

function shuffle() {
    stop();
    statusDisplay.innerText = "Status: Shuffling...";
    newAnimationQ();

    for(let i = 0; i < arrayLength; i++){
        swap(Math.floor(Math.random() * (arrayLength)), i);
    }
    update();

    statusDisplay.innerText = "Status: Idle";
}// shuffle()

function visualShuffle(callback) {

    stop();
    interval = clearInterval(interval);
    pauseButton.style.display = "block";

    newAnimationQ();

    for(let i = 0; i < arrayLength; i++) {
        swap(Math.floor(Math.random() * (arrayLength)), i);
        addAnimationFrame();
    }

    statusDisplay.innerText = "Status: Shuffling...";

    if(isPaused) {
        lastStatus = statusDisplay.innerText;
        statusDisplay.innerText = "Status: PAUSED";
        return;
    }

    playAnimationQ(callback);
    //statusDisplay.innerText = "Status: Idle";
}// visualShuffle()

function swap(i1, i2) {
    let temp = numbers[i2];
    numbers[i2] = numbers[i1];
    numbers[i1] = temp;
    //update();
}// swap(i1, i2)

function update() {

    c.style.width = window.innerWidth + "px";
    c.style.height = window.innerHeight + "px";

    c.width = arrayLength*2;
    c.height = arrayLength;

    clear();

    for(let i = 0; i < arrayLength; i++){

        //ctx.moveTo(i*2 + 1, arrayLength);
        //ctx.lineTo(i*2 + 1, arrayLength - numbers[i]);
        if(settings.visualizerStyle == 'rainbow') {
            ctx.fillStyle = "hsl(" + (numbers[i] * 300 / arrayLength) + ", 100%, 50%)";
        }
        else if(settings.visualizerStyle == 'fullSpectrum') {
            ctx.fillStyle = "hsl(" + (numbers[i] * 360 / arrayLength) + ", 100%, 50%)";
        }
        else if(settings.visualizerStyle == 'none'){
            ctx.fillStyle = settings.visualizerColor;
        }
        else {
            ctx.fillStyle = settings.visualizerColor;
        }

        if(settings.dynamicHeight) {
            ctx.fillRect(i*2, arrayLength - numbers[i], 2, arrayLength);
        }
        else {
            ctx.fillRect(i*2, 0, 2, arrayLength);
        }
        //ctx.stroke();
        //update();
    }

    updateDelay();

    arraySizeDisplay.innerText = arrayLength;
} // update()

function startAutoPlay() {
    stopAll();
    autoPlayOn = true;
    isPaused = false;
    autoPlay();
}// startAutoPlay()

function autoPlay() {
    if(!autoPlayOn) return;
    
    statusDisplay.innerText = "Status: Waiting for shuffle";
    setTimeout(() => {
        visualShuffle(() => {
            statusDisplay.innerText = "Status: Waiting for sort";
            setTimeout(() => {
                startSort(autoPlay);
            }, autoPlayDelayMs)
        })
    }, autoPlayDelayMs);
}//

/*----- Bubble Sort -----*/

function bubbleSort() {
    let swaped;
    for(let itteration = 0; itteration < numbers.length - 1; itteration++) {
        swaped = false;
        for(let compairison = 0; compairison < numbers.length - 1 - itteration; compairison++) {
            if(numbers[compairison] > numbers[compairison + 1]) {
                swap(compairison, compairison + 1);
                addAnimationFrame();
                swaped = true;
            }
        }
        if(!swaped) break;
    }
    //update();
}// bubbleSort()

function bubbleSortVisual(callback) {
    //interval = clearInterval(interval);
    
    newAnimationQ();

    bubbleSort();

    statusDisplay.innerText = "Status: Sorting... (Bubble)";
    playAnimationQ(callback);
}// bubbleSortVisual()

/*----- Bubble Sort End -----*/

/*----- Insertion Sort -----*/

function insertionSort() {
    var traverser;
    var subject;
    var insertIndex;

    for(traverser = 1; traverser < numbers.length; traverser++) {
        subject = numbers[traverser];
        insertIndex = traverser - 1;

        while(insertIndex >= 0 && numbers[insertIndex] > subject) {
            swap(insertIndex+1, insertIndex);
            addAnimationFrame();
            --insertIndex;
        }
        numbers[insertIndex+1] = subject;
        addAnimationFrame();
    }
    //update();
}// insertionSort()

function insertionSortVisual(callback) {
    newAnimationQ();
    insertionSort();

    statusDisplay.innerText = "Status: Sorting... (Insertion)";
    playAnimationQ(callback);
}// insertionSortVisual()

/*----- Insertion Sort End -----*/

/*----- Selection Sort -----*/

function selectionSort() {
    //statusDisplay.innerText = "Status: Sorting... (Selection)";

    let minIndex;
    for(let i = 0; i < numbers.length - 1; i++) {
        minIndex = i;
        for(let j = i + 1; j < numbers.length; j++) {
            if(numbers[j] < numbers[minIndex]){
                minIndex = j;
            }
        }
        swap(i, minIndex);
        addAnimationFrame();
    }

    //statusDisplay.innerText = "Status: Idle";
    //update();
}// selectionSort()

function selectionSortVisual(callback) {
    newAnimationQ();
    selectionSort();

    statusDisplay.innerText = "Status: Sorting... (Selection)";
    playAnimationQ(callback);
}// selectionSortVisual()

/*----- Selection Sort End -----*/

/*----- Merge Sort -----*/

function mergeSort(l, r) {
    if(l < r)
    {
        var m = Math.floor(l + (r - l)/2);

        mergeSort(l, m);
        mergeSort(m+1, r);

        merge(l, m, r);
    }
}// mergeSort(l, r)

function merge(l, m, r) {

    var i = 0;
    var j = 0;
    var k = 0;
    
    var n1 = m - l + 1;
    var n2 = r - m;

    var L = [];
    var R = [];

    for(i = 0; i < n1; i++)
        L[i] = numbers[l+i];

    for(j = 0; j < n2; j++)
        R[j] = numbers[m+1+j];

    i = 0;
    j = 0;
    k = l;
    while(i < n1 && j < n2) {
        if(L[i] <= R[j]) {
            numbers[k] = L[i];
            i++;
        }
        else {
            numbers[k] = R[j];
            j++;
        }
        k++;
        addAnimationFrame();
    }

    while(i < n1) {
        numbers[k] = L[i];
        addAnimationFrame();
        i++;
        k++;
    }

    while(j < n2) {
        numbers[k] = R[j];
        addAnimationFrame();
        j++;
        k++;
    }
}// merge(l, m, r)

function mergeSortVisual(callback) {
    newAnimationQ();
    mergeSort(0, numbers.length-1);

    statusDisplay.innerText = "Status: Sorting... (Merge)";
    playAnimationQ(callback);
}// mergeSortVisual()

/*----- Merge Sort End -----*/
/*----- Quick Sort -----*/

function quickSortVisual(callback) {
    interval = clearInterval(interval);

    newAnimationQ();

    quickSort(0, numbers.length -1);

    statusDisplay.innerText = "Status: Sorting... (Quick)";
    playAnimationQ(callback);
    
}// startQuickSort()

function quickSort(low, high) {
    if(low < high) {
        var pivotLocation = partition(low, high);
        quickSort(low, pivotLocation - 1);
        quickSort(pivotLocation + 1, high);
    }
}// quickSort(low, high)

function partition(low, high) {
    var pivot = high;
    var leftwall = low;

    for(let i = low; i <= high - 1; i++) {
        if(numbers[i] <= numbers[pivot]) {
            swap(i, leftwall);
            addAnimationFrame();
            leftwall++;
        }
    }
    swap(pivot, leftwall);
    addAnimationFrame();

    return(leftwall);
}// partition(low, high)

/*----- Quick Sort End -----*/

sorts.shaker = Object();

sorts.shaker.start = function(callback) {

    newAnimationQ();

    let swaped;

    for(let i = 0; i < numbers.length - 1; i++) {
        
        swaped = false;

        for(let j = 0; j < numbers.length - 1 - i; j++) {

            if(numbers[j] > numbers[j + 1]) {
                swap(j, j + 1);
                addAnimationFrame();
                swaped = true;
            }

        }

        for(let j = numbers.length - 1 - i; j > i; j--) {

            if(numbers[j] < numbers[j - 1]) {
                swap(j, j - 1);
                addAnimationFrame();
                swaped = true;
            }


        }

        if(!swaped) break;

    }

    statusDisplay.innerText = "Status: Sorting... (Shaker)";
    playAnimationQ(callback);

}// sorts.shaker.start()


sorts.brick = Object();

sorts.brick.start = function(callback) {

    newAnimationQ();

    var sorted = false;

    while(!sorted) {

        sorted = true;

        for(let i = 1; i < numbers.length - 1; i += 2) {

            if(numbers[i] > numbers[i + 1]) {

                swap(i, i + 1);
                addAnimationFrame();
                sorted = false;

            }

        }

        for(let i = 0; i < numbers.length - 1; i += 2) {

            if(numbers[i] > numbers[i + 1]) {

                swap(i, i + 1);
                addAnimationFrame();
                sorted = false;
                
            }

        }

    }

    statusDisplay.innerText = "Status: Sorting... (Brick)";
    playAnimationQ(callback);
    
}// sorts.brick.start()


sorts.superBrick = Object();

sorts.superBrick.start = function(callback) {

    newAnimationQ();

    this.split(0, numbers.length - 1);

    statusDisplay.innerText = "Status: Sorting... (Superbrick)";
    playAnimationQ(callback);

}// sorts.superBrick.start()

sorts.superBrick.split = function(low, high) {

    if(high <= low) {
        return;
    }
    else if(high > low) {

        var halfway = Math.floor(low + ((high - low) / 2));

        this.split(low, halfway);
        this.split(halfway + 1, high);

    }

    var sorted = false;

    while(!sorted) {

        sorted = true;

        for(let i = low + 1; i < high; i += 2) {
            
            if(numbers[i] > numbers[i + 1]) {

                swap(i, i + 1);
                addAnimationFrame();
                sorted = false;

            }

        }

        for(let i = low; i < high; i += 2) {
            
            if(numbers[i] > numbers[i + 1]) {

                swap(i, i + 1);
                addAnimationFrame();
                sorted = false;

            }

        }

    }

}// sorts.superBrick.split(low, high)


sorts.superShaker = Object();

sorts.superShaker.split = function(low, high) {

    if(high <= low) {
        return;
    }
    else if(high > low) {

        var halfway = Math.floor(low + ((high - low) / 2));

        this.split(low, halfway);
        this.split(halfway + 1, high);

    }

    let swaped;

    for(let i = low; i < high; i++) {
        
        swaped = false;

        for(let j = low; j < high; j++) {

            if(numbers[j] > numbers[j + 1]) {
                swap(j, j + 1);
                addAnimationFrame();
                swaped = true;
            }

        }

        for(let j = high; j > i; j--) {

            if(numbers[j] < numbers[j - 1]) {
                swap(j, j - 1);
                addAnimationFrame();
                swaped = true;
            }


        }

        if(!swaped) break;

    }

}// sorts.superShaker.split(low, high) 

sorts.superShaker.start = function(callback) {

    newAnimationQ();

    this.split(0, numbers.length - 1);

    statusDisplay.innerText = "Status: Sorting... (Supershaker)";
    playAnimationQ(callback);

}// sorts.superShaker.start(callback)

// ------------------ end of sorts --------------------

function newAnimationQ() {
    animationQueue = [];

    animationQueue[0] = [];
    for(let i = 0; i < numbers.length; i++) {
        animationQueue[0][i] = numbers[i];
    }
}// newAnimationQ()

function addAnimationFrame() {
    let next = animationQueue.length;
    animationQueue[next] = [];
    for(let i = 0; i < numbers.length; i++) {
        if(numbers[i] == undefined) {

        }
        animationQueue[next][i] = numbers[i];
    }
}// addAnimationFrame()

function playAnimationQ(callback) {
    animationCallback = callback;

    interval = clearInterval(interval);

    let multiplier = 1;

    if(delay < 4) {
        multiplier = Math.floor(4 / delay);
    }

    currentFrame = 0;

    if(isPaused) {
        statusDisplay.innerText = "Status: PAUSED";
        return;
    }

    interval = setInterval(function() {
        if(currentFrame < animationQueue.length) {
            numbers = animationQueue[currentFrame];
            update();
        }
        else {
            numbers = animationQueue[animationQueue.length - 1];
            update();
            statusDisplay.innerText = "Status: Idle";
            interval = clearInterval(interval);
            if(animationCallback != null) animationCallback();
        }
        currentFrame += multiplier;
    }, delay);
}// playAnimationQ(callback)

function pauseAnimationQ(callback) {
    
    stop();

    isPaused = true;

    lastStatus = statusDisplay.innerText;

    statusDisplay.innerText = "Status: PAUSED";

    pauseButton.innerText = "Play";

    var newQ = Array();

    for(let i = 0; i < animationQueue.length - currentFrame; i++) {

        newQ[i] = animationQueue[i + currentFrame];

    }

    animationQueue = newQ;

    if(callback) callback();

}// pauseAnimationQ(callback)

function resumeAnimationQ() {

    if(!isPaused) {
        return;
    }

    isPaused = false;

    pauseButton.innerText = "Pause";

    if(!animationQueue) return;

    statusDisplay.innerText = lastStatus;

    playAnimationQ(animationCallback);

}// resumeAnimationQ(callback)

function togglePause() {
    if(isPaused) {
        resumeAnimationQ();
    }
    else {
        pauseAnimationQ();
    }
}// togglePause()

function updateDelay() {

    if(!delaySlider.value || !(delaySlider.value > 0) || delay == delaySlider.value) {
        return;
    }

    delay = delaySlider.value;
    delayDisplay.innerHTML = "Delay: " + delay + " ms";

    if(!interval) {
        return;
    } 

    
    pauseAnimationQ();

    if(animationQueue) {
        resumeAnimationQ();
    }

}// updateDelay()

function startSort(callback, type) {

    //isPaused = false;

    statusDisplay.innerText = "Status: Calculating...";
    pauseButton.style.display = "block";

    setTimeout(() => {

        stop();

        if(!type) type = document.getElementById("sortDropdown").value;

        interval = clearInterval(interval);

        newAnimationQ();

        switch(type) {
            case "bubble":
                bubbleSortVisual(callback);
                break;
            case "shaker":
                sorts.shaker.start(callback);
                break;
            case "insertion":
                insertionSortVisual(callback);
                break;
            case "selection":
                selectionSortVisual(callback);
                break;
            case "merge":
                mergeSortVisual(callback);
                break;
            case "quick":
                quickSortVisual(callback);
                break;
            case "brick":
                sorts.brick.start(callback);
                break;
            case 'superBrick':
                sorts.superBrick.start(callback);
                break;
            case 'superShaker':
                sorts.superShaker.start(callback);
                break;
            case "random":
            default:
                var rng = Math.floor(Math.random() * randomSorts.length);
                startSort(callback, randomSorts[rng]);
        }
    }, 10);
}

function init() {

    stopAll();

    if(urlParams.get('auto') == 'true') {
        document.getElementById("stuffs").style.opacity = 0;
        showBox = false;
    }

    if(urlParams.get('sortType')) {
        document.getElementById("sortDropdown").value = urlParams.get('sortType');
    }

    arrayLength = arraySizeInput.value;

    if(urlParams.get('arraySize')) {
        arrayLength = parseInt(urlParams.get('arraySize'));
    }
    
    c.style.width = window.innerWidth + "px";
    c.style.height = window.innerHeight + "px";

    pauseButton.style.display = "none";

    interval = clearInterval(interval);

    statusDisplay.innerText = "Status: Idle";

    numbers = [];
    newAnimationQ();
    for(let i = 0; i < arrayLength; i++){
        numbers[i] = i+1;
    }

    setInterval(function() {
        c.style.width = window.innerWidth + "px";
        c.style.height = window.innerHeight + "px";
    }, 1000/24);

    update();

    if(urlParams.get('viewType')) {
        viewTypes.set(urlParams.get('viewType'));
    }

    if(urlParams.get('dynamicHeight') == 'false') {
        settings.dynamicHeight = false;
    }

    update();

    if(urlParams.get('auto') == 'true') {
        startAutoPlay();
    }

}

function testFunction(arr) {
    return arr;
}