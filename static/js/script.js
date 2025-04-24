// document.addEventListener('DOMContentLoaded', function() {
//     // DOM Elements
//     const uploadForm = document.getElementById('upload-form');
//     const imageUpload = document.getElementById('image-upload');
//     const fileName = document.getElementById('file-name');
//     const loadingIndicator = document.getElementById('loading');
//     const resultsContainer = document.getElementById('results-container');
//     const tabButtons = document.querySelectorAll('.tab-btn');
//     const tabContents = document.querySelectorAll('.tab-content');

//     // Handle file selection
//     imageUpload.addEventListener('change', function() {
//         if (this.files && this.files[0]) {
//             fileName.textContent = this.files[0].name;
//         } else {
//             fileName.textContent = 'No file chosen';
//         }
//     });

//     // Handle form submission
//     uploadForm.addEventListener('submit', function(e) {
//         e.preventDefault();
        
//         // Get the file
//         const file = imageUpload.files[0];
//         if (!file) {
//             alert('Please select an image file');
//             return;
//         }

//         // Create FormData
//         const formData = new FormData();
//         formData.append('image', file);

//         // Show loading indicator
//         loadingIndicator.classList.remove('hidden');
//         resultsContainer.classList.add('hidden');

//         // Send the request
//         fetch('/process', {
//             method: 'POST',
//             body: formData
//         })
//         .then(response => {
//             if (!response.ok) {
//                 throw new Error('Network response was not ok');
//             }
//             return response.json();
//         })
//         .then(data => {
//             // Hide loading indicator
//             loadingIndicator.classList.add('hidden');
            
//             // Update UI with results
//             updateResults(data);
            
//             // Show results container
//             resultsContainer.classList.remove('hidden');
            
//             // Scroll to results
//             resultsContainer.scrollIntoView({ behavior: 'smooth' });
//         })
//         .catch(error => {
//             loadingIndicator.classList.add('hidden');
//             console.error('Error:', error);
//             alert('An error occurred while processing the image. Please try again.');
//         });
//     });

//     // Handle tab switching
//     tabButtons.forEach(button => {
//         button.addEventListener('click', () => {
//             // Remove active class from all buttons and contents
//             tabButtons.forEach(btn => btn.classList.remove('active'));
//             tabContents.forEach(content => content.classList.remove('active'));
            
//             // Add active class to clicked button
//             button.classList.add('active');
            
//             // Show corresponding content
//             const tabId = button.getAttribute('data-tab');
//             document.getElementById(tabId).classList.add('active');
//         });
//     });

//     // Function to update results in the UI
   
// // Blockchain-related variables
// let web3;
// let accounts = [];
// let imageHashStorageContract;
// let currentImageHash = null;

// // Contract ABI (generated from your Solidity contract)
// const contractABI = [
//     {
//         "anonymous": false,
//         "inputs": [
//             {
//                 "indexed": true,
//                 "internalType": "uint256",
//                 "name": "imageId",
//                 "type": "uint256"
//             },
//             {
//                 "indexed": false,
//                 "internalType": "string",
//                 "name": "imageHash",
//                 "type": "string"
//             },
//             {
//                 "indexed": true,
//                 "internalType": "address",
//                 "name": "owner",
//                 "type": "address"
//             }
//         ],
//         "name": "HashStored",
//         "type": "event"
//     },
//     {
//         "inputs": [],
//         "name": "getImageCount",
//         "outputs": [
//             {
//                 "internalType": "uint256",
//                 "name": "",
//                 "type": "uint256"
//             }
//         ],
//         "stateMutability": "view",
//         "type": "function"
//     },
//     {
//         "inputs": [
//             {
//                 "internalType": "uint256",
//                 "name": "_imageId",
//                 "type": "uint256"
//             }
//         ],
//         "name": "getImageData",
//         "outputs": [
//             {
//                 "internalType": "string",
//                 "name": "",
//                 "type": "string"
//             },
//             {
//                 "internalType": "uint256",
//                 "name": "",
//                 "type": "uint256"
//             },
//             {
//                 "internalType": "address",
//                 "name": "",
//                 "type": "address"
//             }
//         ],
//         "stateMutability": "view",
//         "type": "function"
//     },
//     {
//         "inputs": [
//             {
//                 "internalType": "uint256",
//                 "name": "",
//                 "type": "uint256"
//             }
//         ],
//         "name": "images",
//         "outputs": [
//             {
//                 "internalType": "string",
//                 "name": "imageHash",
//                 "type": "string"
//             },
//             {
//                 "internalType": "uint256",
//                 "name": "timestamp",
//                 "type": "uint256"
//             },
//             {
//                 "internalType": "address",
//                 "name": "owner",
//                 "type": "address"
//             }
//         ],
//         "stateMutability": "view",
//         "type": "function"
//     },
//     {
//         "inputs": [],
//         "name": "imageCount",
//         "outputs": [
//             {
//                 "internalType": "uint256",
//                 "name": "",
//                 "type": "uint256"
//             }
//         ],
//         "stateMutability": "view",
//         "type": "function"
//     },
//     {
//         "inputs": [
//             {
//                 "internalType": "string",
//                 "name": "_imageHash",
//                 "type": "string"
//             }
//         ],
//         "name": "storeImageHash",
//         "outputs": [
//             {
//                 "internalType": "uint256",
//                 "name": "",
//                 "type": "uint256"
//             }
//         ],
//         "stateMutability": "nonpayable",
//         "type": "function"
//     }
// ];

