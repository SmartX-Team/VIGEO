/**
 * Created by K on 2017-01-31.
 */
/**
 * Created by K on 2017-01-31.
 */


<!-- Leaflet Map jquery import -->


Vigeo = {};

Vigeo.MapCreator = {

    vigeoMap : {},
    drawnItems : {},
    imgItems : {},
    markerItems : {},

    //map을 그려주는 전반적인 workflow를 관리한다.
    createMap : function () {
        var MY_COMPANY_LOACTION = [37.531056, 126.921686];
           this.vigeoMap = this._initLeafletMap(MY_COMPANY_LOACTION); //맵의 정보를 초기화
        this._addMap(this.vigeoMap); //맵을 그려준다.
        //google.maps.event.addDomListener(window, 'load', init);
    },

    //화면에 map을 그려주는 동작을 수행한다.
    _addMap : function(map){
        L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            subdomains: ['a', 'b', 'c']
        }).addTo(map);

        //그려지는 도형들을 위한 drawnItems layer를 생성한다.
        this._initFeatureGroups(this.vigeoMap);

        //draw기능의 속성을 정의한다.
        var drawControl = this._setDrawControl();

        //맵에 커스텀 버튼을 추가한다.
        this._addButtonsToMap(this.vigeoMap);

        //console.log(test_img.getCorners());
        //맵에 Toolbar를 추가한다.
        map.addControl(drawControl);

        var _this = this;
        console.log(this.drawnItems);
        map.on('draw:created', function (e) {
            _this._onDrawObjectCreated(e);
        });
    },

    _onDrawObjectCreated : function (e){
        var type = e.layerType,
            layer = e.layer;
        layer.type = type;

        this.drawnItems.addLayer(layer);
        //drawItems.BringToBack();
        this.imgItems.bringToFront(); //
        //  console.log(drawnItems);
    },


    //feature group을 초기화 한다.
    _initFeatureGroups : function (map) {
        this.drawnItems = new L.FeatureGroup(); //도형이 그려지는 layer
        this.imgItems = new L.FeatureGroup(); // 이미지가 삽입되는 layer
        this.markerItems = new L.FeatureGroup();
        map.addLayer(this.imgItems); //layer를 map에 추가한다.
        map.addLayer(this.drawnItems); //drawnItems Layer를 맵에 추가한다
        map.addLayer(this.markerItems); //맵에 marker layer를 추가한다.
    },

    //draw 툴바의 속성을 설정한다.
    _setDrawControl : function () {
        var drawControl = new L.Control.Draw({
            draw: {
                polygon: true,
                marker: true,
                circle: false
            },
            edit: {
                featureGroup: this.drawnItems
            }
        });
        return drawControl;
    },

//맵의 초기화 과정을 수행한다.
    _initLeafletMap : function(focused_location){
        var MAXIMUM_ZOOM = 2;
        var INITIAL_ZOOM = 8;

        //맵의 설정 정보를 입력한다.
        var map = L.map('map', { //id가 map인 div에 맵을 출력한다..
            center: focused_location, //맵의 초기 위치를 지정
            minZoom: MAXIMUM_ZOOM,
            zoom: INITIAL_ZOOM
        });
        return map;
    },

    //custom button을 map에 삽입한다.
    _addButtonsToMap : function(map){
        this._addAtachImgBtn(map);
        this._addStoreMapDataBtn(map);
        this._addGetMapDataBtn(map);
    },

    //이미지 삽입 커스텀 버튼
    _addAtachImgBtn : function (map) {
        L.easyButton('<i class="material-icons" style="font-size:1.3em;padding: 5px 0px 6px 0px;">insert_photo</i>',
            function() {
                $('#file_picker').click();
            }, 'Attach an image').addTo(map);
    },
    //맵 데이터 저장 커스텀 버튼
    _addStoreMapDataBtn : function (map) {
        L.easyButton('<i class="material-icons" style="font-size:1.3em;padding: 5px 0px 6px 0px;">save</i>',
            function () {
                vigeoTools.storeMapData();
            }, 'Save').addTo(map);
    },

    //맵 데이터 불러오기 커스텀 버튼
    _addGetMapDataBtn : function (map) {
        L.easyButton('<i class="download icon" style="font-size:1.1em;padding: 0px 0px 0px 0px;"></i>',
            function() {
                vigeoTools.getMapData();
            }, 'Get map data from server').addTo(map);
    }
}