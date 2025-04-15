import os
import cv2
import numpy as np
import qrcode
import base64
import cloudinary
import cloudinary.uploader
from cloudinary.utils import cloudinary_url
from flask import Flask, request, jsonify, render_template, redirect, url_for
from werkzeug.utils import secure_filename
from io import BytesIO
from PIL import Image
from datetime import datetime
import mediapipe as mp
import logging
from mtcnn import MTCNN

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['RESULT_FOLDER'] = 'static/results'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Create directories if they don't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['RESULT_FOLDER'], exist_ok=True)
os.makedirs(os.path.join('static', 'results'), exist_ok=True)

# Cloudinary Configuration
cloudinary.config(
    cloud_name="dn4ln2hab",
    api_key="448978139882856",
    api_secret="g4aCelH0QnzaTkJxkHmFdpGroAA"
)

# Initialize face detector
try:
    face_detector = MTCNN()
    logger.info("MTCNN face detector initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize MTCNN face detector: {e}")
    face_detector = None

# Initialize MediaPipe Pose
try:
    mp_pose = mp.solutions.pose
    mp_drawing = mp.solutions.drawing_utils
    pose_detector = mp_pose.Pose(
        static_image_mode=True,
        model_complexity=2,
        enable_segmentation=True,
        min_detection_confidence=0.5
    )
    logger.info("MediaPipe pose detector initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize MediaPipe pose detector: {e}")
    pose_detector = None

# Initialize HOG-based person detector
try:
    hog = cv2.HOGDescriptor()
    hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
    logger.info("HOG person detector initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize HOG detector: {e}")
    hog = None

def save_image(image, folder, filename):
    """Save an image to a specified folder and return its path."""
    filepath = os.path.join(folder, filename)
    cv2.imwrite(filepath, image)
    return filepath

def image_to_base64(image_path):
    """Convert an image to base64 for web display."""
    web_path = image_path.replace('static/', '').replace('\\', '/')
    return url_for('static', filename=web_path)

def detect_face_mtcnn(image):
    """Detect face using MTCNN and return bounding boos.makedirs(os.path.join('static', 'results'), exist_ok=True)x."""
    if face_detector is None:
        logger.warning("MTCNN face detector not available")
        return None
    
    try:
        # Convert to RGB if it's BGR
        if len(image.shape) == 3 and image.shape[2] == 3:
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        else:
            image_rgb = image
            
        faces = face_detector.detect_faces(image_rgb)
        if len(faces) == 0:
            logger.warning("No face detected in the image")
            return None
        
        logger.info(f"Face detected with confidence: {faces[0]['confidence']:.2f}")
        return faces[0]['box']
    except Exception as e:
        logger.error(f"Error in face detection: {e}")
        return None

