from onnx_tf.backend import prepare
import onnx

model = onnx.load("yolov8n.onnx")  # 후처리 포함된 onnx
tf_rep = prepare(model)
tf_rep.export_graph("yolov8n_saved_model")