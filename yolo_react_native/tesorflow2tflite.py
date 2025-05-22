import tensorflow as tf

# 모델 로드
converter = tf.lite.TFLiteConverter.from_saved_model("yolov8n_saved_model")

# 최적화 옵션 (선택)
converter.optimizations = [tf.lite.Optimize.DEFAULT]

# 변환 수행
tflite_model = converter.convert()

# 파일로 저장
with open("yolov8n.tflite", "wb") as f:
    f.write(tflite_model)