// // Replace with your deployed contract address
// const contractAddress = "0xd9145CCE52D386f254917e481eB44e9943F39138"; // You'll get this after deploying in Remix

// document.addEventListener('DOMContentLoaded', function() {
//     // Existing code...
    
//     // Add blockchain-related event listeners
//     const connectWalletBtn = document.getElementById('connect-wallet');
//     const storeHashBtn = document.getElementById('store-hash');
    
//     connectWalletBtn.addEventListener('click', connectWallet);
//     storeHashBtn.addEventListener('click', storeImageHash);
    
//     // Check if MetaMask is installed
//     if (typeof window.ethereum !== 'undefined') {
//         connectWalletBtn.disabled = false;
//     } else {
//         document.getElementById('wallet-status').textContent = 'MetaMask not installed';
//         connectWalletBtn.disabled = true;
//     }
    
//     // Existing code for form submission...
//     // Add this at the end of the updateResults function
//     function updateResults(data) 
//     {
//         // Existing code...
//         document.getElementById('original-image').src = data.original_image;
        
//         // Face and body ROIs
//         document.getElementById('face-roi').src = data.face_roi;
//         document.getElementById('body-roi').src = data.body_roi;
        
//         // QR code
//         document.getElementById('qr-code').src = data.qr_code;
//         document.getElementById('qr-data').textContent = data.qr_data;
        
//         // Watermarking
//         document.getElementById('watermarked-image').src = data.watermarked_image;
//         document.getElementById('extracted-watermark').src = data.extracted_watermark;
        
//         // Set download links
//         const downloadWatermarked = document.getElementById('download-watermarked');
//         downloadWatermarked.href = data.watermarked_image;
//         downloadWatermarked.download = 'watermarked_image.png';
        
//         if (data.image_hash) 
//         {
//             currentImageHash = data.image_hash;
//             document.getElementById('image-hash').textContent = 
//                 `${currentImageHash.substring(0, 10)}...${currentImageHash.substring(currentImageHash.length - 10)}`;
//             document.getElementById('store-hash').disabled = accounts.length === 0;
//         } 
//         else 
//         {
//             generateImageHash(data.watermarked_image);
//         }
//         console.log("Server response data:", data);
    
//         // Original image
//         console.log("Setting original image src to:", data.original_image);
//         document.getElementById('original-image').src = data.original_image;
//     }
// });

// // Connect to MetaMask wallet
// async function connectWallet() {
//     try {
//         document.getElementById('wallet-status').textContent = 'Connecting...';
        
//         // Request account access
//         accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
//         // Initialize Web3
//         web3 = new Web3(window.ethereum);
        
//         // Initialize contract
//         imageHashStorageContract = new web3.eth.Contract(
//             contractABI,
//             contractAddress
//         );
        
//         document.getElementById('wallet-status').textContent = `Connected: ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`;
//         document.getElementById('store-hash').disabled = currentImageHash === null;
        
//         // Listen for account changes
//         window.ethereum.on('accountsChanged', function (accounts) {
//             connectWallet();
//         });
        
//     } catch (error) {
//         console.error('Error connecting to MetaMask:', error);
//         document.getElementById('wallet-status').textContent = 'Connection failed';
//     }
// }

// // Generate SHA-256 hash of the image
// async function generateImageHash(imageUrl) {
//     try {
//         document.getElementById('image-hash').textContent = 'Generating...';
        
//         // Fetch the image data
//         const response = await fetch(imageUrl);
//         const blob = await response.blob();
        
//         // Read the image as array buffer
//         const arrayBuffer = await new Promise((resolve, reject) => {
//             const reader = new FileReader();
//             reader.onloadend = () => resolve(reader.result);
//             reader.onerror = reject;
//             reader.readAsArrayBuffer(blob);
//         });
        
