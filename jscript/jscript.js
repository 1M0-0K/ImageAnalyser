((window, document, undefined) => {
    'use strict'
    
    ///////////////////////////////////
    /////////////Selectors/////////////
    ///////////////////////////////////


    //------General
    const errorDisplay = document.querySelector("#errors");
    const fileTypes = "jpg|jpeg|png|svg|gif";
    let canWork = false;

    //------Theme
    const toggleTheme = document.querySelector("#toggle");
    const toggleThemeCheckbox = document.querySelector("#toggle-box");

    //------ToolBox
    const menu = document.querySelector("#menu");
    const buttons = document.querySelectorAll(".menu-item");
    const buttonAdd = buttons[0];
    const buttonMove = buttons[1];
    const buttonMeasure = buttons[2];
    const buttonZoom = buttons[3];
    const buttonPick = buttons[4];
    let selectedTool = "move";
    let lastSelectedTool;
    
    //------Workspace
    const main = document.querySelector("#main");
    const workImage = document.querySelector("#main>img");
    const canvas = document.querySelector("#canvas");
    const ctx = canvas.getContext("2d");

    //------Image 
    const formAdd = document.querySelector("#add-file");
    const selectedImageLocal = document.querySelector("form#add-file input#image-local");
    const selectedImageName = document.querySelector(".file-selected>span");
    const selectedImageURL = document.querySelector("form#add-file input#selected-image");
    const selectedImageDD = document.querySelector("#direct-upload #image-local-dd");
    const dragDrop = document.querySelector("#direct-upload");
    const formClose = formAdd.querySelector(".close");

    //------Touch
    const eventsDD = ["dragenter", "dragover", "dragleave", "drop"];
    let touchCount = 0;
    let touchTimeout = null;
    let touchPoints = [];
    let prevDifference = -1;

    //------Guids
    const gVertical = document.createElement("div");
    const gHorizontal = document.createElement("div");

    //------Zooming Tool
    let zoomToolLabel= document.createElement("div"); 
    let zoom = 100;
    let zoomTemp = zoom;
    let timer = null;
    let zoomToolTouchOn = false;

    //------Moving Tool
    let tempMoving = false;
    let canMove = false;
    let imageX = 0;
    let imageY = 0;
    let imageOffsetX = 0;
    let imageOffsetY = 0;
    let imageOffsetLeft = 0;
    let imageOffsetTop = 0;


    //------Measure Tool
    let mToolX1 = 0;
    let mToolY1 = 0;
    let mToolX2 = 0;
    let mToolY2 = 0;
    let mToolIsDrawing = false;
    let mTool = document.createElement("div");
    let mToolSizeLabel = document.createElement("div"); 



    /////////////////////////////////
    /////////////Methods/////////////
    /////////////////////////////////
    

    //------General
    const preventDefaults = (e) => {
	e.preventDefault();
	e.stopPropagation();
    }

    const getCursorStyle = () =>{
	let cursorStyle;
	switch(selectedTool){
	    case "move":
		cursorStyle = "grab";
		break;
	    case "zoom":
		cursorStyle = "zoom-in";
		break;
	    case "pick":
		cursorStyle = "default";
		break;
	    case "measure":
	    default:
		cursorStyle = "crosshair";
	}

	return cursorStyle;
    }
    
    const canvasInit = () => {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
    }

    const drawCanvas = () => {
	
	ctx.clearRect(0, 0, innerWidth, innerHeight);
	ctx.drawImage(workImage, imageX, imageY, workImage.width*(zoom/100), workImage.height*(zoom/100));
	requestAnimationFrame(drawCanvas);

    }
    
    const isImageExtension = (name) => {

	//Check if the name matches one of the extensions
	const isImage = name.match(`\.(${fileTypes}|${fileTypes.toUpperCase()})+$`);

	return isImage;

    }

    const sendError = (message) => {

	//No more then 4 error message at a time 
	if(errorDisplay.childElementCount > 4){
	    return;
	}

	//Create new error
	let newError = document.createElement("div");
	
	newError.classList.add("notify-error");
	newError.textContent = message;
	
	//Display the error
	errorDisplay.insertBefore(newError, errorDisplay.childNodes[0]);
	
	//Start a timer to remove the error message
	setTimeout(() => {
	    newError.remove();
	}, 3000);

    }

    //-----Local Storage
    const addToStorage = (value) => {

	//Add selected theme to local storage
	localStorage.setItem("theme", value);

    }

    const getFromStorage = () => {

	//Get selected theme from local storage
	return localStorage.getItem("theme");

    }

    const setTheme = () => {

	//Set the selected theme
	if(getFromStorage() === "1"){
	    toggleThemeCheckbox.checked = false;
	}else{
	    toggleThemeCheckbox.checked = true;
	}

    }

    //------Upload image
    const addLocale = async(file) => {
	
	//Check if the file has one of the allowed extensions
	if(!isImageExtension(file.name)){
	    sendError(`Only images(${fileTypes.replace(/\|/g,",")}) are allowed.`);
	    return false;
	}

	//Read the image 
	const imageClient = new FileReader();
	imageClient.onload = (e) => {
		workImage.src = e.target.result;
	 };
	imageClient.readAsDataURL(file);

	return true;

    };

    const addURL = (url) => {

	//Check if the url has one of the allowed extensions
	if(!isImageExtension(url)){
	    sendError(`Only images(${fileTypes.replace(/\|/g,",")}) are allowed.`);
	    return false;
	}

	//Update the image source
	workImage.src = url;

	return true;

    }

    const afterDisplay = () => {

	//Update the style of some elements
	dragDrop.style.display = "none";
	canvas.style.display = "block";
    
	main.style.cursor = "grab";

	imageOffsetLeft = (window.innerWidth / 2 - workImage.width / 2 );
	imageOffsetTop = Math.ceil(window.innerHeight / 2 - workImage.height / 2);
	imageX = imageOffsetLeft;
	imageY = imageOffsetTop;
	
	drawCanvas();
	
	//Now we can use the tools
	canWork = true;

	//Update the guids
	updateGuids();

    }

    const updateFileName = (e) => {
    
	const file = e.target.files[0];
	const fileElements = file.name.split(".");
	    
	if(file){
	    selectedImageName.textContent = fileElements[0].substring(0,28)+"."+fileElements[fileElements.length-1];
	}else{
	    selectedImageName.textContent = "No Image";
	}

    }

    const uploadFromDD = (e) => {

	const file = e.target.files[0];
	
	if(addLocale(file)){
	    return;
	}


	dragDrop.style.display = "none";

    }

    const uploadFromForm = async(e) => {

	e.preventDefault();
	if(selectedImageLocal.files[0]){
	    if(!addLocale(selectedImageLocal.files[0])){
		return;
	    }
	}else if(selectedImageURL.value){
	    if(!addURL(selectedImageURL.value)){
		return;
	    }
	}else{
	    sendError("Please select an image.");
	    return;
	}	

	selectedImageName.textContent = "No Image";
	selectedImageLocal.value = "";
	selectedImageURL.value = "";

	formAdd.style.display = "none";

    }

    const hideForm = () => {
	formAdd.style.display = "none";
    }

    const getFromDD = (e) => {

	let dt = e.dataTransfer;
	let file = dt.files[0];
	addLocale(file);

    }


    const uploadFromClip = (e) => {

	//Get raw and file image
	const itemRaw = e.clipboardData.items[0];
	const itemFile = e.clipboardData.files[0];
	let image = null;

	//Check if we have something in the clipboard
	if(itemRaw || itemFile!== undefined){
	    //Check what we have in the clipboard
	    if (itemRaw && itemRaw.type.indexOf("image") === 0){
		image = itemRaw.getAsFile();
	    }else if(itemFile && itemFile.type.indexOf("image") === 0){
		image = itemFile; 
	    }
	}

	//Display the image
	if(image){
	    hideForm();
	    let reader = new FileReader();
	    
	    reader.onload = function(event) {
		workImage.src = event.target.result;
	    };
     
	    reader.readAsDataURL(image);
	}

    }

    //------Guids
    const guids = () => {
	
	//Style the guids
	const styleBoth = `
	    background: transparent;
	    position: absolute;
	    border: 1px dashed #444;
	    display: none;
	`;

	gVertical.style.cssText = `
	    height: 100%;
	    ${styleBoth}
	    border-bottom: 0;
	    border-top: 0;
	`;

	gHorizontal.style.cssText = `
	    width: 100%;
	    ${styleBoth}
	    border-left: 0;
	    border-right: 0;
	`;
	
	//Update the dimension for the current image
	gVertical.style.width = (workImage.offsetWidth  + 2) + "px";
	gVertical.style.left = (workImage.offsetLeft - 1) + "px";
	gHorizontal.style.height = (workImage.offsetHeight + 2) + "px";
	gHorizontal.style.top = (workImage.offsetTop - 1) + "px";

	//Add the guids to the page
	main.appendChild(gVertical);
	main.appendChild(gHorizontal);

    }

    const updateGuids = () => {

	//Update the width and height of the guids for the current image
	gVertical.style.width = Math.abs(workImage.width * zoom / 100) + "px";
	gHorizontal.style.height = Math.abs(workImage.height * zoom /100) + "px";

	//Update the position of the guids for the current image
	gVertical.style.left = imageOffsetLeft + "px";
	gHorizontal.style.top = imageOffsetTop + "px"; 
	
	//Display the guids on the page
	gVertical.style.display = "block";
	gHorizontal.style.display = "block";

    }

    //------Moving Tool

    const move = (e) => {

	//Update the image position
	imageX = e.clientX - imageOffsetX;
	imageY = e.clientY - imageOffsetY;
	imageOffsetLeft = imageX;
	imageOffsetTop = imageY;

    } 
    
    const movingTool = (e) => {
	let posX = e.clientX;
	let posY = e.clientY;

	if(e.targetTouches){
	    posX = e.touches[0].clientX; 
	    posY = e.touches[0].clientY;
	}

	//If the wheel or the left mouse button and space bar are pressed and we can
	//use the tool we start moving the image
	if(e.button === 1 || (e.touches && e.touches[0]) || (e.button === 0 && selectedTool === "move") || (e.button === 0 && tempMoving)){
	    if(canWork){

		main.style.cursor = "grabbing";

		imageOffsetX = posX - imageOffsetLeft;
		imageOffsetY = posY - imageOffsetTop;

		canMove = true;
	    }
	};

    }

    const movingToolStop = (e) => {

	//The moving stops if the wheel or the left mouse button are not pressed 
	if(e.button === 1 || e.button === 0 || !e.touches){
	    if(canMove){
		if(tempMoving){
		    main.style.cursor = getCursorStyle();
		}else{
		    main.style.cursor = "grab";
		}
	    }

	    canMove = false;
	}

    }

    const movingToolUpdate = (e) => {
	let event = e;
	if(e.touches){
	    event = e.touches[0];
	}

	//The image is moved and the guids are updated if we are still moving
	if(canMove === true){
	    move(event);    
	    updateGuids();
	}

    }

    //------Zoom Tool

    const zoomToolLabelInit = () =>{

	zoomToolLabel.setAttribute("id", "zoom-tool-label");
	main.appendChild(zoomToolLabel);
    
    }

    const zoomToolLabelUpdate = (e) => {
	
	if(canWork){
	    zoomToolLabel.style.left = e.clientX + 5 + "px";
	    zoomToolLabel.style.top = e.clientY + 5 + "px";
	}

    }

    const zoomTool = (e) => {//display the zoom in top right corner in a small pill like box

	//Check if we cand use the tool
	if(canWork){

	    //Check if wheel spins up or down
	
	    if(e.deltaY > 0){
		
		//If alt key is pressed we change the amount only by 1
		if(e.altKey){
		    if(zoom>1)zoom--;
		}
		else{
		    if(zoom>5)zoom -= 5;
		}
		imageX += Math.abs((workImage.width * zoom /100 - workImage.width * zoomTemp / 100 ))/2; 
		imageY += Math.abs((workImage.height * zoom /100 - workImage.height * zoomTemp / 100 ))/2; 

	    }else if(e.deltaY < 0){

		if(e.altKey){
		    if(zoom<1000)zoom++;
		}
		else{
		    if(zoom<1000)zoom += 5;
		}
		imageX -= (workImage.width * zoom /100 - workImage.width * zoomTemp / 100 )/2; 
		imageY -= (workImage.height * zoom /100 - workImage.height * zoomTemp / 100 )/2; 

	    }
	    
	    //Update image position
	    imageOffsetLeft = imageX;
	    imageOffsetTop = imageY;
	    zoomTemp = zoom;

	    //Update magnification label

	    zoomToolLabel.style.opacity = "1";
	    
	    if(timer !== null){
		clearTimeout(timer);;
	    }

	    timer = setTimeout(() => {
		zoomToolLabel.style.opacity = "0";
	    }, 1000);

	    zoomToolLabel.innerHTML = `<p>${zoom}%</p>`;

	    //Update the guids with the new image properties
	    updateGuids();
	}

    }

    const zoomToolTouch = (range) => {//display the zoom in top right corner in a small pill like box

	//Check if we cand use the tool
	if(canWork){

	    //Check if wheel spins up or down
	
	    if(range > 0){
		if(zoom>100)zoom-=5;
		else if(zoom>1)zoom--;

		imageX += Math.abs((workImage.width * zoom /100 - workImage.width * zoomTemp / 100 ))/2; 
		imageY += Math.abs((workImage.height * zoom /100 - workImage.height * zoomTemp / 100 ))/2; 

	    }else if(range < 0){

		if(zoom<100)zoom+=1;
		else if(zoom<1000)zoom+=5;

		imageX -= (workImage.width * zoom /100 - workImage.width * zoomTemp / 100 )/2; 
		imageY -= (workImage.height * zoom /100 - workImage.height * zoomTemp / 100 )/2; 

	    }
	    
	    //Update image position
	    imageOffsetLeft = imageX;
	    imageOffsetTop = imageY;
	    zoomTemp = zoom;

	    //Update magnification label

	    zoomToolLabel.style.opacity = "1";
	    
	    if(timer !== null){
		clearTimeout(timer);;
	    }

	    timer = setTimeout(() => {
		zoomToolLabel.style.opacity = "0";
	    }, 1000);

	    zoomToolLabel.innerHTML = `<p>${zoom}%</p>`;

	    //Update the guids with the new image properties
	    updateGuids();
	}

    }

    const zoomToolTouchDown = (e) => {

	const touchesAtOnce = e.touches;
	if(e.touches.length === 2){
	    mToolMouseUp()
	    canMove = false;
	    zoomToolTouchOn = true;
	    prevDifference = Math.abs(touchesAtOnce[0].clientX  - touchesAtOnce[1].clientX);
	    
	    for(let i = 0; i < touchesAtOnce.length; i++){
		touchPoints.push(touchesAtOnce[i]);
	    }
	}

    }

    const zoomToolTouchUp = () => {

	if(zoomToolTouchOn){
	    zoomToolTouchOn = false;
	    touchPoints = [];
	    prevDifference = -1;
	}

    }

    const zoomToolTouchMove = (e) => {

	const touchesAtOnce = e.touches;

	if(zoomToolTouchOn){
	    if(touchPoints.length === 2){
		let currDiff = Math.abs(touchesAtOnce[0].clientX  - touchesAtOnce[1].clientX);

		if(currDiff > prevDifference){
		    zoomToolTouch(-1);
		}
		if(currDiff < prevDifference){
		    zoomToolTouch(1);
		}
		prevDifference = currDiff;

	    }
	}

    }


    //------ColorPicker Tool
    const colorPicker = (e) => {
	const pixel = ctx.getImageData(e.clientX, e.clientY, 1, 1).data;
	console.log(`rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3]})`);
    }

    const saveToClipboard = (text) => {
	navigator.clipboard.writeText(text).then( (msg) =>
	    sendError("Copied to clipboard")
	).catch((err) =>
	    sendError("Error" + err)
	)
    }


    //------Buttons Events
    const buttonsEvents = (e) => {

	const _t = e.target;

	//Check if Add button is pressed
	if(buttonAdd.contains(_t) && e.button === 0){
	    if(formAdd.style.display != "flex"){
		formAdd.style.display = "flex";
	    }else{
		hideForm();
		selectedImageName.textContent = "No Image";
		selectedImageLocal.value = "";
	    }
	    menu.classList.toggle("active");
	};

	if(formClose.contains(_t) && e.button === 0){
	    hideForm();
	}

	if(toggleTheme.contains(_t) && e.button === 0){
	    if(toggleThemeCheckbox.checked){
		addToStorage(1); 
	    }else{
		addToStorage(0);
	    }
	}

	if(menu === e.target){
	    menu.classList.toggle("active");
	}

	if(buttonMove.contains(_t) && e.button === 0 && canWork){
	    selectedTool = "move";
	    main.style.cursor= "grab";
	    menu.classList.toggle("active");
	}

	if(buttonMeasure.contains(_t) && e.button === 0 && canWork){
	    selectedTool = "measure";
	    main.style.cursor = "crosshair";	
	    menu.classList.toggle("active");
	}

	if(buttonZoom.contains(_t) && e.button === 0 && canWork){
	    selectedTool = "zoom";
	    main.style.cursor = "zoom-in";
	    menu.classList.toggle("active");
	}
	
	if(buttonPick.contains(_t) && e.button === 0 && canWork){
	    // saveToClipboard("Testing");
	    selectedTool = "pick";
	    main.style.cursor = "default";
	    menu.classList.toggle("active");
	}


    }

    //------Measure Tool
    const mToolInit = () => {

	//Prepare the tool for use
	mTool.setAttribute("id","measuring-tool")
	main.appendChild(mTool);

	//Initiate the size label
	mToolSizeLabelInit();

    }

    const mToolSizeLabelInit = () => {
	
	//Prepare the size label
	mToolSizeLabel.setAttribute("id", "measuring-tool-label");
	mTool.appendChild(mToolSizeLabel);

    }

    const mToolDraw = () => {

	//Check if the tool is used
	if(mToolIsDrawing !== true)
	    return false;
	
	//Find the scale for the zoom magnification
	let elementScale = workImage.width / workImage.width*zoom/100;

	const width = Math.round(Math.abs(mToolX2 - mToolX1));
	const height = Math.round(Math.abs(mToolY2 - mToolY1));
	let left = mToolX1 + "px";
	let top = mToolY1 + "px";

	let labelLeft = width + 10;
	let labelBottom = 5;

	//Determine the position of the tool and the size label
	if(mToolX2 < mToolX1){
	    left = mToolX2 + "px";
	    labelLeft = -(mToolSizeLabel.offsetWidth + 10);
	}

	if(mToolY2 < mToolY1){
	    top = mToolY2 + "px";
	    labelBottom = height + 5;
	}

	//Update the tool size and position
	mTool.style.top = top;
	mTool.style.left = left;
	mTool.style.width = width + "px";
	mTool.style.height = height + "px";

	//Update size label text
	mToolSizeLabel.innerHTML=`
	    <span>W: ${elementScale ? Math.round(width / elementScale) : width}px</span>
	    <span>H: ${elementScale ? Math.round(height / elementScale) : height}px</span>
	`;
	
	//Update the size label position 
	mToolSizeLabel.style.left = labelLeft + "px";
	mToolSizeLabel.style.bottom = labelBottom + "px";

    }

    const mToolMouseDown = (e) => {
	let posX = e.clientX;
	let posY = e.clientY;

	if(e.targetTouches){
	    posX = e.touches[0].clientX; 
	    posY = e.touches[0].clientY;
	}

	e.preventDefault();

	//Check if we can use the tool
	if((e.button === 0 && canWork && !canMove && selectedTool === "measure") || (canWork && !canMove && e.touches)){
	    mToolIsDrawing = true;

	    mToolX2 = posX;
	    mToolY2 = posY;
	    mToolX1 = posX;
	    mToolY1 = posY;

	    mTool.style.display = "block";

	    mToolDraw();
	}

    }

    const mToolMouseUp = () => {

	//The tool is stopped
	mToolIsDrawing = false;
	mTool.style.display = "none";

    }

    const mToolMouseMove = (e) => {
	let posX = e.clientX;
	let posY = e.clientY;

	if(e.targetTouches){
	    posX = e.touches[0].clientX; 
	    posY = e.touches[0].clientY;
	}
	
	//Update the position of the tool
	mToolX2 = posX;
	mToolY2 = posY;
	
	//Check if we can use the tool
	if(mToolIsDrawing === true && canMove === false && !zoomToolTouchOn)
	    mToolDraw();
    }

    /* For Touch */

    const mToolTouchDown = (e) => {

	if(selectedTool === "measure" && zoomToolTouchOn === false){
	    canMove = false;
	    mToolMouseDown(e);
	}else{
	    if(touchTimeout !== null){
		clearTimeout(touchTimeout);
	    }
	    touchCount++;
	    if(touchCount == 2 && e.touches.length < 2){
		canMove = false;
		mToolMouseDown(e);
	    }
	}

    }

    const mToolTouchUp = (e) => {

	touchTimeout = setTimeout(() => {
	    touchCount = 0;
	}, 100);

	mToolMouseUp(e);

    }

    ////////////////////////////////
    /////////////Events/////////////
    ////////////////////////////////

    //Add event for when mouse buttons are pressed
    addEventListener("mousedown",(e) => {

	//Buttons 
	buttonsEvents(e);

    })

    //Add event for when mouse buttons are released
    addEventListener("mouseup", (e) => {
	//Nothing for now

    })

    //Add event for selecting an image from popup window
    selectedImageLocal.addEventListener("change", (e) => {

	//Update file name
	updateFileName(e);

    })

    //Add event for selecting an image from start window
    selectedImageDD.addEventListener("change", (e) => {

	//Upload file from Drag&Drop
	uploadFromDD(e);

    })

    //Add event for form submision
    formAdd.addEventListener("submit", (e) => {

	//Upload file from form
	uploadFromForm(e);
	
    })

    //Add event for paste
    addEventListener("paste", (e) => {
	
	//Upload file from clipboard
	uploadFromClip(e);

    })

    //Add event for keys
    addEventListener("keydown",(e) => {

	//Check if the Escape key is pressed
	if(e.code === "Escape"){

	    //If the image upload form is visible we hide it 
	    if(formAdd.style.display === "flex"){
		hideForm();
	    }

	    if(selectedTool !== "measure"){
		selectedTool = "measure";
		main.style.cursor = "crosshair";
	    }
	}

	if(e.ctrlKey){
	    if(selectedTool === "zoom"){
		main.style.cursor = "zoom-out";
	    }
	}
	
	if(canWork === true){
	    switch(e.key){
		case " ":
		    lastSelectedTool = selectedTool;

		    tempMoving = true;
		    main.style.cursor = "grab";
		break;
		case "m":
		    selectedTool = "measure";
		    main.style.cursor = "crosshair";
		break;
		case "v":
		    selectedTool = "move";
		    main.style.cursor = "grab";
		break;
		case "i":
		    selectedTool = "pick";
		    main.style.cursor = "default";
		break;
		case "z":
		    selectedTool = "zoom";
		    main.style.cursor = "zoom-in";
		break;
	    }
	}




    })

    addEventListener("keyup",(e) => {
	if(selectedTool === "zoom"){
	    main.style.cursor = "zoom-in";
	}

	if(tempMoving === true){
	    selectedTool = lastSelectedTool;
	    main.style.cursor = getCursorStyle();
	    tempMoving = false;
	}
    })

    //Update different things after the image was updated
    workImage.addEventListener("load", () => {

	afterDisplay();

    });

    //Prevent default for touch events
    eventsDD.forEach(event => {
	addEventListener(event, preventDefaults, false);
    })

    addEventListener("drop",(e) => {

	//Get image from drop
	getFromDD(e);

    })

    //Add event for mouse down
    main.addEventListener("mousedown",(e) =>{

	//Moving tool
	movingTool(e);
	
	//Zoom tool
	if(selectedTool === "zoom"){
	    if(!tempMoving){
		if(e.ctrlKey){
		    zoomToolTouch(1);
		}else{

		    zoomToolTouch(-1);
		}
	    }
	}

	if(selectedTool === "pick" && !tempMoving){
	    colorPicker(e);
	}

	//Measure Tool
	mToolMouseDown(e);

    }, false);

    //Add event for mouse up
    main.addEventListener("mouseup",(e) =>{
	//Moving tool
	movingToolStop(e);

	//Measure tool
	mToolMouseUp(e);

    } , false);

    //Add event for mouse moving
    main.addEventListener("mousemove",(e) => { 
	//Moving tool
	movingToolUpdate(e);

	//Zoom label update
	zoomToolLabelUpdate(e);

	//Measure tool
	mToolMouseMove(e);

    }, false);

    //Add event for wheel moves
    main.addEventListener("wheel", (e) => { 

	//Zoom tool
	zoomTool(e);

    })

    //Add events to touch
    main.addEventListener("touchstart",(e) => {
	e.preventDefault();

	//Moving tool
	movingTool(e);

	//Measure tool
	mToolTouchDown(e);
	
	//Zoom tool
	if(selectedTool === "zoom"){
	    if(e.ctrlKey){
		zoomToolTouch(1);
	    }else{

		zoomToolTouch(-1);
	    }
	}

	if(selectedTool === "pick"){
	    colorPicker(e);
	}

	//Zoom tool
	zoomToolTouchDown(e);
    },false);

    main.addEventListener("touchend",(e) => {
	e.preventDefault();
	
	//Moving tool
	movingToolStop(e);

	//Measure tool
	mToolTouchUp(e);

	//Zoom tool
	zoomToolTouchUp();
    },false);

    main.addEventListener("touchcancel",(e) => {
	e.preventDefault();

	//Moving tool 
	movingToolStop(e);

	//Measure tool
	mToolTouchUp(e);

	//Zoom tool
	zoomToolTouchUp();
    },false);

    main.addEventListener("touchmove",(e) => {
	e.preventDefault();

	//Moving tool
	movingToolUpdate(e);

	//Measure tool
	if(!zoomToolTouchOn){
	    mToolMouseMove(e);
	}

	//Zoom tool
	zoomToolTouchMove(e);
    },false);

    window.addEventListener("resize", () => {
	canvasInit();

    })

    //Initialize 
    setTheme();
    canvasInit();
    mToolInit();
    guids();
    zoomToolLabelInit();

})(window, document);
