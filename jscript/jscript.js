((window, document, undefined) => {
    'use strict'
    
    ///////////////////////////////////
    /////////////Selectors/////////////
    ///////////////////////////////////


    //------General
    const errorDisplay = document.querySelector("#errors");
    const fileTypes = "jpg|jpeg|png|svg|gif";
    let canWork = false;
    let lastCursorStyle = "crosshair";

    //------Theme
    const toggleTheme = document.querySelector("#toggle");
    const toggleThemeCheckbox = document.querySelector("#toggle-box");

    //------ToolBox
    const buttons = document.querySelectorAll(".menu-item");
    const buttonAdd = buttons[0];
    
    //------Workspace
    const main = document.querySelector("#main");
    const workImage = document.querySelector("#main>img");

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

    //------Guids
    const gVertical = document.createElement("div");
    const gHorizontal = document.createElement("div");

    //------Zooming Tool
    let zoomToolLabel= document.createElement("div"); 
    let zoom = 100;
    let timer = null;

    //------Moving Tool
    let canMove = false;
    let offsetX = 0;
    let offsetY = 0;


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
	workImage.style.display = "block";
	workImage.style.left = "";
	workImage.style.top = "";
	main.style.cursor = "crosshair";	
	
	//Now we can use the tools
	canWork = true;

	//Update the guids
	updateGuids();

    }

    const updateFileName = (e) => {
    
	const file = e.target.files[0];
	if(file){
	    selectedImageName.textContent = file.name;
	}else{
	    selectedImageName.textContent = "No Image";
	}

    }

    const uploadFromDD = (e) => {

	const file = e.target.files[0];
	
	if(addLocale(file)){
	    return;
	}

	// afterDisplay();

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
	if(itemRaw || itemFile){
	    //Check what we have in the clipboard
	    if (itemRaw.type.indexOf("image") === 0){
		image = itemRaw.getAsFile();
	    }else if(itemFile.type.indexOf("image") === 0){
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

	//Find the scale for the zoom magnification
	let measuredElement = document.querySelector("#main>img");
	let elementScale = measuredElement.getBoundingClientRect().width / measuredElement.offsetWidth;

	//Update the width and height of the guids for the current image
	gVertical.style.width = Math.abs(workImage.offsetWidth * elementScale) + "px";
	gHorizontal.style.height = Math.abs(workImage.offsetHeight * elementScale) + "px";

	//Update the position of the guids for the current image
	gVertical.style.left = (workImage.offsetLeft - ((workImage.getBoundingClientRect().width - workImage.offsetWidth) / 2)) + "px";
	gHorizontal.style.top = (workImage.offsetTop - ((workImage.getBoundingClientRect().height - workImage.offsetHeight) / 2))+ "px"; 
	
	//Display the guids on the page
	gVertical.style.display = "block";
	gHorizontal.style.display = "block";

    }

    //------Moving Tool

    const move  = (e) => {

	//Update the image position
	workImage.style.left = `${e.clientX - offsetX}px`; 
	workImage.style.top = `${e.clientY - offsetY}px`; 

    } 
    
    const movingTool = (e) => {

	//If the wheel or the left mouse button and alt key are pressed and we can
	//use the tool we start moving the image
	if(e.button === 1 || (e.button === 0 && e.altKey)){
	    if(canWork){
		lastCursorStyle = main.style.cursor;
		main.style.cursor= "grabbing";
		offsetX = e.clientX - workImage.offsetLeft;
		offsetY = e.clientY - workImage.offsetTop;
		canMove = true;
	    }
	};

    }

    const movingToolStop = (e) => {

	//The moving stops if the wheel or the left mouse button are not pressed 
	if(e.button === 1 || (e.button === 0) ){
	    if(canMove)
		main.style.cursor = lastCursorStyle;

	    canMove = false;
	}

    }

    const movingToolUpdate = (e) => {

	//The image is moved and the guids are updated if we are still moving
	if(canMove === true){
	    move(e);    
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
	    }else if(e.deltaY < 0){
		if(e.altKey){
		    if(zoom<1000)zoom++;
		}
		else{
		    if(zoom<1000)zoom += 5;
		}
	    }else if(e.deltaY == 0){
		console.log("test");
	    }

	    //Update the image
	    workImage.style.transform = "scale("+(zoom/100)+")";

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

    }

    //------Measure Tool
    const mToolInit = () => {

	//Prepare the tool for use
	mTool.setAttribute("id","measuring-tool")
	main.appendChild(mTool);

	//Initiate the size label
	mToolSizeLabelInit();

	//Add events to the tool
	mTool.addEventListener("mousedown", mToolMouseDown, false);
	mTool.addEventListener("mouseup", mToolMouseUp, false);
	mTool.addEventListener("mousemove", mToolMouseMove, false);

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
	let measuredElement = document.querySelector("#main>img");
	let elementScale = measuredElement.getBoundingClientRect().width / measuredElement.offsetWidth;

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

	e.preventDefault();

	//Check if we can use the tool
	if(e.button === 0 && canWork && canMove === false && !e.altKey){
	    mToolIsDrawing = true;

	    mToolX2 = e.clientX;
	    mToolY2 = e.clientY;
	    mToolX1 = e.clientX;
	    mToolY1 = e.clientY;

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
	
	//Update the position of the tool
	mToolX2 = e.clientX;
	mToolY2 = e.clientY;
	
	//Check if we can use the tool
	if(mToolIsDrawing === true && canMove === false)
	    mToolDraw();
    }

    /* For Touch */
    const mToolMouseDownTouch = (e) => {

	e.preventDefault();
	const touches = e.changedTouches;

	//Check if we can use the tool
	if(canWork && canMove ===false){
	    //Start using the tool
	    mToolIsDrawing = true;
	    mToolX2 = touches[0].clientX;
	    mToolY2 = touches[0].clientY;
	    mToolX1 = touches[0].clientX;
	    mToolY1 = touches[0].clientY;
	    mTool.style.display = "block";
	    mToolDraw();
	}
    }

    const mToolMouseUpTouch = (e) => {
	
	e.preventDefault();

	//The tool is stopped
	mToolIsDrawing = false;
	mTool.style.display = "none";

    }

    const mToolMouseMoveTouch = (e) => {

	e.preventDefault();

	const touches = e.changedTouches;
	
	//Update the postion of the tool
	mToolX2 = touches[0].clientX;
	mToolY2 = touches[0].clientY;
	
	//Check if we can use the tool
	if(mToolIsDrawing === true && canMove === false)
	    mToolDraw();

    }

    ////////////////////////////////
    /////////////Events/////////////
    ////////////////////////////////

    //Add event for when mouse buttons are pressed
    addEventListener("mousedown",(e) => {

	//Moving tool
	movingTool(e);

	//Buttons 
	buttonsEvents(e);

    })

    //Add event for when mouse buttons are released
    addEventListener("mouseup", (e) => {

	//Moving tool
	movingToolStop(e);

    })
    
    //Add event for moving mouse
    addEventListener("mousemove", (e) => {

	//Moving tool
	movingToolUpdate(e);

	//Zoom label update
	zoomToolLabelUpdate(e);

    })

    //Add event for wheel moves
    addEventListener("wheel", (e) => { 

	//Zoom tool
	zoomTool(e);

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

    
    //Add events for moving tool
    main.addEventListener("mousedown", mToolMouseDown, false);
    main.addEventListener("mouseup", mToolMouseUp, false);
    main.addEventListener("mousemove", mToolMouseMove, false);

    //to touch too
    main.addEventListener("touchstart",mToolMouseDownTouch,false);
    main.addEventListener("touchend",mToolMouseUpTouch,false);
    main.addEventListener("touchcancel",mToolMouseUpTouch,false);
    main.addEventListener("touchmove",mToolMouseMoveTouch,false);

    //Initialize 
    setTheme();
    mToolInit();
    guids();
    zoomToolLabelInit();

})(window, document);


