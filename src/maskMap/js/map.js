import "leaflet/dist/leaflet.css"
import $L from "leaflet";
// 解決 leaflet 默認 maker 無法顯示問題
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
let DefaultIcon = $L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow
});
$L.Marker.prototype.options.icon = DefaultIcon;

// 引入 leaflet.markercluster
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"
import "leaflet.markercluster";

const createMap = (divId, options) => {
  let map = $L.map(divId, options);
  return map;
};

const createTileLayer = async (map, url, options) => {
  let tileLayer = await $L.tileLayer(url, options);
  tileLayer.addTo(map);
  return tileLayer;
};

const createIcon = options => {
  return $L.icon(options);
};

/**
 * 通過 [x, y] 座標添加 Maker
 *
 * @param {Object} map
 * @param {Object} latLng
 * @param {Object} options
 * 
 */
const createMakerByXY = (coordinate, options = {}) => {
  return $L.marker($L.latLng(coordinate[1], coordinate[0]), options);
};

const createMakerCluster = () => {
  return $L.markerClusterGroup();
};

const createPopup = (options) => {
  let popup = $L.popup(options);
  return popup;
};

export default {
  createMap,
  createTileLayer,
  createMakerByXY,
  createMakerCluster,
  createPopup
};