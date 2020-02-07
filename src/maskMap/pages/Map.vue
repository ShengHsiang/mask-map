<template>
  <div class="map-wrap">
    <div class="map-container" id="map-container"></div>
    <div class="map-toolbox">
      <div></div>
      <el-select class="map-toolbox_select" v-model="city" placeholder="请选择" @change="handleCityChange">
        <el-option
          v-for="item in cityData"
          :key="item.name"
          :value="item.name"
        ></el-option>
      </el-select>
      <el-select class="map-toolbox_select" v-model="districts" placeholder="请选择">
        <el-option
          v-for="item in this.findDistrictsByCity()"
          :key="item"
          :value="item"
        ></el-option>
      </el-select>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import { cityData } from "../js/data";

export default {
  name: "maskMap",
  data() {
    return {
      map: null,
      OSMUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      maskData: null,
      cityData: cityData,
      city: "臺北市",
      districts: null
    };
  },
  async mounted() {
    // 初使化 map
    this.map = this.$map.createMap("map-container", {
      maxZoom: 18
    });
    // 加載 open street map 的圖層服務
    this.$map.createTileLayer(this.map, this.OSMUrl, {});
    // 設定地圖的中心位置
    this.map.setView([25, 121.74739], 10);
    // 獲取口罩數據
    await this.fetchData();
    const cluster = await this.setMaskMakers(this.maskData);
    this.map.addLayer(cluster);
  },
  methods: {
    handleCityChange(e) {
      this.districts = null
    },
    changeName(val) {
      this.$store.commit("user/setName", val);
    },
    findDistrictsByCity() {
      const temp = this.cityData.filter(item => item.name === this.city)
      return temp[0].districts
    },
    fetchData() {
      const url =
        "https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json?fbclid=IwAR08mKKy05bPBaRJfMU33fhIsj-4y8G2ec9vteF2eLXBzF9z3SPuIZHeQks";
      return axios.get(url).then(res => {
        if (res.status === 200) {
          if (res.data.hasOwnProperty("features")) {
            this.maskData = res.data.features;
            console.log(this.maskData[0]);
          }
        }
      });
    },
    setMaskMakers(data) {
      const cluster = this.$map.createMakerCluster();
      data.forEach(element => {
        // if (
        //   element.properties.mask_adult > 0 ||
        //   element.properties.mask_child > 0
        // ) {
        // }
        // 1. 創建 popup
        let popup = this.$map.createPopup({
          maxWidth: 300,
          minWidth: 200,
          className: "map-popup"
        });
        popup.setContent(
          `<h1>${element.properties.name}</h1>
          <p>電話：${element.properties.phone}</p>
          <div>
            地址：
            <a target="_blank" href="https://www.google.com.tw/maps/place/${
              element.properties.address
            }">${element.properties.address}</a>
          </div>
          <div class="hr"></div>
          <div>
            <div>成人口罩：${element.properties.mask_adult}個</div>
            <div>兒童口罩：${element.properties.mask_child}個</div>
          </div>
          <p>更新時間：${element.properties.updated || "未知"}</p>`
        );
        const marker = this.$map.createMakerByXY(element.geometry.coordinates);
        // 3.为 marker 绑定 popup
        marker.bindPopup(popup);
        cluster.addLayer(marker);
      });
      return cluster;
    }
  }
};
</script>

<style lang="scss">
.map-wrap {
  display: flex;
  justify-content: flex-end;
}
.map-container {
  width: calc(100vw - 300px);
  height: 100vh;
}
.map-toolbox {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 300px;
  background-color: #f6f6f6;
  box-shadow: 0 2px 4px #10203033, 0 0 6px #10203033;
  /* z-index: 10000; */
  padding: 20px;

  .map-toolbox_select {
    width: 100%;
    margin-bottom: 10px;
  }
}
.map-popup {
  h1 {
    margin-bottom: 10px;
  }
  .hr {
    width: 100%;
    border-top: 2px solid #ccc;
    margin: 10px 0;
  }

  p {
    margin-bottom: 5px;
  }
}
</style>
