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
                    alert('Image processing complete!');
                }, 500);
            })
            .catch(() => {
                progressBar.style.display = 'none';
                alert('An error occurred. Please try again.');
            });

            // Reset the file input to allow the same file to be uploaded again
            form.querySelector('input[type="file"]').value = '';
        }
    }

    // Load the initial tab content
    loadTabContent('background-remover');
});
