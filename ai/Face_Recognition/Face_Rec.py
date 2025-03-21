import tensorflow as tf
import numpy as np
import cv2
import os
from mtcnn import MTCNN
import openpyxl
import xlrd
import json
import sys
from ultralytics import YOLO

# TensorFlow session setup
config = tf.compat.v1.ConfigProto(log_device_placement=False)
session = tf.compat.v1.Session(config=config)
sess = session

# Initialize MTCNN
try:
    detector = MTCNN()
except Exception as e:
    print(f"Error initializing MTCNN: {e}")
    sys.exit(1)

# Initialize YOLOv8n for person detection
try:
    yolo_model = YOLO("yolov8n.pt")
except Exception as e:
    print(f"Error initializing YOLOv8n: {e}")
    sys.exit(1)

print("Choose")
print("1. For input from Webcam (Live)")
print("2. For input from the Folder-Input")
print("4. Capture and Process Image")
val = input("Enter your value from Keyboard: ")
print(val)

# Constants
minsize = 20
threshold = [0.6, 0.7, 0.7]
factor = 0.709
margin = 44
input_image_size = 160

# Load Excel database
loc = "data.xlsx"
if not os.path.exists(loc):
    loc = "data.xls"
    if not os.path.exists(loc):
        print(f"Error: Neither 'data.xlsx' nor 'data.xls' found.")
        sys.exit(1)
if loc.endswith('.xlsx'):
    workbook = openpyxl.load_workbook(loc)
    sheet = workbook.active
    nrows = sheet.max_row
else:
    workbook = xlrd.open_workbook(loc)
    sheet = workbook.sheet_by_index(0)
    nrows = sheet.nrows

# Custom load model function
def custom_load_model(model):
    model_exp = os.path.expanduser(model)
    print('Model filename: %s' % model_exp)
    with tf.io.gfile.GFile(model_exp, 'rb') as f:
        graph_def = tf.compat.v1.GraphDef()
        graph_def.ParseFromString(f.read())
        tf.compat.v1.import_graph_def(graph_def, name='')

# Load pre-trained FaceNet model
model_path = "20170512-110547.pb"
if not os.path.exists(model_path):
    print(f"Error: Model file '{model_path}' not found. Download it from: https://drive.google.com/file/d/0B5MzpY9kBtDVZ2RpVDYwWmxoSUk")
    sys.exit(1)
custom_load_model(model_path)

# Get input and output tensors
images_placeholder = tf.compat.v1.get_default_graph().get_tensor_by_name("input:0")
embeddings = tf.compat.v1.get_default_graph().get_tensor_by_name("embeddings:0")
phase_train_placeholder = tf.compat.v1.get_default_graph().get_tensor_by_name("phase_train:0")
embedding_size = embeddings.get_shape()[1]

# Define prewhiten function manually
def prewhiten(x):
    mean = np.mean(x)
    std = np.std(x)
    std_adj = np.maximum(std, 1.0 / np.sqrt(x.size))
    y = np.multiply(np.subtract(x, mean), 1 / std_adj)
    return y

def getFace(img):
    faces = []
    try:
        result = detector.detect_faces(img)
    except Exception as e:
        print(f"Error in face detection: {e}")
        return faces
    if not result:
        return faces
    bounding_box = result[0]['box']
    keypoints = result[0]['keypoints']
    cv2.rectangle(img,
                  (bounding_box[0], bounding_box[1]),
                  (bounding_box[0] + bounding_box[2], bounding_box[1] + bounding_box[3]),
                  (0, 155, 255), 2)
    cv2.circle(img, (keypoints['left_eye']), 2, (0, 155, 255), 2)
    cv2.circle(img, (keypoints['right_eye']), 2, (0, 155, 255), 2)
    cv2.circle(img, (keypoints['nose']), 2, (0, 155, 255), 2)
    cv2.circle(img, (keypoints['mouth_left']), 2, (0, 155, 255), 2)
    cv2.circle(img, (keypoints['mouth_right']), 2, (0, 155, 255), 2)
    cropped = img[bounding_box[1]:bounding_box[1] + bounding_box[3], bounding_box[0]:bounding_box[0] + bounding_box[2]]
    if cropped.size == 0:
        return faces
    rearranged = cv2.resize(cropped, (input_image_size, input_image_size), interpolation=cv2.INTER_CUBIC)
    prewhitened = prewhiten(rearranged)
    faces.append({'face': rearranged, 'embedding': getEmbedding(prewhitened), 'box': bounding_box})
    return faces

