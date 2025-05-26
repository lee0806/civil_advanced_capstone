import './App.css'
import MapPage from './components/mapPage/mapPage'

function App() {

  // const mapRef = useRef<HTMLDivElement | null>(null);

  // useEffect(() => {
  //   if (window.kakao && window.kakao.maps) {
  //     window.kakao.maps.load(() => {
  //       if (mapRef.current) {
  //         const options = {
  //           center: new window.kakao.maps.LatLng(37.5665, 126.9780),
  //           level: 3,
  //         };
  //         const map = new window.kakao.maps.Map(mapRef.current, options);
  //         mapRef.current = map;
  //       }
  //     });
  //   }
  // }, []);

  // console.log('mapRef', mapRef);
  // console.log('window.kakao', window.kakao);
  


  return (
    <>
      <div className="mapPage">
        <MapPage></MapPage>
      </div>
    </>
  )
}

export default App
