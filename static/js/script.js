document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const uploadForm = document.getElementById('upload-form');
    const imageUpload = document.getElementById('image-upload');
    const fileName = document.getElementById('file-name');
    const loadingIndicator = document.getElementById('loading');
    const resultsContainer = document.getElementById('results-container');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Handle file selection
    imageUpload.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            fileName.textContent = this.files[0].name;
        } else {
            fileName.textContent = 'No file chosen';
        }
    });

    // Handle form submission
    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get the file
        const file = imageUpload.files[0];
        if (!file) {
            alert('Please select an image file');
            return;
        }

        // Create FormData
        const formData = new FormData();
        formData.append('image', file);

        // Show loading indicator
        loadingIndicator.classList.remove('hidden');
        resultsContainer.classList.add('hidden');

        // Send the request
        fetch('/process', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Hide loading indicator
            loadingIndicator.classList.add('hidden');
            
            // Update UI with results
            updateResults(data);
            
            // Show results container
            resultsContainer.classList.remove('hidden');
            
            // Scroll to results
            resultsContainer.scrollIntoView({ behavior: 'smooth' });
        })
        .catch(error => {
            loadingIndicator.classList.add('hidden');
            console.error('Error:', error);
            alert('An error occurred while processing the image. Please try again.');
        });
    });

    // Handle tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Show corresponding content
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Function to update results in the UI
    function updateResults(data) {
        // Original image
        document.getElementById('original-image').src = data.original_image;
        
        // Face and body ROIs
        document.getElementById('face-roi').src = data.face_roi;
        document.getElementById('body-roi').src = data.body_roi;
        
        // QR code
        document.getElementById('qr-code').src = data.qr_code;
        document.getElementById('qr-data').textContent = data.qr_data;
        
        // Watermarking
        document.getElementById('watermarked-image').src = data.watermarked_image;
        document.getElementById('extracted-watermark').src = data.extracted_watermark;
        
        // Set download links
        const downloadWatermarked = document.getElementById('download-watermarked');
        downloadWatermarked.href = data.watermarked_image;
        downloadWatermarked.download = 'watermarked_image.png';
    }
});