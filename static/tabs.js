document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            loadTabContent(button.getAttribute('data-tab'));
        });
    });

    function loadTabContent(tabName) {
        fetch(`/html/${tabName}.html`)
            .then(response => response.text())
            .then(html => {
                const tabContent = document.getElementById('tab-content');
                tabContent.innerHTML = html;
                setupDragAndDrop(tabContent);
            })
            .catch(error => console.error('Error loading tab content:', error));
    }

    function setupDragAndDrop(tabContent) {
        let dropArea = tabContent.querySelector('#drop-area');
        if (!dropArea) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => dropArea.classList.add('highlight'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => dropArea.classList.remove('highlight'), false);
        });

        dropArea.addEventListener('drop', handleDrop, false);

        tabContent.querySelectorAll('input[type="file"]').forEach(fileInput => {
            fileInput.addEventListener('change', (e) => {
                let files = e.target.files;
                let form = e.target.closest('form');
                handleFiles(files, form);
            });
        });
    }

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleDrop(e) {
        let dt = e.dataTransfer;
        let files = dt.files;
        let form = e.target.closest('form');
        handleFiles(files, form);
    }

    function showCustomPopup(message) {
        // Create the overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = 0;
        overlay.style.left = 0;
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = 1000;
    
        // Create the popup container
        const popup = document.createElement('div');
        popup.style.backgroundColor = '#0d0821'; // Change to dark background
        popup.style.color = '#fff'; // White text color
        popup.style.padding = '20px';
        popup.style.borderRadius = '8px';
        popup.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        popup.style.maxWidth = '400px';
        popup.style.textAlign = 'center';
        
        // Add the message
        const messageEl = document.createElement('p');
        messageEl.innerText = message;
        popup.appendChild(messageEl);
    
        // Add a close button
        const closeButton = document.createElement('button');
        closeButton.innerText = 'Close';
        closeButton.style.marginTop = '10px';
        closeButton.style.padding = '10px 20px';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '5px';
        closeButton.style.backgroundColor = '#6a0dad';
        closeButton.style.color = '#fff';
        closeButton.style.cursor = 'pointer';
        closeButton.onclick = function () {
            document.body.removeChild(overlay);
        };
        popup.appendChild(closeButton);
    
        // Add the popup to the overlay and the overlay to the body
        overlay.appendChild(popup);
        document.body.appendChild(overlay);
    }

    function handleFiles(files, form) {
        if (files.length) {
            let formData = new FormData();
            formData.append('file', files[0]);

            let formAction;
            let timestamp = new Date().getTime();  // Add timestamp to ensure uniqueness
            if (form.id === 'file-form-background-remover') {
                formAction = '/background-remover?' + timestamp;
            } else if (form.id === 'file-form-blur-image') {
                formAction = '/blur-image?' + timestamp;
                formData.append('blur_percentage', form.querySelector('#blurPercentage').value);
            } else if (form.id === 'file-form-image-rescaler') {
                formAction = '/image-rescaler?' + timestamp;
                formData.append('scale_percentage', form.querySelector('#scalePercentage').value);
            } else if (form.id === 'file-form-bokeh-effect') {
                formAction = '/bokeh-effect?' + timestamp;
                formData.append('bokeh_blur', form.querySelector('#bokehBlur').value); // Add blur intensity
            } else if (form.id === 'file-form-foreground-blur') {
                formAction = '/foreground-blur?' + timestamp;
                formData.append('foreground_blur', form.querySelector('#foregroundBlur').value);
            }

            let progressBar = form.querySelector('.progress-bar');
            progressBar.style.display = 'block';
            progressBar.style.width = '0';

            let interval = setInterval(() => {
                progressBar.style.width = `${parseInt(progressBar.style.width) + 10}%`;
                if (progressBar.style.width === '100%') clearInterval(interval);
            }, 100);

            fetch(formAction, {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.blob();
            })
            .then(blob => {
                let url = window.URL.createObjectURL(blob);
                let a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'processed_image.png';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);

                progressBar.style.width = '100%';
                setTimeout(() => {
                    progressBar.style.display = 'none';
                    showCustomPopup('Image processing complete!');
                }, 500);
            })
            .catch(() => {
                progressBar.style.display = 'none';
                showCustomPopup('An error occurred. Please try again.');
            });

            // Reset the file input to allow the same file to be uploaded again
            form.querySelector('input[type="file"]').value = '';
        }
    }

    // Load the initial tab content
    loadTabContent('background-remover');
});
