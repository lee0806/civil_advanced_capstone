import React, {useEffect, useRef, useState} from 'react';
import {View, Text, StyleSheet, Platform} from 'react-native';
import {Camera} from 'react-native-vision-camera';
import {useTflite} from 'react-native-fast-tflite';
import RNFS from 'react-native-fs';

const MODEL_WIDTH = 640; // 모델의 너비
const MODEL_HEIGHT = 640; // 모델의 높이
const SCORE_THRESHOLD = 0.5; // 객체 감지 임계값, conf값
const IOU_THRESHOLD = 0.45; // 중복 상자 제거 IOU 임계값
const MAX_DETECTIONS = 30; // 최대 감지 개수

function App() {
  // 카메라 권한에 대한 상태 관리

  // 카메라 권한 상태를 저장 (초기값은 'not-determined')
  const [permission, setPermission] = useState('not-determined');

  // 사용할 카메라 디바이스 (예: 후면 카메라)
  const [device, setDevice] = useState(null);

  // 주기적으로 권한과 장치 상태를 확인할 타이머 참조
  const checkTimer = useRef(null);

  // TFLite 모델을 사용하기 위한 설정

  // 모델 로딩 상태
  const [modelLoaded, setModelLoaded] = useState(false);

  // 감지된 객체 정보 저장
  const [detections, setDetections] = useState([]);

  // 카메라 프레임 상태
  const [isProcessing, setIsProcessing] = useState(false);

  // 카메라 프레임 레퍼런스
  const cameraRef = useRef(null);

  // TFLite 모델 초기화
  const {Model, DetectionResult} = useTflite();
  const modelRef = useRef(null);

  // COCO 데이터셋 클래스 목록
  const classLabels = [
    'person',
    'bicycle',
    'car',
    'motorcycle',
    'airplane',
    'bus',
    'train',
    'truck',
    'boat',
    'traffic light',
    'fire hydrant',
    'stop sign',
    'parking meter',
    'bench',
    'bird',
    'cat',
    'dog',
    'horse',
    'sheep',
    'cow',
    'elephant',
    'bear',
    'zebra',
    'giraffe',
    'backpack',
    'umbrella',
    'handbag',
    'tie',
    'suitcase',
    'frisbee',
    'skis',
    'snowboard',
    'sports ball',
    'kite',
    'baseball bat',
    'baseball glove',
    'skateboard',
    'surfboard',
    'tennis racket',
    'bottle',
    'wine glass',
    'cup',
    'fork',
    'knife',
    'spoon',
    'bowl',
    'banana',
    'apple',
    'sandwich',
    'orange',
    'broccoli',
    'carrot',
    'hot dog',
    'pizza',
    'donut',
    'cake',
    'chair',
    'couch',
    'potted plant',
    'bed',
    'dining table',
    'toilet',
    'tv',
    'laptop',
    'mouse',
    'remote',
    'keyboard',
    'cell phone',
    'microwave',
    'oven',
    'toaster',
    'sink',
    'refrigerator',
    'book',
    'clock',
    'vase',
    'scissors',
    'teddy bear',
    'hair drier',
    'toothbrush',
  ];

  // 모델 로딩 및 초기화
  const loadModel = async () => {
    try {
      // 모델 파일 경로 설정
      const modelPath =
        Platform.OS === 'ios'
          ? `${RNFS.MainBundlePath}/yolov8n.tflite`
          : 'yolov8n.tflite';

      // 모델 로드
      modelRef.current = await Model.fromFile(modelPath, {
        //Yolov8n 모델 설정
        type: 'yolo',
        modelType: 'yolov8',
        numClasses: classLabels.length,
        classLabels: classLabels,
        scoreThreshold: SCORE_THRESHOLD,
        iouThreshold: IOU_THRESHOLD,
        maxDetections: MAX_DETECTIONS,
      });

      console.log('yolo 모델 로드 완료');
      setModelLoaded(true);
    } catch (error) {
      console.error('모델 로드 실패: ', error);
    }
  };

  // 카메라 프레임 처리
  const processFrame = async frame => {
    if (!modelRef.current || isProcessing) return; // 모델이 로드되지 않았거나 이미 처리 중인 경우 리턴

    try {
      setIsProcessing(true); // 처리 상태를 on으로 변경

      // 카메라 프레임을 모델에 전달하여 객체 감지 수행
      const results = await modelRef.current.detect(frame, {
        inputShape: [MODEL_HEIGHT, MODEL_WIDTH],
        inputFormat: 'vision-camera',
      });

      // 감지된 객체 결과를 DetectionResult 객체로 변환
      setDetections(results);
    } catch (error) {
      console.error('객체 감지 오류:', error); // 오류 발생 시 처리
    } finally {
      setIsProcessing(false); // 처리 상태를 off로 변경
    }
  };

  useEffect(() => {
    // 권한이 허용된 상태인지 확인하는 함수
    const isAuthorized = status =>
      status === 'authorized' || status === 'granted';

    const askAndCheck = async () => {
      // 현재 카메라 권한 상태 확인
      const status = await Camera.getCameraPermissionStatus();

      // 권한이 없으면 요청
      if (!isAuthorized(status)) {
        const newStatus = await Camera.requestCameraPermission();
        setPermission(newStatus);
        if (newStatus !== 'authorized') return;
      } else {
        setPermission('authorized');
      }

      // 사용 가능한 카메라 장치 중 후면 카메라를 선택
      const devs = await Camera.getAvailableCameraDevices();
      const backa = devs.find(c => c.position === 'back');
      setDevice(backa ?? null);
    };

    // 초기 한 번 실행
    askAndCheck();

    // 모델 로드
    loadModel();

    // 이후 1초마다 권한 및 장치 확인 반복
    checkTimer.current = setInterval(askAndCheck, 1000);

    // 컴포넌트 언마운트 시 타이머 제거
    return () => clearInterval(checkTimer.current);
  }, []);

  // 객체 탐지 결과를 화면에 그리는 컴포넌트
  const RenderDetections = () => {
    return detections.map((detection, index) => {
      const {box, score, class_id, class_name} = detection;

      // 바운딩 박스 계산
      const boxStyle = {
        position: 'absolute',
        borderWidth: 2,
        borderColor: 'red',
        left: `${box.left * 100}%`,
        top: `${box.top * 100}%`,
        width: `${box.width * 100}%`,
        height: `${box.height * 100}%`,
      };

      // 라벨 스타일
      const labelStyle = {
        backgroundColor: 'red',
        color: 'white',
        fontSize: 12,
        padding: 2,
        position: 'absolute',
        top: -20,
      };

      return (
        <View key={index} style={boxStyle}>
          <Text style={labelStyle}>
            {class_name} {(score * 100).toFixed(1)}%
          </Text>
        </View>
      );
    });
  };

  // 카메라 권한이 없는 경우 안내 메시지 표시
  if (permission !== 'authorized')
    return (
      <View style={styles.center}>
        <Text style={styles.text}>📋 카메라 권한을 허용해주세요</Text>
        <Text style={styles.textSmall}>설정 → 앱 → 카메라 허용</Text>
        <Text style={{color: 'black', textAlign: 'center', fontSize: 12}}>
          perm: {permission} | device: {device ? 'yes' : 'no'}
        </Text>
      </View>
    );

  // 장치를 아직 찾지 못한 경우 로딩 메시지 표시
  if (!device)
    return (
      <View style={styles.center}>
        <Text style={styles.text}>📷 후면 카메라 장치를 찾는 중…</Text>
      </View>
    );

  // 모델이 로딩되지 않았을 경우 로딩 메시지 표시
  if (!modelLoaded)
    return (
      <View style={styles.center}>
        <Text style={styles.text}>🧠 YOLO 모델 로딩중...</Text>
      </View>
    );

  // // 권한 있고 장치도 있으면 카메라 화면 표시
  // return (
  //   <View style={styles.center}>
  //     <View style={styles.cameraBox}>
  //       <Camera device={device} isActive style={styles.camera} />
  //       <Text
  //         style={{
  //           color: 'white',
  //           fontWeight: 'bold',
  //           position: 'absolute',
  //           top: 10,
  //           left: 10,
  //         }}>
  //         📷 카메라 실행 중
  //       </Text>
  //     </View>
  //   </View>
  // );

  // 권한 있고 장치도 있으면 카메라 화면 표시
  return (
    <View style={styles.center}>
      <View style={styles.cameraBox}>
        <Camera
          ref={cameraRef}
          device={device}
          isActive={true}
          style={styles.camera}
          frameProcessor={processFrame}
          frameProcessorFps={5} // 초당 처리할 프레임 수 (성능에 따라 조절)
        />
        <RenderDetections />
        <View style={styles.statsOverlay}>
          <Text style={styles.statsText}>감지된 객체: {detections.length}</Text>
        </View>
      </View>
    </View>
  );
}