//         // Convert to Uint8Array
//         const uint8Array = new Uint8Array(arrayBuffer);
        
//         // Calculate SHA-256 hash
//         const hashHex = sha256(uint8Array);
//         currentImageHash = hashHex;
        
//         document.getElementById('image-hash').textContent = `${hashHex.substring(0, 10)}...${hashHex.substring(hashHex.length - 10)}`;
//         document.getElementById('store-hash').disabled = accounts.length === 0;
        
//         return hashHex;
//     } catch (error) {
//         console.error('Error generating hash:', error);
//         document.getElementById('image-hash').textContent = 'Hash generation failed';
//         return null;
//     }
// }

// // Store image hash on blockchain
// async function storeImageHash() 
// {
//     if (!currentImageHash || accounts.length === 0) return;
    
//     try 
//     {
//         document.getElementById('tx-status').textContent = 'Pending...';
//         document.getElementById('store-hash').disabled = true;
        
//         // Call the smart contract function
//         const result = await imageHashStorageContract.methods.storeImageHash(currentImageHash)
//             .send({ from: accounts[0] });
        
//         // Update UI with transaction info
//         document.getElementById('tx-status').textContent = 'Confirmed';
//         document.getElementById('tx-hash').textContent = result.transactionHash;
//         document.getElementById('tx-hash').href = `https://etherscan.io/tx/${result.transactionHash}`;
//         document.getElementById('store-hash').disabled = false;
        
//         console.log('Transaction successful:', result);
//     } 
//     catch (error) 
//     {
//         console.error('Error storing hash on blockchain:', error);
//         document.getElementById('tx-status').textContent = 'Failed';
//         document.getElementById('store-hash').disabled = false;
//     }
// }
// });
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const uploadForm = document.getElementById('upload-form');
    const imageUpload = document.getElementById('image-upload');
    const fileName = document.getElementById('file-name');
    const loadingIndicator = document.getElementById('loading');
    const resultsContainer = document.getElementById('results-container');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const connectWalletBtn = document.getElementById('connect-wallet');
    const storeHashBtn = document.getElementById('store-hash');
    
    // Blockchain-related variables
    let web3;
    let accounts = [];
    let imageHashStorageContract;
    let currentImageHash = null;
    // const staticTxHash = "0x4aa59a84e54441dcaeec4e766b1a76b8ffd7e38c0260b3d64639e23087b356e5";
    // Display static transaction hash
    // const staticTxHash = "0x4aa59a84e54441dcaeec4e766b1a76b8ffd7e38c0260b3d64639e23087b356e5";
    // document.getElementById('static-tx-hash').textContent = staticTxHash;
    // Contract ABI (generated from your Solidity contract)
    const contractABI = [
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "uint256",
                    "name": "imageId",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "string",
                    "name": "imageHash",
                    "type": "string"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "owner",
                    "type": "address"
                }
            ],
            "name": "HashStored",
            "type": "event"
        },
        {
            "inputs": [],
            "name": "getImageCount",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "_imageId",
                    "type": "uint256"
                }
            ],
            "name": "getImageData",
            "outputs": [
                {
                    "internalType": "string",
                    "name": "",
                    "type": "string"
                },
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                },
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "name": "images",
            "outputs": [
                {
                    "internalType": "string",
                    "name": "imageHash",
                    "type": "string"
                },
                {
                    "internalType": "uint256",
                    "name": "timestamp",
                    "type": "uint256"
                },
                {
                    "internalType": "address",
                    "name": "owner",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "imageCount",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "string",
                    "name": "_imageHash",
                    "type": "string"
                }
            ],
            "name": "storeImageHash",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ];

    // Replace with your deployed contract address
    const contractAddress = "0x9D7f74d0C41E726EC95884E0e97Fa6129e3b5E99";

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
        console.log("Server response data:", data);
        
        // Original image
        console.log("Setting original image src to:", data.original_image);
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
        
        if (data.image_hash) {
            currentImageHash = data.image_hash;
            document.getElementById('image-hash').textContent = 
                `${currentImageHash.substring(0, 10)}...${currentImageHash.substring(currentImageHash.length - 10)}`;
            document.getElementById('store-hash').disabled = accounts.length === 0;
        } else {
            generateImageHash(data.watermarked_image);
        }
    }

    // Connect to MetaMask wallet
    connectWalletBtn.addEventListener('click', connectWallet);
    
    // Store hash on blockchain
    storeHashBtn.addEventListener('click', storeImageHash);
    
    // Check if MetaMask is installed
    if (typeof window.ethereum !== 'undefined') {
        connectWalletBtn.disabled = false;
    } else {
        document.getElementById('wallet-status').textContent = 'MetaMask not installed';
        connectWalletBtn.disabled = true;
    }

    // Connect to MetaMask wallet
    async function connectWallet() {
        try {
            document.getElementById('wallet-status').textContent = 'Connecting...';
            
            // Request account access
            accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // Initialize Web3
            web3 = new Web3(window.ethereum);
            
            // Initialize contract
            imageHashStorageContract = new web3.eth.Contract(
                contractABI,
                contractAddress
            );
            
            document.getElementById('wallet-status').textContent = `Connected: ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`;
            document.getElementById('store-hash').disabled = currentImageHash === null;
            
            // Listen for account changes
            window.ethereum.on('accountsChanged', function (accounts) {
                connectWallet();
            });
            
        } catch (error) {
            console.error('Error connecting to MetaMask:', error);
            document.getElementById('wallet-status').textContent = 'Connection failed';
        }
    }

    // Generate SHA-256 hash of the image
    async function generateImageHash(imageUrl) {
        try {
            document.getElementById('image-hash').textContent = 'Generating...';
            
            // Fetch the image data
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            
            // Read the image as array buffer
            const arrayBuffer = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsArrayBuffer(blob);
            });
            
            // Convert to Uint8Array
            const uint8Array = new Uint8Array(arrayBuffer);
            
            // Calculate SHA-256 hash
            const hashHex = sha256(uint8Array);
            currentImageHash = hashHex;
            
            document.getElementById('image-hash').textContent = `${hashHex.substring(0, 10)}...${hashHex.substring(hashHex.length - 10)}`;
            document.getElementById('store-hash').disabled = accounts.length === 0;
            
            return hashHex;
        } catch (error) {
            console.error('Error generating hash:', error);
            document.getElementById('image-hash').textContent = 'Hash generation failed';
            return null;
        }
    }
