/**
 * Created by K on 2017-01-31.
 */


Vigeo.Tools = {

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
            //alert("Dimensions " + height + "x" + width + ", Type: " + type);

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
            L.DomEvent.on(image._image, 'load', image.editing.enable, image.editing);
            //console.log(image.getCorners());
        };
    },

    getMapData : function () {
        var _this = this;
        $.ajax({
            type: 'POST',
            url: '/usermapdata',
            success: function(mapData) {
                console.log(JSON.stringify(mapData.user_mapdata));
                _this._drawMapData(mapData.user_mapdata);
            },
            contentType: "application/json",
            dataType: "json"
        });
    },

    storeMapData : function () {
        var mapJsonData = this._mapDataToJSON();
        $.ajax({
            type: 'POST',
            url: '/save',
            data: JSON.stringify(mapJsonData),
            success: function(data) {
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

        //도형이 그려져있는 레이어를 검색하여 정보를 추출한다.
        for (var i in featureGroups.drawnItems._layers) {
            itemType = featureGroups.drawnItems._layers[i].type;

            if (itemType == "marker") {
                itemLatlngs = featureGroups.drawnItems._layers[i]._latlng;
            }
            else {
                itemLatlngs = featureGroups.drawnItems._layers[i]._latlngs;
            }

            if (itemType == "rectangle" || itemType == "polygon" || itemType == "polyline" || itemType == "marker") {
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
        return mapJsonData;
    },

    //JSON 데이터를 읽어 MAP에 도형,이미지를 그린다.
    _drawMapData : function (jsonMapData) {
        var mapData = JSON.parse(jsonMapData);

        var type;
        var coords;
        var imgURL;
        var image;
        var item;
        for (var i in mapData) {
            type = mapData[i].type;
            coords = mapData[i].latlngs;
            if (type == "rectangle") { //사각형
                item = L.rectangle([coords[0], coords[2]], {
                    color: "#ff7800",
                    weight: 3
                });

                item.type = type;
                featureGroups.drawnItems.addLayer(item);
                featureGroups.imgItems.bringToFront();
            }
            if (type == "polygon") { //다각형
                L.polygon(coords, {
                    color: "#ff7800",
                    weight: 5
                }).addTo(featureGroups.drawnItems);
            }
            if (type == "polyline") { //선
                L.polyline(coords, {
                    color: "#ff7800",
                    weight: 5
                }).addTo(featureGroups.drawnItems);
            }
            if (type == "marker") { //마커
                L.marker(coords, {
                    color: "#ff7800",
                    weight: 5
                }).addTo(featureGroups.drawnItems);
            }
            if (type == "image") { //이미지
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
                L.DomEvent.on(image._image, 'load', image.editing.enable, image.editing);
            }
        }

        console.log(featureGroups.drawnItems);
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
    }
}