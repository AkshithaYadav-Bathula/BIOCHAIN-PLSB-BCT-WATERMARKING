// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ImageHashStorage {
    struct ImageData {
        string imageHash;
        uint256 timestamp;
        address owner;
    }
    
    
    // Mapping from image ID to image data
    mapping(uint256 => ImageData) public images;
    uint256 public imageCount = 0;
    
    // Event to emit when a new hash is stored
    event HashStored(uint256 indexed imageId, string imageHash, address indexed owner);
    
    // Store a new image hash
    function storeImageHash(string memory _imageHash) public returns (uint256) {
        imageCount++;
        images[imageCount] = ImageData({
            imageHash: _imageHash,
            timestamp: block.timestamp,
            owner: msg.sender
        });
        
        emit HashStored(imageCount, _imageHash, msg.sender);
        return imageCount;
    }
    
    // Get image data by ID
    function getImageData(uint256 _imageId) public view returns (string memory, uint256, address) {
        ImageData memory img = images[_imageId];
        return (img.imageHash, img.timestamp, img.owner);
    }
    
    // Get total number of images
    function getImageCount() public view returns (uint256) {
        return imageCount;
    }
}