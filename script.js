const fileInput = document.querySelector('.file-input');
const chooseImgBtn = document.querySelector('.choose-img');
const saveImgBtn = document.querySelector('.save-img');
const resetFilterBtn = document.querySelector('.reset-filter');
const previewImg = document.querySelector('.preview-img img');
const previewWrapper = document.querySelector('.preview-img');
const filterButtons = document.querySelectorAll('.filter button');
const filterSlider = document.querySelector('#brightness-slider');
const filterName = document.querySelector('.filter-info .name');
const filterValue = document.querySelector('.filter-info .value');
const rotateButtons = document.querySelectorAll('.rotate button');
const uploadBgBtn = document.querySelector(".upload-background-to-photo");
const removeBgBtn = document.querySelector('.click-to-remove-bg');

const apiKey = 'QZ8GHKnrk7LPd6A3HDifSQTE';  // Add your API key here for Remove.bg

let brightness = 100;
let saturation = 100;
let inversion = 0;
let grayscale = 0;
let rotate = 0;
let flipHorizontal = 1;
let flipVertical = 1;
let bgImageUrl = '';

const applyFilters = () => {
    previewImg.style.transform = `rotate(${rotate}deg) scale(${flipHorizontal}, ${flipVertical})`;
    previewImg.style.filter = `
        brightness(${brightness}%)
        saturate(${saturation}%)
        invert(${inversion}%)
        grayscale(${grayscale}%)
    `;
    previewImg.style.backgroundImage = bgImageUrl ? `url(${bgImageUrl})` : 'none';
    previewImg.style.backgroundSize = "cover";
    previewImg.style.backgroundPosition = "center";
};


const loadImage = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    previewImg.src = URL.createObjectURL(file);
    document.querySelector('.container').classList.remove('disable');

    let vignette = document.querySelector('.vignette-overlay');
    if (!vignette) {
        vignette = document.createElement('div');
        vignette.className = 'vignette-overlay';
        document.querySelector('.preview-img').appendChild(vignette);
    }
};

fileInput.addEventListener('change', loadImage);
chooseImgBtn.addEventListener('click', () => fileInput.click());

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        document.querySelector('.filter .active')?.classList.remove('active');
        button.classList.add('active');
        filterName.innerText = button.innerText;
        filterSlider.max = 100;

        if (["brightness", "saturation", "inversion"].includes(button.id)) {
            filterSlider.value = eval(button.id) / 2;
        } else {
            filterSlider.value = eval(button.id);
        }

        filterValue.innerText = `${filterSlider.value}%`;
    });
});

filterSlider.addEventListener('input', () => {
    filterValue.innerText = `${filterSlider.value}%`;
    const selectedFilter = document.querySelector('.filter .active')?.id;

    if (selectedFilter) {
        if (["brightness", "saturation", "inversion"].includes(selectedFilter)) {
            eval(`${selectedFilter} = ${filterSlider.value * 2}`);
        } else {
            eval(`${selectedFilter} = ${filterSlider.value}`);
        }
        applyFilters();
    }
});

rotateButtons.forEach(button => {
    button.addEventListener('click', () => {
        switch (button.id) {
            case 'left':
                rotate -= 90;
                break;
            case 'right':
                rotate += 90;
                break;
            case 'horizontal':
                flipHorizontal *= -1;
                break;
            case 'vertical':
                flipVertical *= -1;
                break;
        }
        applyFilters();
    });
});

resetFilterBtn.addEventListener('click', () => {
    brightness = saturation = 100;
    inversion = grayscale = 0;
    rotate = 0;
    flipHorizontal = flipVertical = 1;
    bgImageUrl = '';
    applyFilters();

    const activeFilter = document.querySelector('.filter .active');
    if (activeFilter && ["brightness", "saturation", "inversion"].includes(activeFilter.id)) {
        filterSlider.value = 50;
        filterValue.innerText = "50%";
    }
});

saveImgBtn.addEventListener('click', () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const bgImage = new Image();
    const photoImage = new Image();

    photoImage.src = previewImg.src;
    bgImage.src = bgImageUrl || previewImg.src;

    photoImage.onload = () => {
        canvas.width = photoImage.naturalWidth;
        canvas.height = photoImage.naturalHeight;

        bgImage.onload = () => {
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
            ctx.filter = `
                brightness(${brightness}%)
                saturate(${saturation}%)
                invert(${inversion}%)
                grayscale(${grayscale}%)
            `;
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(rotate * Math.PI / 180);
            ctx.scale(flipHorizontal, flipVertical);
            ctx.drawImage(photoImage, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);

            const link = document.createElement('a');
            link.download = 'edited-image.png';
            link.href = canvas.toDataURL();
            link.click();
        };
    };
});

const bgInput = document.createElement("input");
bgInput.type = "file";
bgInput.accept = "image/*";
bgInput.style.display = "none";
document.body.appendChild(bgInput);

uploadBgBtn.addEventListener("click", () => bgInput.click());

bgInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    bgImageUrl = URL.createObjectURL(file);
    applyFilters();
});

removeBgBtn.addEventListener('click', () => {
    if (!previewImg.src) return alert("Please upload an image first!");

    fetch(previewImg.src)
        .then(response => response.blob())
        .then(blob => {
            const formData = new FormData();
            formData.append('image_file', blob);
            formData.append('size', 'auto');

            fetch('https://api.remove.bg/v1.0/removebg', {
                method: 'POST',
                headers: { 'X-Api-Key': apiKey },
                body: formData
            })
                .then(response => response.blob())
                .then(blob => {
                    const imageUrl = URL.createObjectURL(blob);
                    previewImg.src = imageUrl;
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Error removing background. Please try again.');
                });
        })
        .catch(error => {
            console.error('Error:', error);
            alert('There was an issue uploading the image.');
        });
});
