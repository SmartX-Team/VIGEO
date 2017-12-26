/**
 * Created by K on 2017-01-31.
 */


Vigeo.Tools = {

    editingMapInfo : {},

    addImage : function (imgURL) {
        var image = new Image();
        //Set the src attribute to your URL
        image.src = imgURL;
        console.log(image.src);
        //When the image is loaded, read the available properties /예외 처리 필요
        image.onload = function() {
            //Get height and width in pixel
            var imgHeight = parseInt(image.height, 10);
            var imgWidth = parseInt(image.width, 10);
            var centerPixels = map.latLngToContainerPoint(map.getCenter());

            //convert px to [lat, long]
            var topLeft = map.containerPointToLatLng([centerPixels.x - (imgWidth / 2), centerPixels.y + (imgHeight / 2)]);
            var topRight = map.containerPointToLatLng([centerPixels.x + (imgWidth / 2), centerPixels.y + (imgHeight / 2)]);
            var bottomLeft = map.containerPointToLatLng([centerPixels.x - (imgWidth / 2), centerPixels.y - (imgHeight / 2)]);
            var bottomRight = map.containerPointToLatLng([centerPixels.x + (imgWidth / 2), centerPixels.y - (imgHeight / 2)]);
            image = new L.DistortableImageOverlay(
                imgURL, {
                    corners: [
                        new L.latLng(bottomLeft), //top left
                        new L.latLng(bottomRight), //top right
                        new L.latLng(topLeft), //bottom left
                        new L.latLng(topRight) //bottom right
                    ]
                }
            ).addTo(featureGroups.imgItems);
            console.log('up');
            L.DomEvent.on(image._image, 'load', image.editing.enable, image.editing);
            //console.log(image.getCorners());
        };
    },

    _setEditingMapInfo : function (mapID, mapName){
        this.editingMapInfo.mapID = mapID;
        this.editingMapInfo.mapName = mapName;
        var mapNameHtml = "<div class=\"ui green large label\" style=\"width: 85%;\"><CENTER>"+ mapName +"</CENTER></div>";
        document.getElementById('text_editingMapName').innerHTML = mapNameHtml;
    },

    getEditingMapID : function (){
        return this.editingMapInfo.mapID;
    },

    getEditingMapName : function (){
        return this.editingMapInfo.mapName;
    },

    getMapData : function (mapID, mode) {
        var _this = this;
        var reqMapInfo = {
            id : mapID
        };
        $.ajax({
            type: 'POST',
            url: '/usermapdata',
            data: JSON.stringify(reqMapInfo),
            success: function(mapData) {
                console.log(JSON.stringify(mapData));

                _this._drawMapData(mapData, mode);
            },
            contentType: "application/json",
            dataType: "json"
        });
    },
    deleteMapData : function (mapID){
        var _this = this;
        var delMapInfo = {
            id : mapID
        };
        $.ajax({
            type: 'POST',
            url: '/deleteMapData',
            data: JSON.stringify(delMapInfo),
            success: function (result) {
                if (result.message == 'deleteSuccess') {
                    vigeoMapCreator.getUserMapList('EDIT');
                }
            },
            contentType: "application/json",
            dataType: "json"
        })

    },

    storeMapData : function () {
        var mapJsonData = this._mapDataToJSON();
        var editingMapID = this.getEditingMapID();
        var postData = {
            mapID : editingMapID,
            mapData : mapJsonData
        }
        $.ajax({
            type: 'POST',
            url: '/saveUserMap',
            data: JSON.stringify(postData),
            success: function(data) {
                console.log(data);
            },
            contentType: "application/json",
            dataType: "json"
        });
    },
    addUserMap: function (inputMapName) {
        var mapInfo = {
            mapName: inputMapName
        };
        console.log(inputMapName);
        $.ajax({
            type: 'POST',
            url: '/addUserMap',
            data: JSON.stringify(mapInfo),
            success: function (data) {
                //update 하는 부분 필요
                vigeoMapCreator.getUserMapList('EDIT');
                vigeoMapCreator.showMapListModal('EDIT');
                console.log(data);
            },
            contentType: "application/json",
            dataType: "json"
        });
    },

    //맵 데이터를 JSON형식으로 변환시켜 준다.
    // JSON 데이터는 다음과 같은 정보를 가진다
    //도형 : 타입, 좌표배열
    //이미지 : 타입, 좌표배열(각4개 모서리), 이미지 url

    _mapDataToJSON : function () {
        var item;
        var itemType;
        var mapJsonData = [];
        var itemLatlngs;

        var mapStatus = new Object();
        mapStatus.type = "mapStatus";
        mapStatus.center = map.getCenter();
        mapStatus.zoomLevel = map.getZoom();
        mapJsonData.push(mapStatus);

        //도형이 그려져있는 레이어를 검색하여 정보를 추출한다.
        for (var i in featureGroups.drawnItems._layers) {
            itemType = featureGroups.drawnItems._layers[i].type;

            console.log(featureGroups.drawnItems._layers[i].type);
            if (itemType == "marker") {
                itemLatlngs = featureGroups.drawnItems._layers[i]._latlng;
            }
            else {
                itemLatlngs = featureGroups.drawnItems._layers[i]._latlngs;
            }

            if (itemType == "rectangle" ||  itemType == "polyline" || itemType == "marker") {
                item = new Object();
                item.type = itemType;
                item.latlngs = itemLatlngs;
                mapJsonData.push(item);
            }
            else if(itemType == "polygon"){
                item = new Object();
                item.type = itemType;
                item.latlngs = itemLatlngs;
                mapJsonData.push(item);
            }
        }

        //이미지가 삽입되어있는 레이어에서 이미지 오브젝트의 정보를 추출한다.
        for (var i in featureGroups.imgItems._layers) {
            item = new Object();
            item.type = "image";
            item.url = featureGroups.imgItems._layers[i]._url;
            item.latlngs = featureGroups.imgItems._layers[i]._corners;
            mapJsonData.push(item);
        }
        console.log(mapJsonData);
        return mapJsonData;
    },

    //JSON 데이터를 읽어 MAP에 도형,이미지를 그린다.
    _drawMapData : function (jsonMapData, mode) {
        console.log(jsonMapData);
        var mapData = JSON.parse(jsonMapData.mapData);

        var mapID = JSON.parse(jsonMapData.mapID);
        var mapName = jsonMapData.mapName;
        this._setEditingMapInfo(mapID, mapName);

        this.clearFeatureGroups();
        var type;
        var coords;
        var imgURL;
        var image;
        var item;
        for (var i in mapData) {
            type = mapData[i].type;

            if (type == "mapStatus"){ //맵 상태 정보의 처리
                var center = mapData[i].center;
                var zoomLevel = mapData[i].zoomLevel;
                map.setView(center, zoomLevel);
            }
            else if (type == "image") { //이미지 처리
                coords = mapData[i].latlngs;
                console.log(mapData[i]);
                imgURL = mapData[i].url;
                image = new L.DistortableImageOverlay(
                    imgURL, {
                        corners: [
                            mapData[i].latlngs[0], //top left
                            mapData[i].latlngs[1], //top right
                            mapData[i].latlngs[2], //bottom left
                            mapData[i].latlngs[3] //bottom right
                        ]
                    }
                ).addTo(featureGroups.imgItems);
                if (mode == 'EDITMODE') {
                    L.DomEvent.on(image._image, 'load', image.editing.enable, image.editing);
                }
            }
            else{//도형 처리
                coords = mapData[i].latlngs;
                if (type == "rectangle") { //사각형
                    item = L.rectangle([coords[0], coords[2]], {
                        color: "#3485ff",
                        weight: 3
                    });
                }
                if (type == "polygon") { //다각형
                    item = L.polygon(coords, {
                        color: "#3485ff",
                        weight: 5
                    });
                }
                if (type == "polyline") { //선
                    item = L.polyline(coords, {
                        color: "#3485ff",
                        weight: 5
                    });
                }
                if (type == "marker") { //마커
                    item = L.marker(coords, {
                        color: "#3485ff",
                        weight: 5
                    });
                }
                item.type = type;
                featureGroups.drawnItems.addLayer(item);
                featureGroups.imgItems.bringToFront();
            }
        }
        console.log(featureGroups.drawnItems);
    },

    clearFeatureGroups : function (){
        featureGroups.drawnItems.clearLayers();
        featureGroups.imgItems.clearLayers();
        featureGroups.markerItems.clearLayers();
    },

    //altlang 객체를 경도 위도를 가진 좌표 배열로 변환한다.
    latLngToCoords : function (latlng) {
        var coords = [latlng.lng, latlng.lat];

        if (latlng.alt !== undefined) {
            coords.push(latlng.alt);
        }
        return coords;
    },

    //latlangs 객체 배열을 경도 위도를 가진 좌표 배열로 변환한다
    latLngsToCoords : function (latLngs){
        var coords = [];
        for (var i = 0, len = latLngs.length; i < len; i++) {
            coords.push(L.GeoJSON.latLngToCoords(latLngs[i]));
        }
        return coords;
    },

    doLogOut : function (){
        $.ajax({
            type: 'POST',
            url: '/logout',
            success: function(data) {
                if(data.message == "logoutSuccess"){
                    location.href='/';
                }
                else
                {
                    alert('로그아웃 실패');
                }

            },
            contentType: "application/json",
            dataType: "json"
        });
    },

    getUserInfo : function(){
        var _this = this;
        $.ajax({
            type: 'POST',
            url: '/getAccountInfo',
            success: function(data) {
                _this.setUserProfile(data);
            },
            contentType: "application/json",
            dataType: "json"
        });
    },

    setUserProfile : function(userInfo){
        console.log(userInfo);
        console.log(userInfo.id);
        var userName = userInfo.name;
        var subProfile = '<div class="sub header" id="profile_id">'
            + userInfo.id + '</div>'
        $('#profile_name').html(userName + subProfile);
    }
}