import { useEffect, useRef } from "react";
import axios from "axios";
import Papa from "papaparse";
import { useQuery } from "@tanstack/react-query";


const MIDDLE_SCORE = 5.5;
const HIGH_SCORE = 10.5;


const MapBox = () => {

  // 1. useRef 생성 - 지도 객체를 저장하기 위한 참조
  const mapRef = useRef<any>(null);
  
  // 2. CSV 파일을 비동기로 가져오는 함수 정의
  const fetchCSV = async () => {
    const response = await axios.get("/data/road.csv");
    return response.data;
  }

  // 3. react-query를 사용해 CSV 데이터를 가져오고 상태 관리
  const { data: csvText, isSuccess } = useQuery({
    queryKey: ["road-data"],
    queryFn: fetchCSV,
  });

  // 4. 도로 상태 번호와 이름을 매핑하는 객체 정의
  const labelData = {  

    // 도로 상태 번호 : 도로 상태 이름

    0 : "반사균열",
    1 : "세로방향균열",
    2 : "밀림균열",
    3 : "러팅",
    4 : "코루게이션및쇼빙",
    5 : "함몰",
    6 : "포트홀",
    7 : "라벨링",
    8 : "박리",
    9 : "정상",
    10 : "단부균열",
    11 : "시공균열",
    12 : "거북등",
  };

  // 5. 도로 상태별 점수를 정의한 배열(도로상태와 점수 매핑)
  const roadRankData = [
  { 도로상태: 0, 점수: 8 },
  { 도로상태: 1, 점수: 9 },
  { 도로상태: 2, 점수: 1 },
  { 도로상태: 3, 점수: 12 },
  { 도로상태: 4, 점수: 10 },
  { 도로상태: 5, 점수: 2 },
  { 도로상태: 6, 점수: 11 },
  { 도로상태: 7, 점수: 3 },
  { 도로상태: 8, 점수: 7 },
  { 도로상태: 9, 점수: 0 },
  { 도로상태: 10, 점수: 4 },
  { 도로상태: 11, 점수: 5 },
  { 도로상태: 12, 점수: 6 },
];


  // 6. useEffect 훅 - CSV 데이터가 성공적으로 로드되면 지도 및 마커를 생성
  useEffect(() => {

    // 6-1. CSV 로드가 완료되지 않으면 함수 종료
    if (!isSuccess) return;

    // 6-2. PapaParse를 사용해 CSV 텍스트를 파싱
    Papa.parse(csvText, {
      header: true, // 첫 줄을 헤더로 인식
      skipEmptyLines: true, // 빈 줄 건너뜀
      complete: async (result: any) => {
        const parsedData = result.data;
        console.log(parsedData);

        

        // 6-3. kakao.maps 객체가 존재하는지 확인 후 지도 생성
        if (window.kakao && window.kakao.maps) {
          const container = document.getElementById("map"); // 지도 컨테이너 요소 선택
          const options = {
            center: new window.kakao.maps.LatLng(37.30109320187593, 127.03517954846585), // 지도 중심 좌표 설정
            level: 13, // 지도의 확대 레벨 설정
          };
          const map = new window.kakao.maps.Map(container, options); // 지도 생성 및 객체 리턴
          mapRef.current = map; // ref에 지도 객체 저장

          // 6-4. 파싱된 CSV 데이터 각 항목에 대해 반복 처리
          for (const item of parsedData) {
            const lat = parseFloat(item.위도); // 위도 숫자 변환
            const lng = parseFloat(item.경도); // 경도 숫자 변환
            const name = item["name"]; // 이름 추출

            // 6-5. 이름에서 공백 제거 후 이미지 파일명과 매칭 시도
            const baseName = name.replace(/\s/g, "");
            const matchedImage = (() => {
              // import.meta.glob를 사용해 predict 폴더 내 jpg 파일을 eager 로드
              const files = import.meta.glob('/public/data/predict/*.jpg', { eager: true});
              for (const path in files) {
                const fileName = path.split('/').pop();
                if (fileName?.startsWith(baseName + "_")) {
                  return path.replace('/public', '');
                }
              }
              return null;
            })();

            // 6-6. 이미지 경로에서 라벨 텍스트 파일 경로로 변환
            const matchedLabelPath = matchedImage?.replace('.jpg', '.txt')?.replace('/predict/', '/predict/labels/');
            let labelSummary = '';
            let labelRank = '';
            if (matchedLabelPath) {
              try {
                // 6-7. 라벨 텍스트 파일을 fetch로 불러와 내용을 파싱
                const labelText = await fetch(matchedLabelPath).then(res => res.text());
                const labelLines = labelText.trim().split('\n');
                // 6-8. 라벨별 출현 횟수 집계
                const labelCounts = labelLines.reduce((acc, line) => {
                  const label = line.split(' ')[0];
                  acc[label] = (acc[label] || 0) + 1;
                  return acc;
                }, {});
                // 6-9. 라벨별 요약 문자열 생성 (ex: "반사균열: 3곳, 박리: 2곳")
                labelSummary = Object.entries(labelCounts).map(([k, v]) => `${labelData[k] || "unknown"}`).join(', ');

                // 6-10. 라벨 점수 계산 및 평균 점수 표시
                let totalScore = 0;
                let totalCount = 0;

                for (const [k, v] of Object.entries(labelCounts)) {
                  const roadState = roadRankData.find(d => d.도로상태 === parseInt(k));
                  if (roadState) {
                    totalScore += roadState.점수 * v;
                    totalCount += v;
                  }
                }

                const averageScore = totalCount > 0 ? totalScore / totalCount : 0;
                labelRank = `평균 점수: ${averageScore.toFixed(2)}`;
              } catch (error) {
                // 6-11. 라벨 파일 로드 실패 시 에러 로그 출력
                console.error('Failed to load label file:', error);
              }
            }

            // 6-12. 위도, 경도 값이 유효하면 마커 생성 및 지도에 표시
            if (!isNaN(lat) && !isNaN(lng)) {
              const markerPosition = new window.kakao.maps.LatLng(lat, lng);
              const markerImage = new window.kakao.maps.MarkerImage(
                "src/assets/marker.png",
                new window.kakao.maps.Size(30, 30)
              );

              // 6-13. 마커 객체 생성
              const marker = new window.kakao.maps.Marker({
                position: markerPosition,
                map,
                image: markerImage,
                title: item["name"],
              });

              const averageScoreValue = parseFloat(labelRank.replace(/[^0-9.]/g, '')); // 숫자만 추출

              // 6-14. 인포윈도우 생성 - 마커에 표시될 상세 정보 구성
              const infowindow = new window.kakao.maps.InfoWindow({
                  content: `
                  <div style="padding: 10px;width: 300px;text-align: center; color: #333;">
                    <div style="padding-bottom: 10px;padding-left: 20px;text-align: left;">
                    <div style="display: flex; justify-content: space-between; font-weight: bold;">
                      ${name}
                      ${averageScoreValue < MIDDLE_SCORE ? `<div style="padding-right: 30px; font-weight: bold; color: green;">정상</div>` : ""}
                      ${averageScoreValue >= MIDDLE_SCORE && averageScoreValue <= HIGH_SCORE  ? `<div style="padding-right: 30px; font-weight: bold; color: orange;">경고</div>` : ""}
                      ${averageScoreValue > HIGH_SCORE  ? `<div style="padding-right: 30px; font-weight: bold; color: red;">위험</div>` : ""}
                    </div>
                    
                    </div>
                    ${labelRank ? `<div style="padding-top: 10px; float: left; padding-left: 20px; ">${labelRank}</div>` : ""}
                    ${matchedImage ? `<img src="${matchedImage}" style="width: 300px; height: 300px;"/>` : ""}
                    
                  </div>`,
              });

              // 6-15. 마커에 마우스 오버 시 인포윈도우 열기 이벤트 등록
              window.kakao.maps.event.addListener(
                marker,
                "mouseover",
                makeOverListener(map, marker, infowindow)
              );

              // 6-16. 마커에서 마우스 아웃 시 인포윈도우 닫기 이벤트 등록
              window.kakao.maps.event.addListener(
                marker,
                "mouseout",
                makeOutListener(infowindow)
              );
            }
          }
        }
      }
    });
  }, [csvText, isSuccess]);

  // 7. 인포윈도우를 표시하는 listener 함수 정의
  function makeOverListener(map, marker, infowindow) {
    return function () {
      infowindow.open(map, marker);
    };
  }

  // 8. 인포윈도우를 닫는 listener 함수 정의
  function makeOutListener(infowindow) {
    return function () {
      infowindow.close();
    };
  }

  // 9. 지도 컨테이너 div 반환 (전체 화면 크기)
  return <div id="map" style={{ width: "100vw", height: "100vh" }} />;
};

export default MapBox;