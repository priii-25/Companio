import tensorflow as tf
import numpy as np
import pre_trained_facenet
import cv2
import xlrd
import os
from mtcnn import MTCNN

# No need to disable eager execution; let it run in TensorFlow 2.x default mode
config = tf.compat.v1.ConfigProto(log_device_placement=False)
session = tf.compat.v1.Session(config=config)
sess = session

# Initialize MTCNN
detector = MTCNN()

print("Choose")
print("1. For input from Webcam (Live)")
print("2. For input from the Folder-Input")
val = input("Enter your value from Keyboard: ")
print(val)

# Constants
minsize = 20
threshold = [0.6, 0.7, 0.7]
factor = 0.709
margin = 44
input_image_size = 160

# Load Excel database
loc = r"C:\Users\VICTUS\Downloads\Face_Recognition\Face_Recognition\data.xls"
if not os.path.exists(loc):
    print(f"Error: '{loc}' not found.")
    exit()
wb = xlrd.open_workbook(loc)
sheet = wb.sheet_by_index(0)

# Custom load model function
def custom_load_model(model):
    model_exp = os.path.expanduser(model)
    print('Model filename: %s' % model_exp)
    with tf.io.gfile.GFile(model_exp, 'rb') as f:
        graph_def = tf.compat.v1.GraphDef()
        graph_def.ParseFromString(f.read())
        tf.compat.v1.import_graph_def(graph_def, name='')

# Load pre-trained FaceNet model
model_path = r"C:\Users\VICTUS\Downloads\Face_Recognition\Face_Recognition\20170512-110547.pb"
if not os.path.exists(model_path):
    print(f"Error: Model file '{model_path}' not found. Download it from: https://drive.google.com/file/d/0B5MzpY9kBtDVZ2RpVDYwWmxoSUk")
    exit()
custom_load_model(model_path)

# Get input and output tensors
images_placeholder = tf.compat.v1.get_default_graph().get_tensor_by_name("input:0")
embeddings = tf.compat.v1.get_default_graph().get_tensor_by_name("embeddings:0")
phase_train_placeholder = tf.compat.v1.get_default_graph().get_tensor_by_name("phase_train:0")
embedding_size = embeddings.get_shape()[1]

def getFace(img):
    faces = []
    result = detector.detect_faces(img)
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
    rearranged = cv2.resize(cropped, (input_image_size, input_image_size), interpolation=cv2.INTER_CUBIC)
    prewhitened = pre_trained_facenet.prewhiten(rearranged)
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
for j in range(1, sheet.nrows):
    img = cv2.imread(r"C:\Users\VICTUS\Downloads\Face_Recognition\Face_Recognition\database\Person" + str(j) + ".jpg")
    if img is None:
        print(f"Warning: Could not load 'database/Person{j}.jpg'. Skipping.")
        continue
    faces = getFace(img)
    if faces:
        database_faces.append({'embedding': faces[0]['embedding'], 'class': j, 'name': sheet.cell_value(j, 1)})

print("Total number of people in database = " + str(sheet.nrows - 1))

if val == '1':
    # Initialize webcam
    camera = cv2.VideoCapture(0)
    if not camera.isOpened():
        print("Error: Could not open webcam.")
        exit()

    # Live camera loop
    while True:
        ret, frame = camera.read()
        if not ret:
            print("Error: Could not read frame from webcam.")
            break

        # Detect and recognize faces in the current frame
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

            # Display recognition result on the frame
            label = f"{recognized_name} ({min_distance:.2f})"
            cv2.putText(frame, label, (live_box[0], live_box[1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

        # Show the frame
        cv2.imshow('Face Recognition', frame)

        # Exit on 'q' key press
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # Cleanup
    camera.release()
    cv2.destroyAllWindows()

elif val == '2':
    # Single image from folder
    img_path = r"C:\Users\VICTUS\Downloads\Face_Recognition\Face_Recognition\Input\cam.jpg"
    img2 = cv2.imread(img_path)
    if img2 is None:
        print(f"Error: Could not load '{img_path}'. Check if the file exists.")
        exit()

    # Process the single image
    for j in range(1, sheet.nrows):
        img1 = cv2.imread(r"C:\Users\VICTUS\Downloads\Face_Recognition\Face_Recognition\database\Person" + str(j) + ".jpg")
        if img1 is None:
            print(f"Warning: Could not load 'database/Person{j}.jpg'. Skipping.")
            continue
        live_faces = getFace(img2.copy())  # Copy to avoid modifying original
        if not live_faces:
            print("No face detected in the input image.")
            break
        live_embedding = live_faces[0]['embedding']
        distance = np.sqrt(np.sum(np.square(np.subtract(live_embedding, database_faces[j-1]['embedding']))))
        threshold = 0.9
        print("distance = " + str(distance))
        if distance <= threshold:
            print("person found is from class  " + str(j))
            print("The person found is  " + str(sheet.cell_value(j, 1)))
            break
    else:
        print("No match found in the database.")

else:
    print("Wrong Choice")
    exit()