// Store image hash on blockchain
// async function storeImageHash() {
//     if (!currentImageHash || accounts.length === 0) return;
    
//     try {
//         document.getElementById('tx-status').textContent = 'Pending...';
//         document.getElementById('store-hash').disabled = true;
        
//         // Call the smart contract function
//         const result = await imageHashStorageContract.methods.storeImageHash(currentImageHash)
//             .send({ from: accounts[0] });
        
//         // Update UI with static transaction info
//         document.getElementById('tx-status').textContent = 'Confirmed';
        
//         // Replace dynamic transaction hash with static hash
//         const staticTxHash = "0x4aa59a84e54441dcaeec4e766b1a76b8ffd7e38c0260b3d64639e23087b356e5";
//         document.getElementById('tx-hash').textContent = staticTxHash;
//         // document.getElementById('tx-hash').href = `https://sepolia.etherscan.io/tx/${staticTxHash}`; // Update the link if needed
//         document.getElementById('tx-hash').href = `https://etherscan.io/tx/${staticTxHash}`; // Update the link if needed
//         document.getElementById('store-hash').disabled = false;
        
//         console.log('Transaction successful:', result);
//     } catch (error) {
//         console.error('Error storing hash on blockchain:', error);
//         document.getElementById('tx-status').textContent = 'Failed';
//         document.getElementById('store-hash').disabled = false;
//     }
// }
    // Store image hash on blockchain
    async function storeImageHash() {
        if (!currentImageHash || accounts.length === 0) return;
        
        try {
            document.getElementById('tx-status').textContent = 'Pending...';
            document.getElementById('store-hash').disabled = true;
            
            // Call the smart contract function
            const result = await imageHashStorageContract.methods.storeImageHash(currentImageHash)
                .send({ from: accounts[0] });
            
            // Update UI with transaction info
            document.getElementById('tx-status').textContent = 'Confirmed';
            document.getElementById('tx-hash').textContent = result.transactionHash;
            // document.getElementById('tx-hash').href = `https://sepolia.etherscan.io/tx/${result.transactionHash}`;
            document.getElementById('tx-hash').href = `https://eth-sepolia.blockscout.com/tx/${result.transactionHash}`;

            // document.getElementById('tx-hash').href = `https://etherscan.io/tx/${result.transactionHash}`;
            document.getElementById('store-hash').disabled = false;
            
            console.log('Transaction successful:', result);
        } catch (error) {
            console.error('Error storing hash on blockchain:', error);
            document.getElementById('tx-status').textContent = 'Failed';
            document.getElementById('store-hash').disabled = false;
        }
    }
});


