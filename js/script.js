showdown.setOption('simplifiedAutoLink',true);
showdown.setOption('openLinksInNewWindow',true);
showdown.setOption('simpleLineBreaks',true);
showdown.setOption('headerLevelStart',2);

var app = angular.module("page", ['ngSanitize']).config(function($sceDelegateProvider) {  
    $sceDelegateProvider.resourceUrlWhitelist([
        // Allow same origin resource loads.
        'self',
        // Allow loading from our assets domain. **.
        'https://trello.com/**'
      ]);
});
app.controller('MgCtrl',['$scope','$http','$sce',function($scope, $http, $sce){
    init = function(){
        doRouter($scope);
        
        var jsonUrl = $scope.jsonUrl;
        
        $http.get(jsonUrl)
            .then(function(response){
                console.log(response.data);
                $scope.myData = response.data;
                console.log($scope.myData);
                setHeader($scope);
                setMenu($scope);
                setContent($scope);
            });        
    }
    
    doRouter = function($scope){
        if(!location.search){
            search = '?XAL44x7M';
        }else{
            search = location.search;
        }
        var reg = RegExp(/\?([^\/]+)(\/([^\/]+))?/);;
        var router = reg.exec(search);
        if(router){
            $scope.boardID = router[1];
            console.log(router[3]);
            if(router[3]){
                $scope.cardID = router[3];    
            }
            $scope.jsonUrl ='https://trello.com/b/'+$scope.boardID+'.json';
        }
    }
    
    setHeader = function($scope){
        $scope.bgImage = $scope.myData.prefs.backgroundImage;
    }
    
    setMenu = function($scope){
        var menu = [];
        var lists = $scope.myData.lists;
        lists.forEach(function(item){
            var object = {
                title : item.name,
                id : item.id,
                children : [],
            }
            menu.push(object);
        });
        
        $scope.menu = menu;
        
        var cards = $scope.myData.cards.forEach(function(item){
            parent = getMenuParent($scope, item.idList);
            if(!item.desc){
                var url = "#";
            }else{
                var reg = RegExp(/^http(s)?:\/\/[^\n]+$/);
                if(reg.exec(item.desc)){
                    var url = item.desc
                }else{
                    var url = '/?'+$scope.boardID +'/'+item.shortLink;    
                }
            }
            parent.children.push({
                title : item.name,
                url : url,
                shortLink : item.shortLink
            });
        });
        
        if(typeof postSetMenu != 'undefined'){
            postSetMenu();
        }
    }
    
    setContent = function($scope){
        if(!$scope.cardID){
            $scope.cardID = $scope.myData.cards[0].shortLink;
        }
        var cards = $scope.myData.cards.forEach(function(item){
            if(item.shortLink == $scope.cardID){
                $scope.title = item.name;
                var converter = new showdown.Converter();
                $scope.content = converter.makeHtml(item.desc);
                $sce.trustAsHtml($scope.content);
                $scope.content = $sce.getTrustedHtml($scope.content);
            }
        }); 
    };
    
    getMenuParent = function($scope, menuID){
        var returnObj = null;
        $scope.menu.forEach(function(parent){
            if(parent.id.match(menuID)){
                returnObj = parent;
            }
        });
        return returnObj;
    };
    
    init();
    
    $scope.changeContent = function changeContent($event){
        
        var obj = $event.target;
        var href = obj.getAttribute('href');
        if(href == '#'){
            return
        }else{
            $scope.cardID = href.match(/\?(.+)\/(.+)/)[2];
            $event.preventDefault();
            setContent($scope);
        }
    }
}]);