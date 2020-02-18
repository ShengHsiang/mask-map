<template>
  <div class="map-wrap">
    <div class="map-container" id="map-container"></div>
    <div class="map-toolbox">
      <div class="map-toolbox-select_wrap">
        <el-select
          class="map-toolbox-select"
          v-model="city"
          placeholder="请选择"
          @change="handleCityChange"
        >
          <el-option v-for="item in cityData" :key="item.name" :value="item.name"></el-option>
        </el-select>
        <el-select class="map-toolbox-select" v-model="districts" placeholder="请选择">
          <el-option v-for="item in findDistrictsByCity" :key="item" :value="item"></el-option>
        </el-select>
        <div class="map-toolbox-text">
          <span>有取得口罩數量的藥局有</span>
          <span class="count">{{ storeList && storeList.length || 0 }}</span>家
        </div>
      </div>
      <div class="map-toolbox-store_wrap">
        <div
          class="map-toolbox-store_item"
          v-for="(item, index) in storeList"
          :key="index"
          @click="handleStoreClick(item)"
        >
          <div class="title">{{ item.properties.name }}</div>
          <div class="address">{{ item.properties.address }}</div>
          <div class="phone">{{ item.properties.phone }}</div>
          <div class="count_wrap">
            <div
              class="item"
              :class="{'gray': item.properties.mask_adult === 0}"
            >成人：{{ item.properties.mask_adult }}</div>
            <div
              class="item"
              :class="{'gray': item.properties.mask_child === 0}"
            >兒童：{{ item.properties.mask_child }}</div>
          </div>
        </div>
      </div>
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
      city: cityData[0].name,
      districts: cityData[0].districts[0],
      storeList: null
    };
  },
  computed: {
    findDistrictsByCity() {
      return this.cityData.find(item => item.name === this.city).districts;
    }
  },
  watch: {
    districts(newValue, oldValue) {
      if (newValue !== oldValue) {
        this.filterData();
      }
    }
  },
  async mounted() {
    // 獲取裝置螢幕高度
    this.getScreenHeight();
    // 加載中效果
    const loading = this.$loading({
      lock: true,
      text: "Loading",
      spinner: "el-icon-loading",
      background: "rgba(0, 0, 0, 0.8)"
    });
    // 初使化 map
    this.map = this.$map.createMap("map-container", {
      maxZoom: 18
    });
    // 加載 open street map 的圖層服務
    this.$map.createTileLayer(this.map, this.OSMUrl, {});
    // 設定地圖的中心位置
    this.map.setView([25, 121.74739], 10);

    // 獲取口罩數據
    try {
      // 獲取資料
      await this.fetchData();
      // 在地圖上定位
      const cluster = await this.setMaskMakers(this.maskData);
      this.map.addLayer(cluster);
      // 篩選符合縣市區的藥局
      await this.filterData();
      loading.close();
    } catch {
      loading.close();
    }
  },
  methods: {
    // 選擇縣市，自動選擇第一個區域資料
    handleCityChange() {
      this.districts = this.cityData.find(
        item => item.name === this.city
      ).districts[0];
    },
    // 點擊藥局的事件 -> 跳轉到地圖所在的點
    handleStoreClick(item) {
      const temp = [item.geometry.coordinates[1], item.geometry.coordinates[0]];
      this.map.flyTo(temp, 18);
      let popup = this.$map.createPopup({
        maxWidth: 350,
        minWidth: 250,
        className: "map-popup"
      });
      popup.setLatLng(temp).setContent(this.setPopupContent(item));
      this.map.openPopup(popup);
    },
    // 調用接口獲取藥局資料
    fetchData() {
      const url =
        "https://raw.githubusercontent.com/kiang/pharmacies/master/json/points.json?fbclid=IwAR08mKKy05bPBaRJfMU33fhIsj-4y8G2ec9vteF2eLXBzF9z3SPuIZHeQks";
      return axios.get(url).then(res => {
        if (res.status === 200) {
          if (res.data.hasOwnProperty("features")) {
            this.maskData = res.data.features;
          }
        }
      });
    },
    // 篩選符合縣市區的藥局
    filterData() {
      const condition = this.city + this.districts;
      const storeData = this.maskData.filter(item => {
        if (item.properties.address.charAt(0) === "台") {
          const newAddress = item.properties.address.slice(1);
          item.properties.address = "臺".concat(newAddress);
        }
        return (
          item.properties.address.indexOf(condition) != -1 &&
          (item.properties.mask_adult > 0 || item.properties.mask_child > 0)
        );
      });
      this.storeList = storeData;
    },
    // 在地圖上定位
    setMaskMakers(data) {
      const cluster = this.$map.createMakerCluster();
      data.forEach(element => {
        const marker = this.$map.createMakerByXY(element.geometry.coordinates);
        // 1. 創建 popup
        let popup = this.$map.createPopup({
          maxWidth: 350,
          minWidth: 250,
          className: "map-popup"
        });
        // 2. 寫入內容
        popup.setContent(this.setPopupContent(element));
        // 3.为 marker 绑定 popup
        marker.bindPopup(popup);
        cluster.addLayer(marker);
      });
      return cluster;
    },
    // popup 圖層的樣式
    setPopupContent(element) {
      let adultStr = `<div class="item">成人口罩：${element.properties.mask_adult} 個</div>`;
      let childStr = `<div class="item">兒童口罩：${element.properties.mask_child} 個</div>`;
      if (element.properties.mask_adult === 0) {
        adultStr = `<div class="item gray">成人口罩：${element.properties.mask_adult} 個</div>`;
      } else if (element.properties.mask_child > 0) {
        childStr = `<div class="item gray">兒童口罩：${element.properties.mask_child} 個</div>`;
      }
      const search = element.properties.address + "+" + element.properties.name;
      return `<h1>${element.properties.name}</h1>
          <div class="row">電話：${element.properties.phone}</div>
          <div class="row">
            地址：
            <a target="_blank" href="https://www.google.com.tw/maps/place/${search}">${
        element.properties.address
      }</a>
          </div>
          <div class="count_wrap row">
            ${adultStr}${childStr}
          </div>
          <div class="row">更新時間：${element.properties.updated ||
            "未知"}</div>`;
    },
    // 設置 螢幕高度 vh 使其在手機版網頁也能正確響應
    getScreenHeight() {
      // First we get the viewport height and we multiple it by 1% to get a value for a vh unit
      let vh = window.innerHeight * 0.01;
      // Then we set the value in the --vh custom property to the root of the document
      document.documentElement.style.setProperty("--vh", `${vh}px`);

      // We listen to the resize event
      window.addEventListener("resize", () => {
        // We execute the same script as before
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty("--vh", `${vh}px`);
      });
    }
  }
};
</script>