def detect_body_hog_mediapipe(image):
    """Detect body using HOG + MediaPipe Pose for better accuracy."""
    if pose_detector is None and hog is None:
        logger.warning("Neither MediaPipe pose detector nor HOG detector available")
        return None
    
    try:
        # Convert to RGB if it's BGR
        if len(image.shape) == 3 and image.shape[2] == 3:
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        else:
            image_rgb = image
            
        h, w = image_rgb.shape[:2]
        
        # Method 1: MediaPipe Pose
        if pose_detector is not None:
            pose_results = pose_detector.process(image_rgb)
            
            if pose_results.pose_landmarks:
                logger.info("Body detected with MediaPipe Pose")
                
                # Get body bounds from landmarks
                landmarks = pose_results.pose_landmarks.landmark
                
                # Extract coordinates for torso (using shoulders, hips)
                coords = []
                # Use key points to define upper body region
                key_points = [11, 12, 23, 24]  # Left shoulder, right shoulder, left hip, right hip
                
                for idx in key_points:
                    if idx < len(landmarks):
                        coords.append((int(landmarks[idx].x * w), int(landmarks[idx].y * h)))
                
                if coords:
                    # Get bounds of these points
                    x_coords = [p[0] for p in coords]
                    y_coords = [p[1] for p in coords]
                    
                    # Add padding
                    min_x = max(0, min(x_coords) - int(w * 0.1))
                    min_y = max(0, min(y_coords) - int(h * 0.1))
                    max_x = min(w, max(x_coords) + int(w * 0.1))
                    max_y = min(h, max(y_coords) + int(h * 0.25))  # Extra padding below hips
                    
                    body_box = (min_x, min_y, max_x - min_x, max_y - min_y)
                    return body_box
        
        # Method 2: HOG-based person detection
        if hog is not None:
            rects, weights = hog.detectMultiScale(
                image_rgb, 
                winStride=(8, 8),
                padding=(16, 16), 
                scale=1.05,
                useMeanshiftGrouping=True
            )
            
            if len(rects) > 0:
                logger.info("Body detected with HOG detector")
                # Get largest detected rectangle
                largest_rect = max(rects, key=lambda r: r[2] * r[3])
                x, y, width, height = largest_rect
                
                # Add some padding
                x = max(0, x - int(w * 0.05))
                y = max(0, y - int(h * 0.05))
                width = min(w - x, width + int(w * 0.1))
                height = min(h - y, height + int(h * 0.1))
                
                return (x, y, width, height)
        
        # Method 3: Face-based estimation as fallback
        face_box = detect_face_mtcnn(image_rgb)
        if face_box:
            logger.info("Using face-based body estimation")
            fx, fy, fw, fh = face_box
            # Estimate body position below face
            body_x = max(0, fx - fw//2)
            body_y = min(h-1, fy + fh)
            body_w = min(w - body_x, fw * 3)
            body_h = min(h - body_y, int(h * 0.5))
            
            return (body_x, body_y, body_w, body_h)
        
        # Last resort: use default region
        logger.warning("Using default body region")
        default_body = (int(w * 0.25), int(h * 0.3), int(w * 0.5), int(h * 0.5))
        return default_body
    except Exception as e:
        logger.error(f"Error in body detection: {e}")
        return (int(w * 0.25), int(h * 0.3), int(w * 0.5), int(h * 0.5))

def generate_qr(data):
    """Generates a QR code for the given data."""
    try:
        qr = qrcode.QRCode(
            version=5,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )
        qr.add_data(data)
        qr.make(fit=True)
        qr_img = qr.make_image(fill="black", back_color="white")
        
        # Convert PIL image to OpenCV format
        qr_array = np.array(qr_img)
        # Ensure the array data type is uint8
        qr_array = qr_array.astype(np.uint8) * 255 

        if len(qr_array.shape) == 2:  # If the image is grayscale
            qr_cv = cv2.cvtColor(qr_array, cv2.COLOR_GRAY2BGR)
        else:
            qr_cv = cv2.cvtColor(qr_array, cv2.COLOR_RGB2BGR)
        
        return qr_cv
    except Exception as e:
        logger.error(f"Error generating QR code: {e}")
        return None

def embed_watermark_plsb(original, watermark, body_box):
    """
    Embeds a QR watermark into the body using PLSB (Pixel Least Significant Bit).
    Uses both the LSB and the bit before LSB for embedding.
    """
    try:
        bx, by, bw, bh = body_box
        
        # Resize watermark to fit the body region
        wm_resized = cv2.resize(watermark, (bw, bh))
        
        # Convert to binary representation (0 or 1)
        wm_binary = np.zeros_like(wm_resized)
        for i in range(3):
            _, wm_binary[:, :, i] = cv2.threshold(wm_resized[:, :, i], 128, 1, cv2.THRESH_BINARY)
        
        # Create copy of original image for watermarking
        watermarked = original.copy()
        
        # Embed the watermark by modifying the least significant bit and the bit before it
        roi = watermarked[by:by+bh, bx:bx+bw]
        for i in range(3):
            # Clear the two least significant bits (mask with 11111100 = 0xFC)
            roi[:, :, i] = roi[:, :, i] & 0xFC
            
            # Set the 2nd least significant bit to the same watermark bit
            # (left shift by 1 and use bitwise OR)
            roi[:, :, i] = roi[:, :, i] | (wm_binary[:, :, i] << 1)
            
            # Set the least significant bit to the same watermark bit
            roi[:, :, i] = roi[:, :, i] | wm_binary[:, :, i]
        
        watermarked[by:by+bh, bx:bx+bw] = roi
        
        # Visualize differences between original and watermarked
        diff = cv2.absdiff(original, watermarked)
        
        return watermarked, diff
    except Exception as e:
        logger.error(f"Error embedding watermark: {e}")
        return original.copy(), None

def extract_watermark_plsb(watermarked, body_box):
    """
    Extracts the QR watermark using PLSB from the body region.
    Considers both the LSB and the bit before LSB for extraction.
    """
    try:
        bx, by, bw, bh = body_box
        
        # Get the body region
        body_roi = watermarked[by:by+bh, bx:bx+bw]
        
        # Extract both LSB and the bit before LSB, then combine for better reliability
        extracted = np.zeros_like(body_roi)
        for i in range(3):
            # Extract LSB (bit 0)
            lsb = body_roi[:, :, i] & 0x01
            
            # Extract bit before LSB (bit 1)
            bit_before_lsb = (body_roi[:, :, i] & 0x02) >> 1
            
            # Combine both bits (if they match, keep the value; otherwise, use a threshold)
            # When both bits are the same, we have higher confidence
            combined = np.zeros_like(lsb)
            
            # When bits match (both 0 or both 1), use that value
            match_indices = (lsb == bit_before_lsb)
            combined[match_indices] = lsb[match_indices]
            
            # When bits don't match, make a decision based on surrounding pixels
            # For simplicity, we can use the average of the two bits
            nonmatch_indices = ~match_indices
            combined[nonmatch_indices] = (lsb[nonmatch_indices].astype(float) + 
                                        bit_before_lsb[nonmatch_indices].astype(float)) / 2
            combined = np.round(combined).astype(np.uint8)
            
            # Scale to visible range (0-255)
            extracted[:, :, i] = combined * 255
        
        # Apply post-processing to improve QR code readability
        extracted_gray = cv2.cvtColor(extracted, cv2.COLOR_BGR2GRAY)
        _, extracted_binary = cv2.threshold(extracted_gray, 128, 255, cv2.THRESH_BINARY)
        
        # Convert back to 3-channel for consistency
        extracted_enhanced = cv2.cvtColor(extracted_binary, cv2.COLOR_GRAY2BGR)
        
        return extracted_enhanced
    except Exception as e:
        logger.error(f"Error extracting watermark: {e}")
        return np.zeros_like(watermarked[by:by+bh, bx:bx+bw])

def extract_qr_data(image):
    """Extracts data from QR code."""
    try:
        detector = cv2.QRCodeDetector()
        data, bbox, _ = detector.detectAndDecode(image)
        if not data:
            # Try preprocessing if direct detection fails
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                        cv2.THRESH_BINARY, 11, 2)
            data, bbox, _ = detector.detectAndDecode(thresh)
        
        return data if data else None
    except Exception as e:
        logger.error(f"Error extracting QR data: {e}")
        return None

