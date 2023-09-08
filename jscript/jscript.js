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
    
    //------Color Palette
    const colorPalette = document.querySelector("#color-palette");
    const colorPaletteColors = document.querySelector(".color-palette-colors>.colors");
    const colorPaletteInput = document.querySelector(".palette-input");
    const colorPaletteSave = document.querySelector(".palette-save");
    const colorPaletteRemove = document.querySelector(".palette-remove");
    const colorPaletteCopy = document.querySelector(".palette-copy");
    const colorPreview = document.createElement("div");
    let colors = [];
    let color;
    let picking = false;

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
    const formClose = formAdd.querySelector("#add-file>.close");

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

    //Function to prevent the default behavior of the events
    const preventDefaults = (e) => {
	e.preventDefault();
	e.stopPropagation();
    }

    //Function to convert a dec to hex
    const decToHex = (number) => {
	
	let hex;

	if(number<16){
	    hex = "0"+number.toString(16);
	}else{
	    hex = number.toString(16);
	}

	return hex;

    }

    //Function to check if a string is a hex color
    const checkHexColor = (color) =>{

	const reg = /^#[0-9a-f]{6}$/;
	if(reg.test(color)){
	    return true;
	}else{
	    return false;
	}

    }

    //Function for getting the cursor style
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
    
    //Init function for the canvas
    const canvasInit = () => {

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

    }

    //Draw the canvas
    const drawCanvas = () => {
	
	ctx.clearRect(0, 0, innerWidth, innerHeight);
	ctx.drawImage(workImage, imageX, imageY, workImage.width*(zoom/100), workImage.height*(zoom/100));
	requestAnimationFrame(drawCanvas);

    }
    
    //Function to check the extension 
    const isImageExtension = (name) => {

	//Check if the name matches one of the extensions
	const isImage = name.match(`\.(${fileTypes}|${fileTypes.toUpperCase()})+$`);

	return isImage;

    }

    //Function to send errors
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
    
    //Add items to localStorage
    const addToStorage = (key,value) => {

	//Add selected theme to local storage
	localStorage.setItem(key, value);

    }

    //Get items from localStorage
    const getFromStorage = (key) => {

	//Get selected theme from local storage
	return localStorage.getItem(key);

    }

    //Theme toggle function
    const setTheme = () => {

	//Set the selected theme
	if(getFromStorage() === "1"){
	    toggleThemeCheckbox.checked = false;
	}else{
	    toggleThemeCheckbox.checked = true;
	}

    }

    //------Upload image
    
    //Upload and image from local
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

    //Upload the image from url 
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

    //Update the screen after the image was loaded
    const afterDisplay = () => {

	//Update the style of some elements
	dragDrop.style.display = "none";
	canvas.style.display = "block";
    
	main.style.cursor = "grab";

	//Center the image to the screen
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

    //Update the file name when the file is from local
    const updateFileName = (e) => {
    
	const file = e.target.files[0];
	const fileElements = file.name.split(".");
	    
	if(file){
	    selectedImageName.textContent = fileElements[0].substring(0,28)+"."+fileElements[fileElements.length-1];
	}else{
	    selectedImageName.textContent = "No Image";
	}

    }

    //Upload an image from the start page button
    const uploadFromDD = (e) => {

	const file = e.target.files[0];
	
	if(addLocale(file)){
	    return;
	}


	dragDrop.style.display = "none";

    }

    //Update image from image form
    const uploadFromForm = async(e) => {

	e.preventDefault();

	// Check if is a file or an url
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

    //Hide the add image form
    const hideForm = () => {

	formAdd.style.display = "none";

    }

    //Get the image from drop down
    const getFromDD = (e) => {

	let dt = e.dataTransfer;
	let file = dt.files[0];
	addLocale(file);

    }

    //Function for uploading an image from clipboard
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

    //Function to update the guids
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

    //Function form moving the image
    const move = (e) => {

	//Update the image position
	imageX = e.clientX - imageOffsetX;
	imageY = e.clientY - imageOffsetY;
	imageOffsetLeft = imageX;
	imageOffsetTop = imageY;

    } 
    
    //Starting function for the moving tool
    const movingTool = (e) => {

	//Get the cursor position for the mouse and the touch
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

    //Stopping the moving tool
    const movingToolStop = (e) => {

	//The moving stops if the wheel or the finger is lifted or the left mouse button are not pressed 
	if(e.button === 1 || e.button === 0 || !e.touches){
	    if(canMove){
		if(tempMoving || e.button === 1){
		    main.style.cursor = getCursorStyle();
		}else{
		    main.style.cursor = "grab";
		}
	    }

	    canMove = false;
	}

    }

    //Moving function for the moving tool
    const movingToolUpdate = (e) => {
	
	//Check if touch or mouse
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

    //Function to initializing the zoom label
    const zoomToolLabelInit = () =>{

	zoomToolLabel.setAttribute("id", "zoom-tool-label");
	main.appendChild(zoomToolLabel);
    
    }

    //Function to update the zoom label
    const zoomToolLabelUpdate = (e) => {
	
	if(canWork){
	    zoomToolLabel.style.left = e.clientX + 5 + "px";
	    zoomToolLabel.style.top = e.clientY + 5 + "px";
	}

    }

    //Function for the actual zooming
    const zoomTool = (e) => {

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
		
		//Center the image when zooming
		imageX += Math.abs((workImage.width * zoom /100 - workImage.width * zoomTemp / 100 ))/2; 
		imageY += Math.abs((workImage.height * zoom /100 - workImage.height * zoomTemp / 100 ))/2; 

	    }else if(e.deltaY < 0){

		if(e.altKey){
		    if(zoom<1000)zoom++;
		}
		else{
		    if(zoom<1000)zoom += 5;
		}

		//Center the image when zooming
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

    //Function for the actual zooming 
    const zoomToolTouch = (range) => {

	//Check if we cand use the tool
	if(canWork){

	    //Select zoom in or zoom out
	    if(range > 0){
		if(zoom>100)zoom-=5;
		else if(zoom>1)zoom--;

		//Center the image when zooming
		imageX += Math.abs((workImage.width * zoom /100 - workImage.width * zoomTemp / 100 ))/2; 
		imageY += Math.abs((workImage.height * zoom /100 - workImage.height * zoomTemp / 100 ))/2; 

	    }else if(range < 0){

		if(zoom<100)zoom+=1;
		else if(zoom<1000)zoom+=5;

		//Center the image when zooming
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

    //Starting function for the zoom tool on touch
    const zoomToolTouchDown = (e) => {

	const touchesAtOnce = e.touches;
	//Check if there are 2 touch points on the screen
	if(e.touches.length === 2){
	    //Stop the measuring tool on touch to interfere
	    mToolMouseUp()
	    //Stop the moving tool
	    canMove = false;
	    //We are zooming now
	    zoomToolTouchOn = true;

	    //Set the previous distance 
	    prevDifference = Math.abs(touchesAtOnce[0].clientX  - touchesAtOnce[1].clientX);
	    //Save the 2 touch points for late
	    for(let i = 0; i < touchesAtOnce.length; i++){
		touchPoints.push(touchesAtOnce[i]);
	    }
	}

    }

    //Cleaning function for the zoom tool on touch
    const zoomToolTouchUp = () => {
	if(zoomToolTouchOn){
	    zoomToolTouchOn = false;
	    touchPoints = [];
	    prevDifference = -1;
	}

    }

    //Moving function for the zoom tool on touch
    const zoomToolTouchMove = (e) => {

	const touchesAtOnce = e.touches;

	//Work only when the tool is selected
	if(zoomToolTouchOn){
	    //Check if we have 2 fingers on the screen
	    if(touchPoints.length === 2){
		//Get the distance between the x axis of the fingers
		let currDiff = Math.abs(touchesAtOnce[0].clientX  - touchesAtOnce[1].clientX);

		//Zoom depending on the distance
		if(currDiff > prevDifference){
		    zoomToolTouch(-1);
		}
		if(currDiff < prevDifference){
		    zoomToolTouch(1);
		}

		//Update the previous distance
		prevDifference = currDiff;

	    }
	}

    }


    //------ColorPicker Tool

    //Color picker
    const colorPickerStart = (e) => {
	
	//Get the cursor position for both mouse and touch
	let posX = e.clientX;
	let posY = e.clientY;

	if(e.targetTouches){
	    posX = e.touches[0].clientX; 
	    posY = e.touches[0].clientY;
	}

	//Get the pixel data and convert the rgba color to hex color
	const pixel = ctx.getImageData(posX, posY, 1, 1).data;
	color = `#${decToHex(pixel[0])}${decToHex(pixel[1])}${decToHex(pixel[2])}`;

	colorPreview.style.display = "flex";
	colorPreview.style.color = color;
	colorPreview.dataset.color = color;
	picking = true;

    }

    //Show the color unde the cursor
    const colorPickerMove = (e) => {
	//Get the cursor position for both mouse and touch
	let posX = e.clientX;
	let posY = e.clientY;

	if(e.targetTouches){
	    posX = e.touches[0].clientX; 
	    posY = e.touches[0].clientY;
	}

	if(picking){
	    //Get the pixel data and convert the rgba color to hex color
	    const pixel = ctx.getImageData(posX, posY, 1, 1).data;
	    color = `#${decToHex(pixel[0])}${decToHex(pixel[1])}${decToHex(pixel[2])}`;

	    colorPreview.style.color = color;
	    colorPreview.dataset.color = color;
	}

    }

    //Set the color in the color palette and copy the color to the clipboard
    const colorPickerStop = () => {

	picking = false;

	colorPreview.style.display = "none";
	//Add the color to the palette input to make it ready to be saved
	addColorToPaletteInput(color);
	//Copy the color to the clipboard
	saveToClipboard(color);

    }

    //Initialise the color preview 
    const colorPreviewInit = () =>{

	colorPreview.setAttribute("id", "color-preview");
	main.appendChild(colorPreview);
    
    }

    //Save text to the clipboard
    const saveToClipboard = (text) => {

	navigator.clipboard.writeText(text).then( () =>
	    console.log("Copied to clipboard")
	).catch((err) =>
	    console.log("Error" + err)
	)

    }

    //------Color Palette

    //Add color to the palette input
    const addColorToPaletteInput = (color) => {
	colorPaletteInput.value = color;
    }

    //Get color from localStorage
    const getColorFromStorage = () => {

	let col = getFromStorage("color");
	//Check if there are any colors saved
	if(col){
	    //Convert the string to an array
	    colors = col.split(","); 
	    if(colors.length > 0){
		//Empty the color palette
		colorPaletteColors.innerHTML = "";

		//Iterate through the array and add colors to the palette
		for(let i = 0; i < colors.length; i++){
		    let colorNew = document.createElement("li");
		    colorNew.onclick = () => addColorToPaletteInput(colors[i]);
		    colorNew.dataset.label = colors[i];
		    colorNew.style.backgroundColor = colors[i];
		    colorPaletteColors.appendChild(colorNew); 
		}
	    }
	}else{
	    colorPaletteColors.innerHTML = "";
	}

    }

    //Add color to localStorage
    const addColorToStorage = (color) => {
	
	//Check if is a  hex color
	if(checkHexColor(color)){
	    //Add the new color to the array
	    colors = [...colors, color];
	    addToStorage("color", colors);
	    getColorFromStorage();
	}else{
	    sendError("That is not a color");
	}

    }

    //Remove color from localStorage
    const removeColorFromStorage = (color) => {

	//Remove the color from the array
	colors = colors.filter(col => col != color);

	//Add the new color array to localStorage
	addToStorage("color", colors);

	//Get the colors from localStoragej
	getColorFromStorage();

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

	//Close the image form
	if(formClose.contains(_t) && e.button === 0){
	    hideForm();
	}

	//Toggle the application theme
	if(toggleTheme.contains(_t) && e.button === 0){
	    if(toggleThemeCheckbox.checked){
		addToStorage("theme", 1); 
	    }else{
		addToStorage("theme", 0);
	    }
	}

	//Toggle the menu
	if(menu === _t && e.button === 0){
	    menu.classList.toggle("active");
	}

	//Choose the moving tool
	if(buttonMove.contains(_t) && e.button === 0 && canWork){
	    selectedTool = "move";
	    main.style.cursor= "grab";
	    menu.classList.toggle("active");
	}

	//Choose the measuring tool
	if(buttonMeasure.contains(_t) && e.button === 0 && canWork){
	    selectedTool = "measure";
	    main.style.cursor = "crosshair";	
	    menu.classList.toggle("active");
	}

	//Choose the zooming tool
	if(buttonZoom.contains(_t) && e.button === 0 && canWork){
	    selectedTool = "zoom";
	    main.style.cursor = "zoom-in";
	    menu.classList.toggle("active");
	}
	
	//Choose the color picker tool
	if(buttonPick.contains(_t) && e.button === 0 && canWork){
	    if(selectedTool !== "pick"){
		lastSelectedTool = selectedTool;
		selectedTool = "pick";
	    }else{
		selectedTool = lastSelectedTool;
	    }
	    
	    main.style.cursor = "default";
	    menu.classList.toggle("active");
	}

	//Toggle the color palette
	if(colorPalette === _t && e.button === 0){
	    colorPalette.classList.toggle("active");

	    getColorFromStorage();
	}

	//Save the color to localStorage
	if(colorPaletteSave.contains(_t) && e.button === 0){
	    if(colorPaletteInput.value.length >= 0){
		addColorToStorage(colorPaletteInput.value);
	    }
	}

	//Remove the color from localStorage
	if(colorPaletteRemove.contains(_t) && e.button === 0){
	    if(colorPaletteInput.value.length >= 0){
		removeColorFromStorage(colorPaletteInput.value);
	    }
	}

	//Save the color to clipboard
	if(colorPaletteCopy.contains(_t) && e.button === 0){
	    if(colorPaletteInput.value.length >= 0){
		saveToClipboard(colorPaletteInput.value);
	    }
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
	
	if(touchCount === 0){
	    //Update the size label position 
	    mToolSizeLabel.style.left = labelLeft + "px";
	    mToolSizeLabel.style.bottom = labelBottom + "px";
	}else{
	    mToolSizeLabel.style.position = "fixed";
	    mToolSizeLabel.style.left = "calc(50% - 32px)";
	    mToolSizeLabel.style.bottom = "calc(100% - 60px)";
	}

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
	if(mToolIsDrawing === true && canMove === false && !zoomToolTouchOn){
	    mToolDraw();
	}

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


	//Change the cursor to zoom out when the ctrl key is down
	if(e.ctrlKey){
	    if(selectedTool === "zoom"){
		main.style.cursor = "zoom-out";
	    }
	}
	
	//Shortcuts for the tools
	if(canWork === true){
	    switch(e.key){
		case " ": //Move
		    lastSelectedTool = selectedTool;

		    tempMoving = true;
		    main.style.cursor = "grab";
		break;
		case "m": //Measure
		    selectedTool = "measure";
		    main.style.cursor = "crosshair";
		break;
		case "v": //Move
		    selectedTool = "move";
		    main.style.cursor = "grab";
		break;
		case "i": //Color picker
		    selectedTool = "pick";
		    main.style.cursor = "default";
		break;
		case "z": //Zoom
		    selectedTool = "zoom";
		    main.style.cursor = "zoom-in";
		break;
	    }
	}

    })

    //Event for when the keys are up
    addEventListener("keyup",(e) => {

	//Change the cursor when the ctrl in up
	if(selectedTool === "zoom"){
	    main.style.cursor = "zoom-in";
	}

	//Change the tools and the cursor when the space is up
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

	//Color picker
	if(selectedTool === "pick" && !tempMoving && e.button === 0){
	    colorPickerStart(e);
	}

	//Measure Tool
	mToolMouseDown(e);

    }, false);

    //Add event for mouse up
    main.addEventListener("mouseup",(e) =>{

	//Moving tool
	movingToolStop(e);

	//Color picker
	if(selectedTool === "pick"){
	    colorPickerStop();
	}

	//Measure tool
	mToolMouseUp(e);

    } , false);

    //Add event for mouse moving
    main.addEventListener("mousemove",(e) => { 

	//Moving tool
	movingToolUpdate(e);

	//Zoom label update
	zoomToolLabelUpdate(e);

	//Color picker
	if(selectedTool === "pick" && !tempMoving){
	    colorPickerMove(e);
	}

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
	if(selectedTool === "move"){
	    movingTool(e);
	}

	//Measure tool
	if(selectedTool !== "pick"){
	    mToolTouchDown(e);
	}
	
	//Zoom tool
	if(selectedTool === "zoom"){
	    if(e.ctrlKey){
		zoomToolTouch(1);
	    }else{

		zoomToolTouch(-1);
	    }
	}

	//Color picker
	if(selectedTool === "pick"){
	    colorPickerStart(e);
	}

	//Zoom tool
	zoomToolTouchDown(e);

    },false);

    main.addEventListener("touchend",(e) => {

	//Moving tool
	movingToolStop(e);

	//Measure tool
	mToolTouchUp(e);

	//ColorPicker tool
	if(selectedTool === "pick"){
	    colorPickerStop();
	}

	//Zoom tool
	zoomToolTouchUp();

    },false);

    main.addEventListener("touchcancel",(e) => {

	e.preventDefault();

	//Moving tool 
	movingToolStop(e);

	//Measure tool
	if(selectedTool !== "pick"){
	    mToolTouchUp(e);
	}

	//ColorPicker tool
	colorPickerStop();

	//Zoom tool
	zoomToolTouchUp();

    },false);

    main.addEventListener("touchmove",(e) => {

	e.preventDefault();

	//Moving tool
	if(selectedTool === "move"){
	    movingToolUpdate(e);
	}

	//Measure tool
	if(!zoomToolTouchOn){
	    mToolMouseMove(e);
	}

	//ColorPicker tool
	if(selectedTool === "pick"){
	    colorPickerMove(e);
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
    colorPreviewInit();

})(window, document);
