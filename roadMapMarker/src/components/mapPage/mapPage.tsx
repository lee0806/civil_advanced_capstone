import { useEffect, useRef } from "react";
import axios from "axios";
import Papa from "papaparse";
import { useQuery } from "@tanstack/react-query";






const MapBox = () => {

  const mapRef = useRef<any>(null);
  
  const fetchCSV = async () => {
    const response = await axios.get("/data/road.csv");
    return response.data;
  }

  const { data: csvText, isSuccess } = useQuery({
    queryKey: ["road-data"],
    queryFn: fetchCSV,
  });


  useEffect(() => {

    if (!isSuccess) return;

    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (result: any) => {
        const parsedData = result.data;
        console.log(parsedData);

        

        if (window.kakao && window.kakao.maps) {
          const container = document.getElementById("map");
          const options = {
            center: new window.kakao.maps.LatLng(37.30109320187593, 127.03517954846585), // 지도 중심 좌표
            level: 13, // 지도의 레벨(확대, 축소 정도)
          };
          const map = new window.kakao.maps.Map(container, options); // 지도 생성 및 객체 리턴
          mapRef.current = map;

          parsedData.forEach((item: any) => {
            const lat = parseFloat(item.위도);
            const lng = parseFloat(item.경도);
            const name = item["name"];

            const baseName = name.replace(/\s/g, "");
            const matchedImage = (() => {
              const files = import.meta.glob('/public/data/predict/*.jpg', { eager: true});
              for (const path in files) {
                const fileName = path.split('/').pop();
                if (fileName?.startsWith(baseName + "_")) {
                  return path.replace('/public', '');
                }
              }
              return null;
            })();



            if (!isNaN(lat) && !isNaN(lng)) {
              const markerPosition = new window.kakao.maps.LatLng(lat, lng);
              const markerImage = new window.kakao.maps.MarkerImage(
                "src/assets/marker.png",
                new window.kakao.maps.Size(30, 30)
              );

              const marker = new window.kakao.maps.Marker({
                position: markerPosition,
                map,
                image: markerImage,
                title: item["name"],
              });

              const infowindow = new window.kakao.maps.InfoWindow({
                  content: `
                  <div style="padding: 10px;width: 300px;text-align: center; color: #333;">
                    <div style="padding-bottom: 10px;padding-left: 30px;text-align: left;">${name}</div>
                    ${matchedImage ? `<img src="${matchedImage}" style="width: 250px; height: 250px;"/>` : ""}
                  </div>`,
              });

              window.kakao.maps.event.addListener(
                marker,
                "mouseover",
                makeOverListener(map, marker, infowindow)
              );

              window.kakao.maps.event.addListener(
                marker,
                "mouseout",
                makeOutListener(infowindow)
              );
            }
          });
        }
      }
    });
  }, [csvText, isSuccess]);

  // 인포윈도우를 표시하는 listener 함수
  function makeOverListener(map, marker, infowindow) {
    return function () {
      infowindow.open(map, marker);
    };
  }

  // 인포윈도우를 닫는 listener 함수
  function makeOutListener(infowindow) {
    return function () {
      infowindow.close();
    };
  }

  return <div id="map" style={{ width: "100vw", height: "100vh" }} />;
};

export default MapBox;