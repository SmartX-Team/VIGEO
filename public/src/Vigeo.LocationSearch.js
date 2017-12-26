/**
 * Created by K on 2017-01-31.
 */
Vigeo.LocationSearch = {

    //구글 map api에서 요구하는 초기화 함수 함수
    //infowindow : {},
    service : {},
    places : [],


    initMap : function () {
        //this.infowindow = new google.maps.InfoWindow();
        this.service = new google.maps.places.PlacesService(document.createElement('div'));
    },

    //google map 의 textsearch api를 이용한 검색 수행

    searchLocation : function () {
        var input_query = $("#searchTextField").val(); //val attr 등의 구별법 공부할 것
        var seoul = { //중심 좌표 설정
            lat: 37.556080,
            lng: 126.992315
        };

        this.service.textSearch({
            location: seoul,
            radius: 500000,
            query: [input_query]
        }, this._searchCallBack); //질의 완료시 callback함수가 수행된다.
    },

    //google API의 응답을 받은 후 수행되는 callback
    _searchCallBack : function (result, status) {
        var _this = this;
        if (status === google.maps.places.PlacesServiceStatus.OK) { //���������� ���� �޾��� ��
            var resultcontent = '';
            var list_table = document.getElementById('list_table');
            var row;
            var cell;

            places = result;
            $('#list_table').empty(); //table을 초기화한다.
            for (i = 0; i < result.length; i++) {
                row = list_table.insertRow(i); //행을 추가한다.
                row.id = i;
                cell = row.insertCell(0);
                //해당 행에 위치 정보를 출력한다.
                console.log(result[i].geometry.location );
                resultcontent += '<div><h3 class="ui header">' + result[i].name + '</h4></div>';
                resultcontent += '<div><font size ="1">' + result[i].formatted_address + '</font></div>';
                resultcontent += '<div><font size ="1">' + result[i].geometry.location + '</font></div>';
                cell.innerHTML = resultcontent;
                resultcontent = '';
            }
            $('.ui.sidebar').sidebar('setting', 'transition', 'overlay');
            $('.ui.sidebar').sidebar('setting', 'dimPage', false);
            $('.ui.sidebar').sidebar('toggle');
        } else {
            window.alert('error');
        }
    },

    //지도에 marker를 추가하는 동작을 수행한다
    //인자 : 위치 이름, 위치 정보(위도 경도를 가진 size2의 문자열 배열)
    addLocationMaker : function(name, marked_location) {
        featureGroups.markerItems.clearLayers(); //마커를 갱신하기 위해 marker layer의 상태를 초기화한다.

        var marker_name_tag = "<CENTER><B>" + name + "<B></CENTER>"
        var marker = L.marker(marked_location); //해당 위치의 marker를 정의한다.

       /// L.Illustrate.textbox(marked_location, {minSize: L.point(10,10), textEditable : true, textContest : "fucasdfasdfasdfasdfasdfasdfk"}).addTo(featureGroups.markerItems);
        featureGroups.markerItems.addLayer(marker); //marker를 marker전용 layer에 추가한다.
        marker.bindPopup(marker_name_tag).openPopup(); //추가된
    }
}