def getEmbedding(resized):
    reshaped = resized.reshape(-1, input_image_size, input_image_size, 3)
    feed_dict = {images_placeholder: reshaped, phase_train_placeholder: False}
    with sess.as_default():
        embedding = sess.run(embeddings, feed_dict=feed_dict)
    return embedding

# Load database images once
database_faces = []
for j in range(1, nrows):
    img_path = os.path.join("database", f"Person{j}.jpg")
    img = cv2.imread(img_path)
    if img is None:
        print(f"Warning: Could not load '{img_path}'. Skipping.")
        continue
    faces = getFace(img)
    if faces:
        if loc.endswith('.xlsx'):
            name = sheet.cell(j + 1, 2).value
        else:
            name = sheet.cell_value(j, 1)
        database_faces.append({'embedding': faces[0]['embedding'], 'class': j, 'name': name})

print("Total number of people in database = " + str(len(database_faces)))

# Function to segment image using YOLO
def segment_image(image):
    sub_images = []
    face_positions = []
    try:
        results = yolo_model(image)
        for result in results:
            boxes = result.boxes.xyxy.cpu().numpy()
            classes = result.boxes.cls.cpu().numpy()
            for box, cls in zip(boxes, classes):
                if int(cls) == 0:  # Class ID 0 is "person"
                    x1, y1, x2, y2 = map(int, box[:4])
                    # Estimate face region (upper 20% of the person bounding box)
                    face_height = int((y2 - y1) * 0.2)
                    face_y1 = y1
                    face_y2 = y1 + face_height
                    face_x1 = x1
                    face_x2 = x2
                    face_center_x = (face_x1 + face_x2) // 2
                    face_positions.append((face_center_x, face_x1, face_x2, face_y1, face_y2))
    except Exception as e:
        print(f"Error in YOLO person detection: {e}")
        return sub_images

    if not face_positions:
        return [image]  # No faces detected, return the original image

    # Sort faces by x-coordinate to determine splitting order
    face_positions.sort(key=lambda x: x[0])  # Sort by face_center_x

    # Split the image based on the number of faces
    num_faces = len(face_positions)
    img_height, img_width = image.shape[:2]
    if num_faces == 1:
        sub_images.append(image)
    else:
        # Calculate split points between faces
        split_points = []
        for i in range(num_faces - 1):
            # Split at the midpoint between two face centers
            split_x = (face_positions[i][0] + face_positions[i + 1][0]) // 2
            split_points.append(split_x)

        # Segment the image
        prev_x = 0
        for i in range(num_faces):
            if i < len(split_points):
                next_x = split_points[i]
            else:
                next_x = img_width
            # Extract the sub-image
            sub_img = image[:, prev_x:next_x]
            if sub_img.size > 0:
                sub_images.append(sub_img)
            prev_x = next_x

    return sub_images

# Function to recognize faces in a sub-image
def recognize_face(sub_image):
    recognized_name = "Unknown"
    min_distance = float('inf')
    threshold = 0.9

    live_faces = getFace(sub_image.copy())
    if live_faces:
        live_embedding = live_faces[0]['embedding']
        for db_face in database_faces:
            distance = np.sqrt(np.sum(np.square(np.subtract(live_embedding, db_face['embedding']))))
            if distance < min_distance:
                min_distance = distance
                if distance <= threshold:
                    recognized_name = db_face['name']
    return recognized_name

