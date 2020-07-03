<template>
  <div class="map-wrap">
    <div class="map-container" id="map-container"></div>
    <div class="map-toolbox">
      <div class="map-toolbox-select_wrap">
        <el-select
          class="map-toolbox-select"
          v-model="city"
          placeholder="請選擇"
          @change="handleCityChange"
        >
          <el-option v-for="item in cityData" :key="item.name" :value="item.name"></el-option>
        </el-select>
        <el-select class="map-toolbox-select" v-model="districts" placeholder="請選擇">
          <el-option v-for="item in findDistrictsByCity" :key="item" :value="item"></el-option>
        </el-select>
        <div class="map-toolbox-text">
          <span>還有振興三倍卷的郵局有</span>
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
          <div class="title">{{ item.storeNm }}</div>
          <div class="address">{{ item.addr}}</div>
          <div class="phone">{{ item.tel }}</div>
          <div class="count_wrap">
            <div
              class="item"
              :class="{'gray': item.total === 0}"
            >
            數量：{{ item.total }}
            </div>
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
    document.title = '振興三倍卷地圖'
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
    // 點擊郵局的事件 -> 跳轉到地圖所在的點
    handleStoreClick(item) {
      const temp = [item.latitude, item.longitude];
      this.map.flyTo(temp, 18);
      let popup = this.$map.createPopup({
        maxWidth: 350,
        minWidth: 250,
        className: "map-popup"
      });
      popup.setLatLng(temp).setContent(this.setPopupContent(item));
      this.map.openPopup(popup);
    },
    // 調用接口獲取郵局資料
    fetchData() {
      const url =
        "https://3000.gov.tw/hpgapi-openmap/api/getPostData";
      return axios.get(url).then(res => {
        if (res.status === 200 && res.data.length > 0) {
          this.maskData = res.data;
          console.log(res.data[0])
        }
      });
    },
    // 篩選符合縣市區的藥局
    filterData() {
      const storeData = this.maskData.filter(item => {
        return (
          item.hsnNm === this.city
          && item.townNm === this.districts 
          // && item.total > 0
        );
      });
      this.storeList = storeData;
    },
    // 在地圖上定位
    setMaskMakers(data) {
      const cluster = this.$map.createMakerCluster();
      data.forEach(element => {
        const geometry = [element.longitude, element.latitude]
        const marker = this.$map.createMakerByXY(geometry);
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
      let count = `<div class="item">振興卷數量：${element.total} 個</div>`;
      if (element.total === 0) {
        count = `<div class="item gray">振興卷數量：${element.total} 個</div>`;
      }
      const search = element.addr;
      return `<h1>${element.storeNm}</h1>
          <div class="row">電話：${element.tel}</div>
          <div class="row">
            地址：
            <a target="_blank" href="https://www.google.com.tw/maps/place/${search}">${element.addr}</a>
          </div>
          <div class="row">
            營業時間：${element.busiTime}
          </div>
          <div class="count_wrap row">
            ${count}
          </div>
          <div class="row">更新時間：${ element.updateDate || "未知" }</div>`;
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
    width: 100%;
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