def visualize_watermarking_process(original, watermark, watermarked, extracted, body_box):
    """
    Visualizes the complete watermarking process with intermediate steps.
    """
    try:
        bx, by, bw, bh = body_box
        
        # Create a figure for comparison
        h, w = original.shape[:2]
        process_vis = np.zeros((h*2, w*2, 3), dtype=np.uint8)
        
        # Add original image
        original_marked = original.copy()
        cv2.rectangle(original_marked, (bx, by), (bx+bw, by+bh), (255, 0, 0), 2)
        process_vis[:h, :w] = original_marked
        
        # Add watermark
        watermark_resized = cv2.resize(watermark, (w, h))
        process_vis[:h, w:w*2] = watermark_resized
        
        # Add watermarked image
        process_vis[h:h*2, :w] = watermarked
        
        # Add extracted watermark (resize to full resolution for visibility)
        extracted_resized = cv2.resize(extracted, (w, h))
        process_vis[h:h*2, w:w*2] = extracted_resized
        
        # Add text labels
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.8
        font_color = (255, 255, 255)
        font_thickness = 2
        
        cv2.putText(process_vis, "Original Image", (10, 30), font, font_scale, font_color, font_thickness)
        cv2.putText(process_vis, "QR Code Watermark", (w+10, 30), font, font_scale, font_color, font_thickness)
        cv2.putText(process_vis, "Watermarked Image", (10, h+30), font, font_scale, font_color, font_thickness)
        cv2.putText(process_vis, "Extracted Watermark", (w+10, h+30), font, font_scale, font_color, font_thickness)
        
        return process_vis
    except Exception as e:
        logger.error(f"Error creating watermarking process visualization: {e}")
        return original