if val == '1':
    # Original live webcam mode (unchanged)
    camera = None
    for i in range(3):
        camera = cv2.VideoCapture(i)
        if camera.isOpened():
            print(f"Webcam opened successfully on index {i}.")
            break
    if not camera or not camera.isOpened():
        print("Error: Could not open webcam. Ensure camera access is enabled.")
        sys.exit(1)

    while True:
        ret, frame = camera.read()
        if not ret:
            print("Error: Could not read frame from webcam.")
            break

        live_faces = getFace(frame)
        recognized_name = "Unknown"
        min_distance = float('inf')
        threshold = 0.9

        if live_faces:
            live_embedding = live_faces[0]['embedding']
            live_box = live_faces[0]['box']
            for db_face in database_faces:
                distance = np.sqrt(np.sum(np.square(np.subtract(live_embedding, db_face['embedding']))))
                if distance < min_distance:
                    min_distance = distance
                    if distance <= threshold:
                        recognized_name = db_face['name']

            label = f"{recognized_name} ({min_distance:.2f})"
            cv2.putText(frame, label, (live_box[0], live_box[1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

        try:
            cv2.imshow('Face Recognition', frame)
        except Exception as e:
            print(f"Error displaying frame: {e}")
            break

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    camera.release()
    cv2.destroyAllWindows()

elif val == '2':
    # Original folder input mode (unchanged)
    img_path = os.path.join("Input", "cam.jpg")
    img2 = cv2.imread(img_path)
    if img2 is None:
        print(f"Error: Could not load '{img_path}'. Check if the file exists.")
        sys.exit(1)

    for j in range(len(database_faces)):
        live_faces = getFace(img2.copy())
        if not live_faces:
            print("No face detected in the input image.")
            break
        live_embedding = live_faces[0]['embedding']
        distance = np.sqrt(np.sum(np.square(np.subtract(live_embedding, database_faces[j]['embedding']))))
        threshold = 0.9
        print("distance = " + str(distance))
        if distance <= threshold:
            print("person found is from class  " + str(j + 1))
            print("The person found is  " + str(database_faces[j]['name']))
            break
    else:
        print("No match found in the database.")

elif val == '4':
    # New mode: Capture from webcam, segment, and recognize faces
    camera = None
    for i in range(3):
        camera = cv2.VideoCapture(i)
        if camera.isOpened():
            print(f"Webcam opened successfully on index {i}.")
            break
    if not camera or not camera.isOpened():
        print("Error: Could not open webcam. Ensure camera access is enabled.")
        sys.exit(1)

    # Display webcam feed without face recognition
    while True:
        ret, frame = camera.read()
        if not ret:
            print("Error: Could not read frame from webcam.")
            break

        # Show the frame with a prompt to capture
        cv2.putText(frame, "Press 'c' to capture", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        try:
            cv2.imshow('Webcam Capture', frame)
        except Exception as e:
            print(f"Error displaying frame: {e}")
            break

        # Capture on 'c' key press
        key = cv2.waitKey(1) & 0xFF
        if key == ord('c'):
            # Save the captured frame
            cv2.imwrite("captured_frame.jpg", frame)
            print(json.dumps({"status": "frame_captured", "path": "captured_frame.jpg"}))
            sys.stdout.flush()
            break
        elif key == ord('q'):
            camera.release()
            cv2.destroyAllWindows()
            sys.exit(0)

    camera.release()
    cv2.destroyAllWindows()

    # Process the captured image
    captured_image = cv2.imread("captured_frame.jpg")
    if captured_image is None:
        print("Error: Could not load captured image.")
        sys.exit(1)

    # Segment the image using YOLO
    sub_images = segment_image(captured_image)
    print(f"Segmented into {len(sub_images)} sub-images")

    # Recognize faces in each sub-image
    face_results = []
    for i, sub_img in enumerate(sub_images):
        recognized_name = recognize_face(sub_img)
        face_results.append({
            "recognized": recognized_name != "Unknown",
            "name": recognized_name
        })

    # Output the results as JSON
    result = {
        "status": "success",
        "faces": face_results
    }
    print(json.dumps(result))
    sys.stdout.flush()

else:
    print("Wrong Choice")
    sys.exit(1)