// 기존 카메라 스타일
// const styles = StyleSheet.create({
//   // 화면 중앙 정렬을 위한 스타일
//   center: {
//     display: 'flex',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   // 카메라 컴포넌트의 스타일
//   camera: {
//     display: 'flex',
//     justifyContent: 'flex-start',
//     width: '100%',
//     height: '100%',
//   },
//   // 카메라 박스 스타일 (테두리, 모서리 라운드 등)
//   cameraBox: {
//     marginTop: 8,
//     width: '100%',
//     height: '100%',
//     borderRadius: 12,
//     overflow: 'hidden',
//     borderWidth: 2,
//     borderColor: '#888',
//   },
//   // 일반 텍스트 스타일
//   text: {
//     fontSize: 16,
//     color: 'black',
//     textAlign: 'center',
//     marginVertical: 8,
//   },
//   // 작은 텍스트 스타일
//   textSmall: {
//     fontSize: 12,
//     color: '#555',
//     textAlign: 'center',
//   },
// });

const styles = StyleSheet.create({
  // 화면 중앙 정렬을 위한 스타일
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 카메라 컴포넌트의 스타일
  camera: {
    width: '100%',
    height: '100%',
  },
  // 카메라 박스 스타일 (테두리, 모서리 라운드 등)
  cameraBox: {
    position: 'relative',
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#888',
  },
  // 일반 텍스트 스타일
  text: {
    fontSize: 16,
    color: 'black',
    textAlign: 'center',
    marginVertical: 8,
  },
  // 작은 텍스트 스타일
  textSmall: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
  },
  // 상태 오버레이
  statsOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 5,
    borderRadius: 5,
  },
  // 상태 텍스트
  statsText: {
    color: 'white',
    fontSize: 12,
  },
});

export default App;