@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process_image():
    """Process the uploaded image."""
    try:
        # Check if image file was uploaded
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        
        # Check if the file is empty
        if file.filename == '':
            return jsonify({'error': 'No image selected'}), 400
        
        # Generate a unique filename to avoid collisions
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{secure_filename(file.filename)}"
        # filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        filepath = os.path.normpath(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        
        # Save the uploaded file
        file.save(filepath)
        logger.info(f"Image saved to {filepath}")
        
        # Read the image with OpenCV
        image = cv2.imread(filepath)
        if image is None:
            return jsonify({'error': 'Failed to read the uploaded image'}), 400
        
        # Create results dictionary
        results = {}
        
        # Save original image for reference
        original_path = os.path.join(app.config['RESULT_FOLDER'], f"original_{filename}")
        cv2.imwrite(original_path, image)
        results['original_image'] = image_to_base64(original_path)
        
        # Detect face (ROI)
        face_box = detect_face_mtcnn(image)
        if face_box is None:
            return jsonify({'error': 'No face detected in the image'}), 400
        
        x, y, w, h = face_box
        
        # Create face detection visualization
        face_detection_img = image.copy()
        cv2.rectangle(face_detection_img, (x, y), (x+w, y+h), (0, 255, 0), 2)
        face_detection_path = os.path.join(app.config['RESULT_FOLDER'], f"face_detection_{filename}")
        cv2.imwrite(face_detection_path, face_detection_img)
        results['face_detection'] = image_to_base64(face_detection_path)
        
        # Extract face ROI
        face_roi = image[y:y+h, x:x+w]
        face_roi_path = os.path.join(app.config['RESULT_FOLDER'], f"face_roi_{filename}")
        cv2.imwrite(face_roi_path, face_roi)
        results['face_roi'] = image_to_base64(face_roi_path)
        
        # Upload face to Cloudinary
        try:
            response = cloudinary.uploader.upload(face_roi_path)
            image_url = response["secure_url"]
            logger.info(f"Face uploaded to Cloudinary: {image_url}")
            qr_data = image_url
        except Exception as e:
            logger.error(f"Error uploading to Cloudinary: {e}")
            qr_data = f"face_detected_{timestamp}"
        
        # Store QR data
        results['qr_data'] = qr_data
        
        # Generate QR code
        qr_image = generate_qr(qr_data)
        qr_path = os.path.join(app.config['RESULT_FOLDER'], f"qr_{filename}")
        cv2.imwrite(qr_path, qr_image)
        results['qr_code'] = image_to_base64(qr_path)
        
        # Detect body for watermarking
        body_box = detect_body_hog_mediapipe(image)
        bx, by, bw, bh = body_box
        
        # Create body detection visualization
        body_detection_img = image.copy()
        cv2.rectangle(body_detection_img, (bx, by), (bx+bw, by+bh), (255, 0, 0), 2)
        body_detection_path = os.path.join(app.config['RESULT_FOLDER'], f"body_detection_{filename}")
        cv2.imwrite(body_detection_path, body_detection_img)
        results['body_detection'] = image_to_base64(body_detection_path)
        
        # Extract body ROI
        body_roi = image[by:by+bh, bx:bx+bw]
        body_roi_path = os.path.join(app.config['RESULT_FOLDER'], f"body_roi_{filename}")
        cv2.imwrite(body_roi_path, body_roi)
        results['body_roi'] = image_to_base64(body_roi_path)
        
        # Embed watermark
        watermarked, diff = embed_watermark_plsb(image, qr_image, body_box)
        watermarked_path = os.path.join(app.config['RESULT_FOLDER'], f"watermarked_{filename}")
        cv2.imwrite(watermarked_path, watermarked)
        results['watermarked_image'] = image_to_base64(watermarked_path)
        
        # Extract watermark
        extracted_watermark = extract_watermark_plsb(watermarked, body_box)
        extracted_path = os.path.join(app.config['RESULT_FOLDER'], f"extracted_{filename}")
        cv2.imwrite(extracted_path, extracted_watermark)
        results['extracted_watermark'] = image_to_base64(extracted_path)
        
        # Create process visualization
        process_vis = visualize_watermarking_process(
            image, qr_image, watermarked, extracted_watermark, body_box
        )
        process_vis_path = os.path.join(app.config['RESULT_FOLDER'], f"process_{filename}")
        cv2.imwrite(process_vis_path, process_vis)
        results['watermark_process'] = image_to_base64(process_vis_path)
        
        return jsonify(results)
    
    except Exception as e:
        logger.error(f"Error processing image: {e}")
        return jsonify({'error': f'Error processing image: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)