<style lang="scss">
.map-wrap {
  @include pc-width {
    display: flex;
    justify-content: flex-end;
  }
  @include phone-width {
    height: 100vh; /* Fallback for browsers that do not support Custom Properties */
    height: calc(var(--vh, 1vh) * 100 - 46px);
  }
}
.map-container {
  @include pc-width {
    width: calc(100vw - 300px);
    height: 100vh;
  }
  @include phone-width {
    height: calc((var(--vh, 1vh) * 100) / 2);
  }
}
.map-toolbox {
  background-color: #f6f6f6;
  @include pc-width {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 300px;
    box-shadow: 0 2px 4px #10203033, 0 0 6px #10203033;
  }
  @include phone-width {
    height: calc((var(--vh, 1vh) * 100) / 2);
  }

  .map-toolbox-select_wrap {
    @include pc-width {
      padding: 20px;
      height: 150px;
    }
    @include phone-width {
      padding: 10px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      height: 80px;
    }
  }

  .map-toolbox-select {
    @include pc-width {
      width: 100%;
      margin-bottom: 10px;
    }
    @include phone-width {
      width: 49%;
      margin-bottom: 5px;
    }
  }

  .map-toolbox-store_wrap {
    overflow-x: hidden;
    overflow-y: scroll;
    @include pc-width {
      height: calc(100vh - 150px);
    }
    @include phone-width {
      height: calc(100% - 80px);
    }
  }

  .map-toolbox-store_item {
    min-height: 150px;
    background-color: #fff;
    padding: 20px;
    border-bottom: 1px solid #e2e2e2;
    cursor: pointer;
    &:first-child {
      border-top: 1px solid #e2e2e2;
    }
    &:hover {
      background-color: #f6f6f6;
    }
    .title {
      margin-bottom: 10px;
    }
    .address,
    .phone {
      color: #888888;
      font-size: 14px;
      margin-bottom: 5px;
    }
  }
  .map-toolbox-text {
    .count {
      color: $--color-primary;
      font-size: 22px;
      font-weight: bold;
      margin: 0 5px;
    }
  }
}
.map-popup {
  h1 {
    margin-bottom: 10px;
  }
  .row {
    margin-bottom: 5px;
  }
}
.count_wrap {
  display: flex;
  border-radius: 6px;
  overflow: hidden;
  .item {
    width: 50%;
    height: 35px;
    background-color: #668afe;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #fff;
    &:last-child {
      border-left: 1px solid #fff;
    }
  }
  .gray {
    background-color: #e2e2e2;
    color: #9c9c9c;
  }
}
</style>
